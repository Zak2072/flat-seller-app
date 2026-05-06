import React, { createContext, useContext, useEffect, useState } from 'react';
import { onAuthStateChanged, User } from 'firebase/auth';
import { doc, onSnapshot, getDoc, setDoc, getDocFromServer, collection, addDoc, updateDoc, deleteDoc, query, orderBy } from 'firebase/firestore';
import { auth, db, storage, handleFirestoreError, OperationType } from '../firebase';
import type { UserProfile, VaultSectionId, PropertyProfile, PropertyStatus } from '../types';
import { ref, listAll, deleteObject, StorageReference } from 'firebase/storage';

interface AuthContextType {
  user: User | null;
  profile: UserProfile | null;
  properties: PropertyProfile[];
  currentProperty: PropertyProfile | null;
  loading: boolean;
  isAdmin: boolean;
  isAuthReady: boolean;
  addProperty: (address: string, details?: Partial<PropertyProfile>) => Promise<string>;
  updateProperty: (propertyId: string, data: Partial<PropertyProfile>) => Promise<void>;
  deleteProperty: (propertyId: string) => Promise<void>;
  deleteAccount: () => Promise<void>;
  markAsSold: (propertyId: string) => Promise<void>;
  setCurrentPropertyId: (id: string | null) => void;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  profile: null,
  properties: [],
  currentProperty: null,
  loading: true,
  isAdmin: false,
  isAuthReady: false,
  addProperty: async () => '',
  updateProperty: async () => {},
  deleteProperty: async () => {},
  deleteAccount: async () => {},
  markAsSold: async () => {},
  setCurrentPropertyId: () => {},
});

export const useAuth = () => useContext(AuthContext);

