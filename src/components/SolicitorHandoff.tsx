import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Link } from 'react-router-dom';
import JSZip from 'jszip';
import { 
  ShieldCheck, 
  Lock, 
  Send, 
  CheckCircle2, 
  Mail, 
  User, 
  Loader2, 
  FileCheck,
  ExternalLink,
  CreditCard,
  HelpCircle,
  AlertCircle,
  Building2,
  MapPin,
  ChevronDown,
  Copy
} from 'lucide-react';
import { cn } from '../lib/utils';
import { doc, setDoc } from 'firebase/firestore';
import { db } from '../firebase';
import type { PropertyProfile } from '../types';

interface SolicitorHandoffProps {
  profile: PropertyProfile;
  sellerName?: string;
  onSend: (data: { 
    name: string; 
    email: string; 
    practiceName: string; 
    phone: string; 
    address: string;
    payload: any;
    shareId: string;
  }) => Promise<void>;
}

export const SolicitorHandoff: React.FC<SolicitorHandoffProps> = ({ profile, sellerName, onSend }) => {
  const [practiceName, setPracticeName] = useState(profile.solicitorInfo?.practiceName || '');
  const [name, setName] = useState(profile.solicitorInfo?.name || '');
  const [email, setEmail] = useState(profile.solicitorInfo?.email || '');
  const [phone, setPhone] = useState(profile.solicitorInfo?.phone || '');
  const [address, setAddress] = useState(profile.solicitorInfo?.address || '');
  const [isSending, setIsSending] = useState(false);
  const [isBundling, setIsBundling] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [showButtonSuccess, setShowButtonSuccess] = useState(false);
  const [activeTooltip, setActiveTooltip] = useState<string | null>(null);

  const alreadySent = !!profile.solicitorInfo?.sentAt;

  // Status calculation logic
  const getStakeholdersStatus = () => {
    const info = profile.teamInfo;
    const required = [info?.groundLeaseHolder, info?.managementCompany, info?.managingAgent];
    const present = required.filter(Boolean).length;
    if (present === required.length) return 'green';
    if (present > 0) return 'amber';
    return 'red';
  };

  const getFormsStatus = () => {
    const required = ['ta6', 'ta7', 'ta10', 'lpe1'];
    const completed = required.filter(id => profile.vaultProgress[id as any]).length;
    if (completed === required.length) return 'green';
    if (completed > 0) return 'amber';
    return 'red';
  };

  const getMoneyStatus = () => {
    const required = ['sc_accounts', 'sc_budget', 'ground_rent_receipt', 'reserve_fund_confirmation', 'transfer_fees'];
    const completed = required.filter(id => profile.vaultProgress[id as any]).length;
    if (completed === required.length) return 'green';
    if (completed > 0) return 'amber';
    return 'red';
  };

  const getSafetyStatus = () => {
    const required = ['fra', 'insurance', 'bsa', 'eicr', 'asbestos_survey'];
    const completed = required.filter(id => profile.vaultProgress[id as any]).length;
    if (completed === required.length) return 'green';
    if (completed > 0) return 'amber';
    return 'red';
  };

  const getMissingStakeholders = () => {
    const missing = [];
    if (!profile.teamInfo?.groundLeaseHolder) missing.push('Ground Lease Holder Details');
    if (!profile.teamInfo?.managementCompany) missing.push('Management Company Details');
    if (!profile.teamInfo?.managingAgent) missing.push('Managing Agent Details');
    return missing;
  };

  const getMissingForms = () => {
    const required = [
      { id: 'ta6', label: 'TA6: Property Information' },
      { id: 'ta7', label: 'TA7: Leasehold Information' },
      { id: 'ta10', label: 'TA10: Fittings and Contents' },
      { id: 'lpe1', label: 'LPE1: Leasehold Enquiries' }
    ];
    return required.filter(f => !profile.vaultProgress[f.id as any]).map(f => f.label);
  };

  const getMissingMoney = () => {
    const required = [
      { id: 'sc_accounts', label: 'Service Charge Accounts (3 Years)' },
      { id: 'sc_budget', label: 'Current Year Budget' },
      { id: 'ground_rent_receipt', label: 'Ground Rent Receipt' },
      { id: 'reserve_fund_confirmation', label: 'Reserve Fund Confirmation' },
      { id: 'transfer_fees', label: 'Notice & Transfer Fees info' }
    ];
    return required.filter(m => !profile.vaultProgress[m.id as any]).map(m => m.label);
  };

  const getMissingSafety = () => {
    const required = [
      { id: 'fra', label: 'Fire Risk Assessment' },
      { id: 'insurance', label: 'Building Insurance' },
      { id: 'bsa', label: 'BSA 2022 Documents' },
      { id: 'eicr', label: 'EICR (Electrical Safety)' },
      { id: 'asbestos_survey', label: 'Asbestos Survey' }
    ];
    return required.filter(s => !profile.vaultProgress[s.id as any]).map(s => s.label);
  };

  const TrafficLight = ({ status }: { status: 'green' | 'amber' | 'red' }) => (
    <div className="flex flex-col gap-0.5 bg-slate-800 p-1 rounded-md w-fit">
      <div className={cn("w-2 h-2 rounded-full", status === 'red' ? "bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.8)]" : "bg-red-900/50")} />
      <div className={cn("w-2 h-2 rounded-full", status === 'amber' ? "bg-amber-500 shadow-[0_0_8px_rgba(245,158,11,0.8)]" : "bg-amber-900/50")} />
      <div className={cn("w-2 h-2 rounded-full", status === 'green' ? "bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.8)]" : "bg-green-900/50")} />
    </div>
  );

  const trackerSections = [
    { 
      id: 'stakeholders', 
      label: 'Step 1: Stakeholders', 
      status: getStakeholdersStatus() as 'green' | 'amber' | 'red', 
      missing: getMissingStakeholders() 
    },
    { 
      id: 'forms', 
      label: 'Step 2: Legal Forms', 
      status: getFormsStatus() as 'green' | 'amber' | 'red', 
      missing: getMissingForms() 
    },
    { 
      id: 'money', 
      label: 'Step 3: The Money', 
      status: getMoneyStatus() as 'green' | 'amber' | 'red', 
      missing: getMissingMoney() 
    },
    { 
      id: 'safety', 
      label: 'Step 4: Safety Vault', 
      status: getSafetyStatus() as 'green' | 'amber' | 'red', 
      missing: getMissingSafety() 
    },
  ];

  const handleGeneratePack = async () => {
    if (isSending || isBundling || showButtonSuccess) return;

    setIsBundling(true);
    
    // 1. Data Payload Construction
    // Gathering complete profile, file URLs and solicitor details
    const payload = {
      propertyProfile: {
        address: profile.address,
        uprn: profile.uprn || null,
        epc_rating: profile.epc_rating || null,
        total_floor_area: profile.total_floor_area || null,
        vaultProgress: profile.vaultProgress || {},
        teamInfo: profile.teamInfo || {},
        ta6Data: profile.ta6Data || null,
        ta10Data: profile.ta10Data || null,
        lpe1Data: profile.lpe1Data || null,
        sharedAt: new Date().toISOString()
      },
      evidence: profile.vaultFiles || {},
      solicitorDetails: {
        practiceName: practiceName || null,
        name: name || null,
        email: email || null,
        phone: phone || null,
        practiceAddress: address || null
      }
    };

    try {
      const zip = new JSZip();
      
      // Add solicitor-pack.json at the root
      const jsonString = JSON.stringify(payload, null, 2);
      zip.file('solicitor-pack.json', jsonString);

      // Create evidence_documents folder
      const folder = zip.folder('evidence_documents');

      // Fetch all evidence files and bundle them
      const evidence = profile.vaultFiles || {};
      const filePromises = Object.entries(evidence).map(async ([key, data]: [string, any]) => {
        if (data && data.url) {
          try {
            const response = await fetch(data.url);
            if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
            const blob = await response.blob();
            const fileName = `${key.replace(/_/g, '-')}.pdf`;
            folder?.file(fileName, blob);
          } catch (err) {
            console.warn(`Failed to bundle file for ${key}:`, err);
          }
        }
      });

      await Promise.all(filePromises);

      // Generate the ZIP blob
      const zipContent = await zip.generateAsync({ type: 'blob' });
      const downloadUrl = URL.createObjectURL(zipContent);

      // Trigger browser download of the ZIP file
      const link = document.createElement('a');
      const sanitizedAddress = profile.address.split(',')[0].replace(/\s+/g, '-').toLowerCase();
      link.href = downloadUrl;
      link.download = `property-pack.zip`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(downloadUrl);

      // Record the generation in the property profile
      await onSend({ 
        practiceName, 
        name, 
        email, 
        phone, 
        address, 
        payload, 
        shareId: '' // Cloud share disabled
      });

      setIsSuccess(true);
      setShowButtonSuccess(true);
      setTimeout(() => setIsSuccess(false), 5000);
      setTimeout(() => setShowButtonSuccess(false), 3000); // Revert to active after 3s
    } catch (error: any) {
      console.error('Failed to generate pack:', error);
      alert('Failed to generate pack: ' + error.message);
    } finally {
      setIsBundling(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    handleGeneratePack();
  };

  const copyEmailTemplate = () => {
    const docs = [];
    if (profile.ta6Data) docs.push('TA6 (Property Information Form)');
    if (profile.ta7Data) docs.push('TA7 (Leasehold Information Form)');
    if (profile.ta10Data) docs.push('TA10 (Fittings and Contents Form)');
    if (profile.lpe1Data) docs.push('LPE1 (Leasehold Enquiries)');

    const docList = docs.length > 0 
      ? `This pack currently includes:\n\n${docs.map(d => `${d}`).join('\n\n')}\n\nDPDTS-compliant JSON data file`
      : 'This pack currently includes all available evidence and property data for this sale.';

    const caveat = 'Please note that these forms are as complete as possible at present. I am still working on updating certain sections and providing further document evidence. I will follow up with an updated pack as soon as that additional information becomes available.';

    const signOff = sellerName ? `Kind regards,\n${sellerName}` : 'Kind regards,';

    const template = `Subject: Digital Property Pack for ${profile.address}

Dear ${name || '[Solicitor Name]'},

Please find attached the digital property pack for my sale. This ZIP archive contains all relevant evidence documents in PDF format, alongside a machine-readable JSON file following the Digital Property Data Trust Standard (DPDTS).

${docList}

${caveat}

${signOff}`;
    
    navigator.clipboard.writeText(template);
    alert('Email template copied to clipboard');
  };

  const shareLink = profile.solicitorInfo?.shareId 
    ? `${window.location.origin}?shareId=${profile.solicitorInfo.shareId}`
    : '';

  const copyToClipboard = () => {
    if (shareLink) {
      navigator.clipboard.writeText(shareLink);
      alert('Link copied!');
    }
  };

  return (
    <div className="space-y-12">
      <div>
        <h2 className="text-3xl font-serif font-bold text-navy tracking-tight">Step 5: The Handoff</h2>
        <p className="text-slate-500 mt-2">Securely transfer your verified Material Information pack to your legal team.</p>
      </div>

      {/* Full Width Data Readiness Tracker */}
      <section className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm">
        <div className="bg-slate-50 border-b border-slate-200 p-6 flex items-center justify-between">
          <h3 className="text-sm font-bold text-navy uppercase tracking-widest flex items-center gap-2">
            <FileCheck size={18} className="text-gold" />
            Data Readiness Tracker
          </h3>
          <div className="flex gap-4">
            {['green', 'amber', 'red'].map(s => (
              <div key={s} className="flex items-center gap-1.5 text-[10px] font-bold text-slate-400">
                <div className={cn(
                  "w-2 h-2 rounded-full",
                  s === 'green' ? "bg-green-500" : s === 'amber' ? "bg-amber-500" : "bg-red-500"
                )} />
                {s === 'green' ? 'Complete' : s === 'amber' ? 'Partial' : 'Missing'}
              </div>
            ))}
          </div>
        </div>
        <div className="divide-y divide-slate-100">
          {trackerSections.map((section) => (
            <details key={section.id} className="group transition-all">
              <summary className="flex items-center justify-between p-6 cursor-pointer hover:bg-slate-50/50 transition-colors list-none">
                <div className="flex items-center gap-6">
                  <TrafficLight status={section.status} />
                  <span className="font-serif font-bold text-navy text-lg">{section.label}</span>
                </div>
                <div className="flex items-center gap-4">
                  <span className={cn(
                    "text-[10px] font-bold px-2 py-0.5 rounded uppercase",
                    section.status === 'green' ? "bg-green-100 text-green-700" :
                    section.status === 'amber' ? "bg-amber-100 text-amber-700" :
                    "bg-red-100 text-red-700"
                  )}>
                    {section.status === 'green' ? 'Ready' : section.status === 'amber' ? 'Action Required' : 'Incomplete'}
                  </span>
                  <motion.div
                    animate={{ rotate: 0 }}
                    className="text-slate-400 group-open:rotate-180 transition-transform"
                  >
                    <ChevronDown size={20} />
                  </motion.div>
                </div>
              </summary>
              <div className="px-20 pb-8 space-y-4">
                {section.status === 'green' ? (
                  <div className="bg-green-50 text-green-700 p-4 rounded-xl flex items-center gap-3 text-sm font-medium border border-green-100">
                    <CheckCircle2 size={18} className="shrink-0" />
                    All required documents and details have been provided.
                  </div>
                ) : (
                  <div className="space-y-4">
                    <p className="text-xs font-bold text-slate-400 uppercase tracking-tight">Missing or Incomplete Items:</p>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {section.missing.map((item, idx) => (
                        <div key={idx} className="flex items-start gap-3 text-sm text-slate-600 bg-slate-50/50 p-3 rounded-xl border border-slate-100 shadow-sm">
                          <AlertCircle size={14} className="text-amber-500 shrink-0 mt-0.5" />
                          {item}
                        </div>
                      ))}
                      {section.missing.length === 0 && section.status === 'amber' && (
                        <div className="text-sm text-slate-400 italic bg-amber-50/30 p-3 rounded-xl border border-amber-100/30">
                          Basic information provided but verification pending
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </details>
          ))}
        </div>
      </section>

      {/* Solicitor Instruction Form */}
      <section className="bg-white border border-slate-200 rounded-2xl p-8 shadow-sm relative overflow-hidden">
        <div className="mb-8">
          <h3 className="text-2xl font-serif font-bold text-navy">Instruct Your Solicitor</h3>
          <p className="text-slate-500 mt-1">Provide your solicitor's contact information to transfer the secure pack.</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 pb-8 border-b border-slate-100">
            <div className="space-y-2">
              <label className="text-sm font-semibold text-navy flex items-center gap-2">
                <Building2 size={14} className="text-slate-400" /> Practice Name
              </label>
              <input
                type="text"
                required
                value={practiceName}
                onChange={(e) => setPracticeName(e.target.value)}
                placeholder="e.g. Jenkins & Co Solicitors"
                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-navy/20 focus:border-navy outline-none transition-all"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-semibold text-navy flex items-center gap-2">
                <User size={14} className="text-slate-400" /> Solicitor Name
              </label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Sarah Jenkins"
                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-navy/20 focus:border-navy outline-none transition-all"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-semibold text-navy flex items-center gap-2">
                <Mail size={14} className="text-slate-400" /> Solicitor Email
              </label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="s.jenkins@lawfirm.co.uk"
                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-navy/20 focus:border-navy outline-none transition-all"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-semibold text-navy flex items-center gap-2">
                <ShieldCheck size={14} className="text-slate-400" /> Solicitor Phone
              </label>
              <input
                type="tel"
                required
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="020 7123 4567"
                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-navy/20 focus:border-navy outline-none transition-all"
              />
            </div>
            <div className="md:col-span-2 space-y-2">
              <label className="text-sm font-semibold text-navy flex items-center gap-2">
                <MapPin size={14} className="text-slate-400" /> Practice Office Address
              </label>
              <textarea
                required
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                placeholder="123 Law Lane, London, EC1A 1AA"
                rows={3}
                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-navy/20 focus:border-navy outline-none transition-all resize-none"
              />
            </div>
          </div>

          <div className="flex flex-col items-center gap-6">
            <button
              type="submit"
              disabled={isSending || isBundling || showButtonSuccess}
              className={cn(
                "w-full max-w-lg py-5 rounded-2xl font-bold flex items-center justify-center gap-3 transition-all shadow-xl hover:shadow-2xl active:scale-[0.98]",
                showButtonSuccess 
                  ? "bg-green-50 text-green-700 border border-green-200 cursor-default"
                  : "bg-navy text-white hover:bg-navy-light disabled:opacity-50"
              )}
            >
              {isBundling ? (
                <>
                  <Loader2 size={24} className="animate-spin" />
                  Bundling Documents...
                </>
              ) : isSending ? (
                <>
                  <Loader2 size={24} className="animate-spin" />
                  Generating Pack...
                </>
              ) : showButtonSuccess ? (
                <>
                  <CheckCircle2 size={24} />
                  Pack Generated
                </>
              ) : (
                <>
                  <Send size={24} />
                  {alreadySent ? 'Update & Redownload' : 'Generate and Download'}
                </>
              )}
            </button>
            <p className="text-xs text-slate-400 text-center max-w-sm">
              Click the button above to save your digital property pack to your device. You must then attach this downloaded file to an email and send it directly to your solicitor to begin the legal process.
            </p>
          </div>

          {/* Secure Access Link UI Hidden */}

          <div className="mt-12 p-8 bg-slate-50 border-2 border-dashed border-slate-200 rounded-3xl space-y-6 max-w-2xl mx-auto">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-navy/5 rounded-full flex items-center justify-center text-navy">
                  <Mail size={20} />
                </div>
                <h4 className="font-bold text-navy">Draft Email to Solicitor</h4>
              </div>
              <button
                type="button"
                onClick={copyEmailTemplate}
                className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 rounded-xl text-xs font-bold text-navy hover:bg-navy hover:text-white transition-all shadow-sm active:scale-95"
              >
                <Copy size={14} />
                Copy Email Text
              </button>
            </div>

            <div className="bg-white p-6 rounded-2xl border border-slate-100 text-sm text-slate-600 leading-relaxed shadow-inner font-sans">
              <p className="font-bold text-navy mb-4">Subject: Digital Property Pack for {profile.address}</p>
              <p className="mb-4">Dear {name || '[Solicitor Name]'},</p>
              <p className="mb-4">
                Please find attached the digital property pack for my sale. This ZIP archive contains all relevant evidence documents in PDF format, alongside a machine-readable JSON file following the Digital Property Data Trust Standard (DPDTS).
              </p>
              
              {(() => {
                const docs = [];
                if (profile.ta6Data) docs.push('TA6 (Property Information Form)');
                if (profile.ta7Data) docs.push('TA7 (Leasehold Information Form)');
                if (profile.ta10Data) docs.push('TA10 (Fittings and Contents Form)');
                if (profile.lpe1Data) docs.push('LPE1 (Leasehold Enquiries)');

                return (
                  <>
                    {docs.length > 0 ? (
                      <div className="mb-4 space-y-4">
                        <p>This pack currently includes:</p>
                        {docs.map((doc, idx) => (
                          <p key={idx} className="pl-4 border-l-2 border-gold/30">{doc}</p>
                        ))}
                        <p className="pl-4 border-l-2 border-gold/30">DPDTS-compliant JSON data file</p>
                      </div>
                    ) : (
                      <p className="mb-4">This pack currently includes all available evidence and property data for this sale.</p>
                    )}
                    <p className="mb-4 text-slate-500 italic">
                      Please note that these forms are as complete as possible at present. I am still working on updating certain sections and providing further document evidence. I will follow up with an updated pack as soon as that additional information becomes available.
                    </p>
                  </>
                );
              })()}

              <p>Kind regards,<br />{sellerName || ''}</p>
            </div>
          </div>
        </form>
      </section>

      {/* Success Toast Simulation */}
      <AnimatePresence>
        {isSuccess && (
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 50 }}
            className="fixed bottom-8 right-8 z-50 bg-green-600 text-white px-6 py-4 rounded-2xl shadow-2xl flex items-center gap-4 border border-green-500"
          >
            <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center">
              <CheckCircle2 size={24} />
            </div>
            <div>
              <p className="font-bold text-lg">Solicitor Pack Generated</p>
              <p className="text-sm text-green-100">All documents have been bundled for local download.</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
