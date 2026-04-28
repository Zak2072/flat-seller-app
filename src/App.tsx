import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  ShieldCheck, 
  CreditCard, 
  CheckCircle2, 
  AlertCircle, 
  ArrowRight,
  ExternalLink,
  Lock,
  Building2,
  Key,
  Zap,
  Car,
  Loader2,
  Users,
  FileText,
  BadgePoundSterling,
  ShieldAlert,
  Send,
  MapPin,
  ChevronLeft,
  Hash
} from 'lucide-react';
import { BrowserRouter, Routes, Route, Navigate, useLocation, useNavigate } from 'react-router-dom';
import { Glossary } from './pages/Glossary';
import { Navbar } from './components/Navbar';
import { Sidebar } from './components/Sidebar';
import { VaultSection } from './components/VaultSection';
import { StepContent } from './components/StepContent';
import { SolicitorHandoff } from './components/SolicitorHandoff';
import { SolicitorView } from './components/SolicitorView';
import { LandingPage } from './components/LandingPage';
import { PropertiesList } from './components/PropertiesList';
import { PaymentGate } from './components/PaymentGate';
import { calculatePrice } from './lib/pricing';
import { loadStripe } from '@stripe/stripe-js';

const stripePromise = loadStripe((import.meta as any).env.VITE_STRIPE_PUBLISHABLE_KEY);
import { ProgressBar } from './components/ProgressBar';
import { cn } from './lib/utils';
import type { AppState, VaultSectionId, UserProfile, PropertyProfile } from './types';
import { FirebaseProvider, useAuth } from './components/FirebaseProvider';
import { Auth } from './components/Auth';
import ErrorBoundary from './components/ErrorBoundary';
import { doc, updateDoc, deleteDoc, setDoc } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { db, storage, auth, handleFirestoreError, OperationType } from './firebase';
import { validateDocument } from './services/geminiService';

const INITIAL_SECTIONS: Omit<AppState['sections'][0], 'status'>[] = [
  { 
    id: 'team', 
    title: 'Step 1: Stakeholders', 
    description: 'Ground Lease Holder, Management Company and Managing Agent details.',
  },
  { 
    id: 'forms', 
    title: 'Step 2: The Forms', 
    description: 'Law Society TA6, TA7 and TA10 forms.',
  },
  { 
    id: 'money', 
    title: 'Step 3: The Money', 
    description: 'Service charge accounts and budgets for current and previous years.',
  },
  { 
    id: 'safety', 
    title: 'Step 4: The Safety', 
    description: 'Fire Risk Assessment, Insurance and BSA 2022 documents.',
  },
  { 
    id: 'handoff', 
    title: 'Step 5: The Handoff', 
    description: 'Send your prepped pack to your solicitor.',
  },
];

