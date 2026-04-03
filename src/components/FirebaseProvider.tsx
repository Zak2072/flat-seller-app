import React, { createContext, useContext, useEffect, useState } from 'react';
import { onAuthStateChanged, User } from 'firebase/auth';
import { doc, onSnapshot, getDoc, setDoc, getDocFromServer, collection, addDoc, updateDoc, deleteDoc, query, orderBy } from 'firebase/firestore';
import { auth, db, handleFirestoreError, OperationType } from '../firebase';
import type { UserProfile, VaultSectionId, PropertyProfile, PropertyStatus } from '../types';

interface AuthContextType {
  user: User | null;
  profile: UserProfile | null;
  properties: PropertyProfile[];
  currentProperty: PropertyProfile | null;
  loading: boolean;
  isAuthReady: boolean;
  addProperty: (address: string) => Promise<string>;
  updateProperty: (propertyId: string, data: Partial<PropertyProfile>) => Promise<void>;
  deleteProperty: (propertyId: string) => Promise<void>;
  markAsSold: (propertyId: string) => Promise<void>;
  setCurrentPropertyId: (id: string | null) => void;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  profile: null,
  properties: [],
  currentProperty: null,
  loading: true,
  isAuthReady: false,
  addProperty: async () => '',
  updateProperty: async () => {},
  deleteProperty: async () => {},
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
  const [isAuthReady, setIsAuthReady] = useState(false);

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
    const unsubscribeAuth = onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser);
      setIsAuthReady(true);
      
      if (currentUser) {
        const userRef = doc(db, 'users', currentUser.uid);
        
        // Check if profile exists, if not create it
        try {
          const docSnap = await getDoc(userRef);
          if (!docSnap.exists()) {
            const newProfile: UserProfile = {
              uid: currentUser.uid,
              email: currentUser.email || '',
              displayName: currentUser.displayName || '',
              createdAt: new Date().toISOString(),
            };
            await setDoc(userRef, newProfile);
          }
        } catch (error) {
          handleFirestoreError(error, OperationType.WRITE, `users/${currentUser.uid}`);
        }

        // Listen for profile changes
        const unsubscribeProfile = onSnapshot(userRef, (snapshot) => {
          if (snapshot.exists()) {
            setProfile(snapshot.data() as UserProfile);
          }
        }, (error) => {
          handleFirestoreError(error, OperationType.GET, `users/${currentUser.uid}`);
        });

        // Listen for properties
        const propertiesRef = collection(db, 'users', currentUser.uid, 'properties');
        const q = query(propertiesRef, orderBy('createdAt', 'desc'));
        const unsubscribeProperties = onSnapshot(q, (snapshot) => {
          const props = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as PropertyProfile));
          setProperties(props);
          setLoading(false);
        }, (error) => {
          handleFirestoreError(error, OperationType.GET, `users/${currentUser.uid}/properties`);
          setLoading(false);
        });

        return () => {
          unsubscribeProfile();
          unsubscribeProperties();
        };
      } else {
        setProfile(null);
        setProperties([]);
        setLoading(false);
      }
    });

    return () => unsubscribeAuth();
  }, []);

  const addProperty = async (address: string) => {
    if (!user) throw new Error('User not authenticated');
    
    const propertiesRef = collection(db, 'users', user.uid, 'properties');
    const propertyDoc = doc(propertiesRef);
    const propertyId = propertyDoc.id;

    const newProperty: PropertyProfile = {
      id: propertyId,
      address,
      status: 'Active',
      vaultProgress: {
        team: false,
        forms: false,
        money: false,
        safety: false,
        handoff: false,
      },
      vaultFiles: {},
      aiVerification: {},
      teamInfo: {
        groundLeaseHolder: '',
        managementCompany: '',
        managingAgent: ''
      },
      paymentStatus: 'unpaid',
      hasPaid: false,
      createdAt: new Date().toISOString(),
    };

    try {
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
      await deleteDoc(propertyRef);
      if (currentPropertyId === propertyId) setCurrentPropertyId(null);
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, `users/${user.uid}/properties/${propertyId}`);
      throw error;
    }
  };

  const markAsSold = async (propertyId: string) => {
    await updateProperty(propertyId, { status: 'Sold' });
  };

  return (
    <AuthContext.Provider value={{ 
      user, 
      profile, 
      properties, 
      currentProperty, 
      loading, 
      isAuthReady,
      addProperty,
      updateProperty,
      deleteProperty,
      markAsSold,
      setCurrentPropertyId
    }}>
      {children}
    </AuthContext.Provider>
  );
};
