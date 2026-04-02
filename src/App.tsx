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
  Loader2
} from 'lucide-react';
import { Sidebar } from './components/Sidebar';
import { VaultSection } from './components/VaultSection';
import { SolicitorHandoff } from './components/SolicitorHandoff';
import { loadStripe } from '@stripe/stripe-js';

const stripePromise = loadStripe((import.meta as any).env.VITE_STRIPE_PUBLISHABLE_KEY);
import { ProgressBar } from './components/ProgressBar';
import { cn } from './lib/utils';
import type { AppState, VaultSectionId, UserProfile } from './types';
import { FirebaseProvider, useAuth } from './components/FirebaseProvider';
import { Auth } from './components/Auth';
import ErrorBoundary from './components/ErrorBoundary';
import { doc, updateDoc } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { db, storage, handleFirestoreError, OperationType } from './firebase';
import { validateDocument } from './services/geminiService';

const INITIAL_SECTIONS: Omit<AppState['sections'][0], 'status'>[] = [
  { 
    id: 'leasehold', 
    title: 'Leasehold Info (LPE1)', 
    description: 'Management information, service charges, and ground rent details.',
  },
  { 
    id: 'safety', 
    title: 'Building Safety (BSA)', 
    description: 'EWS1 forms, fire risk assessments, and cladding status.',
  },
  { 
    id: 'tenure', 
    title: 'Tenure & Title', 
    description: 'Land Registry documents and proof of ownership.',
  },
  { 
    id: 'utilities', 
    title: 'Utilities & EPC', 
    description: 'Energy Performance Certificate and utility provider details.',
  },
  { 
    id: 'parking', 
    title: 'Parking & Access', 
    description: 'Allocated spaces, permits, and access restrictions.',
  },
];