function MainApp() {
  const { user, profile, properties, currentProperty, loading, setCurrentPropertyId, updateProperty } = useAuth();
  const [activeSection, setActiveSection] = useState('dashboard');
  const location = useLocation();
  const navigate = useNavigate();

  // Handle shareId detection synchronously to bypass auth guards immediately
  const urlParams = new URLSearchParams(location.search);
  const shareId = urlParams.get('shareId');

  useEffect(() => {
    if (urlParams.get('payment') === 'success' && user && currentProperty) {
      const updatePayment = async () => {
        await updateProperty(currentProperty.id, {
          paymentStatus: 'paid',
          hasPaid: true
        });
        // Clean up URL
        window.history.replaceState({}, document.title, window.location.pathname);
      };
      updatePayment();
    }
  }, [user, currentProperty, location.search]);

  if (shareId) {
    return <SolicitorView shareId={shareId} />;
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center space-y-4">
          <Loader2 className="animate-spin text-navy mx-auto" size={48} />
          <p className="text-navy font-serif font-bold text-xl">Loading Prepped Seller...</p>
        </div>
      </div>
    );
  }

  // Handle Landing Page Route
  if (location.pathname === '/') {
    return <LandingPage onStart={() => {
      if (user) navigate('/properties');
      else navigate('/auth');
    }} />;
  }

  if (!user || !profile) {
    return (
      <div className="relative pt-16">
        <button 
          onClick={() => navigate('/')}
          className="absolute top-24 left-8 z-50 flex items-center gap-2 text-navy font-bold hover:underline"
        >
          <ArrowRight className="rotate-180" size={18} />
          Back to Guide
        </button>
        <Auth />
      </div>
    );
  }

  if (!currentProperty) {
    return <PropertiesList onPropertySelected={(id) => {
      setCurrentPropertyId(id);
      setActiveSection('team');
    }} />;
  }

  const sections = INITIAL_SECTIONS.map(s => ({
    ...s,
    status: (currentProperty.vaultProgress[s.id as VaultSectionId] ? 'completed' : 'pending') as 'pending' | 'completed',
    fileName: (() => {
      const fileData = currentProperty.vaultFiles[s.id as VaultSectionId];
      if (!fileData) return undefined;
      if (Array.isArray(fileData)) return fileData.map(f => f.fileName).join(', ');
      return fileData.fileName;
    })()
  }));

  const completedCount = Object.values(currentProperty.vaultProgress).filter(Boolean).length;
  const progress = (completedCount / INITIAL_SECTIONS.length) * 100;

  const paidPropertiesCount = properties.filter(p => p.paymentStatus === 'paid').length;
  const { totalPrice } = calculatePrice(paidPropertiesCount);

  // Routing Interceptor: Redirect to payment if unpaid and trying to access steps
  const isStepSection = ['team', 'forms', 'money', 'safety', 'handoff'].includes(activeSection);
  const effectiveSection = (isStepSection && currentProperty.paymentStatus === 'pending') ? 'payment' : activeSection;

  const handleTeamUpdate = async (data: { groundLeaseHolder: string; managementCompany: string; managingAgent: string }) => {
    try {
      await updateProperty(currentProperty.id, {
        teamInfo: data,
        'vaultProgress.team': true
      } as any);
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `users/${user.uid}/properties/${currentProperty.id}`);
    }
  };

  const handleFinancialUpdate = async (data: { reserveFundAmount: string }) => {
    try {
      await updateProperty(currentProperty.id, {
        financialInfo: data
      });
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `users/${user.uid}/properties/${currentProperty.id}`);
    }
  };

  const handleTA6Update = async (data: any) => {
    if (!currentProperty) return;
    console.log("App.tsx: handleTA6Update called with:", data);
    try {
      await updateProperty(currentProperty.id, {
        ta6Data: data
      });
      console.log("App.tsx: TA6 update successful");
    } catch (error) {
      console.error("App.tsx: TA6 update failed:", error);
      handleFirestoreError(error, OperationType.UPDATE, `users/${user.uid}/properties/${currentProperty.id}`);
    }
  };

  const handleTA7Update = async (data: any) => {
    if (!currentProperty) return;
    try {
      await updateProperty(currentProperty.id, {
        ta7Data: data
      });
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `users/${user.uid}/properties/${currentProperty.id}`);
    }
  };

  const handleTA10Update = async (data: any) => {
    if (!currentProperty) return;
    try {
      await updateProperty(currentProperty.id, {
        ta10Data: data
      });
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `users/${user.uid}/properties/${currentProperty.id}`);
    }
  };

  const handleUpload = async (id: string, files: File | FileList | File[]) => {
    try {
      const fileList = files instanceof File ? [files] : Array.from(files);
      if (fileList.length === 0) return;

      const existingFiles = currentProperty.vaultFiles[id];
      const existingFileList = Array.isArray(existingFiles) ? existingFiles : (existingFiles ? [existingFiles] : []);

      // 1. Upload to Storage
      const uploadPromises = fileList.map(async (file) => {
        const storageRef = ref(storage, `users/${user.uid}/properties/${currentProperty.id}/vault/${id}/${file.name}`);
        await uploadBytes(storageRef, file);
        const downloadURL = await getDownloadURL(storageRef);
        return {
          url: downloadURL,
          fileName: file.name,
          uploadTimestamp: new Date().toISOString(),
          originalFileName: file.name,
          fileSize: file.size
        };
      });

      const newUploadedFiles = await Promise.all(uploadPromises);
      const allFiles = [...existingFileList, ...newUploadedFiles];

      // 2. Update Firestore
      const updateData: any = {
        [`vaultFiles.${id}`]: allFiles.length > 1 ? allFiles : allFiles[0],
        [`aiVerification.${id}`]: {
          status: 'pending'
        }
      };

      if (id === 'lpe1' && allFiles.length > 0) {
        updateData['lpe1Data.fileUrl'] = allFiles[0].url;
      }

      await updateProperty(currentProperty.id, updateData);

      // 3. AI Validation feedback
      let aiMessage = `Verified: ${allFiles.length} files uploaded.`;
      if (id === 'sc_accounts') {
        aiMessage = 'I see your accounts files. Checking them for the last three years of data.';
      } else if (allFiles.length === 1) {
        const section = INITIAL_SECTIONS.find(s => s.id === id);
        const validation = await validateDocument(section?.title || id, allFiles[0].fileName);
        const currentYear = new Date().getFullYear();
        if (validation.isValid) {
          if (id === 'sc_budget') aiMessage = `Verified: ${currentYear} Budget matches service charge enquiries.`;
          else if (id === 'ta6') aiMessage = 'Verified: TA6 form is fully completed and signed.';
          else if (id === 'lpe1') aiMessage = 'Verified: LPE1 Management Pack is complete and signed by the Managing Agent.';
          else if (id === 'fra') aiMessage = 'Verified: Fire Risk Assessment is current and valid.';
          else aiMessage = `Verified: ${allFiles[0].fileName} matches requirements.`;
        } else {
          aiMessage = validation.message || 'Verification failed';
        }
      }

      // 4. Update Firestore with AI result
      await updateProperty(currentProperty.id, {
        [`vaultProgress.${id}`]: true,
        [`aiVerification.${id}`]: {
          status: 'verified',
          message: aiMessage
        }
      } as any);

      // Check if the entire step is complete
      const updatedVaultProgress = { ...currentProperty.vaultProgress, [id]: true };
      
      let stepId: VaultSectionId | null = null;
      if (['ta6', 'ta7', 'ta10', 'lpe1'].includes(id)) {
        const formsComplete = updatedVaultProgress.ta6 && updatedVaultProgress.ta7 && updatedVaultProgress.ta10 && updatedVaultProgress.lpe1;
        if (formsComplete) stepId = 'forms';
      } else if (['sc_accounts', 'sc_budget', 'ground_rent_receipt', 'reserve_fund_confirmation'].includes(id)) {
        const moneyComplete = updatedVaultProgress.sc_accounts && 
                            updatedVaultProgress.sc_budget && 
                            updatedVaultProgress.ground_rent_receipt && 
                            updatedVaultProgress.reserve_fund_confirmation;
        if (moneyComplete) stepId = 'money';
      } else if (['fra', 'asbestos_survey', 'eicr', 'insurance', 'bsa', 'headlease', 'management_articles', 'transfer_fees'].includes(id)) {
        const safetyComplete = updatedVaultProgress.fra && 
                             updatedVaultProgress.asbestos_survey && 
                             updatedVaultProgress.eicr && 
                             updatedVaultProgress.insurance && 
                             updatedVaultProgress.bsa && 
                             updatedVaultProgress.headlease && 
                             updatedVaultProgress.management_articles && 
                             updatedVaultProgress.transfer_fees;
        if (safetyComplete) stepId = 'safety';
      }

      if (stepId) {
        await updateProperty(currentProperty.id, {
          [`vaultProgress.${stepId}`]: true
        } as any);
      }
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `users/${user.uid}/properties/${currentProperty.id}`);
    }
  };

  const handleDeleteFile = async (id: string, fileName: string) => {
    try {
      const existingFiles = currentProperty.vaultFiles[id];
      const existingFileList = Array.isArray(existingFiles) ? existingFiles : (existingFiles ? [existingFiles] : []);
      
      const updatedFileList = existingFileList.filter(f => f.fileName !== fileName);
      
      await updateProperty(currentProperty.id, {
        [`vaultFiles.${id}`]: updatedFileList.length === 0 ? null : (updatedFileList.length === 1 ? updatedFileList[0] : updatedFileList),
        [`vaultProgress.${id}`]: updatedFileList.length > 0,
        [`aiVerification.${id}`]: updatedFileList.length === 0 ? null : currentProperty.aiVerification[id]
      } as any);
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `users/${user.uid}/properties/${currentProperty.id}`);
    }
  };

  const handleSolicitorHandoff = async (data: { 
    name: string; 
    email: string; 
    practiceName: string; 
    phone: string; 
    address: string;
    payload: any;
    shareId: string;
  }) => {
    try {
      // Update Property with solicitor info and the provided share ID
      // The shared_links document is now handled by the component before download
      await updateProperty(currentProperty.id, {
        solicitorInfo: {
          name: data.name,
          email: data.email,
          practiceName: data.practiceName,
          phone: data.phone,
          address: data.address,
          sentAt: new Date().toISOString(),
          shareId: data.shareId
        }
      });
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `users/${user.uid}/properties/${currentProperty.id}`);
    }
  };

  const handleDeleteAccount = async () => {
    if (!window.confirm('Are you sure you want to close your account and delete all data? This action is permanent and cannot be undone.')) {
      return;
    }

    try {
      const userRef = doc(db, 'users', user.uid);
      await updateDoc(userRef, {
        deletedAt: new Date().toISOString()
      });

      // Sign out
      await auth.signOut();
      window.location.reload();
    } catch (error) {
      console.error('Error deleting account:', error);
      alert('Failed to delete account. Please contact support.');
    }
  };

  const handlePayment = async () => {
    if (!currentProperty) return;

    try {
      // Mock payment: direct Firestore update to bypass Stripe in preview
      await updateProperty(currentProperty.id, {
        paymentStatus: 'paid',
        hasPaid: true
      });
      
      // Success routing: automatically navigate to Step 1
      setActiveSection('team');
    } catch (error) {
      // Error handling: log for security rule rejections
      console.error('Mock Payment Error:', error);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col pt-16">
      <div className="flex flex-1">
        <Sidebar 
          activeSection={activeSection} 
          onSectionChange={setActiveSection} 
          profile={currentProperty as any} 
          onBackToProperties={() => setCurrentPropertyId(null)}
        />
        
        <main className="flex-1 ml-64 p-12 max-w-6xl mx-auto">
          <AnimatePresence mode="wait">
            {effectiveSection === 'dashboard' && (
            <motion.div
              key="dashboard"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-10"
            >
              <header className="flex justify-between items-end border-b border-slate-200 pb-8">
                <div>
                  <div className="flex items-center gap-4 text-gold font-bold text-xs uppercase tracking-widest mb-2">
                    <div className="flex items-center gap-1">
                      <MapPin size={14} />
                      {currentProperty.address}
                    </div>
                    {currentProperty.uprn && (
                      <div className="flex items-center gap-1 border-l border-slate-200 pl-4">
                        <Hash size={14} />
                        UPRN: {currentProperty.uprn}
                      </div>
                    )}
                    {currentProperty.epc_rating && (
                      <div className="flex items-center gap-1 border-l border-slate-200 pl-4">
                        <Zap size={14} />
                        EPC: {currentProperty.epc_rating}
                      </div>
                    )}
                  </div>
                  <h2 className="text-4xl font-serif font-bold text-navy mb-2">Property Vault</h2>
                  <p className="text-slate-500 max-w-lg">
                    Welcome back, <span className="font-bold text-navy">{profile.displayName || profile.email}</span>. 
                    Organising your sale for <span className="text-navy font-semibold">{currentProperty.address}</span>.
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-semibold text-navy uppercase tracking-widest mb-1">Status</p>
                  <p className={cn(
                    "text-lg font-medium",
                    progress === 100 ? "text-green-600" : "text-amber-600"
                  )}>
                    {progress === 100 ? "Fully Compliant" : "Action Required"}
                  </p>
                </div>
              </header>

              <section className="grid grid-cols-1 md:grid-cols-3 gap-8">
                <div className="col-span-2 bg-white p-8 rounded-2xl border border-slate-200 shadow-sm">
                  <div className="flex justify-between items-center mb-6">
                    <h3 className="text-xl font-serif font-semibold text-navy">Vault Progress</h3>
                    <span className="text-2xl font-bold text-navy">{Math.round(progress)}%</span>
                  </div>
                  <ProgressBar progress={progress} />
                  <div className="mt-8 grid grid-cols-5 gap-2">
                    {sections.map((s, i) => (
                      <div 
                        key={s.id} 
                        className={cn(
                          "h-1.5 rounded-full transition-colors duration-500",
                          s.status === 'completed' ? "bg-navy" : "bg-slate-200"
                        )}
                      />
                    ))}
                  </div>
                  <p className="mt-6 text-sm text-slate-500 italic">
                    {completedCount} of {sections.length} critical documents uploaded.
                  </p>
                </div>

                <div className="bg-navy text-white p-8 rounded-2xl shadow-xl flex flex-col justify-between relative overflow-hidden">
                  <div className="absolute top-0 right-0 p-4 opacity-10">
                    <CreditCard size={120} />
                  </div>
                  <div>
                    <h3 className="text-xl font-serif font-semibold mb-2">Verification Fee</h3>
                    <p className="text-slate-300 text-sm mb-6">
                      One-time fee for legal document verification and vault hosting for this property.
                    </p>
                    <p className="text-3xl font-bold mb-8">£{totalPrice.toFixed(2)}</p>
                  </div>
                  <button
                    onClick={handlePayment}
                    disabled={currentProperty.paymentStatus === 'paid'}
                    className={cn(
                      "w-full py-4 rounded-xl font-bold transition-all flex items-center justify-center gap-2",
                      currentProperty.paymentStatus === 'paid' 
                        ? "bg-green-500/20 text-green-400 cursor-default" 
                        : "bg-white text-navy hover:bg-slate-100 active:scale-95"
                    )}
                  >
                    {currentProperty.paymentStatus === 'paid' ? (
                      <><CheckCircle2 size={20} /> Paid & Verified</>
                    ) : (
                      <><CreditCard size={20} /> Pay with Stripe</>
                    )}
                  </button>
                </div>
              </section>

              <section className="space-y-6">
                <div className="flex justify-between items-center">
                  <h3 className="text-2xl font-serif font-semibold text-navy">5-Step Pathway Overview</h3>
                  <button 
                    onClick={() => setActiveSection('team')}
                    className="text-navy font-semibold flex items-center gap-2 hover:underline"
                  >
                    Start Prepping <ArrowRight size={18} />
                  </button>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {sections.map(section => (
                    <button 
                      key={section.id} 
                      onClick={() => setActiveSection(section.id)}
                      className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm flex items-center gap-4 hover:border-navy transition-all text-left"
                    >
                      <div className={cn(
                        "p-3 rounded-lg",
                        section.status === 'completed' ? "bg-green-50 text-green-600" : "bg-slate-50 text-slate-400"
                      )}>
                        {section.id === 'team' && <Users size={24} />}
                        {section.id === 'forms' && <FileText size={24} />}
                        {section.id === 'money' && <BadgePoundSterling size={24} />}
                        {section.id === 'safety' && <ShieldAlert size={24} />}
                        {section.id === 'handoff' && <Send size={24} />}
                      </div>
                      <div className="flex-1 min-w-0">
                        <h4 className="font-semibold text-navy truncate">{section.title}</h4>
                        <p className="text-xs text-slate-500 truncate">{section.status}</p>
                      </div>
                      {section.status === 'completed' && <CheckCircle2 size={20} className="text-green-500" />}
                    </button>
                  ))}
                </div>
              </section>
            </motion.div>
          )}

          {['team', 'forms', 'money', 'safety'].includes(effectiveSection) && (
            <motion.div
              key={effectiveSection}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-8"
            >
              <header className="border-b border-slate-200 pb-8">
                <div className="flex items-center gap-4 text-gold font-bold text-[10px] uppercase tracking-[0.2em] mb-2">
                  <div className="flex items-center gap-1">
                    <MapPin size={12} />
                    {currentProperty.address}
                  </div>
                  {currentProperty.uprn && (
                    <div className="flex items-center gap-1 border-l border-slate-200 pl-3">
                      <Hash size={12} />
                      UPRN: {currentProperty.uprn}
                    </div>
                  )}
                  {currentProperty.epc_rating && (
                    <div className="flex items-center gap-1 border-l border-slate-200 pl-3">
                      <Zap size={12} />
                      EPC: {currentProperty.epc_rating}
                    </div>
                  )}
                </div>
                <h2 className="text-4xl font-serif font-bold text-navy mb-2">
                  {INITIAL_SECTIONS.find(s => s.id === effectiveSection)?.title}
                </h2>
                <p className="text-slate-500">
                  {INITIAL_SECTIONS.find(s => s.id === effectiveSection)?.description}
                </p>
              </header>
 
              <StepContent 
                id={effectiveSection as VaultSectionId}
                profile={currentProperty as any}
                onUpload={handleUpload}
                onDeleteFile={handleDeleteFile}
                onTeamUpdate={handleTeamUpdate}
                onFinancialUpdate={handleFinancialUpdate}
                onTA6Update={handleTA6Update}
                onTA7Update={handleTA7Update}
                onTA10Update={handleTA10Update}
              />
            </motion.div>
          )}

          {effectiveSection === 'handoff' && (
            <motion.div
              key="handoff"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
            >
              <header className="border-b border-slate-200 pb-8 mb-8">
                <div className="flex items-center gap-4 text-gold font-bold text-[10px] uppercase tracking-[0.2em] mb-2">
                  <div className="flex items-center gap-1">
                    <MapPin size={12} />
                    {currentProperty.address}
                  </div>
                  {currentProperty.uprn && (
                    <div className="flex items-center gap-1 border-l border-slate-200 pl-3">
                      <Hash size={12} />
                      UPRN: {currentProperty.uprn}
                    </div>
                  )}
                  {currentProperty.epc_rating && (
                    <div className="flex items-center gap-1 border-l border-slate-200 pl-3">
                      <Zap size={12} />
                      EPC: {currentProperty.epc_rating}
                    </div>
                  )}
                </div>
              </header>
              <SolicitorHandoff 
                profile={currentProperty as any} 
                sellerName={profile?.displayName}
                onSend={handleSolicitorHandoff} 
              />
            </motion.div>
          )}

          {effectiveSection === 'payment' && (
            <PaymentGate 
              property={currentProperty}
              paidPropertiesCount={paidPropertiesCount}
              onProceed={handlePayment}
            />
          )}
          {effectiveSection === 'settings' && (
            <motion.div
              key="settings"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="max-w-2xl space-y-12"
            >
              <header className="border-b border-slate-200 pb-8">
                <h2 className="text-4xl font-serif font-bold text-navy mb-2">User Settings</h2>
                <p className="text-slate-500">Manage your account and data preferences.</p>
              </header>

              <div className="bg-white p-8 rounded-3xl border border-slate-200 shadow-sm space-y-8">
                <div className="space-y-4">
                  <h3 className="text-xl font-serif font-bold text-navy">Danger Zone</h3>
                  <p className="text-sm text-slate-500">
                    Once you delete your account, there is no going back. Please be certain.
                  </p>
                </div>

                <button
                  onClick={handleDeleteAccount}
                  className="px-6 py-3 bg-red-50 text-red-600 border border-red-200 rounded-xl font-bold hover:bg-red-600 hover:text-white transition-all"
                >
                  Close Account & Delete Data
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </main>
    </div>

    <footer className="ml-64 p-6 border-t border-slate-200 text-center bg-white">
      <p className="text-xs text-slate-400 max-w-2xl mx-auto">
        Prepped Seller is a document collation tool. We do not provide legal advice. 
        AML/KYC verification remains the responsibility of your appointed solicitor.
      </p>
    </footer>
  </div>
);
}

export default function App() {
  return (
    <ErrorBoundary>
      <FirebaseProvider>
        <BrowserRouter>
          <AppContent />
        </BrowserRouter>
      </FirebaseProvider>
    </ErrorBoundary>
  );
}

function AppContent() {
  const location = useLocation();
  const shareId = new URLSearchParams(location.search).get('shareId');

  return (
    <>
      {!shareId && <Navbar />}
      <Routes>
        <Route path="/glossary" element={<Glossary />} />
        <Route path="*" element={<MainApp />} />
      </Routes>
    </>
  );
}
