import React, { useEffect, useState } from 'react';
import { 
  ShieldCheck, 
  CheckCircle2, 
  FileText, 
  Users, 
  BadgePoundSterling, 
  ShieldAlert,
  Loader2,
  Lock,
  Download
} from 'lucide-react';
import { collection, query, where, getDocs, collectionGroup } from 'firebase/firestore';
import { db } from '../firebase';
import type { PropertyProfile, VaultSectionId } from '../types';
import { cn } from '../lib/utils';

interface SolicitorViewProps {
  shareId: string;
}

export const SolicitorView: React.FC<SolicitorViewProps> = ({ shareId }) => {
  const [profile, setProfile] = useState<PropertyProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        // Use collectionGroup to find the property with the matching shareId across all users
        const propertiesRef = collectionGroup(db, 'properties');
        const q = query(propertiesRef, where('solicitorInfo.shareId', '==', shareId));
        const querySnapshot = await getDocs(q);

        if (querySnapshot.empty) {
          setError('Invalid or expired secure link.');
          setLoading(false);
          return;
        }

        const propertyData = querySnapshot.docs[0].data() as PropertyProfile;
        setProfile(propertyData);
      } catch (err) {
        console.error('Error fetching solicitor view:', err);
        setError('Failed to load secure view. Please try again later.');
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, [shareId]);

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center space-y-4">
          <Loader2 className="animate-spin text-navy mx-auto" size={48} />
          <p className="text-navy font-serif font-bold text-xl">Loading Secure Solicitor View...</p>
        </div>
      </div>
    );
  }

  if (error || !profile) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6">
        <div className="max-w-md w-full bg-white p-12 rounded-3xl border border-slate-200 shadow-xl text-center space-y-6">
          <div className="w-20 h-20 bg-red-50 text-red-600 rounded-full flex items-center justify-center mx-auto">
            <Lock size={40} />
          </div>
          <h2 className="text-3xl font-serif font-bold text-navy">Access Denied</h2>
          <p className="text-slate-500">{error}</p>
          <p className="text-xs text-slate-400">
            For security reasons, this link may have been revoked or is no longer valid.
          </p>
        </div>
      </div>
    );
  }

  const sections = [
    { id: 'team', title: 'Step 1: Stakeholders', icon: Users },
    { id: 'forms', title: 'Step 2: The Forms', icon: FileText },
    { id: 'money', title: 'Step 3: The Money', icon: BadgePoundSterling },
    { id: 'safety', title: 'Step 4: The Safety', icon: ShieldAlert },
  ];

  return (
    <div className="min-h-screen bg-slate-50 pb-20">
      <nav className="bg-navy text-white p-6 shadow-xl sticky top-0 z-50">
        <div className="max-w-6xl mx-auto flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-white rounded-lg flex items-center justify-center">
              <ShieldCheck className="text-navy" size={24} />
            </div>
            <h1 className="text-2xl font-serif font-bold tracking-tight uppercase">Prepped Seller</h1>
          </div>
          <div className="flex items-center gap-4 text-sm">
            <span className="px-3 py-1 bg-green-500/20 text-green-400 rounded-full font-bold border border-green-500/30 flex items-center gap-2">
              <Lock size={14} /> Secure Solicitor View
            </span>
          </div>
        </div>
      </nav>

      <main className="max-w-6xl mx-auto p-12 space-y-12">
        <header className="border-b border-slate-200 pb-8 flex justify-between items-end">
          <div>
            <div className="flex items-center gap-2 text-gold font-bold text-[10px] uppercase tracking-[0.2em] mb-2">
              <ShieldCheck size={12} />
              Material Information Pack
            </div>
            <h2 className="text-4xl font-serif font-bold text-navy mb-2">{profile.address}</h2>
            <p className="text-slate-500">
              Vault Status: <span className="font-bold text-navy uppercase tracking-widest text-xs">{profile.status}</span>
            </p>
          </div>
          <div className="text-right">
            <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">Generated On</p>
            <p className="text-navy font-medium">{new Date(profile.solicitorInfo?.sentAt || '').toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })}</p>
          </div>
        </header>

        {profile.teamInfo && (
          <section className="bg-white p-8 rounded-3xl border border-slate-200 shadow-sm space-y-6">
            <h3 className="text-2xl font-serif font-bold text-navy flex items-center gap-3">
              <Users size={24} /> Stakeholders
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <div className="space-y-1">
                <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Ground Lease Holder</p>
                <p className="text-navy font-medium">{profile.teamInfo.groundLeaseHolder}</p>
              </div>
              <div className="space-y-1">
                <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Management Company</p>
                <p className="text-navy font-medium">{profile.teamInfo.managementCompany}</p>
              </div>
              <div className="space-y-1">
                <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Managing Agent</p>
                <p className="text-navy font-medium">{profile.teamInfo.managingAgent}</p>
              </div>
            </div>
            {profile.financialInfo?.reserveFundAmount && (
              <div className="pt-6 border-t border-slate-100">
                <div className="inline-flex flex-col p-4 bg-navy text-white rounded-2xl shadow-lg">
                  <p className="text-[10px] font-bold text-navy-light uppercase tracking-widest mb-1">Reserve Fund Held</p>
                  <p className="text-2xl font-serif font-bold">£{profile.financialInfo.reserveFundAmount}</p>
                </div>
              </div>
            )}
          </section>
        )}

        <div className="grid grid-cols-1 gap-8">
          {sections.map(section => {
            const sectionFiles = Object.entries(profile.vaultFiles)
              .filter(([id]) => {
                if (section.id === 'forms') return ['ta6', 'ta7', 'ta10', 'solicitor_forms'].includes(id);
                if (section.id === 'money') return ['sc_accounts', 'sc_budget', 'ground_rent_receipt', 'reserve_fund_confirmation'].includes(id);
                if (section.id === 'safety') return ['fra', 'asbestos_survey', 'eicr', 'insurance', 'bsa', 'headlease', 'management_articles', 'transfer_fees'].includes(id);
                return false;
              })
              .flatMap(([id, fileData]) => {
                if (!fileData) return [];
                const files = Array.isArray(fileData) ? fileData : [fileData];
                return files.map(file => ({ id, ...file }));
              });

            if (section.id === 'team') return null;

            return (
              <section key={section.id} className="bg-white p-8 rounded-3xl border border-slate-200 shadow-sm space-y-6">
                <h3 className="text-2xl font-serif font-bold text-navy flex items-center gap-3">
                  <section.icon size={24} /> {section.title}
                </h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {sectionFiles.map((file, idx) => (
                    <div key={`${file.id}-${idx}`} className="flex items-center justify-between p-4 bg-slate-50 border border-slate-200 rounded-xl group hover:border-navy transition-all">
                      <div className="flex items-center gap-4 min-w-0">
                        <div className="w-10 h-10 bg-white rounded-lg flex items-center justify-center text-navy shadow-sm">
                          <FileText size={20} />
                        </div>
                        <div className="min-w-0">
                          <p className="text-sm font-bold text-navy truncate">{file.fileName}</p>
                          <p className="text-[10px] text-slate-400 uppercase tracking-widest">
                            {file.id.toUpperCase()} • {(file.fileSize || 0) / 1024 > 1024 
                              ? `${((file.fileSize || 0) / 1024 / 1024).toFixed(1)} MB` 
                              : `${((file.fileSize || 0) / 1024).toFixed(0)} KB`}
                          </p>
                        </div>
                      </div>
                      <a 
                        href={file.url} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="p-2 text-navy hover:bg-navy hover:text-white rounded-lg transition-all"
                        title="Download Document"
                      >
                        <Download size={20} />
                      </a>
                    </div>
                  ))}
                  {sectionFiles.length === 0 && (
                    <p className="text-sm text-slate-400 italic col-span-2 py-4 text-center">No documents uploaded in this section.</p>
                  )}
                </div>
              </section>
            );
          })}
        </div>
      </main>

      <footer className="max-w-6xl mx-auto p-12 border-t border-slate-200 text-center">
        <p className="text-xs text-slate-400 max-w-2xl mx-auto">
          Prepped Seller is a document collation tool. We do not provide legal advice. 
          AML/KYC verification remains the responsibility of your appointed solicitor.
        </p>
      </footer>
    </div>
  );
};