export const FirebaseProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [properties, setProperties] = useState<PropertyProfile[]>([]);
  const [currentPropertyId, setCurrentPropertyId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [isAuthReady, setIsAuthReady] = useState(false);

  useEffect(() => {
    setIsAdmin(profile?.role === 'admin');
  }, [profile]);

  const currentProperty = properties.find(p => p.id === currentPropertyId) || null;

  // Test connection to Firestore as required by guidelines
  useEffect(() => {
    async function testConnection() {
      try {
        await getDocFromServer(doc(db, 'test', 'connection'));
      } catch (error) {
        if (error instanceof Error && error.message.includes('the client is offline')) {
          console.error("Please check your Firebase configuration. ");
        }
      }
    }
    testConnection();
  }, []);

  useEffect(() => {
    const unsubscribeAuth = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setIsAuthReady(true);
      if (!currentUser) {
        setProfile(null);
        setProperties([]);
        setLoading(false);
      }
    });

    return () => unsubscribeAuth();
  }, []);

  useEffect(() => {
    if (!user) return;

    const userRef = doc(db, 'users', user.uid);
    
    // Check if profile exists, if not create it
    const checkProfile = async () => {
      try {
        const docSnap = await getDoc(userRef);
        if (!docSnap.exists()) {
          const newProfile: UserProfile = {
            uid: user.uid,
            email: user.email || '',
            displayName: user.displayName || '',
            role: 'client',
            createdAt: new Date().toISOString(),
          };
          await setDoc(userRef, newProfile);
        }
      } catch (error) {
        // Only log if it's not a permission error during logout transition
        if (auth.currentUser) {
          handleFirestoreError(error, OperationType.WRITE, `users/${user.uid}`);
        }
      }
    };

    checkProfile();

    // Listen for profile changes
    const unsubscribeProfile = onSnapshot(userRef, (snapshot) => {
      if (snapshot.exists()) {
        setProfile(snapshot.data() as UserProfile);
      }
    }, (error) => {
      if (auth.currentUser) {
        handleFirestoreError(error, OperationType.GET, `users/${user.uid}`);
      }
    });

    // Listen for properties
    const propertiesRef = collection(db, 'users', user.uid, 'properties');
    const q = query(propertiesRef, orderBy('createdAt', 'desc'));
    const unsubscribeProperties = onSnapshot(q, (snapshot) => {
      const props = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as PropertyProfile));
      setProperties(props);
      setLoading(false);
    }, (error) => {
      if (auth.currentUser) {
        handleFirestoreError(error, OperationType.GET, `users/${user.uid}/properties`);
      }
      setLoading(false);
    });

    return () => {
      unsubscribeProfile();
      unsubscribeProperties();
    };
  }, [user]);

  const addProperty = async (address: string, details?: Partial<PropertyProfile>) => {
    if (!user) throw new Error('User not authenticated');
    
    const propertiesRef = collection(db, 'users', user.uid, 'properties');
    const propertyDoc = doc(propertiesRef);
    const propertyId = propertyDoc.id;

    const newProperty: PropertyProfile = {
      id: propertyId,
      address,
      addressLine1: details?.addressLine1 || '',
      addressLine2: details?.addressLine2 || '',
      town: details?.town || '',
      postcode: details?.postcode || '',
      status: 'Active',
      vaultProgress: {
        team: false,
        forms: false,
        money: false,
        safety: false,
        handoff: false,
        postSale: false,
      },
      vaultFiles: {},
      aiVerification: {},
      postSaleTracking: {
        licenceToAssignStatus: 'Not Started',
        deedOfCovenantStatus: 'Not Started'
      },
      teamInfo: {
        freeholderName: '',
        freeholderAgent: '',
        managementCompany: '',
        managingAgent: '',
        mortgageLender: '',
        mortgageAccountNumber: ''
      },
      createdAt: new Date().toISOString(),
      ...details,
      paymentStatus: 'pending',
      hasPaid: false,
    };

    try {
      console.log("Attempting to save property payload:", newProperty);
      await setDoc(propertyDoc, newProperty);
      return propertyId;
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, `users/${user.uid}/properties/${propertyId}`);
      throw error;
    }
  };

  const updateProperty = async (propertyId: string, data: Partial<PropertyProfile>) => {
    if (!user) throw new Error('User not authenticated');
    const propertyRef = doc(db, 'users', user.uid, 'properties', propertyId);
    try {
      await updateDoc(propertyRef, data);
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, `users/${user.uid}/properties/${propertyId}`);
      throw error;
    }
  };

  const deleteProperty = async (propertyId: string) => {
    if (!user) throw new Error('User not authenticated');
    const propertyRef = doc(db, 'users', user.uid, 'properties', propertyId);
    try {
      // 1. Delete Firestore document
      await deleteDoc(propertyRef);
      
      // 2. Clean up storage files for this property
      const propertyStorageRef = ref(storage, `users/${user.uid}/properties/${propertyId}`);
      await deleteFilesRecursively(propertyStorageRef);

      if (currentPropertyId === propertyId) setCurrentPropertyId(null);
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, `users/${user.uid}/properties/${propertyId}`);
      throw error;
    }
  };

  const deleteAccount = async () => {
    if (!user) throw new Error('User not authenticated');
    
    try {
      // 1. Delete all properties and their files
      for (const prop of properties) {
        await deleteProperty(prop.id);
      }

      // 2. Delete user profile document
      const userRef = doc(db, 'users', user.uid);
      await deleteDoc(userRef);

      // 3. Delete any other files in user's root storage
      const userStorageRef = ref(storage, `users/${user.uid}`);
      await deleteFilesRecursively(userStorageRef);

      // 4. Delete Auth user
      await user.delete();
    } catch (error: any) {
      if (error.code === 'auth/requires-recent-login') {
        throw new Error('This action requires a recent login. Please sign out and sign back in before deleting your account.');
      }
      throw error;
    }
  };

  const markAsSold = async (propertyId: string) => {
    await updateProperty(propertyId, { status: 'Sold' });
  };

  async function deleteFilesRecursively(storageRef: StorageReference) {
    try {
      const res = await listAll(storageRef);
      
      // Delete all files in this folder
      const itemPromises = res.items.map((item) => deleteObject(item));
      await Promise.all(itemPromises);

      // Recurse into subdirectories
      const folderPromises = res.prefixes.map((folder) => deleteFilesRecursively(folder));
      await Promise.all(folderPromises);
    } catch (error) {
      console.warn('Storage cleanup warning:', error);
      // Don't block the whole deletion if some storage files fail to delete
    }
  }

  return (
    <AuthContext.Provider value={{ 
      user, 
      profile, 
      properties, 
      currentProperty, 
      loading, 
      isAdmin,
      isAuthReady,
      addProperty,
      updateProperty,
      deleteProperty,
      deleteAccount,
      markAsSold,
      setCurrentPropertyId
    }}>
      {children}
    </AuthContext.Provider>
  );
};