function MainApp() {
  const { user, profile, loading } = useAuth();
  const [activeSection, setActiveSection] = useState('dashboard');

  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.get('payment') === 'success' && user) {
      const updatePayment = async () => {
        const userRef = doc(db, 'users', user.uid);
        await updateDoc(userRef, {
          paymentStatus: 'paid',
          hasPaid: true
        });
        // Clean up URL
        window.history.replaceState({}, document.title, window.location.pathname);
      };
      updatePayment();
    }
  }, [user]);

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center space-y-4">
          <Loader2 className="animate-spin text-navy mx-auto" size={48} />
          <p className="text-navy font-serif font-bold text-xl">Loading your secure vault...</p>
        </div>
      </div>
    );
  }

  if (!user || !profile) {
    return <Auth />;
  }

  const sections = INITIAL_SECTIONS.map(s => ({
    ...s,
    status: (profile.vaultProgress[s.id as VaultSectionId] ? 'completed' : 'pending') as 'pending' | 'completed',
    fileName: profile.vaultFiles[s.id as VaultSectionId]?.fileName
  }));

  const completedCount = Object.values(profile.vaultProgress).filter(Boolean).length;
  const progress = (completedCount / INITIAL_SECTIONS.length) * 100;

  const handleUpload = async (id: string, file: File) => {
    try {
      // 1. Upload to Storage
      const storageRef = ref(storage, `users/${user.uid}/vault/${id}/${file.name}`);
      await uploadBytes(storageRef, file);
      const downloadURL = await getDownloadURL(storageRef);

      // 2. Update Firestore with file info and set AI status to pending
      const userRef = doc(db, 'users', user.uid);
      await updateDoc(userRef, {
        [`vaultFiles.${id}`]: {
          url: downloadURL,
          fileName: file.name
        },
        [`aiVerification.${id}`]: {
          status: 'pending'
        }
      });

      // 3. AI Validation
      const section = INITIAL_SECTIONS.find(s => s.id === id);
      const validation = await validateDocument(section?.title || id, file.name);

      // 4. Update Firestore with AI result
      await updateDoc(userRef, {
        [`vaultProgress.${id}`]: validation.isValid,
        [`aiVerification.${id}`]: {
          status: validation.isValid ? 'verified' : 'failed',
          message: validation.message
        }
      });
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `users/${user.uid}`);
    }
  };

  const handleSolicitorHandoff = async (name: string, email: string) => {
    try {
      // Simulate API call delay
      await new Promise(resolve => setTimeout(resolve, 2000));

      // Update Firestore with solicitor info
      const userRef = doc(db, 'users', user.uid);
      await updateDoc(userRef, {
        solicitorInfo: {
          name,
          email,
          sentAt: new Date().toISOString()
        }
      });
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `users/${user.uid}`);
    }
  };

  const handlePayment = async () => {
    try {
      const response = await fetch('/api/create-checkout-session', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ userId: user.uid }),
      });

      const session = await response.json();
      const stripe = await stripePromise;
      
      if (stripe && session.id) {
        const { error } = await (stripe as any).redirectToCheckout({
          sessionId: session.id,
        });
        if (error) console.error(error);
      }
    } catch (error) {
      console.error('Payment Error:', error);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex">
      <Sidebar activeSection={activeSection} onSectionChange={setActiveSection} />
      
      <main className="flex-1 ml-64 p-12 max-w-6xl mx-auto">
        <AnimatePresence mode="wait">
          {activeSection === 'dashboard' && (
            <motion.div
              key="dashboard"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-10"
            >
              <header className="flex justify-between items-end border-b border-slate-200 pb-8">
                <div>
                  <h2 className="text-4xl font-serif font-bold text-navy mb-2">Compliance Dashboard</h2>
                  <p className="text-slate-500 max-w-lg">
                    Welcome back, <span className="font-bold text-navy">{profile.displayName || profile.email}</span>. 
                    Manage your Material Information requirements for a smooth flat sale.
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
                    <h3 className="text-xl font-serif font-semibold text-navy">Overall Progress</h3>
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
                      One-time fee for legal document verification and vault hosting.
                    </p>
                    <p className="text-3xl font-bold mb-8">£249.00</p>
                  </div>
                  <button
                    onClick={handlePayment}
                    disabled={profile.paymentStatus === 'paid'}
                    className={cn(
                      "w-full py-4 rounded-xl font-bold transition-all flex items-center justify-center gap-2",
                      profile.paymentStatus === 'paid' 
                        ? "bg-green-500/20 text-green-400 cursor-default" 
                        : "bg-white text-navy hover:bg-slate-100 active:scale-95"
                    )}
                  >
                    {profile.paymentStatus === 'paid' ? (
                      <><CheckCircle2 size={20} /> Paid & Verified</>
                    ) : (
                      <><CreditCard size={20} /> Pay with Stripe</>
                    )}
                  </button>
                </div>
              </section>

              <section className="space-y-6">
                <div className="flex justify-between items-center">
                  <h3 className="text-2xl font-serif font-semibold text-navy">Vault Overview</h3>
                  <button 
                    onClick={() => setActiveSection('vault')}
                    className="text-navy font-semibold flex items-center gap-2 hover:underline"
                  >
                    View All <ArrowRight size={18} />
                  </button>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {sections.slice(0, 3).map(section => (
                    <div key={section.id} className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm flex items-center gap-4">
                      <div className={cn(
                        "p-3 rounded-lg",
                        section.status === 'completed' ? "bg-green-50 text-green-600" : "bg-slate-50 text-slate-400"
                      )}>
                        {section.id === 'leasehold' && <Building2 size={24} />}
                        {section.id === 'safety' && <ShieldCheck size={24} />}
                        {section.id === 'tenure' && <Key size={24} />}
                      </div>
                      <div className="flex-1 min-w-0">
                        <h4 className="font-semibold text-navy truncate">{section.title}</h4>
                        <p className="text-xs text-slate-500 truncate">{section.status}</p>
                      </div>
                      {section.status === 'completed' && <CheckCircle2 size={20} className="text-green-500" />}
                    </div>
                  ))}
                </div>
              </section>
            </motion.div>
          )}

          {activeSection === 'vault' && (
            <motion.div
              key="vault"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-8"
            >
              <header className="border-b border-slate-200 pb-8">
                <h2 className="text-4xl font-serif font-bold text-navy mb-2">Document Vault</h2>
                <p className="text-slate-500">
                  Upload the required documents for each section. Our legal team will review them within 48 hours.
                </p>
              </header>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                  {sections.map(section => (
                    <VaultSection 
                      key={section.id} 
                      section={section} 
                      onUpload={handleUpload}
                      aiStatus={profile.aiVerification[section.id as VaultSectionId]}
                    />
                  ))}
                </div>
            </motion.div>
          )}

          {activeSection === 'handoff' && (
            <motion.div
              key="handoff"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
            >
              <SolicitorHandoff 
                profile={profile} 
                onSend={handleSolicitorHandoff} 
              />
            </motion.div>
          )}

          {activeSection === 'payment' && (
            <motion.div
              key="payment"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="max-w-2xl mx-auto text-center space-y-8 py-12"
            >
              <div className="w-20 h-20 bg-navy/5 text-navy rounded-full flex items-center justify-center mx-auto mb-8">
                <CreditCard size={40} />
              </div>
              <h2 className="text-4xl font-serif font-bold text-navy">Secure Payment</h2>
              <p className="text-slate-500 text-lg">
                To finalize your Material Information pack and share it with potential buyers, 
                a verification fee of £249.00 is required.
              </p>
              
              <div className="bg-white p-10 rounded-3xl border border-slate-200 shadow-xl space-y-8">
                <div className="flex justify-between items-center text-left border-b border-slate-100 pb-6">
                  <div>
                    <p className="font-bold text-navy text-xl">Vault Verification Pack</p>
                    <p className="text-slate-500 text-sm">Includes legal review & hosting</p>
                  </div>
                  <p className="text-2xl font-bold text-navy">£249.00</p>
                </div>
                
                <div className="space-y-4">
                  <div className="flex items-center gap-3 text-slate-600 text-sm">
                    <CheckCircle2 size={18} className="text-green-500" />
                    <span>Solicitor-approved document check</span>
                  </div>
                  <div className="flex items-center gap-3 text-slate-600 text-sm">
                    <CheckCircle2 size={18} className="text-green-500" />
                    <span>Secure digital vault for 12 months</span>
                  </div>
                  <div className="flex items-center gap-3 text-slate-600 text-sm">
                    <CheckCircle2 size={18} className="text-green-500" />
                    <span>Instant sharing with estate agents</span>
                  </div>
                </div>

                <button
                  onClick={handlePayment}
                  disabled={profile.paymentStatus === 'paid'}
                  className={cn(
                    "w-full py-5 rounded-2xl font-bold text-lg transition-all flex items-center justify-center gap-3 shadow-lg",
                    profile.paymentStatus === 'paid'
                      ? "bg-green-500 text-white cursor-default"
                      : "bg-navy text-white hover:bg-navy-light active:scale-95"
                  )}
                >
                  {profile.paymentStatus === 'paid' ? (
                    <><CheckCircle2 size={24} /> Payment Confirmed</>
                  ) : (
                    <><Lock size={20} /> Pay £249.00 with Stripe</>
                  )}
                </button>
                
                <p className="text-xs text-slate-400 flex items-center justify-center gap-2">
                  <ShieldCheck size={14} /> Securely processed by Stripe. No card details stored.
                </p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </main>
    </div>
  );
}

export default function App() {
  return (
    <ErrorBoundary>
      <FirebaseProvider>
        <MainApp />
      </FirebaseProvider>
    </ErrorBoundary>
  );
}
