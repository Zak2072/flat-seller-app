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
  Car
} from 'lucide-react';
import { Sidebar } from './components/Sidebar';
import { VaultSection } from './components/VaultSection';
import { ProgressBar } from './components/ProgressBar';
import { cn } from './lib/utils';
import type { AppState, VaultSectionId } from './types';

const INITIAL_SECTIONS: AppState['sections'] = [
  { 
    id: 'leasehold', 
    title: 'Leasehold Info (LPE1)', 
    description: 'Management information, service charges, and ground rent details.',
    status: 'pending' 
  },
  { 
    id: 'safety', 
    title: 'Building Safety (BSA)', 
    description: 'EWS1 forms, fire risk assessments, and cladding status.',
    status: 'pending' 
  },
  { 
    id: 'tenure', 
    title: 'Tenure & Title', 
    description: 'Land Registry documents and proof of ownership.',
    status: 'pending' 
  },
  { 
    id: 'utilities', 
    title: 'Utilities & EPC', 
    description: 'Energy Performance Certificate and utility provider details.',
    status: 'pending' 
  },
  { 
    id: 'parking', 
    title: 'Parking & Access', 
    description: 'Allocated spaces, permits, and access restrictions.',
    status: 'pending' 
  },
];

export default function App() {
  const [activeSection, setActiveSection] = useState('dashboard');
  const [state, setState] = useState<AppState>({
    sections: INITIAL_SECTIONS,
    paymentStatus: 'unpaid',
  });

  const completedCount = state.sections.filter(s => s.status === 'completed').length;
  const progress = (completedCount / state.sections.length) * 100;

  const handleUpload = (id: string, file: File) => {
    setState(prev => ({
      ...prev,
      sections: prev.sections.map(s => 
        s.id === id ? { ...s, status: 'completed', fileName: file.name } : s
      )
    }));
  };

  const handlePayment = () => {
    // Mock Stripe payment
    const confirm = window.confirm("Proceed to secure payment of £249.00?");
    if (confirm) {
      setState(prev => ({ ...prev, paymentStatus: 'paid' }));
      alert("Payment successful. Your vault is now fully verified.");
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
                    Manage your Material Information requirements for a smooth flat sale. 
                    Ensure all 'Vault' sections are complete to avoid delays.
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
                    {state.sections.map((s, i) => (
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
                    {completedCount} of {state.sections.length} critical documents uploaded.
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
                    disabled={state.paymentStatus === 'paid'}
                    className={cn(
                      "w-full py-4 rounded-xl font-bold transition-all flex items-center justify-center gap-2",
                      state.paymentStatus === 'paid' 
                        ? "bg-green-500/20 text-green-400 cursor-default" 
                        : "bg-white text-navy hover:bg-slate-100 active:scale-95"
                    )}
                  >
                    {state.paymentStatus === 'paid' ? (
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
                  {state.sections.slice(0, 3).map(section => (
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
                {state.sections.map(section => (
                  <VaultSection 
                    key={section.id} 
                    section={section} 
                    onUpload={handleUpload} 
                  />
                ))}
              </div>
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
                  disabled={state.paymentStatus === 'paid'}
                  className={cn(
                    "w-full py-5 rounded-2xl font-bold text-lg transition-all flex items-center justify-center gap-3 shadow-lg",
                    state.paymentStatus === 'paid'
                      ? "bg-green-500 text-white cursor-default"
                      : "bg-navy text-white hover:bg-navy-light active:scale-95"
                  )}
                >
                  {state.paymentStatus === 'paid' ? (
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
