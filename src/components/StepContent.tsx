import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { 
  Users, 
  FileText, 
  BadgePoundSterling, 
  ShieldAlert, 
  Download, 
  FileUp, 
  CheckCircle2, 
  Loader2, 
  AlertCircle,
  ShieldCheck,
  ArrowRight,
  ExternalLink,
  HelpCircle,
  Trash2,
  Plus,
  Upload,
  ChevronDown
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { ref, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage';
import { storage, auth } from '../firebase';
import { cn } from '../lib/utils';
import type { PropertyProfile, VaultSectionId } from '../types';

interface StepContentProps {
  id: VaultSectionId;
  profile: PropertyProfile;
  onUpload: (id: string, files: File | FileList | File[]) => Promise<void>;
  onDeleteFile: (id: string, fileName: string) => Promise<void>;
  onTeamUpdate: (data: any) => Promise<void>;
  onFinancialUpdate: (data: any) => Promise<void>;
  onTA6Update: (data: any) => Promise<void>;
  onTA7Update: (data: any) => Promise<void>;
  onTA10Update: (data: any) => Promise<void>;
}

interface TA10ItemRowProps {
  name: string;
  data: {
    status: 'Included' | 'Excluded' | 'None' | '';
    price?: string;
    comments?: string;
  };
  onChange: (newData: any) => void;
}

const TA10ItemRow: React.FC<TA10ItemRowProps> = ({ name, data, onChange }) => {
  return (
    <div className="py-6 border-b border-slate-100 last:border-0 space-y-4">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <span className="text-sm font-bold text-navy">{name}</span>
        <div className="flex bg-slate-50 border border-slate-200 rounded-lg p-1 shrink-0">
          {(['Included', 'Excluded', 'None'] as const).map((status) => (
            <button
              key={status}
              type="button"
              onClick={() => onChange({ ...data, status })}
              className={cn(
                "px-3 py-1.5 rounded-md text-[10px] font-bold transition-all uppercase tracking-wider",
                data.status === status ? "bg-navy text-white shadow-sm" : "text-slate-500 hover:text-navy"
              )}
            >
              {status}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {data.status === 'Excluded' && (
          <div className="space-y-1 animate-in fade-in slide-in-from-top-1 duration-200">
            <label className="text-[10px] font-bold text-navy uppercase tracking-wider ml-1">Price (£)</label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 font-bold text-xs">£</span>
              <input
                type="text"
                value={data.price || ''}
                onChange={(e) => onChange({ ...data, price: e.target.value })}
                className="w-full pl-7 pr-4 py-2 bg-white border border-slate-200 rounded-lg focus:ring-2 focus:ring-navy focus:border-transparent outline-none transition-all text-sm"
                placeholder="Offer price..."
              />
            </div>
          </div>
        )}
        <div className={cn("space-y-1", data.status !== 'Excluded' && "md:col-span-2")}>
          <label className="text-[10px] font-bold text-navy uppercase tracking-wider ml-1">Comments</label>
          <input
            type="text"
            value={data.comments || ''}
            onChange={(e) => onChange({ ...data, comments: e.target.value })}
            className="w-full px-4 py-2 bg-white border border-slate-200 rounded-lg focus:ring-2 focus:ring-navy focus:border-transparent outline-none transition-all text-sm"
            placeholder="e.g. Brand new, fitted last year..."
          />
        </div>
      </div>
    </div>
  );
};

export const StepContent: React.FC<StepContentProps> = ({ id, profile, onUpload, onDeleteFile, onTeamUpdate, onFinancialUpdate, onTA6Update, onTA7Update, onTA10Update }) => {
  const [teamData, setTeamData] = useState(profile.teamInfo || {
    groundLeaseHolder: '',
    managementCompany: '',
    managingAgent: ''
  });
  const [financialData, setFinancialData] = useState(profile.financialInfo || {
    reserveFundAmount: ''
  });
  const [ta6Data, setTa6Data] = useState<any>(profile.ta6Data || {
    boundaries: '',
    disputes: { hasDisputes: false, details: '' },
    planning: { hasPlanning: false, details: '' },
    guarantees: [],
    evidence: {},
    environmental: {
      flooding: { hasFlooding: false, details: '' },
      radon: { hasRadon: false, details: '' },
      knotweed: 'no'
    },
    services: {
      heating: { hasHeating: false, type: '' },
      boiler: { isServiced: false },
      electrical: { isTested: false }
    },
    notices: {
      neighbourNotices: { hasNotices: false, details: '' },
      nearbyProposals: { hasProposals: false, details: '' }
    },
    planningControl: {
      listedBuilding: 'not_known',
      conservationArea: 'not_known',
      treeOrders: { hasOrders: false },
      extensions: { hasExtensions: false }
    },
    rights: {
      sharedAccess: { hasAccess: false, details: '' },
      publicRightsOfWay: { hasRights: false, details: '' },
      chancelRepair: 'not_known',
      minesAndMinerals: 'not_known'
    },
    parking: {
      arrangements: '',
      controlledZone: { isRequired: false }
    },
    drainage: {
      mainsConnected: true,
      offMains: {
        type: '',
        lastServiced: '',
        isShared: false
      }
    },
    utilities: {
      waterConnected: true,
      electricityConnected: true,
      gasConnected: true,
      broadbandProvider: ''
    },
    insurance: {
      abnormalPremiums: { hasAbnormal: false, details: '' },
      refusedInsurance: { hasRefused: false, details: '' }
    },
    occupiers: {
      vacantPossession: true,
      otherOccupiers: { hasOccupiers: false, consentDetails: '' }
    },
    transaction: {
      movingDateRequirements: { hasRequirements: false, details: '' },
      clearMortgages: 'not_known'
    }
  });
  const [ta7Data, setTa7Data] = useState<any>(profile.ta7Data || {
    propertyAndRent: {
      propertyType: '',
      paysRent: { hasRent: false, amount: '', frequency: '' }
    },
    maintenance: {
      contributesToCost: false,
      expensiveWorks: { hasWorks: false, details: '' },
      arrears: { hasArrears: false, details: '' }
    },
    buildingSafety: {
      remediationWorks: { hasProposed: false, details: '' },
      hasLeaseholderDeed: false,
      hasLandlordCertificate: false
    },
    documents: {
      hasLease: false,
      hasShareCertificate: false
    },
    consents: {
      hasAlterations: { hasAlterations: false, details: '' },
      hasRefusedConsent: { hasRefused: false, details: '' }
    },
    enfranchisement: {
      actionTaken: 'not_known',
      details: ''
    },
    evidence: {}
  });
  const [ta10Data, setTa10Data] = useState<any>(profile.ta10Data || {
    basicFittings: {},
    kitchen: {
      items: {},
      anyFitted: false
    },
    bathrooms: {},
    carpets: {},
    curtains: {},
    lightFittings: {},
    outdoorArea: {}
  });
  const [updatingTeam, setUpdatingTeam] = useState(false);
  const [updatingFinancial, setUpdatingFinancial] = useState(false);
  const [updatingTA6, setUpdatingTA6] = useState(false);
  const [updatingTA7, setUpdatingTA7] = useState(false);
  const [updatingTA10, setUpdatingTA10] = useState(false);
  const [uploadingSlots, setUploadingSlots] = useState<Record<string, boolean>>({});
  const [deletingSlots, setDeletingSlots] = useState<Record<string, boolean>>({});
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [ta7SaveSuccess, setTa7SaveSuccess] = useState(false);
  const [ta10SaveSuccess, setTa10SaveSuccess] = useState(false);
  const [activeTooltip, setActiveTooltip] = useState<string | null>(null);
  const [activeFormSection, setActiveFormSection] = useState<string | null>(null);

  React.useEffect(() => {
    if (profile.ta6Data) {
      setTa6Data({
        ...profile.ta6Data,
        environmental: profile.ta6Data.environmental || {
          flooding: { hasFlooding: false, details: '' },
          radon: { hasRadon: false, details: '' },
          knotweed: 'no'
        },
        services: profile.ta6Data.services || {
          heating: { hasHeating: false, type: '' },
          boiler: { isServiced: false },
          electrical: { isTested: false }
        },
        notices: profile.ta6Data.notices || {
          neighbourNotices: { hasNotices: false, details: '' },
          nearbyProposals: { hasProposals: false, details: '' }
        },
        planningControl: profile.ta6Data.planningControl || {
          listedBuilding: 'not_known',
          conservationArea: 'not_known',
          treeOrders: { hasOrders: false },
          extensions: { hasExtensions: false }
        },
        rights: profile.ta6Data.rights || {
          sharedAccess: { hasAccess: false, details: '' },
          publicRightsOfWay: { hasRights: false, details: '' },
          chancelRepair: 'not_known',
          minesAndMinerals: 'not_known'
        },
        parking: profile.ta6Data.parking || {
          arrangements: '',
          controlledZone: { isRequired: false }
        },
        drainage: profile.ta6Data.drainage || {
          mainsConnected: true,
          offMains: {
            type: '',
            lastServiced: '',
            isShared: false
          }
        },
        utilities: profile.ta6Data.utilities || {
          waterConnected: true,
          electricityConnected: true,
          gasConnected: true,
          broadbandProvider: ''
        },
        insurance: profile.ta6Data.insurance || {
          abnormalPremiums: { hasAbnormal: false, details: '' },
          refusedInsurance: { hasRefused: false, details: '' }
        },
        occupiers: profile.ta6Data.occupiers || {
          vacantPossession: true,
          otherOccupiers: { hasOccupiers: false, consentDetails: '' }
        },
        transaction: profile.ta6Data.transaction || {
          movingDateRequirements: { hasRequirements: false, details: '' },
          clearMortgages: 'not_known'
        }
      });
    }
    if (profile.ta7Data) {
      setTa7Data({
        ...profile.ta7Data,
        propertyAndRent: profile.ta7Data.propertyAndRent || {
          propertyType: '',
          paysRent: { hasRent: false, amount: '', frequency: '' }
        },
        maintenance: profile.ta7Data.maintenance || {
          contributesToCost: false,
          expensiveWorks: { hasWorks: false, details: '' },
          arrears: { hasArrears: false, details: '' }
        },
        buildingSafety: profile.ta7Data.buildingSafety || {
          remediationWorks: { hasProposed: false, details: '' },
          hasLeaseholderDeed: false,
          hasLandlordCertificate: false
        },
        documents: profile.ta7Data.documents || {
          hasLease: false,
          hasShareCertificate: false
        },
        consents: profile.ta7Data.consents || {
          hasAlterations: { hasAlterations: false, details: '' },
          hasRefusedConsent: { hasRefused: false, details: '' }
        },
        enfranchisement: profile.ta7Data.enfranchisement || {
          actionTaken: 'not_known',
          details: ''
        }
      });
    }
    if (profile.ta10Data) {
      setTa10Data({
        ...profile.ta10Data,
        basicFittings: profile.ta10Data.basicFittings || {},
        kitchen: profile.ta10Data.kitchen || {
          items: {},
          anyFitted: false
        },
        bathrooms: profile.ta10Data.bathrooms || {},
        carpets: profile.ta10Data.carpets || {},
        curtains: profile.ta10Data.curtains || {},
        lightFittings: profile.ta10Data.lightFittings || {},
        outdoorArea: profile.ta10Data.outdoorArea || {}
      });
    }
  }, [profile.ta6Data, profile.ta7Data, profile.ta10Data]);

  const handleTeamSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setUpdatingTeam(true);
    await onTeamUpdate(teamData);
    setUpdatingTeam(false);
  };

  const handleFinancialSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setUpdatingFinancial(true);
    await onFinancialUpdate(financialData);
    setUpdatingFinancial(false);
  };

  const handleTA6Submit = async (e: React.FormEvent) => {
    e.preventDefault();
    console.log("Attempting to save TA6 data:", ta6Data);
    setUpdatingTA6(true);
    try {
      await onTA6Update(ta6Data);
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (error) {
      console.error("Failed to save TA6 progress:", error);
    } finally {
      setUpdatingTA6(false);
    }
  };

  const handleTA7Submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setUpdatingTA7(true);
    try {
      await onTA7Update(ta7Data);
      setTa7SaveSuccess(true);
      setTimeout(() => setTa7SaveSuccess(false), 3000);
    } catch (error) {
      console.error("Failed to save TA7 progress:", error);
    } finally {
      setUpdatingTA7(false);
    }
  };

  const handleTA10Submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setUpdatingTA10(true);
    try {
      await onTA10Update(ta10Data);
      setTa10SaveSuccess(true);
      setTimeout(() => setTa10SaveSuccess(false), 3000);
    } catch (error) {
      console.error("Failed to save TA10 progress:", error);
    } finally {
      setUpdatingTA10(false);
    }
  };

  const renderUploadSlot = (slotId: string, label: string, description: string, tooltip?: string) => {
    const fileData = profile.vaultFiles[slotId];
    const aiStatus = profile.aiVerification[slotId];
    const isVerifying = aiStatus?.status === 'pending';
    const isVerified = aiStatus?.status === 'verified';
    const isFailed = aiStatus?.status === 'failed';

    const files = Array.isArray(fileData) ? fileData : (fileData ? [fileData] : []);

    return (
      <div key={slotId} className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4 relative">
        <div className="flex justify-between items-start">
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <h4 className="font-bold text-navy">{label}</h4>
              {tooltip && (
                <div className="relative">
                  <button 
                    onClick={() => setActiveTooltip(activeTooltip === slotId ? null : slotId)}
                    className="text-gold hover:text-navy transition-colors"
                  >
                    <HelpCircle size={16} />
                  </button>
                      <AnimatePresence>
                        {activeTooltip === slotId && (
                          <motion.div 
                            initial={{ opacity: 0, y: 5 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: 5 }}
                            className="absolute z-50 left-0 top-6 w-64 bg-navy text-white p-4 rounded-xl text-xs shadow-2xl border border-gold/20"
                          >
                            <p className="leading-relaxed mb-2">{tooltip}</p>
                            <Link 
                              to={`/glossary#${slotId.replace(/_/g, '-')}`} 
                              className="text-gold hover:underline font-bold flex items-center gap-1"
                              onClick={(e) => e.stopPropagation()}
                            >
                              Learn more... <ExternalLink size={10} />
                            </Link>
                            <div className="absolute -top-1 left-2 w-2 h-2 bg-navy rotate-45 border-l border-t border-gold/20" />
                          </motion.div>
                        )}
                      </AnimatePresence>
                </div>
              )}
            </div>
            <p className="text-xs text-slate-500">{description}</p>
          </div>
          {isVerified && <CheckCircle2 size={20} className="text-green-500 shrink-0" />}
        </div>

        <div className="space-y-2">
          {files.map((file, index) => (
            <div key={index} className={cn(
              "flex items-center gap-3 p-3 rounded-xl border transition-all group/file",
              isVerified ? "bg-green-50 border-green-200" : "bg-slate-50 border-slate-200"
            )}>
              <FileText className={cn(isVerified ? "text-green-600" : "text-navy")} size={20} />
              <div className="flex flex-col min-w-0 flex-1">
                <span className="text-sm font-medium text-slate-700 truncate">{file.fileName}</span>
                {index === 0 && (
                  <>
                    {isVerifying && (
                      <span className="text-[10px] text-navy flex items-center gap-1 animate-pulse">
                        <Loader2 size={10} className="animate-spin" /> Checking documents...
                      </span>
                    )}
                    {isVerified && (
                      <span className="text-[10px] text-green-600 font-bold flex items-center gap-1">
                        <ShieldCheck size={10} /> {aiStatus.message || 'Verified'}
                      </span>
                    )}
                    {isFailed && (
                      <span className="text-[10px] text-red-600 font-bold flex items-center gap-1">
                        <AlertCircle size={10} /> {aiStatus.message || 'Verification failed'}
                      </span>
                    )}
                  </>
                )}
              </div>
              <button 
                onClick={() => onDeleteFile(slotId, file.fileName)}
                className="p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all opacity-0 group-hover/file:opacity-100"
                title="Remove file"
              >
                <Trash2 size={16} />
              </button>
            </div>
          ))}
        </div>

        <label className={cn(
          "flex items-center justify-center w-full cursor-pointer transition-all group",
          files.length > 0 
            ? "py-3 border border-dashed border-slate-200 rounded-xl hover:bg-slate-50 hover:border-navy" 
            : "py-8 border-2 border-dashed border-slate-200 rounded-xl hover:bg-slate-50 hover:border-navy"
        )}>
          <div className="flex items-center gap-2">
            {files.length > 0 ? (
              <>
                <Plus size={16} className="text-slate-400 group-hover:text-navy" />
                <span className="text-xs text-slate-500 font-medium group-hover:text-navy">Add another PDF</span>
              </>
            ) : (
              <div className="flex flex-col items-center">
                <FileUp className="w-8 h-8 mb-2 text-slate-400 group-hover:text-navy transition-colors" />
                <p className="text-xs text-slate-500 font-medium">Upload PDF</p>
              </div>
            )}
          </div>
          <input 
            type="file" 
            className="hidden" 
            accept=".pdf"
            multiple={slotId === 'sc_accounts'}
            onChange={(e) => {
              const files = e.target.files;
              if (files && files.length > 0) onUpload(slotId, files);
            }}
          />
        </label>
      </div>
    );
  };

  const handleMiniUpload = async (slotId: string, item: string, files: FileList) => {
    if (!auth.currentUser || !profile.id) return;
    const file = files[0];
    if (!file) return;

    setUploadingSlots(prev => ({ ...prev, [slotId]: true }));
    try {
      const storageRef = ref(storage, `users/${auth.currentUser.uid}/properties/${profile.id}/evidence/${file.name}`);
      await uploadBytes(storageRef, file);
      const downloadURL = await getDownloadURL(storageRef);
      
      const warrantyKey = item.toLowerCase().replace(/\s+/g, '_');
      
      if (slotId.startsWith('ta7_')) {
        const updatedTa7Data = {
          ...ta7Data,
          evidence: {
            ...(ta7Data.evidence || {}),
            [warrantyKey]: downloadURL
          }
        };
        setTa7Data(updatedTa7Data);
        await onTA7Update(updatedTa7Data);
      } else {
        const updatedTa6Data = {
          ...ta6Data,
          evidence: {
            ...(ta6Data.evidence || {}),
            [warrantyKey]: downloadURL
          }
        };
        setTa6Data(updatedTa6Data);
        await onTA6Update(updatedTa6Data);
      }
    } catch (error) {
      console.error("Evidence upload failed:", error);
    } finally {
      setUploadingSlots(prev => ({ ...prev, [slotId]: false }));
    }
  };

  const handleDeleteEvidence = async (slotId: string, item: string, evidenceUrl: string) => {
    if (!auth.currentUser || !profile.id) return;
    
    setDeletingSlots(prev => ({ ...prev, [slotId]: true }));
    try {
      // Delete physical file from Storage
      const storageRef = ref(storage, evidenceUrl);
      await deleteObject(storageRef);
      
      // Update Firestore
      const warrantyKey = item.toLowerCase().replace(/\s+/g, '_');
      
      if (slotId.startsWith('ta7_')) {
        const newEvidence = { ...(ta7Data.evidence || {}) };
        delete newEvidence[warrantyKey];
        
        const updatedTa7Data = {
          ...ta7Data,
          evidence: newEvidence
        };
        
        setTa7Data(updatedTa7Data);
        await onTA7Update(updatedTa7Data);
      } else {
        const newEvidence = { ...(ta6Data.evidence || {}) };
        delete newEvidence[warrantyKey];
        
        const updatedTa6Data = {
          ...ta6Data,
          evidence: newEvidence
        };
        
        setTa6Data(updatedTa6Data);
        await onTA6Update(updatedTa6Data);
      }
    } catch (error) {
      console.error("Evidence deletion failed:", error);
    } finally {
      setDeletingSlots(prev => ({ ...prev, [slotId]: false }));
    }
  };

  const renderMiniUploadSlot = (slotId: string, label: string, item: string) => {
    const warrantyKey = item.toLowerCase().replace(/\s+/g, '_');
    const evidenceUrl = slotId.startsWith('ta7_') ? ta7Data.evidence?.[warrantyKey] : ta6Data.evidence?.[warrantyKey];
    const isUploading = uploadingSlots[slotId];
    const isDeleting = deletingSlots[slotId];

    return (
      <div key={slotId} className="mt-2 p-4 bg-white border border-slate-100 rounded-xl space-y-3 shadow-sm">
        <div className="flex justify-between items-center">
          <span className="text-[10px] font-bold text-navy uppercase tracking-wider">{label}</span>
          {evidenceUrl && !isDeleting && <CheckCircle2 size={14} className="text-green-500" />}
          {isDeleting && <Loader2 size={14} className="text-navy animate-spin" />}
        </div>
        
        {evidenceUrl && !isDeleting && (
          <div className="space-y-1">
            <div className="flex items-center justify-between gap-2 p-2 bg-slate-50 rounded-lg border border-slate-100">
              <div className="flex items-center gap-2 min-w-0">
                <FileText size={14} className="text-navy shrink-0" />
                <span className="text-[10px] font-medium text-slate-600 truncate">Evidence Document</span>
              </div>
              <div className="flex items-center gap-3">
                <a 
                  href={evidenceUrl} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-navy hover:text-gold transition-colors text-[10px] font-bold"
                >
                  View
                </a>
                <button
                  onClick={() => handleDeleteEvidence(slotId, item, evidenceUrl)}
                  className="text-slate-400 hover:text-red-500 transition-colors"
                  title="Remove evidence"
                >
                  <Trash2 size={14} />
                </button>
              </div>
            </div>
          </div>
        )}

        {isDeleting ? (
          <div className="flex items-center justify-center gap-2 p-2 border-2 border-dashed border-slate-100 rounded-lg bg-slate-50">
            <span className="text-[10px] font-bold text-slate-400 italic">Deleting...</span>
          </div>
        ) : (
          <label className={cn(
            "flex items-center justify-center gap-2 p-2 border-2 border-dashed rounded-lg transition-all group",
            isUploading ? "bg-slate-50 border-slate-200 cursor-not-allowed" : "border-slate-200 cursor-pointer hover:border-navy hover:bg-navy/5"
          )}>
            {isUploading ? (
              <>
                <Loader2 size={14} className="text-navy animate-spin" />
                <span className="text-[10px] font-bold text-navy">Uploading...</span>
              </>
            ) : (
              <>
                <Upload size={14} className="text-slate-400 group-hover:text-navy" />
                <span className="text-[10px] font-bold text-slate-500 group-hover:text-navy">
                  {evidenceUrl ? 'Replace Evidence' : 'Upload Evidence'}
                </span>
              </>
            )}
            <input 
              type="file" 
              className="hidden" 
              disabled={isUploading}
              onChange={(e) => e.target.files && handleMiniUpload(slotId, item, e.target.files)}
            />
          </label>
        )}
      </div>
    );
  };

  switch (id) {
    case 'team':
      return (
        <div className="max-w-2xl space-y-8">
          <div className="bg-white p-8 rounded-3xl border border-slate-200 shadow-sm space-y-6">
            <div className="flex items-center gap-4 mb-2">
              <div className="w-12 h-12 bg-navy/5 text-navy rounded-2xl flex items-center justify-center">
                <Users size={24} />
              </div>
              <div>
                <h3 className="text-2xl font-serif font-bold text-navy">Stakeholders</h3>
                <p className="text-slate-500 text-sm">Ground Lease Holder, Management Company and Managing Agent details.</p>
              </div>
            </div>
            
            <form onSubmit={handleTeamSubmit} className="space-y-4">
              <div className="space-y-2">
                <div className="flex items-center gap-2 ml-1">
                  <label className="text-xs font-bold text-navy uppercase tracking-wider">Ground Lease Holder</label>
                  <div className="relative">
                    <button 
                      type="button"
                      onClick={() => setActiveTooltip(activeTooltip === 'groundLeaseHolder' ? null : 'groundLeaseHolder')}
                      className="text-gold hover:text-navy transition-colors"
                    >
                      <HelpCircle size={14} />
                    </button>
                    <AnimatePresence>
                      {activeTooltip === 'groundLeaseHolder' && (
                        <motion.div 
                          initial={{ opacity: 0, y: 5 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: 5 }}
                          className="absolute z-50 left-0 top-6 w-64 bg-navy text-white p-4 rounded-xl text-xs shadow-2xl border border-gold/20"
                        >
                          <p className="leading-relaxed mb-2">The person or company that owns the land. They are usually paid ground rent.</p>
                          <Link 
                            to="/glossary#ground-lease-holder" 
                            className="text-gold hover:underline font-bold flex items-center gap-1"
                            onClick={(e) => e.stopPropagation()}
                          >
                            Learn more... <ExternalLink size={10} />
                          </Link>
                          <div className="absolute -top-1 left-2 w-2 h-2 bg-navy rotate-45 border-l border-t border-gold/20" />
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                </div>
                <input 
                  type="text"
                  value={teamData.groundLeaseHolder}
                  onChange={(e) => setTeamData({...teamData, groundLeaseHolder: e.target.value})}
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-navy focus:border-transparent outline-none transition-all"
                  placeholder="e.g. Freehold Properties Ltd"
                  required
                />
              </div>
              <div className="space-y-2">
                <div className="flex items-center gap-2 ml-1">
                  <label className="text-xs font-bold text-navy uppercase tracking-wider">Management Company</label>
                  <div className="relative">
                    <button 
                      type="button"
                      onClick={() => setActiveTooltip(activeTooltip === 'managementCompany' ? null : 'managementCompany')}
                      className="text-gold hover:text-navy transition-colors"
                    >
                      <HelpCircle size={14} />
                    </button>
                    <AnimatePresence>
                      {activeTooltip === 'managementCompany' && (
                        <motion.div 
                          initial={{ opacity: 0, y: 5 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: 5 }}
                          className="absolute z-50 left-0 top-6 w-64 bg-navy text-white p-4 rounded-xl text-xs shadow-2xl border border-gold/20"
                        >
                          <p className="leading-relaxed mb-2">The company responsible for the block's upkeep. Often made up of the residents.</p>
                          <Link 
                            to="/glossary#management-company" 
                            className="text-gold hover:underline font-bold flex items-center gap-1"
                            onClick={(e) => e.stopPropagation()}
                          >
                            Learn more... <ExternalLink size={10} />
                          </Link>
                          <div className="absolute -top-1 left-2 w-2 h-2 bg-navy rotate-45 border-l border-t border-gold/20" />
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                </div>
                <input 
                  type="text"
                  value={teamData.managementCompany}
                  onChange={(e) => setTeamData({...teamData, managementCompany: e.target.value})}
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-navy focus:border-transparent outline-none transition-all"
                  placeholder="e.g. Jenner Walk Management"
                  required
                />
              </div>
              <div className="space-y-2">
                <div className="flex items-center gap-2 ml-1">
                  <label className="text-xs font-bold text-navy uppercase tracking-wider">Managing Agent</label>
                  <div className="relative">
                    <button 
                      type="button"
                      onClick={() => setActiveTooltip(activeTooltip === 'managingAgent' ? null : 'managingAgent')}
                      className="text-gold hover:text-navy transition-colors"
                    >
                      <HelpCircle size={14} />
                    </button>
                    <AnimatePresence>
                      {activeTooltip === 'managingAgent' && (
                        <motion.div 
                          initial={{ opacity: 0, y: 5 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: 5 }}
                          className="absolute z-50 left-0 top-6 w-64 bg-navy text-white p-4 rounded-xl text-xs shadow-2xl border border-gold/20"
                        >
                          <p className="leading-relaxed mb-2">The firm hired to handle the day-to-day running of the building and collect service charges.</p>
                          <Link 
                            to="/glossary#managing-agent" 
                            className="text-gold hover:underline font-bold flex items-center gap-1"
                            onClick={(e) => e.stopPropagation()}
                          >
                            Learn more... <ExternalLink size={10} />
                          </Link>
                          <div className="absolute -top-1 left-2 w-2 h-2 bg-navy rotate-45 border-l border-t border-gold/20" />
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                </div>
                <input 
                  type="text"
                  value={teamData.managingAgent}
                  onChange={(e) => setTeamData({...teamData, managingAgent: e.target.value})}
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-navy focus:border-transparent outline-none transition-all"
                  placeholder="e.g. City Block Management"
                  required
                />
              </div>
              <button 
                type="submit"
                disabled={updatingTeam}
                className="w-full py-4 bg-navy text-white rounded-xl font-bold hover:bg-navy-light transition-all flex items-center justify-center gap-2"
              >
                {updatingTeam ? <Loader2 className="animate-spin" size={20} /> : 'Save Details'}
              </button>
            </form>
          </div>
          {profile.vaultProgress.team && (
            <div className="bg-green-50 border border-green-100 p-6 rounded-2xl flex items-center gap-4">
              <div className="w-10 h-10 bg-green-500 text-white rounded-full flex items-center justify-center">
                <CheckCircle2 size={20} />
              </div>
              <p className="text-green-800 font-medium">Step 1 complete. You’ve identified the key players. Peace of mind achieved.</p>
            </div>
          )}
        </div>
      );

    case 'forms':
      return (
        <div className="space-y-8">
          <div className="bg-white p-8 rounded-3xl border border-slate-200 shadow-sm space-y-6">
            <div className="flex items-center gap-4 mb-2">
              <div className="w-12 h-12 bg-navy/5 text-navy rounded-2xl flex items-center justify-center">
                <FileText size={24} />
              </div>
              <div>
                <h3 className="text-2xl font-serif font-bold text-navy">The Forms</h3>
                <p className="text-slate-500 text-sm max-w-xl">
                  Your solicitor will send you the official TA6, TA7 and TA10 forms. Use the lists below to get your information together now. Once you have filled in your solicitor’s copies, upload them here for a final AI check.
                </p>
              </div>
            </div>

            <div className="space-y-4">
              <details 
                className="group bg-slate-50 border border-slate-200 rounded-2xl overflow-hidden transition-all" 
                open={activeFormSection === 'ta6'}
              >
                <summary 
                  onClick={(e) => {
                    e.preventDefault();
                    setActiveFormSection(activeFormSection === 'ta6' ? null : 'ta6');
                  }}
                  className="flex items-center justify-between p-5 cursor-pointer hover:bg-slate-100 transition-colors list-none"
                >
                  <span className="font-bold text-navy">TA6: Property Information</span>
                  <ArrowRight className={cn("text-navy transition-transform", activeFormSection === 'ta6' && "rotate-90")} size={18} />
                </summary>
                <div className="p-6 pt-2 space-y-4 border-t border-slate-200/50 mt-1">
                  <div className="space-y-4 mb-6">
                    <p className="text-sm text-slate-600 leading-relaxed">
                      If you have already completed a TA6 form sent to you by your solicitor please upload it here. If not please complete each section of the TA6 form below.
                    </p>
                    {renderUploadSlot(
                      'ta6', 
                      'Upload Finished TA6', 
                      'Property Information Form',
                      'The official Law Society form covering boundaries, disputes, and planning permissions.'
                    )}
                  </div>
                  <form onSubmit={handleTA6Submit} className="space-y-4">
                    {/* General Details Accordion */}
                    <details className="group/sub bg-white border border-slate-200 rounded-xl overflow-hidden transition-all">
                      <summary className="flex items-center justify-between p-4 cursor-pointer hover:bg-slate-50 transition-colors list-none">
                        <span className="text-sm font-bold text-navy">General Details</span>
                        <ChevronDown className="text-gold transition-transform group-open/sub:rotate-180" size={18} />
                      </summary>
                      <div className="p-4 pt-2 space-y-6 border-t border-slate-100 mt-1">
                        <div className="space-y-3">
                          <label className="text-sm font-bold text-navy">Boundaries</label>
                          <p className="text-xs text-slate-500">Details of boundary responsibilities and any moved fences or walls.</p>
                          <textarea 
                            value={ta6Data.boundaries}
                            onChange={(e) => setTa6Data({...ta6Data, boundaries: e.target.value})}
                            className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-navy focus:border-transparent outline-none transition-all min-h-[100px] text-sm"
                            placeholder="e.g. The left hand fence is my responsibility..."
                          />
                        </div>

                        <div className="space-y-4">
                          <div className="flex items-center justify-between">
                            <div className="space-y-1">
                              <label className="text-sm font-bold text-navy">Past disputes or complaints</label>
                              <p className="text-xs text-slate-500">Any history of noise complaints or neighbour disputes.</p>
                            </div>
                            <div className="flex bg-slate-50 border border-slate-200 rounded-lg p-1">
                              <button
                                type="button"
                                onClick={() => setTa6Data({...ta6Data, disputes: {...ta6Data.disputes, hasDisputes: true}})}
                                className={cn(
                                  "px-4 py-1.5 rounded-md text-xs font-bold transition-all",
                                  ta6Data.disputes.hasDisputes ? "bg-navy text-white shadow-sm" : "text-slate-500 hover:text-navy"
                                )}
                              >
                                Yes
                              </button>
                              <button
                                type="button"
                                onClick={() => setTa6Data({...ta6Data, disputes: {...ta6Data.disputes, hasDisputes: false}})}
                                className={cn(
                                  "px-4 py-1.5 rounded-md text-xs font-bold transition-all",
                                  !ta6Data.disputes.hasDisputes ? "bg-navy text-white shadow-sm" : "text-slate-500 hover:text-navy"
                                )}
                              >
                                No
                              </button>
                            </div>
                          </div>
                          {ta6Data.disputes.hasDisputes && (
                            <textarea 
                              value={ta6Data.disputes.details}
                              onChange={(e) => setTa6Data({...ta6Data, disputes: {...ta6Data.disputes, details: e.target.value}})}
                              className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-navy focus:border-transparent outline-none transition-all min-h-[80px] text-sm"
                              placeholder="Please provide details of the dispute..."
                            />
                          )}
                        </div>

                        <div className="space-y-4">
                          <div className="flex items-center justify-between">
                            <div className="space-y-1">
                              <label className="text-sm font-bold text-navy">Planning permissions or building work</label>
                              <p className="text-xs text-slate-500">Extensions, loft conversions or structural changes.</p>
                            </div>
                            <div className="flex bg-slate-50 border border-slate-200 rounded-lg p-1">
                              <button
                                type="button"
                                onClick={() => setTa6Data({...ta6Data, planning: {...ta6Data.planning, hasPlanning: true}})}
                                className={cn(
                                  "px-4 py-1.5 rounded-md text-xs font-bold transition-all",
                                  ta6Data.planning.hasPlanning ? "bg-navy text-white shadow-sm" : "text-slate-500 hover:text-navy"
                                )}
                              >
                                Yes
                              </button>
                              <button
                                type="button"
                                onClick={() => setTa6Data({...ta6Data, planning: {...ta6Data.planning, hasPlanning: false}})}
                                className={cn(
                                  "px-4 py-1.5 rounded-md text-xs font-bold transition-all",
                                  !ta6Data.planning.hasPlanning ? "bg-navy text-white shadow-sm" : "text-slate-500 hover:text-navy"
                                )}
                              >
                                No
                              </button>
                            </div>
                          </div>
                          {ta6Data.planning.hasPlanning && (
                            <textarea 
                              value={ta6Data.planning.details}
                              onChange={(e) => setTa6Data({...ta6Data, planning: {...ta6Data.planning, details: e.target.value}})}
                              className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-navy focus:border-transparent outline-none transition-all min-h-[80px] text-sm"
                              placeholder="Details of works and planning reference numbers..."
                            />
                          )}
                        </div>
                      </div>
                    </details>

                    {/* Guarantees and Warranties Accordion */}
                    <details className="group/sub bg-white border border-slate-200 rounded-xl overflow-hidden transition-all">
                      <summary className="flex items-center justify-between p-4 cursor-pointer hover:bg-slate-50 transition-colors list-none">
                        <span className="text-sm font-bold text-navy">Guarantees and Warranties</span>
                        <ChevronDown className="text-gold transition-transform group-open/sub:rotate-180" size={18} />
                      </summary>
                      <div className="p-4 pt-2 space-y-6 border-t border-slate-100 mt-1">
                        <div className="space-y-3">
                          <p className="text-xs text-slate-500 mb-2">Select all that apply to the property.</p>
                          <div className="grid grid-cols-1 gap-4">
                            {['FENSA', 'Damp-proofing', 'Timber treatment', 'Wall ties', 'Roofing', 'Other'].map((item) => {
                              const slotId = `warranty_${item.toLowerCase().replace(/\s+/g, '_')}`;
                              const isChecked = ta6Data.guarantees.includes(item);
                              
                              return (
                                <div key={item} className="space-y-2">
                                  <label className={cn(
                                    "flex items-center gap-3 p-3 border rounded-xl cursor-pointer transition-all",
                                    isChecked ? "bg-navy/5 border-navy" : "bg-slate-50 border-slate-200 hover:border-navy/50"
                                  )}>
                                    <input 
                                      type="checkbox"
                                      checked={isChecked}
                                      onChange={(e) => {
                                        if (e.target.checked) {
                                          setTa6Data({...ta6Data, guarantees: [...ta6Data.guarantees, item]});
                                        } else {
                                          setTa6Data({...ta6Data, guarantees: ta6Data.guarantees.filter(g => g !== item)});
                                        }
                                      }}
                                      className="w-4 h-4 text-navy border-slate-300 rounded focus:ring-navy"
                                    />
                                    <span className="text-xs font-bold text-navy">{item}</span>
                                  </label>
                                  
                                  <AnimatePresence>
                                    {isChecked && (
                                      <motion.div
                                        initial={{ opacity: 0, height: 0 }}
                                        animate={{ opacity: 1, height: 'auto' }}
                                        exit={{ opacity: 0, height: 0 }}
                                        className="overflow-hidden"
                                      >
                                        {renderMiniUploadSlot(slotId, `Upload ${item} Certificate`, item)}
                                      </motion.div>
                                    )}
                                  </AnimatePresence>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      </div>
                    </details>

                    {/* Environmental Matters Accordion */}
                    <details className="group/sub bg-white border border-slate-200 rounded-xl overflow-hidden transition-all">
                      <summary className="flex items-center justify-between p-4 cursor-pointer hover:bg-slate-50 transition-colors list-none">
                        <span className="text-sm font-bold text-navy">Environmental Matters</span>
                        <ChevronDown className="text-gold transition-transform group-open/sub:rotate-180" size={18} />
                      </summary>
                      <div className="p-4 pt-2 space-y-6 border-t border-slate-100 mt-1">
                        <div className="space-y-4">
                          <div className="flex items-center justify-between">
                            <div className="space-y-1">
                              <label className="text-sm font-bold text-navy">Flooding History</label>
                              <p className="text-xs text-slate-500">Has the property ever been affected by flooding?</p>
                            </div>
                            <div className="flex bg-slate-50 border border-slate-200 rounded-lg p-1">
                              <button
                                type="button"
                                onClick={() => setTa6Data((prev: any) => ({
                                  ...prev,
                                  environmental: {
                                    ...(prev?.environmental || {
                                      flooding: { hasFlooding: false, details: '' },
                                      radon: { hasRadon: false, details: '' },
                                      knotweed: 'no'
                                    }),
                                    flooding: {
                                      ...(prev?.environmental?.flooding || { hasFlooding: false, details: '' }),
                                      hasFlooding: true
                                    }
                                  }
                                }))}
                                className={cn(
                                  "px-4 py-1.5 rounded-md text-xs font-bold transition-all",
                                  ta6Data?.environmental?.flooding?.hasFlooding ? "bg-navy text-white shadow-sm" : "text-slate-500 hover:text-navy"
                                )}
                              >
                                Yes
                              </button>
                              <button
                                type="button"
                                onClick={() => setTa6Data((prev: any) => ({
                                  ...prev,
                                  environmental: {
                                    ...(prev?.environmental || {
                                      flooding: { hasFlooding: false, details: '' },
                                      radon: { hasRadon: false, details: '' },
                                      knotweed: 'no'
                                    }),
                                    flooding: {
                                      ...(prev?.environmental?.flooding || { hasFlooding: false, details: '' }),
                                      hasFlooding: false
                                    }
                                  }
                                }))}
                                className={cn(
                                  "px-4 py-1.5 rounded-md text-xs font-bold transition-all",
                                  (ta6Data?.environmental?.flooding?.hasFlooding === false) ? "bg-navy text-white shadow-sm" : "text-slate-500 hover:text-navy"
                                )}
                              >
                                No
                              </button>
                            </div>
                          </div>
                          {ta6Data?.environmental?.flooding?.hasFlooding && (
                            <textarea 
                              value={ta6Data?.environmental?.flooding?.details || ''}
                              onChange={(e) => {
                                const value = e.target.value;
                                setTa6Data((prev: any) => ({
                                  ...prev,
                                  environmental: {
                                    ...(prev?.environmental || {
                                      flooding: { hasFlooding: false, details: '' },
                                      radon: { hasRadon: false, details: '' },
                                      knotweed: 'no'
                                    }),
                                    flooding: {
                                      ...(prev?.environmental?.flooding || { hasFlooding: false, details: '' }),
                                      details: value
                                    }
                                  }
                                }));
                              }}
                              className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-navy focus:border-transparent outline-none transition-all min-h-[80px] text-sm"
                              placeholder="Please provide details of flooding events..."
                            />
                          )}
                        </div>

                        <div className="space-y-4">
                          <div className="flex items-center justify-between">
                            <div className="space-y-1">
                              <label className="text-sm font-bold text-navy">Radon Gas</label>
                              <p className="text-xs text-slate-500">Is the property in a radon affected area?</p>
                            </div>
                            <div className="flex bg-slate-50 border border-slate-200 rounded-lg p-1">
                              <button
                                type="button"
                                onClick={() => setTa6Data((prev: any) => ({
                                  ...prev,
                                  environmental: {
                                    ...(prev?.environmental || {
                                      flooding: { hasFlooding: false, details: '' },
                                      radon: { hasRadon: false, details: '' },
                                      knotweed: 'no'
                                    }),
                                    radon: {
                                      ...(prev?.environmental?.radon || { hasRadon: false, details: '' }),
                                      hasRadon: true
                                    }
                                  }
                                }))}
                                className={cn(
                                  "px-4 py-1.5 rounded-md text-xs font-bold transition-all",
                                  ta6Data?.environmental?.radon?.hasRadon ? "bg-navy text-white shadow-sm" : "text-slate-500 hover:text-navy"
                                )}
                              >
                                Yes
                              </button>
                              <button
                                type="button"
                                onClick={() => setTa6Data((prev: any) => ({
                                  ...prev,
                                  environmental: {
                                    ...(prev?.environmental || {
                                      flooding: { hasFlooding: false, details: '' },
                                      radon: { hasRadon: false, details: '' },
                                      knotweed: 'no'
                                    }),
                                    radon: {
                                      ...(prev?.environmental?.radon || { hasRadon: false, details: '' }),
                                      hasRadon: false
                                    }
                                  }
                                }))}
                                className={cn(
                                  "px-4 py-1.5 rounded-md text-xs font-bold transition-all",
                                  (ta6Data?.environmental?.radon?.hasRadon === false) ? "bg-navy text-white shadow-sm" : "text-slate-500 hover:text-navy"
                                )}
                              >
                                No
                              </button>
                            </div>
                          </div>
                          {ta6Data?.environmental?.radon?.hasRadon && (
                            <textarea 
                              value={ta6Data?.environmental?.radon?.details || ''}
                              onChange={(e) => {
                                const value = e.target.value;
                                setTa6Data((prev: any) => ({
                                  ...prev,
                                  environmental: {
                                    ...(prev?.environmental || {
                                      flooding: { hasFlooding: false, details: '' },
                                      radon: { hasRadon: false, details: '' },
                                      knotweed: 'no'
                                    }),
                                    radon: {
                                      ...(prev?.environmental?.radon || { hasRadon: false, details: '' }),
                                      details: value
                                    }
                                  }
                                }));
                              }}
                              className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-navy focus:border-transparent outline-none transition-all min-h-[80px] text-sm"
                              placeholder="Please provide details of radon tests or measures..."
                            />
                          )}
                        </div>

                        <div className="space-y-4">
                          <div className="space-y-1">
                            <label className="text-sm font-bold text-navy">Japanese Knotweed</label>
                            <p className="text-xs text-slate-500">Is the property affected by Japanese Knotweed?</p>
                          </div>
                          <div className="grid grid-cols-3 gap-2">
                            {[
                              { id: 'yes', label: 'Yes' },
                              { id: 'no', label: 'No' },
                              { id: 'not_known', label: 'Not Known' }
                            ].map((option) => (
                              <button
                                key={option.id}
                                type="button"
                                onClick={() => setTa6Data((prev: any) => ({
                                  ...prev,
                                  environmental: {
                                    ...(prev?.environmental || {
                                      flooding: { hasFlooding: false, details: '' },
                                      radon: { hasRadon: false, details: '' },
                                      knotweed: 'no'
                                    }),
                                    knotweed: option.id
                                  }
                                }))}
                                className={cn(
                                  "py-2 rounded-lg text-xs font-bold border transition-all",
                                  ta6Data?.environmental?.knotweed === option.id 
                                    ? "bg-navy border-navy text-white shadow-sm" 
                                    : "bg-slate-50 border-slate-200 text-slate-500 hover:border-navy/50"
                                )}
                              >
                                {option.label}
                              </button>
                            ))}
                          </div>
                          {ta6Data?.environmental?.knotweed === 'yes' && (
                            <div className="space-y-2">
                              {renderMiniUploadSlot('knotweed_plan', 'Upload Knotweed Management Plan', 'Knotweed Plan')}
                            </div>
                          )}
                        </div>
                      </div>
                    </details>

                    {/* Services Accordion */}
                    <details className="group/sub bg-white border border-slate-200 rounded-xl overflow-hidden transition-all">
                      <summary className="flex items-center justify-between p-4 cursor-pointer hover:bg-slate-50 transition-colors list-none">
                        <span className="text-sm font-bold text-navy">Services</span>
                        <ChevronDown className="text-gold transition-transform group-open/sub:rotate-180" size={18} />
                      </summary>
                      <div className="p-4 pt-2 space-y-6 border-t border-slate-100 mt-1">
                        <div className="space-y-4">
                          <div className="flex items-center justify-between">
                            <div className="space-y-1">
                              <label className="text-sm font-bold text-navy">Central Heating</label>
                              <p className="text-xs text-slate-500">Does the property have central heating?</p>
                            </div>
                            <div className="flex bg-slate-50 border border-slate-200 rounded-lg p-1">
                              <button
                                type="button"
                                onClick={() => setTa6Data((prev: any) => ({
                                  ...prev,
                                  services: {
                                    ...(prev?.services || {
                                      heating: { hasHeating: false, type: '' },
                                      boiler: { isServiced: false },
                                      electrical: { isTested: false }
                                    }),
                                    heating: {
                                      ...(prev?.services?.heating || { hasHeating: false, type: '' }),
                                      hasHeating: true
                                    }
                                  }
                                }))}
                                className={cn(
                                  "px-4 py-1.5 rounded-md text-xs font-bold transition-all",
                                  ta6Data?.services?.heating?.hasHeating ? "bg-navy text-white shadow-sm" : "text-slate-500 hover:text-navy"
                                )}
                              >
                                Yes
                              </button>
                              <button
                                type="button"
                                onClick={() => setTa6Data((prev: any) => ({
                                  ...prev,
                                  services: {
                                    ...(prev?.services || {
                                      heating: { hasHeating: false, type: '' },
                                      boiler: { isServiced: false },
                                      electrical: { isTested: false }
                                    }),
                                    heating: {
                                      ...(prev?.services?.heating || { hasHeating: false, type: '' }),
                                      hasHeating: false
                                    }
                                  }
                                }))}
                                className={cn(
                                  "px-4 py-1.5 rounded-md text-xs font-bold transition-all",
                                  (ta6Data?.services?.heating?.hasHeating === false) ? "bg-navy text-white shadow-sm" : "text-slate-500 hover:text-navy"
                                )}
                              >
                                No
                              </button>
                            </div>
                          </div>
                          {ta6Data?.services?.heating?.hasHeating && (
                            <div className="space-y-2">
                              <label className="text-[10px] font-bold text-navy uppercase tracking-wider">Heating Type</label>
                              <input 
                                type="text"
                                value={ta6Data?.services?.heating?.type || ''}
                                onChange={(e) => {
                                  const value = e.target.value;
                                  setTa6Data((prev: any) => ({
                                    ...prev,
                                    services: {
                                      ...(prev?.services || {
                                        heating: { hasHeating: false, type: '' },
                                        boiler: { isServiced: false },
                                        electrical: { isTested: false }
                                      }),
                                      heating: {
                                        ...(prev?.services?.heating || { hasHeating: false, type: '' }),
                                        type: value
                                      }
                                    }
                                  }));
                                }}
                                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-navy focus:border-transparent outline-none transition-all text-sm"
                                placeholder="e.g. Gas, Electric, Heat Pump"
                              />
                            </div>
                          )}
                        </div>

                        <div className="space-y-4">
                          <div className="flex items-center justify-between">
                            <div className="space-y-1">
                              <label className="text-sm font-bold text-navy">Boiler Serviced</label>
                              <p className="text-xs text-slate-500">Has the boiler been serviced in the last 12 months?</p>
                            </div>
                            <div className="flex bg-slate-50 border border-slate-200 rounded-lg p-1">
                              <button
                                type="button"
                                onClick={() => setTa6Data((prev: any) => ({
                                  ...prev,
                                  services: {
                                    ...(prev?.services || {
                                      heating: { hasHeating: false, type: '' },
                                      boiler: { isServiced: false },
                                      electrical: { isTested: false }
                                    }),
                                    boiler: { isServiced: true }
                                  }
                                }))}
                                className={cn(
                                  "px-4 py-1.5 rounded-md text-xs font-bold transition-all",
                                  ta6Data?.services?.boiler?.isServiced ? "bg-navy text-white shadow-sm" : "text-slate-500 hover:text-navy"
                                )}
                              >
                                Yes
                              </button>
                              <button
                                type="button"
                                onClick={() => setTa6Data((prev: any) => ({
                                  ...prev,
                                  services: {
                                    ...(prev?.services || {
                                      heating: { hasHeating: false, type: '' },
                                      boiler: { isServiced: false },
                                      electrical: { isTested: false }
                                    }),
                                    boiler: { isServiced: false }
                                  }
                                }))}
                                className={cn(
                                  "px-4 py-1.5 rounded-md text-xs font-bold transition-all",
                                  (ta6Data?.services?.boiler?.isServiced === false) ? "bg-navy text-white shadow-sm" : "text-slate-500 hover:text-navy"
                                )}
                              >
                                No
                              </button>
                            </div>
                          </div>
                          {ta6Data?.services?.boiler?.isServiced && (
                            <div className="space-y-2">
                              {renderMiniUploadSlot('boiler_service', 'Upload Boiler Service Record / Gas Safe Certificate', 'Boiler Service')}
                            </div>
                          )}
                        </div>

                        <div className="space-y-4">
                          <div className="flex items-center justify-between">
                            <div className="space-y-1">
                              <label className="text-sm font-bold text-navy">Electrical Wiring Tested</label>
                              <p className="text-xs text-slate-500">Has the electrical wiring been tested (EICR)?</p>
                            </div>
                            <div className="flex bg-slate-50 border border-slate-200 rounded-lg p-1">
                              <button
                                type="button"
                                onClick={() => setTa6Data((prev: any) => ({
                                  ...prev,
                                  services: {
                                    ...(prev?.services || {
                                      heating: { hasHeating: false, type: '' },
                                      boiler: { isServiced: false },
                                      electrical: { isTested: false }
                                    }),
                                    electrical: { isTested: true }
                                  }
                                }))}
                                className={cn(
                                  "px-4 py-1.5 rounded-md text-xs font-bold transition-all",
                                  ta6Data?.services?.electrical?.isTested ? "bg-navy text-white shadow-sm" : "text-slate-500 hover:text-navy"
                                )}
                              >
                                Yes
                              </button>
                              <button
                                type="button"
                                onClick={() => setTa6Data((prev: any) => ({
                                  ...prev,
                                  services: {
                                    ...(prev?.services || {
                                      heating: { hasHeating: false, type: '' },
                                      boiler: { isServiced: false },
                                      electrical: { isTested: false }
                                    }),
                                    electrical: { isTested: false }
                                  }
                                }))}
                                className={cn(
                                  "px-4 py-1.5 rounded-md text-xs font-bold transition-all",
                                  (ta6Data?.services?.electrical?.isTested === false) ? "bg-navy text-white shadow-sm" : "text-slate-500 hover:text-navy"
                                )}
                              >
                                No
                              </button>
                            </div>
                          </div>
                          {ta6Data?.services?.electrical?.isTested && (
                            <div className="space-y-2">
                              {renderMiniUploadSlot('eicr_cert', 'Upload EICR (Electrical Certificate)', 'EICR')}
                            </div>
                          )}
                        </div>
                      </div>
                    </details>

                    {/* Notices and Proposals Accordion */}
                    <details className="group/sub bg-white border border-slate-200 rounded-xl overflow-hidden transition-all">
                      <summary className="flex items-center justify-between p-4 cursor-pointer hover:bg-slate-50 transition-colors list-none">
                        <span className="text-sm font-bold text-navy">Notices and Proposals</span>
                        <ChevronDown className="text-gold transition-transform group-open/sub:rotate-180" size={18} />
                      </summary>
                      <div className="p-4 pt-2 space-y-6 border-t border-slate-100 mt-1">
                        <div className="space-y-4">
                          <div className="flex items-center justify-between">
                            <div className="space-y-1">
                              <label className="text-sm font-bold text-navy">Letters or notices from the local authority or neighbours</label>
                              <p className="text-xs text-slate-500">Any formal communications regarding the property or its surroundings.</p>
                            </div>
                            <div className="flex bg-slate-50 border border-slate-200 rounded-lg p-1">
                              <button
                                type="button"
                                onClick={() => setTa6Data((prev: any) => ({
                                  ...prev,
                                  notices: {
                                    ...(prev?.notices || {
                                      neighbourNotices: { hasNotices: false, details: '' },
                                      nearbyProposals: { hasProposals: false, details: '' }
                                    }),
                                    neighbourNotices: {
                                      ...(prev?.notices?.neighbourNotices || { hasNotices: false, details: '' }),
                                      hasNotices: true
                                    }
                                  }
                                }))}
                                className={cn(
                                  "px-4 py-1.5 rounded-md text-xs font-bold transition-all",
                                  ta6Data?.notices?.neighbourNotices?.hasNotices ? "bg-navy text-white shadow-sm" : "text-slate-500 hover:text-navy"
                                )}
                              >
                                Yes
                              </button>
                              <button
                                type="button"
                                onClick={() => setTa6Data((prev: any) => ({
                                  ...prev,
                                  notices: {
                                    ...(prev?.notices || {
                                      neighbourNotices: { hasNotices: false, details: '' },
                                      nearbyProposals: { hasProposals: false, details: '' }
                                    }),
                                    neighbourNotices: {
                                      ...(prev?.notices?.neighbourNotices || { hasNotices: false, details: '' }),
                                      hasNotices: false
                                    }
                                  }
                                }))}
                                className={cn(
                                  "px-4 py-1.5 rounded-md text-xs font-bold transition-all",
                                  (ta6Data?.notices?.neighbourNotices?.hasNotices === false) ? "bg-navy text-white shadow-sm" : "text-slate-500 hover:text-navy"
                                )}
                              >
                                No
                              </button>
                            </div>
                          </div>
                          {ta6Data?.notices?.neighbourNotices?.hasNotices && (
                            <textarea 
                              value={ta6Data?.notices?.neighbourNotices?.details || ''}
                              onChange={(e) => {
                                const value = e.target.value;
                                setTa6Data((prev: any) => ({
                                  ...prev,
                                  notices: {
                                    ...(prev?.notices || {
                                      neighbourNotices: { hasNotices: false, details: '' },
                                      nearbyProposals: { hasProposals: false, details: '' }
                                    }),
                                    neighbourNotices: {
                                      ...(prev?.notices?.neighbourNotices || { hasNotices: false, details: '' }),
                                      details: value
                                    }
                                  }
                                }));
                              }}
                              className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-navy focus:border-transparent outline-none transition-all min-h-[80px] text-sm"
                              placeholder="Please provide details of the notices..."
                            />
                          )}
                        </div>

                        <div className="space-y-4">
                          <div className="flex items-center justify-between">
                            <div className="space-y-1">
                              <label className="text-sm font-bold text-navy">Proposals to develop nearby land</label>
                              <p className="text-xs text-slate-500">Any known plans for building or development in the immediate area.</p>
                            </div>
                            <div className="flex bg-slate-50 border border-slate-200 rounded-lg p-1">
                              <button
                                type="button"
                                onClick={() => setTa6Data((prev: any) => ({
                                  ...prev,
                                  notices: {
                                    ...(prev?.notices || {
                                      neighbourNotices: { hasNotices: false, details: '' },
                                      nearbyProposals: { hasProposals: false, details: '' }
                                    }),
                                    nearbyProposals: {
                                      ...(prev?.notices?.nearbyProposals || { hasProposals: false, details: '' }),
                                      hasProposals: true
                                    }
                                  }
                                }))}
                                className={cn(
                                  "px-4 py-1.5 rounded-md text-xs font-bold transition-all",
                                  ta6Data?.notices?.nearbyProposals?.hasProposals ? "bg-navy text-white shadow-sm" : "text-slate-500 hover:text-navy"
                                )}
                              >
                                Yes
                              </button>
                              <button
                                type="button"
                                onClick={() => setTa6Data((prev: any) => ({
                                  ...prev,
                                  notices: {
                                    ...(prev?.notices || {
                                      neighbourNotices: { hasNotices: false, details: '' },
                                      nearbyProposals: { hasProposals: false, details: '' }
                                    }),
                                    nearbyProposals: {
                                      ...(prev?.notices?.nearbyProposals || { hasProposals: false, details: '' }),
                                      hasProposals: false
                                    }
                                  }
                                }))}
                                className={cn(
                                  "px-4 py-1.5 rounded-md text-xs font-bold transition-all",
                                  (ta6Data?.notices?.nearbyProposals?.hasProposals === false) ? "bg-navy text-white shadow-sm" : "text-slate-500 hover:text-navy"
                                )}
                              >
                                No
                              </button>
                            </div>
                          </div>
                          {ta6Data?.notices?.nearbyProposals?.hasProposals && (
                            <textarea 
                              value={ta6Data?.notices?.nearbyProposals?.details || ''}
                              onChange={(e) => {
                                const value = e.target.value;
                                setTa6Data((prev: any) => ({
                                  ...prev,
                                  notices: {
                                    ...(prev?.notices || {
                                      neighbourNotices: { hasNotices: false, details: '' },
                                      nearbyProposals: { hasProposals: false, details: '' }
                                    }),
                                    nearbyProposals: {
                                      ...(prev?.notices?.nearbyProposals || { hasProposals: false, details: '' }),
                                      details: value
                                    }
                                  }
                                }));
                              }}
                              className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-navy focus:border-transparent outline-none transition-all min-h-[80px] text-sm"
                              placeholder="Please provide details of the proposals..."
                            />
                          )}
                        </div>
                      </div>
                    </details>

                    {/* Planning and Building Control Accordion */}
                    <details className="group/sub bg-white border border-slate-200 rounded-xl overflow-hidden transition-all">
                      <summary className="flex items-center justify-between p-4 cursor-pointer hover:bg-slate-50 transition-colors list-none">
                        <span className="text-sm font-bold text-navy">Planning and Building Control</span>
                        <ChevronDown className="text-gold transition-transform group-open/sub:rotate-180" size={18} />
                      </summary>
                      <div className="p-4 pt-2 space-y-6 border-t border-slate-100 mt-1">
                        <div className="space-y-4">
                          <div className="space-y-1">
                            <label className="text-sm font-bold text-navy">Is the property a Listed Building</label>
                            <p className="text-xs text-slate-500">Buildings of special architectural or historic interest.</p>
                          </div>
                          <div className="grid grid-cols-3 gap-2">
                            {[
                              { id: 'yes', label: 'Yes' },
                              { id: 'no', label: 'No' },
                              { id: 'not_known', label: 'Not Known' }
                            ].map((option) => (
                              <button
                                key={option.id}
                                type="button"
                                onClick={() => setTa6Data((prev: any) => ({
                                  ...prev,
                                  planningControl: {
                                    ...(prev?.planningControl || {
                                      listedBuilding: 'not_known',
                                      conservationArea: 'not_known',
                                      treeOrders: { hasOrders: false },
                                      extensions: { hasExtensions: false }
                                    }),
                                    listedBuilding: option.id
                                  }
                                }))}
                                className={cn(
                                  "py-2 rounded-lg text-xs font-bold border transition-all",
                                  ta6Data?.planningControl?.listedBuilding === option.id 
                                    ? "bg-navy border-navy text-white shadow-sm" 
                                    : "bg-slate-50 border-slate-200 text-slate-500 hover:border-navy/50"
                                )}
                              >
                                {option.label}
                              </button>
                            ))}
                          </div>
                        </div>

                        <div className="space-y-4">
                          <div className="space-y-1">
                            <label className="text-sm font-bold text-navy">Is it in a Conservation Area</label>
                            <p className="text-xs text-slate-500">Areas of special architectural or historic interest.</p>
                          </div>
                          <div className="grid grid-cols-3 gap-2">
                            {[
                              { id: 'yes', label: 'Yes' },
                              { id: 'no', label: 'No' },
                              { id: 'not_known', label: 'Not Known' }
                            ].map((option) => (
                              <button
                                key={option.id}
                                type="button"
                                onClick={() => setTa6Data((prev: any) => ({
                                  ...prev,
                                  planningControl: {
                                    ...(prev?.planningControl || {
                                      listedBuilding: 'not_known',
                                      conservationArea: 'not_known',
                                      treeOrders: { hasOrders: false },
                                      extensions: { hasExtensions: false }
                                    }),
                                    conservationArea: option.id
                                  }
                                }))}
                                className={cn(
                                  "py-2 rounded-lg text-xs font-bold border transition-all",
                                  ta6Data?.planningControl?.conservationArea === option.id 
                                    ? "bg-navy border-navy text-white shadow-sm" 
                                    : "bg-slate-50 border-slate-200 text-slate-500 hover:border-navy/50"
                                )}
                              >
                                {option.label}
                              </button>
                            ))}
                          </div>
                        </div>

                        <div className="space-y-4">
                          <div className="flex items-center justify-between">
                            <div className="space-y-1">
                              <label className="text-sm font-bold text-navy">Are there any Tree Preservation Orders</label>
                              <p className="text-xs text-slate-500">Protection for specific trees or woodlands.</p>
                            </div>
                            <div className="flex bg-slate-50 border border-slate-200 rounded-lg p-1">
                              <button
                                type="button"
                                onClick={() => setTa6Data((prev: any) => ({
                                  ...prev,
                                  planningControl: {
                                    ...(prev?.planningControl || {
                                      listedBuilding: 'not_known',
                                      conservationArea: 'not_known',
                                      treeOrders: { hasOrders: false },
                                      extensions: { hasExtensions: false }
                                    }),
                                    treeOrders: { hasOrders: true }
                                  }
                                }))}
                                className={cn(
                                  "px-4 py-1.5 rounded-md text-xs font-bold transition-all",
                                  ta6Data?.planningControl?.treeOrders?.hasOrders ? "bg-navy text-white shadow-sm" : "text-slate-500 hover:text-navy"
                                )}
                              >
                                Yes
                              </button>
                              <button
                                type="button"
                                onClick={() => setTa6Data((prev: any) => ({
                                  ...prev,
                                  planningControl: {
                                    ...(prev?.planningControl || {
                                      listedBuilding: 'not_known',
                                      conservationArea: 'not_known',
                                      treeOrders: { hasOrders: false },
                                      extensions: { hasExtensions: false }
                                    }),
                                    treeOrders: { hasOrders: false }
                                  }
                                }))}
                                className={cn(
                                  "px-4 py-1.5 rounded-md text-xs font-bold transition-all",
                                  (ta6Data?.planningControl?.treeOrders?.hasOrders === false) ? "bg-navy text-white shadow-sm" : "text-slate-500 hover:text-navy"
                                )}
                              >
                                No
                              </button>
                            </div>
                          </div>
                        </div>

                        <div className="space-y-4">
                          <div className="flex items-center justify-between">
                            <div className="space-y-1">
                              <label className="text-sm font-bold text-navy">Have any extensions or building works been carried out</label>
                              <p className="text-xs text-slate-500">Structural changes, extensions or major alterations.</p>
                            </div>
                            <div className="flex bg-slate-50 border border-slate-200 rounded-lg p-1">
                              <button
                                type="button"
                                onClick={() => setTa6Data((prev: any) => ({
                                  ...prev,
                                  planningControl: {
                                    ...(prev?.planningControl || {
                                      listedBuilding: 'not_known',
                                      conservationArea: 'not_known',
                                      treeOrders: { hasOrders: false },
                                      extensions: { hasExtensions: false }
                                    }),
                                    extensions: { hasExtensions: true }
                                  }
                                }))}
                                className={cn(
                                  "px-4 py-1.5 rounded-md text-xs font-bold transition-all",
                                  ta6Data?.planningControl?.extensions?.hasExtensions ? "bg-navy text-white shadow-sm" : "text-slate-500 hover:text-navy"
                                )}
                              >
                                Yes
                              </button>
                              <button
                                type="button"
                                onClick={() => setTa6Data((prev: any) => ({
                                  ...prev,
                                  planningControl: {
                                    ...(prev?.planningControl || {
                                      listedBuilding: 'not_known',
                                      conservationArea: 'not_known',
                                      treeOrders: { hasOrders: false },
                                      extensions: { hasExtensions: false }
                                    }),
                                    extensions: { hasExtensions: false }
                                  }
                                }))}
                                className={cn(
                                  "px-4 py-1.5 rounded-md text-xs font-bold transition-all",
                                  (ta6Data?.planningControl?.extensions?.hasExtensions === false) ? "bg-navy text-white shadow-sm" : "text-slate-500 hover:text-navy"
                                )}
                              >
                                No
                              </button>
                            </div>
                          </div>
                          {ta6Data?.planningControl?.extensions?.hasExtensions && (
                            <div className="space-y-4 mt-4">
                              {renderMiniUploadSlot('planning_permission', 'Upload Planning Permission', 'Planning Permission')}
                              {renderMiniUploadSlot('building_regs_approval', 'Upload Building Regulations Approval', 'Building Regulations Approval')}
                              {renderMiniUploadSlot('completion_certificate', 'Upload Completion Certificate', 'Completion Certificate')}
                            </div>
                          )}
                        </div>
                      </div>
                    </details>

                    {/* Rights and Informal Arrangements Accordion */}
                    <details className="group/sub bg-white border border-slate-200 rounded-xl overflow-hidden transition-all">
                      <summary className="flex items-center justify-between p-4 cursor-pointer hover:bg-slate-50 transition-colors list-none">
                        <span className="text-sm font-bold text-navy">Rights and Informal Arrangements</span>
                        <ChevronDown className="text-gold transition-transform group-open/sub:rotate-180" size={18} />
                      </summary>
                      <div className="p-4 pt-2 space-y-6 border-t border-slate-100 mt-1">
                        <div className="space-y-4">
                          <div className="flex items-center justify-between">
                            <div className="space-y-1">
                              <label className="text-sm font-bold text-navy">Shared driveways or access</label>
                              <p className="text-xs text-slate-500">Does the property share a driveway or access with neighbours?</p>
                            </div>
                            <div className="flex bg-slate-50 border border-slate-200 rounded-lg p-1">
                              <button
                                type="button"
                                onClick={() => setTa6Data((prev: any) => ({
                                  ...prev,
                                  rights: {
                                    ...(prev?.rights || {
                                      sharedAccess: { hasAccess: false, details: '' },
                                      publicRightsOfWay: { hasRights: false, details: '' },
                                      chancelRepair: 'not_known',
                                      minesAndMinerals: 'not_known'
                                    }),
                                    sharedAccess: {
                                      ...(prev?.rights?.sharedAccess || { hasAccess: false, details: '' }),
                                      hasAccess: true
                                    }
                                  }
                                }))}
                                className={cn(
                                  "px-4 py-1.5 rounded-md text-xs font-bold transition-all",
                                  ta6Data?.rights?.sharedAccess?.hasAccess ? "bg-navy text-white shadow-sm" : "text-slate-500 hover:text-navy"
                                )}
                              >
                                Yes
                              </button>
                              <button
                                type="button"
                                onClick={() => setTa6Data((prev: any) => ({
                                  ...prev,
                                  rights: {
                                    ...(prev?.rights || {
                                      sharedAccess: { hasAccess: false, details: '' },
                                      publicRightsOfWay: { hasRights: false, details: '' },
                                      chancelRepair: 'not_known',
                                      minesAndMinerals: 'not_known'
                                    }),
                                    sharedAccess: {
                                      ...(prev?.rights?.sharedAccess || { hasAccess: false, details: '' }),
                                      hasAccess: false
                                    }
                                  }
                                }))}
                                className={cn(
                                  "px-4 py-1.5 rounded-md text-xs font-bold transition-all",
                                  (ta6Data?.rights?.sharedAccess?.hasAccess === false) ? "bg-navy text-white shadow-sm" : "text-slate-500 hover:text-navy"
                                )}
                              >
                                No
                              </button>
                            </div>
                          </div>
                          {ta6Data?.rights?.sharedAccess?.hasAccess && (
                            <textarea 
                              value={ta6Data?.rights?.sharedAccess?.details || ''}
                              onChange={(e) => {
                                const value = e.target.value;
                                setTa6Data((prev: any) => ({
                                  ...prev,
                                  rights: {
                                    ...(prev?.rights || {
                                      sharedAccess: { hasAccess: false, details: '' },
                                      publicRightsOfWay: { hasRights: false, details: '' },
                                      chancelRepair: 'not_known',
                                      minesAndMinerals: 'not_known'
                                    }),
                                    sharedAccess: {
                                      ...(prev?.rights?.sharedAccess || { hasAccess: false, details: '' }),
                                      details: value
                                    }
                                  }
                                }));
                              }}
                              className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-navy focus:border-transparent outline-none transition-all min-h-[80px] text-sm"
                              placeholder="Please provide details of shared access..."
                            />
                          )}
                        </div>

                        <div className="space-y-4">
                          <div className="flex items-center justify-between">
                            <div className="space-y-1">
                              <label className="text-sm font-bold text-navy">Rights of way or public footpaths crossing the property</label>
                              <p className="text-xs text-slate-500">Are there any public paths or rights of way through the land?</p>
                            </div>
                            <div className="flex bg-slate-50 border border-slate-200 rounded-lg p-1">
                              <button
                                type="button"
                                onClick={() => setTa6Data((prev: any) => ({
                                  ...prev,
                                  rights: {
                                    ...(prev?.rights || {
                                      sharedAccess: { hasAccess: false, details: '' },
                                      publicRightsOfWay: { hasRights: false, details: '' },
                                      chancelRepair: 'not_known',
                                      minesAndMinerals: 'not_known'
                                    }),
                                    publicRightsOfWay: {
                                      ...(prev?.rights?.publicRightsOfWay || { hasRights: false, details: '' }),
                                      hasRights: true
                                    }
                                  }
                                }))}
                                className={cn(
                                  "px-4 py-1.5 rounded-md text-xs font-bold transition-all",
                                  ta6Data?.rights?.publicRightsOfWay?.hasRights ? "bg-navy text-white shadow-sm" : "text-slate-500 hover:text-navy"
                                )}
                              >
                                Yes
                              </button>
                              <button
                                type="button"
                                onClick={() => setTa6Data((prev: any) => ({
                                  ...prev,
                                  rights: {
                                    ...(prev?.rights || {
                                      sharedAccess: { hasAccess: false, details: '' },
                                      publicRightsOfWay: { hasRights: false, details: '' },
                                      chancelRepair: 'not_known',
                                      minesAndMinerals: 'not_known'
                                    }),
                                    publicRightsOfWay: {
                                      ...(prev?.rights?.publicRightsOfWay || { hasRights: false, details: '' }),
                                      hasRights: false
                                    }
                                  }
                                }))}
                                className={cn(
                                  "px-4 py-1.5 rounded-md text-xs font-bold transition-all",
                                  (ta6Data?.rights?.publicRightsOfWay?.hasRights === false) ? "bg-navy text-white shadow-sm" : "text-slate-500 hover:text-navy"
                                )}
                              >
                                No
                              </button>
                            </div>
                          </div>
                          {ta6Data?.rights?.publicRightsOfWay?.hasRights && (
                            <textarea 
                              value={ta6Data?.rights?.publicRightsOfWay?.details || ''}
                              onChange={(e) => {
                                const value = e.target.value;
                                setTa6Data((prev: any) => ({
                                  ...prev,
                                  rights: {
                                    ...(prev?.rights || {
                                      sharedAccess: { hasAccess: false, details: '' },
                                      publicRightsOfWay: { hasRights: false, details: '' },
                                      chancelRepair: 'not_known',
                                      minesAndMinerals: 'not_known'
                                    }),
                                    publicRightsOfWay: {
                                      ...(prev?.rights?.publicRightsOfWay || { hasRights: false, details: '' }),
                                      details: value
                                    }
                                  }
                                }));
                              }}
                              className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-navy focus:border-transparent outline-none transition-all min-h-[80px] text-sm"
                              placeholder="Please provide details of rights of way..."
                            />
                          )}
                        </div>

                        <div className="space-y-4">
                          <div className="space-y-1">
                            <label className="text-sm font-bold text-navy">Chancel repair liability</label>
                            <p className="text-xs text-slate-500">Is there any liability to contribute to church repairs?</p>
                          </div>
                          <div className="grid grid-cols-3 gap-2">
                            {[
                              { id: 'yes', label: 'Yes' },
                              { id: 'no', label: 'No' },
                              { id: 'not_known', label: 'Not Known' }
                            ].map((option) => (
                              <button
                                key={option.id}
                                type="button"
                                onClick={() => setTa6Data((prev: any) => ({
                                  ...prev,
                                  rights: {
                                    ...(prev?.rights || {
                                      sharedAccess: { hasAccess: false, details: '' },
                                      publicRightsOfWay: { hasRights: false, details: '' },
                                      chancelRepair: 'not_known',
                                      minesAndMinerals: 'not_known'
                                    }),
                                    chancelRepair: option.id
                                  }
                                }))}
                                className={cn(
                                  "py-2 rounded-lg text-xs font-bold border transition-all",
                                  ta6Data?.rights?.chancelRepair === option.id 
                                    ? "bg-navy border-navy text-white shadow-sm" 
                                    : "bg-slate-50 border-slate-200 text-slate-500 hover:border-navy/50"
                                )}
                              >
                                {option.label}
                              </button>
                            ))}
                          </div>
                        </div>

                        <div className="space-y-4">
                          <div className="space-y-1">
                            <label className="text-sm font-bold text-navy">Mines and minerals rights</label>
                            <p className="text-xs text-slate-500">Are there any rights reserved for mining or minerals?</p>
                          </div>
                          <div className="grid grid-cols-3 gap-2">
                            {[
                              { id: 'yes', label: 'Yes' },
                              { id: 'no', label: 'No' },
                              { id: 'not_known', label: 'Not Known' }
                            ].map((option) => (
                              <button
                                key={option.id}
                                type="button"
                                onClick={() => setTa6Data((prev: any) => ({
                                  ...prev,
                                  rights: {
                                    ...(prev?.rights || {
                                      sharedAccess: { hasAccess: false, details: '' },
                                      publicRightsOfWay: { hasRights: false, details: '' },
                                      chancelRepair: 'not_known',
                                      minesAndMinerals: 'not_known'
                                    }),
                                    minesAndMinerals: option.id
                                  }
                                }))}
                                className={cn(
                                  "py-2 rounded-lg text-xs font-bold border transition-all",
                                  ta6Data?.rights?.minesAndMinerals === option.id 
                                    ? "bg-navy border-navy text-white shadow-sm" 
                                    : "bg-slate-50 border-slate-200 text-slate-500 hover:border-navy/50"
                                )}
                              >
                                {option.label}
                              </button>
                            ))}
                          </div>
                        </div>
                      </div>
                    </details>

                    {/* Parking Accordion */}
                    <details className="group/sub bg-white border border-slate-200 rounded-xl overflow-hidden transition-all">
                      <summary className="flex items-center justify-between p-4 cursor-pointer hover:bg-slate-50 transition-colors list-none">
                        <span className="text-sm font-bold text-navy">Parking</span>
                        <ChevronDown className="text-gold transition-transform group-open/sub:rotate-180" size={18} />
                      </summary>
                      <div className="p-4 pt-2 space-y-6 border-t border-slate-100 mt-1">
                        <div className="space-y-2">
                          <label className="text-sm font-bold text-navy">Parking arrangements</label>
                          <p className="text-xs text-slate-500">Please describe the parking (e.g. Garage, Driveway, Street parking).</p>
                          <textarea 
                            value={ta6Data?.parking?.arrangements || ''}
                            onChange={(e) => {
                              const value = e.target.value;
                              setTa6Data((prev: any) => ({
                                ...prev,
                                parking: {
                                  ...(prev?.parking || {
                                    arrangements: '',
                                    controlledZone: { isRequired: false }
                                  }),
                                  arrangements: value
                                }
                              }));
                            }}
                            className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-navy focus:border-transparent outline-none transition-all min-h-[80px] text-sm"
                            placeholder="Describe parking arrangements..."
                          />
                        </div>

                        <div className="space-y-4">
                          <div className="flex items-center justify-between">
                            <div className="space-y-1">
                              <label className="text-sm font-bold text-navy">Controlled parking zone</label>
                              <p className="text-xs text-slate-500">Is a parking permit required?</p>
                            </div>
                            <div className="flex bg-slate-50 border border-slate-200 rounded-lg p-1">
                              <button
                                type="button"
                                onClick={() => setTa6Data((prev: any) => ({
                                  ...prev,
                                  parking: {
                                    ...(prev?.parking || {
                                      arrangements: '',
                                      controlledZone: { isRequired: false }
                                    }),
                                    controlledZone: { isRequired: true }
                                  }
                                }))}
                                className={cn(
                                  "px-4 py-1.5 rounded-md text-xs font-bold transition-all",
                                  ta6Data?.parking?.controlledZone?.isRequired ? "bg-navy text-white shadow-sm" : "text-slate-500 hover:text-navy"
                                )}
                              >
                                Yes
                              </button>
                              <button
                                type="button"
                                onClick={() => setTa6Data((prev: any) => ({
                                  ...prev,
                                  parking: {
                                    ...(prev?.parking || {
                                      arrangements: '',
                                      controlledZone: { isRequired: false }
                                    }),
                                    controlledZone: { isRequired: false }
                                  }
                                }))}
                                className={cn(
                                  "px-4 py-1.5 rounded-md text-xs font-bold transition-all",
                                  (ta6Data?.parking?.controlledZone?.isRequired === false) ? "bg-navy text-white shadow-sm" : "text-slate-500 hover:text-navy"
                                )}
                              >
                                No
                              </button>
                            </div>
                          </div>
                        </div>
                      </div>
                    </details>

                    {/* Drainage and Sewerage Accordion */}
                    <details className="group/sub bg-white border border-slate-200 rounded-xl overflow-hidden transition-all">
                      <summary className="flex items-center justify-between p-4 cursor-pointer hover:bg-slate-50 transition-colors list-none">
                        <span className="text-sm font-bold text-navy">Drainage and Sewerage</span>
                        <ChevronDown className="text-gold transition-transform group-open/sub:rotate-180" size={18} />
                      </summary>
                      <div className="p-4 pt-2 space-y-6 border-t border-slate-100 mt-1">
                        <div className="space-y-4">
                          <div className="flex items-center justify-between">
                            <div className="space-y-1">
                              <label className="text-sm font-bold text-navy">Connected to mains drainage</label>
                              <p className="text-xs text-slate-500">Is the property connected to the public sewer system?</p>
                            </div>
                            <div className="flex bg-slate-50 border border-slate-200 rounded-lg p-1">
                              <button
                                type="button"
                                onClick={() => setTa6Data((prev: any) => ({
                                  ...prev,
                                  drainage: {
                                    ...(prev?.drainage || {
                                      mainsConnected: true,
                                      offMains: { type: '', lastServiced: '', isShared: false }
                                    }),
                                    mainsConnected: true
                                  }
                                }))}
                                className={cn(
                                  "px-4 py-1.5 rounded-md text-xs font-bold transition-all",
                                  ta6Data?.drainage?.mainsConnected ? "bg-navy text-white shadow-sm" : "text-slate-500 hover:text-navy"
                                )}
                              >
                                Yes
                              </button>
                              <button
                                type="button"
                                onClick={() => setTa6Data((prev: any) => ({
                                  ...prev,
                                  drainage: {
                                    ...(prev?.drainage || {
                                      mainsConnected: true,
                                      offMains: { type: '', lastServiced: '', isShared: false }
                                    }),
                                    mainsConnected: false
                                  }
                                }))}
                                className={cn(
                                  "px-4 py-1.5 rounded-md text-xs font-bold transition-all",
                                  (ta6Data?.drainage?.mainsConnected === false) ? "bg-navy text-white shadow-sm" : "text-slate-500 hover:text-navy"
                                )}
                              >
                                No
                              </button>
                            </div>
                          </div>

                          {ta6Data?.drainage?.mainsConnected === false && (
                            <div className="space-y-4 p-4 bg-slate-50 rounded-xl border border-slate-100 animate-in fade-in slide-in-from-top-2 duration-300">
                              <div className="space-y-2">
                                <label className="text-xs font-bold text-navy uppercase tracking-wider">Type of system</label>
                                <input 
                                  type="text"
                                  value={ta6Data?.drainage?.offMains?.type || ''}
                                  onChange={(e) => {
                                    const value = e.target.value;
                                    setTa6Data((prev: any) => ({
                                      ...prev,
                                      drainage: {
                                        ...(prev?.drainage || {}),
                                        offMains: {
                                          ...(prev?.drainage?.offMains || {}),
                                          type: value
                                        }
                                      }
                                    }));
                                  }}
                                  className="w-full px-4 py-2 bg-white border border-slate-200 rounded-lg focus:ring-2 focus:ring-navy focus:border-transparent outline-none transition-all text-sm"
                                  placeholder="e.g. Septic tank, Sewage treatment plant"
                                />
                              </div>
                              <div className="space-y-2">
                                <label className="text-xs font-bold text-navy uppercase tracking-wider">Last serviced date</label>
                                <input 
                                  type="text"
                                  value={ta6Data?.drainage?.offMains?.lastServiced || ''}
                                  onChange={(e) => {
                                    const value = e.target.value;
                                    setTa6Data((prev: any) => ({
                                      ...prev,
                                      drainage: {
                                        ...(prev?.drainage || {}),
                                        offMains: {
                                          ...(prev?.drainage?.offMains || {}),
                                          lastServiced: value
                                        }
                                      }
                                    }));
                                  }}
                                  className="w-full px-4 py-2 bg-white border border-slate-200 rounded-lg focus:ring-2 focus:ring-navy focus:border-transparent outline-none transition-all text-sm"
                                  placeholder="e.g. March 2024"
                                />
                              </div>
                              <div className="flex items-center justify-between">
                                <label className="text-xs font-bold text-navy uppercase tracking-wider">Shared with neighbours</label>
                                <div className="flex bg-white border border-slate-200 rounded-lg p-1">
                                  <button
                                    type="button"
                                    onClick={() => setTa6Data((prev: any) => ({
                                      ...prev,
                                      drainage: {
                                        ...(prev?.drainage || {}),
                                        offMains: {
                                          ...(prev?.drainage?.offMains || {}),
                                          isShared: true
                                        }
                                      }
                                    }))}
                                    className={cn(
                                      "px-3 py-1 rounded-md text-[10px] font-bold transition-all",
                                      ta6Data?.drainage?.offMains?.isShared ? "bg-navy text-white shadow-sm" : "text-slate-500 hover:text-navy"
                                    )}
                                  >
                                    Yes
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => setTa6Data((prev: any) => ({
                                      ...prev,
                                      drainage: {
                                        ...(prev?.drainage || {}),
                                        offMains: {
                                          ...(prev?.drainage?.offMains || {}),
                                          isShared: false
                                        }
                                      }
                                    }))}
                                    className={cn(
                                      "px-3 py-1 rounded-md text-[10px] font-bold transition-all",
                                      (ta6Data?.drainage?.offMains?.isShared === false) ? "bg-navy text-white shadow-sm" : "text-slate-500 hover:text-navy"
                                    )}
                                  >
                                    No
                                  </button>
                                </div>
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    </details>

                    {/* Utilities Accordion */}
                    <details className="group/sub bg-white border border-slate-200 rounded-xl overflow-hidden transition-all">
                      <summary className="flex items-center justify-between p-4 cursor-pointer hover:bg-slate-50 transition-colors list-none">
                        <span className="text-sm font-bold text-navy">Utilities</span>
                        <ChevronDown className="text-gold transition-transform group-open/sub:rotate-180" size={18} />
                      </summary>
                      <div className="p-4 pt-2 space-y-6 border-t border-slate-100 mt-1">
                        <div className="space-y-4">
                          <div className="flex items-center justify-between">
                            <label className="text-sm font-bold text-navy">Mains water supply connected</label>
                            <div className="flex bg-slate-50 border border-slate-200 rounded-lg p-1">
                              <button
                                type="button"
                                onClick={() => setTa6Data((prev: any) => ({
                                  ...prev,
                                  utilities: {
                                    ...(prev?.utilities || {
                                      waterConnected: true,
                                      electricityConnected: true,
                                      gasConnected: true,
                                      broadbandProvider: ''
                                    }),
                                    waterConnected: true
                                  }
                                }))}
                                className={cn(
                                  "px-4 py-1.5 rounded-md text-xs font-bold transition-all",
                                  ta6Data?.utilities?.waterConnected ? "bg-navy text-white shadow-sm" : "text-slate-500 hover:text-navy"
                                )}
                              >
                                Yes
                              </button>
                              <button
                                type="button"
                                onClick={() => setTa6Data((prev: any) => ({
                                  ...prev,
                                  utilities: {
                                    ...(prev?.utilities || {
                                      waterConnected: true,
                                      electricityConnected: true,
                                      gasConnected: true,
                                      broadbandProvider: ''
                                    }),
                                    waterConnected: false
                                  }
                                }))}
                                className={cn(
                                  "px-4 py-1.5 rounded-md text-xs font-bold transition-all",
                                  (ta6Data?.utilities?.waterConnected === false) ? "bg-navy text-white shadow-sm" : "text-slate-500 hover:text-navy"
                                )}
                              >
                                No
                              </button>
                            </div>
                          </div>

                          <div className="flex items-center justify-between">
                            <label className="text-sm font-bold text-navy">Mains electricity connected</label>
                            <div className="flex bg-slate-50 border border-slate-200 rounded-lg p-1">
                              <button
                                type="button"
                                onClick={() => setTa6Data((prev: any) => ({
                                  ...prev,
                                  utilities: {
                                    ...(prev?.utilities || {
                                      waterConnected: true,
                                      electricityConnected: true,
                                      gasConnected: true,
                                      broadbandProvider: ''
                                    }),
                                    electricityConnected: true
                                  }
                                }))}
                                className={cn(
                                  "px-4 py-1.5 rounded-md text-xs font-bold transition-all",
                                  ta6Data?.utilities?.electricityConnected ? "bg-navy text-white shadow-sm" : "text-slate-500 hover:text-navy"
                                )}
                              >
                                Yes
                              </button>
                              <button
                                type="button"
                                onClick={() => setTa6Data((prev: any) => ({
                                  ...prev,
                                  utilities: {
                                    ...(prev?.utilities || {
                                      waterConnected: true,
                                      electricityConnected: true,
                                      gasConnected: true,
                                      broadbandProvider: ''
                                    }),
                                    electricityConnected: false
                                  }
                                }))}
                                className={cn(
                                  "px-4 py-1.5 rounded-md text-xs font-bold transition-all",
                                  (ta6Data?.utilities?.electricityConnected === false) ? "bg-navy text-white shadow-sm" : "text-slate-500 hover:text-navy"
                                )}
                              >
                                No
                              </button>
                            </div>
                          </div>

                          <div className="flex items-center justify-between">
                            <label className="text-sm font-bold text-navy">Mains gas connected</label>
                            <div className="flex bg-slate-50 border border-slate-200 rounded-lg p-1">
                              <button
                                type="button"
                                onClick={() => setTa6Data((prev: any) => ({
                                  ...prev,
                                  utilities: {
                                    ...(prev?.utilities || {
                                      waterConnected: true,
                                      electricityConnected: true,
                                      gasConnected: true,
                                      broadbandProvider: ''
                                    }),
                                    gasConnected: true
                                  }
                                }))}
                                className={cn(
                                  "px-4 py-1.5 rounded-md text-xs font-bold transition-all",
                                  ta6Data?.utilities?.gasConnected ? "bg-navy text-white shadow-sm" : "text-slate-500 hover:text-navy"
                                )}
                              >
                                Yes
                              </button>
                              <button
                                type="button"
                                onClick={() => setTa6Data((prev: any) => ({
                                  ...prev,
                                  utilities: {
                                    ...(prev?.utilities || {
                                      waterConnected: true,
                                      electricityConnected: true,
                                      gasConnected: true,
                                      broadbandProvider: ''
                                    }),
                                    gasConnected: false
                                  }
                                }))}
                                className={cn(
                                  "px-4 py-1.5 rounded-md text-xs font-bold transition-all",
                                  (ta6Data?.utilities?.gasConnected === false) ? "bg-navy text-white shadow-sm" : "text-slate-500 hover:text-navy"
                                )}
                              >
                                No
                              </button>
                            </div>
                          </div>

                          <div className="space-y-2">
                            <label className="text-sm font-bold text-navy">Broadband provider</label>
                            <input 
                              type="text"
                              value={ta6Data?.utilities?.broadbandProvider || ''}
                              onChange={(e) => {
                                const value = e.target.value;
                                setTa6Data((prev: any) => ({
                                  ...prev,
                                  utilities: {
                                    ...(prev?.utilities || {
                                      waterConnected: true,
                                      electricityConnected: true,
                                      gasConnected: true,
                                      broadbandProvider: ''
                                    }),
                                    broadbandProvider: value
                                  }
                                }));
                              }}
                              className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-navy focus:border-transparent outline-none transition-all text-sm"
                              placeholder="e.g. BT, Sky, Virgin Media"
                            />
                          </div>
                        </div>
                      </div>
                    </details>

                    {/* Insurance Accordion */}
                    <details className="group/sub bg-white border border-slate-200 rounded-xl overflow-hidden transition-all">
                      <summary className="flex items-center justify-between p-4 cursor-pointer hover:bg-slate-50 transition-colors list-none">
                        <span className="text-sm font-bold text-navy">Insurance</span>
                        <ChevronDown className="text-gold transition-transform group-open/sub:rotate-180" size={18} />
                      </summary>
                      <div className="p-4 pt-2 space-y-6 border-t border-slate-100 mt-1">
                        <div className="space-y-4">
                          <div className="flex items-center justify-between">
                            <div className="space-y-1">
                              <label className="text-sm font-bold text-navy">Abnormal premiums or high excesses</label>
                              <p className="text-xs text-slate-500">Has the property been insured subject to abnormal terms?</p>
                            </div>
                            <div className="flex bg-slate-50 border border-slate-200 rounded-lg p-1">
                              <button
                                type="button"
                                onClick={() => setTa6Data((prev: any) => ({
                                  ...prev,
                                  insurance: {
                                    ...(prev?.insurance || {
                                      abnormalPremiums: { hasAbnormal: false, details: '' },
                                      refusedInsurance: { hasRefused: false, details: '' }
                                    }),
                                    abnormalPremiums: {
                                      ...(prev?.insurance?.abnormalPremiums || { hasAbnormal: false, details: '' }),
                                      hasAbnormal: true
                                    }
                                  }
                                }))}
                                className={cn(
                                  "px-4 py-1.5 rounded-md text-xs font-bold transition-all",
                                  ta6Data?.insurance?.abnormalPremiums?.hasAbnormal ? "bg-navy text-white shadow-sm" : "text-slate-500 hover:text-navy"
                                )}
                              >
                                Yes
                              </button>
                              <button
                                type="button"
                                onClick={() => setTa6Data((prev: any) => ({
                                  ...prev,
                                  insurance: {
                                    ...(prev?.insurance || {
                                      abnormalPremiums: { hasAbnormal: false, details: '' },
                                      refusedInsurance: { hasRefused: false, details: '' }
                                    }),
                                    abnormalPremiums: {
                                      ...(prev?.insurance?.abnormalPremiums || { hasAbnormal: false, details: '' }),
                                      hasAbnormal: false
                                    }
                                  }
                                }))}
                                className={cn(
                                  "px-4 py-1.5 rounded-md text-xs font-bold transition-all",
                                  (ta6Data?.insurance?.abnormalPremiums?.hasAbnormal === false) ? "bg-navy text-white shadow-sm" : "text-slate-500 hover:text-navy"
                                )}
                              >
                                No
                              </button>
                            </div>
                          </div>
                          {ta6Data?.insurance?.abnormalPremiums?.hasAbnormal && (
                            <textarea 
                              value={ta6Data?.insurance?.abnormalPremiums?.details || ''}
                              onChange={(e) => {
                                const value = e.target.value;
                                setTa6Data((prev: any) => ({
                                  ...prev,
                                  insurance: {
                                    ...(prev?.insurance || {}),
                                    abnormalPremiums: {
                                      ...(prev?.insurance?.abnormalPremiums || {}),
                                      details: value
                                    }
                                  }
                                }));
                              }}
                              className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-navy focus:border-transparent outline-none transition-all min-h-[80px] text-sm"
                              placeholder="Please provide details of abnormal premiums or excesses..."
                            />
                          )}
                        </div>

                        <div className="space-y-4">
                          <div className="flex items-center justify-between">
                            <div className="space-y-1">
                              <label className="text-sm font-bold text-navy">Insurance ever been refused</label>
                              <p className="text-xs text-slate-500">Has any insurer ever declined to provide cover?</p>
                            </div>
                            <div className="flex bg-slate-50 border border-slate-200 rounded-lg p-1">
                              <button
                                type="button"
                                onClick={() => setTa6Data((prev: any) => ({
                                  ...prev,
                                  insurance: {
                                    ...(prev?.insurance || {
                                      abnormalPremiums: { hasAbnormal: false, details: '' },
                                      refusedInsurance: { hasRefused: false, details: '' }
                                    }),
                                    refusedInsurance: {
                                      ...(prev?.insurance?.refusedInsurance || { hasRefused: false, details: '' }),
                                      hasRefused: true
                                    }
                                  }
                                }))}
                                className={cn(
                                  "px-4 py-1.5 rounded-md text-xs font-bold transition-all",
                                  ta6Data?.insurance?.refusedInsurance?.hasRefused ? "bg-navy text-white shadow-sm" : "text-slate-500 hover:text-navy"
                                )}
                              >
                                Yes
                              </button>
                              <button
                                type="button"
                                onClick={() => setTa6Data((prev: any) => ({
                                  ...prev,
                                  insurance: {
                                    ...(prev?.insurance || {
                                      abnormalPremiums: { hasAbnormal: false, details: '' },
                                      refusedInsurance: { hasRefused: false, details: '' }
                                    }),
                                    refusedInsurance: {
                                      ...(prev?.insurance?.refusedInsurance || { hasRefused: false, details: '' }),
                                      hasRefused: false
                                    }
                                  }
                                }))}
                                className={cn(
                                  "px-4 py-1.5 rounded-md text-xs font-bold transition-all",
                                  (ta6Data?.insurance?.refusedInsurance?.hasRefused === false) ? "bg-navy text-white shadow-sm" : "text-slate-500 hover:text-navy"
                                )}
                              >
                                No
                              </button>
                            </div>
                          </div>
                          {ta6Data?.insurance?.refusedInsurance?.hasRefused && (
                            <textarea 
                              value={ta6Data?.insurance?.refusedInsurance?.details || ''}
                              onChange={(e) => {
                                const value = e.target.value;
                                setTa6Data((prev: any) => ({
                                  ...prev,
                                  insurance: {
                                    ...(prev?.insurance || {}),
                                    refusedInsurance: {
                                      ...(prev?.insurance?.refusedInsurance || {}),
                                      details: value
                                    }
                                  }
                                }));
                              }}
                              className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-navy focus:border-transparent outline-none transition-all min-h-[80px] text-sm"
                              placeholder="Please provide details of insurance refusal..."
                            />
                          )}
                        </div>
                      </div>
                    </details>

                    {/* Occupiers Accordion */}
                    <details className="group/sub bg-white border border-slate-200 rounded-xl overflow-hidden transition-all">
                      <summary className="flex items-center justify-between p-4 cursor-pointer hover:bg-slate-50 transition-colors list-none">
                        <span className="text-sm font-bold text-navy">Occupiers</span>
                        <ChevronDown className="text-gold transition-transform group-open/sub:rotate-180" size={18} />
                      </summary>
                      <div className="p-4 pt-2 space-y-6 border-t border-slate-100 mt-1">
                        <div className="space-y-4">
                          <div className="flex items-center justify-between">
                            <div className="space-y-1">
                              <label className="text-sm font-bold text-navy">Sold with vacant possession</label>
                              <p className="text-xs text-slate-500">Will the property be empty on completion?</p>
                            </div>
                            <div className="flex bg-slate-50 border border-slate-200 rounded-lg p-1">
                              <button
                                type="button"
                                onClick={() => setTa6Data((prev: any) => ({
                                  ...prev,
                                  occupiers: {
                                    ...(prev?.occupiers || {
                                      vacantPossession: true,
                                      otherOccupiers: { hasOccupiers: false, consentDetails: '' }
                                    }),
                                    vacantPossession: true
                                  }
                                }))}
                                className={cn(
                                  "px-4 py-1.5 rounded-md text-xs font-bold transition-all",
                                  ta6Data?.occupiers?.vacantPossession ? "bg-navy text-white shadow-sm" : "text-slate-500 hover:text-navy"
                                )}
                              >
                                Yes
                              </button>
                              <button
                                type="button"
                                onClick={() => setTa6Data((prev: any) => ({
                                  ...prev,
                                  occupiers: {
                                    ...(prev?.occupiers || {
                                      vacantPossession: true,
                                      otherOccupiers: { hasOccupiers: false, consentDetails: '' }
                                    }),
                                    vacantPossession: false
                                  }
                                }))}
                                className={cn(
                                  "px-4 py-1.5 rounded-md text-xs font-bold transition-all",
                                  (ta6Data?.occupiers?.vacantPossession === false) ? "bg-navy text-white shadow-sm" : "text-slate-500 hover:text-navy"
                                )}
                              >
                                No
                              </button>
                            </div>
                          </div>
                        </div>

                        <div className="space-y-4">
                          <div className="flex items-center justify-between">
                            <div className="space-y-1">
                              <label className="text-sm font-bold text-navy">Occupiers aged 17 or older</label>
                              <p className="text-xs text-slate-500">Do any other adults live at the property?</p>
                            </div>
                            <div className="flex bg-slate-50 border border-slate-200 rounded-lg p-1">
                              <button
                                type="button"
                                onClick={() => setTa6Data((prev: any) => ({
                                  ...prev,
                                  occupiers: {
                                    ...(prev?.occupiers || {
                                      vacantPossession: true,
                                      otherOccupiers: { hasOccupiers: false, consentDetails: '' }
                                    }),
                                    otherOccupiers: {
                                      ...(prev?.occupiers?.otherOccupiers || { hasOccupiers: false, consentDetails: '' }),
                                      hasOccupiers: true
                                    }
                                  }
                                }))}
                                className={cn(
                                  "px-4 py-1.5 rounded-md text-xs font-bold transition-all",
                                  ta6Data?.occupiers?.otherOccupiers?.hasOccupiers ? "bg-navy text-white shadow-sm" : "text-slate-500 hover:text-navy"
                                )}
                              >
                                Yes
                              </button>
                              <button
                                type="button"
                                onClick={() => setTa6Data((prev: any) => ({
                                  ...prev,
                                  occupiers: {
                                    ...(prev?.occupiers || {
                                      vacantPossession: true,
                                      otherOccupiers: { hasOccupiers: false, consentDetails: '' }
                                    }),
                                    otherOccupiers: {
                                      ...(prev?.occupiers?.otherOccupiers || { hasOccupiers: false, consentDetails: '' }),
                                      hasOccupiers: false
                                    }
                                  }
                                }))}
                                className={cn(
                                  "px-4 py-1.5 rounded-md text-xs font-bold transition-all",
                                  (ta6Data?.occupiers?.otherOccupiers?.hasOccupiers === false) ? "bg-navy text-white shadow-sm" : "text-slate-500 hover:text-navy"
                                )}
                              >
                                No
                              </button>
                            </div>
                          </div>
                          {ta6Data?.occupiers?.otherOccupiers?.hasOccupiers && (
                            <textarea 
                              value={ta6Data?.occupiers?.otherOccupiers?.consentDetails || ''}
                              onChange={(e) => {
                                const value = e.target.value;
                                setTa6Data((prev: any) => ({
                                  ...prev,
                                  occupiers: {
                                    ...(prev?.occupiers || {}),
                                    otherOccupiers: {
                                      ...(prev?.occupiers?.otherOccupiers || {}),
                                      consentDetails: value
                                    }
                                  }
                                }));
                              }}
                              className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-navy focus:border-transparent outline-none transition-all min-h-[80px] text-sm"
                              placeholder="Please confirm they will sign a consent to mortgage document..."
                            />
                          )}
                        </div>
                      </div>
                    </details>

                    {/* Transaction Information Accordion */}
                    <details className="group/sub bg-white border border-slate-200 rounded-xl overflow-hidden transition-all">
                      <summary className="flex items-center justify-between p-4 cursor-pointer hover:bg-slate-50 transition-colors list-none">
                        <span className="text-sm font-bold text-navy">Transaction Information</span>
                        <ChevronDown className="text-gold transition-transform group-open/sub:rotate-180" size={18} />
                      </summary>
                      <div className="p-4 pt-2 space-y-6 border-t border-slate-100 mt-1">
                        <div className="space-y-4">
                          <div className="flex items-center justify-between">
                            <div className="space-y-1">
                              <label className="text-sm font-bold text-navy">Special requirements for moving date</label>
                              <p className="text-xs text-slate-500">Are there any specific dates or constraints?</p>
                            </div>
                            <div className="flex bg-slate-50 border border-slate-200 rounded-lg p-1">
                              <button
                                type="button"
                                onClick={() => setTa6Data((prev: any) => ({
                                  ...prev,
                                  transaction: {
                                    ...(prev?.transaction || {
                                      movingDateRequirements: { hasRequirements: false, details: '' },
                                      clearMortgages: 'not_known'
                                    }),
                                    movingDateRequirements: {
                                      ...(prev?.transaction?.movingDateRequirements || { hasRequirements: false, details: '' }),
                                      hasRequirements: true
                                    }
                                  }
                                }))}
                                className={cn(
                                  "px-4 py-1.5 rounded-md text-xs font-bold transition-all",
                                  ta6Data?.transaction?.movingDateRequirements?.hasRequirements ? "bg-navy text-white shadow-sm" : "text-slate-500 hover:text-navy"
                                )}
                              >
                                Yes
                              </button>
                              <button
                                type="button"
                                onClick={() => setTa6Data((prev: any) => ({
                                  ...prev,
                                  transaction: {
                                    ...(prev?.transaction || {
                                      movingDateRequirements: { hasRequirements: false, details: '' },
                                      clearMortgages: 'not_known'
                                    }),
                                    movingDateRequirements: {
                                      ...(prev?.transaction?.movingDateRequirements || { hasRequirements: false, details: '' }),
                                      hasRequirements: false
                                    }
                                  }
                                }))}
                                className={cn(
                                  "px-4 py-1.5 rounded-md text-xs font-bold transition-all",
                                  (ta6Data?.transaction?.movingDateRequirements?.hasRequirements === false) ? "bg-navy text-white shadow-sm" : "text-slate-500 hover:text-navy"
                                )}
                              >
                                No
                              </button>
                            </div>
                          </div>
                          {ta6Data?.transaction?.movingDateRequirements?.hasRequirements && (
                            <textarea 
                              value={ta6Data?.transaction?.movingDateRequirements?.details || ''}
                              onChange={(e) => {
                                const value = e.target.value;
                                setTa6Data((prev: any) => ({
                                  ...prev,
                                  transaction: {
                                    ...(prev?.transaction || {}),
                                    movingDateRequirements: {
                                      ...(prev?.transaction?.movingDateRequirements || {}),
                                      details: value
                                    }
                                  }
                                }));
                              }}
                              className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-navy focus:border-transparent outline-none transition-all min-h-[80px] text-sm"
                              placeholder="Please provide details of moving date requirements..."
                            />
                          )}
                        </div>

                        <div className="space-y-4">
                          <div className="space-y-1">
                            <label className="text-sm font-bold text-navy">Sale price sufficient to clear mortgages</label>
                            <p className="text-xs text-slate-500">Will all charges be cleared on completion?</p>
                          </div>
                          <div className="grid grid-cols-3 gap-2">
                            {[
                              { id: 'yes', label: 'Yes' },
                              { id: 'no', label: 'No' },
                              { id: 'not_known', label: 'Not Known' }
                            ].map((option) => (
                              <button
                                key={option.id}
                                type="button"
                                onClick={() => setTa6Data((prev: any) => ({
                                  ...prev,
                                  transaction: {
                                    ...(prev?.transaction || {
                                      movingDateRequirements: { hasRequirements: false, details: '' },
                                      clearMortgages: 'not_known'
                                    }),
                                    clearMortgages: option.id
                                  }
                                }))}
                                className={cn(
                                  "py-2 rounded-lg text-xs font-bold border transition-all",
                                  ta6Data?.transaction?.clearMortgages === option.id 
                                    ? "bg-navy border-navy text-white shadow-sm" 
                                    : "bg-slate-50 border-slate-200 text-slate-500 hover:border-navy/50"
                                )}
                              >
                                {option.label}
                              </button>
                            ))}
                          </div>
                        </div>
                      </div>
                    </details>

                    <button 
                      type="submit"
                      disabled={updatingTA6}
                      className={cn(
                        "w-full py-4 rounded-xl font-bold transition-all flex items-center justify-center gap-2 shadow-lg",
                        saveSuccess 
                          ? "bg-green-600 text-white shadow-green-200" 
                          : "bg-navy text-white hover:bg-navy-light shadow-navy/10"
                      )}
                    >
                      {updatingTA6 ? (
                        <Loader2 className="animate-spin" size={20} />
                      ) : saveSuccess ? (
                        <>
                          <CheckCircle2 size={20} />
                          Saved!
                        </>
                      ) : (
                        'Save TA6 Progress'
                      )}
                    </button>
                  </form>
                </div>
              </details>

              {[
                {
                  id: 'ta7',
                  title: 'TA7: Leasehold Information',
                  description: 'Leasehold Information Form',
                  tooltip: 'The official Law Society form covering ground rent, service charges, and management info.',
                  items: [
                    'Confirm your current service charge and ground rent costs.',
                    'Check if you have your Share Certificate for the management company.',
                    'Note any written consent you received for flooring or structural changes.',
                    'Check if a Leaseholder Deed of Certificate (BSA 2022) is finished.'
                  ]
                },
                {
                  id: 'ta10',
                  title: 'TA10: Fittings and Contents',
                  description: 'Fittings and Contents Form',
                  tooltip: 'The official Law Society form listing which fixtures and appliances stay with the property.',
                  items: [
                    'Decide if appliances like the oven and fridge stay or go.',
                    'List which curtains, blinds and carpets are included.',
                    'Note if you are taking any light fittings or smart home tech.',
                    'Check if garden sheds or specific plants are staying.'
                  ]
                },
                {
                  id: 'lpe1',
                  title: 'LPE1: Leasehold Property Enquiries',
                  description: 'Leasehold Property Enquiries Form',
                  tooltip: 'The official Law Society form completed by the Managing Agent regarding management info.',
                  items: [
                    'Contact your Managing Agent to request the LPE1 pack.',
                    'Check the fee required by the Managing Agent for completion.',
                    'Verify if any major works are planned for the building.',
                    'Confirm the current balance of the reserve fund.'
                  ]
                }
              ].map((prep) => (
                <details 
                  key={prep.id} 
                  className="group bg-slate-50 border border-slate-200 rounded-2xl overflow-hidden transition-all"
                  open={activeFormSection === prep.id}
                >
                  <summary 
                    onClick={(e) => {
                      e.preventDefault();
                      setActiveFormSection(activeFormSection === prep.id ? null : prep.id);
                    }}
                    className="flex items-center justify-between p-5 cursor-pointer hover:bg-slate-100 transition-colors list-none"
                  >
                    <span className="font-bold text-navy">{prep.title}</span>
                    <ArrowRight className={cn("text-navy transition-transform", activeFormSection === prep.id && "rotate-90")} size={18} />
                  </summary>
                  <div className="p-6 pt-2 space-y-6 border-t border-slate-200/50 mt-1">
                    <div className="space-y-4">
                      {prep.id === 'lpe1' ? (
                        <p className="text-sm text-slate-600 leading-relaxed">
                          The LPE1 form is completed by the Managing Agent usually for a fee. While you may be able to assist in gathering the information in advance the buyer's solicitor will require the Managing Agent to sign the form as factually accurate. You can view the full requirements on the{' '}
                          <a 
                            href="https://www.lawsociety.org.uk/topics/property/leasehold-forms" 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="text-navy font-bold hover:text-gold transition-colors underline"
                          >
                            Law Society website
                          </a>.
                        </p>
                      ) : (
                        <p className="text-sm text-slate-600 leading-relaxed">
                          If you have already completed a {prep.id.toUpperCase()} form sent to you by your solicitor please upload it here. If not please complete each section of the {prep.id.toUpperCase()} form below.
                        </p>
                      )}
                      {renderUploadSlot(
                        prep.id, 
                        prep.id === 'lpe1' ? 'Upload LPE1 Management Pack' : `Upload Finished ${prep.id.toUpperCase()}`, 
                        prep.description,
                        prep.tooltip
                      )}
                    </div>

                    {prep.id === 'ta7' && (
                      <form onSubmit={handleTA7Submit} className="space-y-4">
                        {/* Property and Rent Accordion */}
                        <details className="group/sub bg-white border border-slate-200 rounded-xl overflow-hidden transition-all">
                          <summary className="flex items-center justify-between p-4 cursor-pointer hover:bg-slate-50 transition-colors list-none">
                            <span className="text-sm font-bold text-navy">Property and Rent</span>
                            <ChevronDown className="text-gold transition-transform group-open/sub:rotate-180" size={18} />
                          </summary>
                          <div className="p-4 pt-2 space-y-6 border-t border-slate-100 mt-1">
                            <div className="space-y-2">
                              <label className="text-sm font-bold text-navy">Type of leasehold property</label>
                              <select 
                                value={ta7Data?.propertyAndRent?.propertyType || ''}
                                onChange={(e) => setTa7Data((prev: any) => ({
                                  ...prev,
                                  propertyAndRent: {
                                    ...(prev?.propertyAndRent || {}),
                                    propertyType: e.target.value
                                  }
                                }))}
                                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-navy focus:border-transparent outline-none transition-all text-sm"
                              >
                                <option value="">Select type...</option>
                                <option value="flat">Flat</option>
                                <option value="shared_ownership">Shared ownership</option>
                                <option value="long_leasehold_house">Long leasehold house</option>
                              </select>
                            </div>

                            <div className="space-y-4">
                              <div className="flex items-center justify-between">
                                <div className="space-y-1">
                                  <label className="text-sm font-bold text-navy">Does the seller pay rent</label>
                                  <p className="text-xs text-slate-500">Including ground rent or shared ownership rent.</p>
                                </div>
                                <div className="flex bg-slate-50 border border-slate-200 rounded-lg p-1">
                                  <button
                                    type="button"
                                    onClick={() => setTa7Data((prev: any) => ({
                                      ...prev,
                                      propertyAndRent: {
                                        ...(prev?.propertyAndRent || {}),
                                        paysRent: {
                                          ...(prev?.propertyAndRent?.paysRent || {}),
                                          hasRent: true
                                        }
                                      }
                                    }))}
                                    className={cn(
                                      "px-4 py-1.5 rounded-md text-xs font-bold transition-all",
                                      ta7Data?.propertyAndRent?.paysRent?.hasRent ? "bg-navy text-white shadow-sm" : "text-slate-500 hover:text-navy"
                                    )}
                                  >
                                    Yes
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => setTa7Data((prev: any) => ({
                                      ...prev,
                                      propertyAndRent: {
                                        ...(prev?.propertyAndRent || {}),
                                        paysRent: {
                                          ...(prev?.propertyAndRent?.paysRent || {}),
                                          hasRent: false
                                        }
                                      }
                                    }))}
                                    className={cn(
                                      "px-4 py-1.5 rounded-md text-xs font-bold transition-all",
                                      (ta7Data?.propertyAndRent?.paysRent?.hasRent === false) ? "bg-navy text-white shadow-sm" : "text-slate-500 hover:text-navy"
                                    )}
                                  >
                                    No
                                  </button>
                                </div>
                              </div>

                              {ta7Data?.propertyAndRent?.paysRent?.hasRent && (
                                <div className="grid grid-cols-2 gap-4 animate-in fade-in slide-in-from-top-2 duration-300">
                                  <div className="space-y-2">
                                    <label className="text-xs font-bold text-navy uppercase tracking-wider ml-1">Annual Rent (£)</label>
                                    <input 
                                      type="number"
                                      value={ta7Data?.propertyAndRent?.paysRent?.amount || ''}
                                      onChange={(e) => setTa7Data((prev: any) => ({
                                        ...prev,
                                        propertyAndRent: {
                                          ...(prev?.propertyAndRent || {}),
                                          paysRent: {
                                            ...(prev?.propertyAndRent?.paysRent || {}),
                                            amount: e.target.value
                                          }
                                        }
                                      }))}
                                      className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-navy focus:border-transparent outline-none transition-all text-sm"
                                      placeholder="e.g. 250"
                                    />
                                  </div>
                                  <div className="space-y-2">
                                    <label className="text-xs font-bold text-navy uppercase tracking-wider ml-1">Payment Frequency</label>
                                    <input 
                                      type="text"
                                      value={ta7Data?.propertyAndRent?.paysRent?.frequency || ''}
                                      onChange={(e) => setTa7Data((prev: any) => ({
                                        ...prev,
                                        propertyAndRent: {
                                          ...(prev?.propertyAndRent || {}),
                                          paysRent: {
                                            ...(prev?.propertyAndRent?.paysRent || {}),
                                            frequency: e.target.value
                                          }
                                        }
                                      }))}
                                      className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-navy focus:border-transparent outline-none transition-all text-sm"
                                      placeholder="e.g. Annually"
                                    />
                                  </div>
                                </div>
                              )}
                            </div>
                          </div>
                        </details>

                        {/* Maintenance and Service Charges Accordion */}
                        <details className="group/sub bg-white border border-slate-200 rounded-xl overflow-hidden transition-all">
                          <summary className="flex items-center justify-between p-4 cursor-pointer hover:bg-slate-50 transition-colors list-none">
                            <span className="text-sm font-bold text-navy">Maintenance and Service Charges</span>
                            <ChevronDown className="text-gold transition-transform group-open/sub:rotate-180" size={18} />
                          </summary>
                          <div className="p-4 pt-2 space-y-6 border-t border-slate-100 mt-1">
                            <div className="flex items-center justify-between">
                              <label className="text-sm font-bold text-navy">Do you contribute to the cost of maintaining the building</label>
                              <div className="flex bg-slate-50 border border-slate-200 rounded-lg p-1">
                                <button
                                  type="button"
                                  onClick={() => setTa7Data((prev: any) => ({
                                    ...prev,
                                    maintenance: {
                                      ...(prev?.maintenance || {}),
                                      contributesToCost: true
                                    }
                                  }))}
                                  className={cn(
                                    "px-4 py-1.5 rounded-md text-xs font-bold transition-all",
                                    ta7Data?.maintenance?.contributesToCost ? "bg-navy text-white shadow-sm" : "text-slate-500 hover:text-navy"
                                  )}
                                >
                                  Yes
                                </button>
                                <button
                                  type="button"
                                  onClick={() => setTa7Data((prev: any) => ({
                                    ...prev,
                                    maintenance: {
                                      ...(prev?.maintenance || {}),
                                      contributesToCost: false
                                    }
                                  }))}
                                  className={cn(
                                    "px-4 py-1.5 rounded-md text-xs font-bold transition-all",
                                    (ta7Data?.maintenance?.contributesToCost === false) ? "bg-navy text-white shadow-sm" : "text-slate-500 hover:text-navy"
                                  )}
                                >
                                  No
                                </button>
                              </div>
                            </div>

                            <div className="space-y-4">
                              <div className="flex items-center justify-between">
                                <div className="space-y-1">
                                  <label className="text-sm font-bold text-navy">Are there any upcoming expensive works</label>
                                  <p className="text-xs text-slate-500">e.g. redecoration, roof repairs or lift maintenance.</p>
                                </div>
                                <div className="flex bg-slate-50 border border-slate-200 rounded-lg p-1">
                                  <button
                                    type="button"
                                    onClick={() => setTa7Data((prev: any) => ({
                                      ...prev,
                                      maintenance: {
                                        ...(prev?.maintenance || {}),
                                        expensiveWorks: {
                                          ...(prev?.maintenance?.expensiveWorks || {}),
                                          hasWorks: true
                                        }
                                      }
                                    }))}
                                    className={cn(
                                      "px-4 py-1.5 rounded-md text-xs font-bold transition-all",
                                      ta7Data?.maintenance?.expensiveWorks?.hasWorks ? "bg-navy text-white shadow-sm" : "text-slate-500 hover:text-navy"
                                    )}
                                  >
                                    Yes
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => setTa7Data((prev: any) => ({
                                      ...prev,
                                      maintenance: {
                                        ...(prev?.maintenance || {}),
                                        expensiveWorks: {
                                          ...(prev?.maintenance?.expensiveWorks || {}),
                                          hasWorks: false
                                        }
                                      }
                                    }))}
                                    className={cn(
                                      "px-4 py-1.5 rounded-md text-xs font-bold transition-all",
                                      (ta7Data?.maintenance?.expensiveWorks?.hasWorks === false) ? "bg-navy text-white shadow-sm" : "text-slate-500 hover:text-navy"
                                    )}
                                  >
                                    No
                                  </button>
                                </div>
                              </div>
                              {ta7Data?.maintenance?.expensiveWorks?.hasWorks && (
                                <textarea 
                                  value={ta7Data?.maintenance?.expensiveWorks?.details || ''}
                                  onChange={(e) => setTa7Data((prev: any) => ({
                                    ...prev,
                                    maintenance: {
                                      ...(prev?.maintenance || {}),
                                      expensiveWorks: {
                                        ...(prev?.maintenance?.expensiveWorks || {}),
                                        details: e.target.value
                                      }
                                    }
                                  }))}
                                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-navy focus:border-transparent outline-none transition-all min-h-[80px] text-sm"
                                  placeholder="Please provide details of upcoming works..."
                                />
                              )}
                            </div>

                            <div className="space-y-4">
                              <div className="flex items-center justify-between">
                                <div className="space-y-1">
                                  <label className="text-sm font-bold text-navy">Do you owe any service charges or rent arrears</label>
                                  <p className="text-xs text-slate-500">Are all payments up to date?</p>
                                </div>
                                <div className="flex bg-slate-50 border border-slate-200 rounded-lg p-1">
                                  <button
                                    type="button"
                                    onClick={() => setTa7Data((prev: any) => ({
                                      ...prev,
                                      maintenance: {
                                        ...(prev?.maintenance || {}),
                                        arrears: {
                                          ...(prev?.maintenance?.arrears || {}),
                                          hasArrears: true
                                        }
                                      }
                                    }))}
                                    className={cn(
                                      "px-4 py-1.5 rounded-md text-xs font-bold transition-all",
                                      ta7Data?.maintenance?.arrears?.hasArrears ? "bg-navy text-white shadow-sm" : "text-slate-500 hover:text-navy"
                                    )}
                                  >
                                    Yes
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => setTa7Data((prev: any) => ({
                                      ...prev,
                                      maintenance: {
                                        ...(prev?.maintenance || {}),
                                        arrears: {
                                          ...(prev?.maintenance?.arrears || {}),
                                          hasArrears: false
                                        }
                                      }
                                    }))}
                                    className={cn(
                                      "px-4 py-1.5 rounded-md text-xs font-bold transition-all",
                                      (ta7Data?.maintenance?.arrears?.hasArrears === false) ? "bg-navy text-white shadow-sm" : "text-slate-500 hover:text-navy"
                                    )}
                                  >
                                    No
                                  </button>
                                </div>
                              </div>
                              {ta7Data?.maintenance?.arrears?.hasArrears && (
                                <textarea 
                                  value={ta7Data?.maintenance?.arrears?.details || ''}
                                  onChange={(e) => setTa7Data((prev: any) => ({
                                    ...prev,
                                    maintenance: {
                                      ...(prev?.maintenance || {}),
                                      arrears: {
                                        ...(prev?.maintenance?.arrears || {}),
                                        details: e.target.value
                                      }
                                    }
                                  }))}
                                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-navy focus:border-transparent outline-none transition-all min-h-[80px] text-sm"
                                  placeholder="Please provide details of arrears..."
                                />
                              )}
                            </div>
                          </div>
                        </details>

                        {/* Building Safety and Cladding Accordion */}
                        <details className="group/sub bg-white border border-slate-200 rounded-xl overflow-hidden transition-all">
                          <summary className="flex items-center justify-between p-4 cursor-pointer hover:bg-slate-50 transition-colors list-none">
                            <span className="text-sm font-bold text-navy">Building Safety and Cladding</span>
                            <ChevronDown className="text-gold transition-transform group-open/sub:rotate-180" size={18} />
                          </summary>
                          <div className="p-4 pt-2 space-y-6 border-t border-slate-100 mt-1">
                            <div className="space-y-4">
                              <div className="flex items-center justify-between">
                                <div className="space-y-1">
                                  <label className="text-sm font-bold text-navy">Have any remediation works been proposed or carried out</label>
                                  <p className="text-xs text-slate-500">Related to building safety or cladding.</p>
                                </div>
                                <div className="flex bg-slate-50 border border-slate-200 rounded-lg p-1">
                                  <button
                                    type="button"
                                    onClick={() => setTa7Data((prev: any) => ({
                                      ...prev,
                                      buildingSafety: {
                                        ...(prev?.buildingSafety || {}),
                                        remediationWorks: {
                                          ...(prev?.buildingSafety?.remediationWorks || {}),
                                          hasProposed: true
                                        }
                                      }
                                    }))}
                                    className={cn(
                                      "px-4 py-1.5 rounded-md text-xs font-bold transition-all",
                                      ta7Data?.buildingSafety?.remediationWorks?.hasProposed ? "bg-navy text-white shadow-sm" : "text-slate-500 hover:text-navy"
                                    )}
                                  >
                                    Yes
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => setTa7Data((prev: any) => ({
                                      ...prev,
                                      buildingSafety: {
                                        ...(prev?.buildingSafety || {}),
                                        remediationWorks: {
                                          ...(prev?.buildingSafety?.remediationWorks || {}),
                                          hasProposed: false
                                        }
                                      }
                                    }))}
                                    className={cn(
                                      "px-4 py-1.5 rounded-md text-xs font-bold transition-all",
                                      (ta7Data?.buildingSafety?.remediationWorks?.hasProposed === false) ? "bg-navy text-white shadow-sm" : "text-slate-500 hover:text-navy"
                                    )}
                                  >
                                    No
                                  </button>
                                </div>
                              </div>
                              {ta7Data?.buildingSafety?.remediationWorks?.hasProposed && (
                                <textarea 
                                  value={ta7Data?.buildingSafety?.remediationWorks?.details || ''}
                                  onChange={(e) => setTa7Data((prev: any) => ({
                                    ...prev,
                                    buildingSafety: {
                                      ...(prev?.buildingSafety || {}),
                                      remediationWorks: {
                                        ...(prev?.buildingSafety?.remediationWorks || {}),
                                        details: e.target.value
                                      }
                                    }
                                  }))}
                                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-navy focus:border-transparent outline-none transition-all min-h-[80px] text-sm"
                                  placeholder="Please provide details of remediation works..."
                                />
                              )}
                            </div>

                            <div className="flex items-center justify-between">
                              <label className="text-sm font-bold text-navy">Is there a Leaseholder Deed of Certificate</label>
                              <div className="flex bg-slate-50 border border-slate-200 rounded-lg p-1">
                                <button
                                  type="button"
                                  onClick={() => setTa7Data((prev: any) => ({
                                    ...prev,
                                    buildingSafety: {
                                      ...(prev?.buildingSafety || {}),
                                      hasLeaseholderDeed: true
                                    }
                                  }))}
                                  className={cn(
                                    "px-4 py-1.5 rounded-md text-xs font-bold transition-all",
                                    ta7Data?.buildingSafety?.hasLeaseholderDeed ? "bg-navy text-white shadow-sm" : "text-slate-500 hover:text-navy"
                                  )}
                                >
                                  Yes
                                </button>
                                <button
                                  type="button"
                                  onClick={() => setTa7Data((prev: any) => ({
                                    ...prev,
                                    buildingSafety: {
                                      ...(prev?.buildingSafety || {}),
                                      hasLeaseholderDeed: false
                                    }
                                  }))}
                                  className={cn(
                                    "px-4 py-1.5 rounded-md text-xs font-bold transition-all",
                                    (ta7Data?.buildingSafety?.hasLeaseholderDeed === false) ? "bg-navy text-white shadow-sm" : "text-slate-500 hover:text-navy"
                                  )}
                                >
                                  No
                                </button>
                              </div>
                            </div>

                            {ta7Data?.buildingSafety?.hasLeaseholderDeed && (
                              <div className="animate-in fade-in slide-in-from-top-2 duration-300">
                                {renderMiniUploadSlot('ta7_leaseholder_deed', 'Upload Leaseholder Deed of Certificate', 'Leaseholder Deed of Certificate')}
                              </div>
                            )}

                            <div className="flex items-center justify-between">
                              <label className="text-sm font-bold text-navy">Has a Landlord's Certificate been received</label>
                              <div className="flex bg-slate-50 border border-slate-200 rounded-lg p-1">
                                <button
                                  type="button"
                                  onClick={() => setTa7Data((prev: any) => ({
                                    ...prev,
                                    buildingSafety: {
                                      ...(prev?.buildingSafety || {}),
                                      hasLandlordCertificate: true
                                    }
                                  }))}
                                  className={cn(
                                    "px-4 py-1.5 rounded-md text-xs font-bold transition-all",
                                    ta7Data?.buildingSafety?.hasLandlordCertificate ? "bg-navy text-white shadow-sm" : "text-slate-500 hover:text-navy"
                                  )}
                                >
                                  Yes
                                </button>
                                <button
                                  type="button"
                                  onClick={() => setTa7Data((prev: any) => ({
                                    ...prev,
                                    buildingSafety: {
                                      ...(prev?.buildingSafety || {}),
                                      hasLandlordCertificate: false
                                    }
                                  }))}
                                  className={cn(
                                    "px-4 py-1.5 rounded-md text-xs font-bold transition-all",
                                    (ta7Data?.buildingSafety?.hasLandlordCertificate === false) ? "bg-navy text-white shadow-sm" : "text-slate-500 hover:text-navy"
                                  )}
                                >
                                  No
                                </button>
                              </div>
                            </div>

                            {ta7Data?.buildingSafety?.hasLandlordCertificate && (
                              <div className="animate-in fade-in slide-in-from-top-2 duration-300">
                                {renderMiniUploadSlot('ta7_landlord_certificate', 'Upload Landlord\'s Certificate', 'Landlord\'s Certificate')}
                              </div>
                            )}
                          </div>
                        </details>

                        {/* Relevant Documents Accordion */}
                        <details className="group/sub bg-white border border-slate-200 rounded-xl overflow-hidden transition-all">
                          <summary className="flex items-center justify-between p-4 cursor-pointer hover:bg-slate-50 transition-colors list-none">
                            <span className="text-sm font-bold text-navy">Relevant Documents</span>
                            <ChevronDown className="text-gold transition-transform group-open/sub:rotate-180" size={18} />
                          </summary>
                          <div className="p-4 pt-2 space-y-6 border-t border-slate-100 mt-1">
                            <div className="flex items-center justify-between">
                              <label className="text-sm font-bold text-navy">Do you have a copy of the lease</label>
                              <div className="flex bg-slate-50 border border-slate-200 rounded-lg p-1">
                                <button
                                  type="button"
                                  onClick={() => setTa7Data((prev: any) => ({
                                    ...prev,
                                    documents: {
                                      ...(prev?.documents || {}),
                                      hasLease: true
                                    }
                                  }))}
                                  className={cn(
                                    "px-4 py-1.5 rounded-md text-xs font-bold transition-all",
                                    ta7Data?.documents?.hasLease ? "bg-navy text-white shadow-sm" : "text-slate-500 hover:text-navy"
                                  )}
                                >
                                  Yes
                                </button>
                                <button
                                  type="button"
                                  onClick={() => setTa7Data((prev: any) => ({
                                    ...prev,
                                    documents: {
                                      ...(prev?.documents || {}),
                                      hasLease: false
                                    }
                                  }))}
                                  className={cn(
                                    "px-4 py-1.5 rounded-md text-xs font-bold transition-all",
                                    (ta7Data?.documents?.hasLease === false) ? "bg-navy text-white shadow-sm" : "text-slate-500 hover:text-navy"
                                  )}
                                >
                                  No
                                </button>
                              </div>
                            </div>

                            {ta7Data?.documents?.hasLease && (
                              <div className="animate-in fade-in slide-in-from-top-2 duration-300">
                                {renderMiniUploadSlot('ta7_lease_document', 'Upload Lease Document', 'Lease Document')}
                              </div>
                            )}

                            <div className="flex items-center justify-between">
                              <label className="text-sm font-bold text-navy">Do you have a Share Certificate for the management company</label>
                              <div className="flex bg-slate-50 border border-slate-200 rounded-lg p-1">
                                <button
                                  type="button"
                                  onClick={() => setTa7Data((prev: any) => ({
                                    ...prev,
                                    documents: {
                                      ...(prev?.documents || {}),
                                      hasShareCertificate: true
                                    }
                                  }))}
                                  className={cn(
                                    "px-4 py-1.5 rounded-md text-xs font-bold transition-all",
                                    ta7Data?.documents?.hasShareCertificate ? "bg-navy text-white shadow-sm" : "text-slate-500 hover:text-navy"
                                  )}
                                >
                                  Yes
                                </button>
                                <button
                                  type="button"
                                  onClick={() => setTa7Data((prev: any) => ({
                                    ...prev,
                                    documents: {
                                      ...(prev?.documents || {}),
                                      hasShareCertificate: false
                                    }
                                  }))}
                                  className={cn(
                                    "px-4 py-1.5 rounded-md text-xs font-bold transition-all",
                                    (ta7Data?.documents?.hasShareCertificate === false) ? "bg-navy text-white shadow-sm" : "text-slate-500 hover:text-navy"
                                  )}
                                >
                                  No
                                </button>
                              </div>
                            </div>

                            {ta7Data?.documents?.hasShareCertificate && (
                              <div className="animate-in fade-in slide-in-from-top-2 duration-300">
                                {renderMiniUploadSlot('ta7_share_certificate', 'Upload Share Certificate', 'Share Certificate')}
                              </div>
                            )}
                          </div>
                        </details>

                        {/* Consents and Alterations Accordion */}
                        <details className="group/sub bg-white border border-slate-200 rounded-xl overflow-hidden transition-all">
                          <summary className="flex items-center justify-between p-4 cursor-pointer hover:bg-slate-50 transition-colors list-none">
                            <span className="text-sm font-bold text-navy">Consents and Alterations</span>
                            <ChevronDown className="text-gold transition-transform group-open/sub:rotate-180" size={18} />
                          </summary>
                          <div className="p-4 pt-2 space-y-6 border-t border-slate-100 mt-1">
                            <div className="space-y-4">
                              <div className="flex items-center justify-between">
                                <div className="space-y-1">
                                  <label className="text-sm font-bold text-navy">Have you made any alterations requiring the landlord's consent</label>
                                  <p className="text-xs text-slate-500">e.g. wooden flooring or structural changes.</p>
                                </div>
                                <div className="flex bg-slate-50 border border-slate-200 rounded-lg p-1">
                                  <button
                                    type="button"
                                    onClick={() => setTa7Data((prev: any) => ({
                                      ...prev,
                                      consents: {
                                        ...(prev?.consents || {}),
                                        hasAlterations: {
                                          ...(prev?.consents?.hasAlterations || {}),
                                          hasAlterations: true
                                        }
                                      }
                                    }))}
                                    className={cn(
                                      "px-4 py-1.5 rounded-md text-xs font-bold transition-all",
                                      ta7Data?.consents?.hasAlterations?.hasAlterations ? "bg-navy text-white shadow-sm" : "text-slate-500 hover:text-navy"
                                    )}
                                  >
                                    Yes
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => setTa7Data((prev: any) => ({
                                      ...prev,
                                      consents: {
                                        ...(prev?.consents || {}),
                                        hasAlterations: {
                                          ...(prev?.consents?.hasAlterations || {}),
                                          hasAlterations: false
                                        }
                                      }
                                    }))}
                                    className={cn(
                                      "px-4 py-1.5 rounded-md text-xs font-bold transition-all",
                                      (ta7Data?.consents?.hasAlterations?.hasAlterations === false) ? "bg-navy text-white shadow-sm" : "text-slate-500 hover:text-navy"
                                    )}
                                  >
                                    No
                                  </button>
                                </div>
                              </div>
                              {ta7Data?.consents?.hasAlterations?.hasAlterations && (
                                <div className="space-y-4 animate-in fade-in slide-in-from-top-2 duration-300">
                                  <textarea 
                                    value={ta7Data?.consents?.hasAlterations?.details || ''}
                                    onChange={(e) => setTa7Data((prev: any) => ({
                                      ...prev,
                                      consents: {
                                        ...(prev?.consents || {}),
                                        hasAlterations: {
                                          ...(prev?.consents?.hasAlterations || {}),
                                          details: e.target.value
                                        }
                                      }
                                    }))}
                                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-navy focus:border-transparent outline-none transition-all min-h-[80px] text-sm"
                                    placeholder="Please provide details of alterations..."
                                  />
                                  {renderMiniUploadSlot('ta7_landlord_consent_letter', 'Upload Landlord Consent Letter', 'Landlord Consent Letter')}
                                </div>
                              )}
                            </div>

                            <div className="space-y-4">
                              <div className="flex items-center justify-between">
                                <div className="space-y-1">
                                  <label className="text-sm font-bold text-navy">Has the landlord ever refused consent for an alteration</label>
                                  <p className="text-xs text-slate-500">Have any requests been turned down?</p>
                                </div>
                                <div className="flex bg-slate-50 border border-slate-200 rounded-lg p-1">
                                  <button
                                    type="button"
                                    onClick={() => setTa7Data((prev: any) => ({
                                      ...prev,
                                      consents: {
                                        ...(prev?.consents || {}),
                                        hasRefusedConsent: {
                                          ...(prev?.consents?.hasRefusedConsent || {}),
                                          hasRefused: true
                                        }
                                      }
                                    }))}
                                    className={cn(
                                      "px-4 py-1.5 rounded-md text-xs font-bold transition-all",
                                      ta7Data?.consents?.hasRefusedConsent?.hasRefused ? "bg-navy text-white shadow-sm" : "text-slate-500 hover:text-navy"
                                    )}
                                  >
                                    Yes
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => setTa7Data((prev: any) => ({
                                      ...prev,
                                      consents: {
                                        ...(prev?.consents || {}),
                                        hasRefusedConsent: {
                                          ...(prev?.consents?.hasRefusedConsent || {}),
                                          hasRefused: false
                                        }
                                      }
                                    }))}
                                    className={cn(
                                      "px-4 py-1.5 rounded-md text-xs font-bold transition-all",
                                      (ta7Data?.consents?.hasRefusedConsent?.hasRefused === false) ? "bg-navy text-white shadow-sm" : "text-slate-500 hover:text-navy"
                                    )}
                                  >
                                    No
                                  </button>
                                </div>
                              </div>
                              {ta7Data?.consents?.hasRefusedConsent?.hasRefused && (
                                <textarea 
                                  value={ta7Data?.consents?.hasRefusedConsent?.details || ''}
                                  onChange={(e) => setTa7Data((prev: any) => ({
                                    ...prev,
                                    consents: {
                                      ...(prev?.consents || {}),
                                      hasRefusedConsent: {
                                        ...(prev?.consents?.hasRefusedConsent || {}),
                                        details: e.target.value
                                      }
                                    }
                                  }))}
                                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-navy focus:border-transparent outline-none transition-all min-h-[80px] text-sm"
                                  placeholder="Please provide details of refused consent..."
                                />
                              )}
                            </div>
                          </div>
                        </details>

                        {/* Enfranchisement Accordion */}
                        <details className="group/sub bg-white border border-slate-200 rounded-xl overflow-hidden transition-all">
                          <summary className="flex items-center justify-between p-4 cursor-pointer hover:bg-slate-50 transition-colors list-none">
                            <span className="text-sm font-bold text-navy">Enfranchisement</span>
                            <ChevronDown className="text-gold transition-transform group-open/sub:rotate-180" size={18} />
                          </summary>
                          <div className="p-4 pt-2 space-y-6 border-t border-slate-100 mt-1">
                            <div className="space-y-4">
                              <div className="space-y-1">
                                <label className="text-sm font-bold text-navy">Has any action been taken to buy the freehold or form a Right to Manage company</label>
                                <p className="text-xs text-slate-500">Are there any ongoing enfranchisement claims?</p>
                              </div>
                              <div className="grid grid-cols-3 gap-2">
                                {[
                                  { id: 'yes', label: 'Yes' },
                                  { id: 'no', label: 'No' },
                                  { id: 'not_known', label: 'Not Known' }
                                ].map((option) => (
                                  <button
                                    key={option.id}
                                    type="button"
                                    onClick={() => setTa7Data((prev: any) => ({
                                      ...prev,
                                      enfranchisement: {
                                        ...(prev?.enfranchisement || {}),
                                        actionTaken: option.id
                                      }
                                    }))}
                                    className={cn(
                                      "py-2 rounded-lg text-xs font-bold border transition-all",
                                      ta7Data?.enfranchisement?.actionTaken === option.id 
                                        ? "bg-navy border-navy text-white shadow-sm" 
                                        : "bg-slate-50 border-slate-200 text-slate-500 hover:border-navy/50"
                                    )}
                                  >
                                    {option.label}
                                  </button>
                                ))}
                              </div>
                              {ta7Data?.enfranchisement?.actionTaken === 'yes' && (
                                <textarea 
                                  value={ta7Data?.enfranchisement?.details || ''}
                                  onChange={(e) => setTa7Data((prev: any) => ({
                                    ...prev,
                                    enfranchisement: {
                                      ...(prev?.enfranchisement || {}),
                                      details: e.target.value
                                    }
                                  }))}
                                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-navy focus:border-transparent outline-none transition-all min-h-[80px] text-sm"
                                  placeholder="Please provide details of enfranchisement action..."
                                />
                              )}
                            </div>
                          </div>
                        </details>

                        <button 
                          type="submit"
                          disabled={updatingTA7}
                          className={cn(
                            "w-full py-4 rounded-xl font-bold transition-all flex items-center justify-center gap-2 shadow-lg",
                            ta7SaveSuccess 
                              ? "bg-green-600 text-white shadow-green-200" 
                              : "bg-navy text-white hover:bg-navy-light shadow-navy/10"
                          )}
                        >
                          {updatingTA7 ? (
                            <Loader2 className="animate-spin" size={20} />
                          ) : ta7SaveSuccess ? (
                            <>
                              <CheckCircle2 size={20} />
                              Saved!
                            </>
                          ) : (
                            'Save TA7 Progress'
                          )}
                        </button>
                      </form>
                    )}

                    {prep.id === 'ta10' && (
                      <form onSubmit={handleTA10Submit} className="space-y-4">
                        {/* Basic Fittings Accordion */}
                        <details className="group/sub bg-white border border-slate-200 rounded-xl overflow-hidden transition-all">
                          <summary className="flex items-center justify-between p-4 cursor-pointer hover:bg-slate-50 transition-colors list-none">
                            <span className="text-sm font-bold text-navy">Basic Fittings</span>
                            <ChevronDown className="text-gold transition-transform group-open/sub:rotate-180" size={18} />
                          </summary>
                          <div className="p-4 pt-2 border-t border-slate-100 mt-1">
                            {[
                              'Boiler/immersion heater',
                              'Radiators/wall heaters',
                              'Light switches',
                              'Roof insulation',
                              'Window fittings',
                              'Internal door fittings',
                              'Burglar alarm'
                            ].map((item) => (
                              <TA10ItemRow 
                                key={item}
                                name={item}
                                data={ta10Data?.basicFittings?.[item] || { status: '', price: '', comments: '' }}
                                onChange={(newData) => setTa10Data((prev: any) => ({
                                  ...prev,
                                  basicFittings: {
                                    ...(prev?.basicFittings || {}),
                                    [item]: newData
                                  }
                                }))}
                              />
                            ))}
                          </div>
                        </details>

                        {/* Kitchen Accordion */}
                        <details className="group/sub bg-white border border-slate-200 rounded-xl overflow-hidden transition-all">
                          <summary className="flex items-center justify-between p-4 cursor-pointer hover:bg-slate-50 transition-colors list-none">
                            <span className="text-sm font-bold text-navy">Kitchen</span>
                            <ChevronDown className="text-gold transition-transform group-open/sub:rotate-180" size={18} />
                          </summary>
                          <div className="p-4 pt-2 space-y-6 border-t border-slate-100 mt-1">
                            <div className="flex items-center justify-between py-4 border-b border-slate-100">
                              <label className="text-sm font-bold text-navy">Are any of the kitchen appliances fitted?</label>
                              <div className="flex bg-slate-50 border border-slate-200 rounded-lg p-1">
                                <button
                                  type="button"
                                  onClick={() => setTa10Data((prev: any) => ({
                                    ...prev,
                                    kitchen: {
                                      ...(prev?.kitchen || {}),
                                      anyFitted: true
                                    }
                                  }))}
                                  className={cn(
                                    "px-4 py-1.5 rounded-md text-xs font-bold transition-all",
                                    ta10Data?.kitchen?.anyFitted ? "bg-navy text-white shadow-sm" : "text-slate-500 hover:text-navy"
                                  )}
                                >
                                  Yes
                                </button>
                                <button
                                  type="button"
                                  onClick={() => setTa10Data((prev: any) => ({
                                    ...prev,
                                    kitchen: {
                                      ...(prev?.kitchen || {}),
                                      anyFitted: false
                                    }
                                  }))}
                                  className={cn(
                                    "px-4 py-1.5 rounded-md text-xs font-bold transition-all",
                                    (ta10Data?.kitchen?.anyFitted === false) ? "bg-navy text-white shadow-sm" : "text-slate-500 hover:text-navy"
                                  )}
                                >
                                  No
                                </button>
                              </div>
                            </div>

                            <div>
                              {[
                                'Hob',
                                'Extractor hood',
                                'Oven/grill',
                                'Microwave',
                                'Refrigerator/fridge-freezer',
                                'Dishwasher',
                                'Washing machine'
                              ].map((item) => (
                                <TA10ItemRow 
                                  key={item}
                                  name={item}
                                  data={ta10Data?.kitchen?.items?.[item] || { status: '', price: '', comments: '' }}
                                  onChange={(newData) => setTa10Data((prev: any) => ({
                                    ...prev,
                                    kitchen: {
                                      ...(prev?.kitchen || {}),
                                      items: {
                                        ...(prev?.kitchen?.items || {}),
                                        [item]: newData
                                      }
                                    }
                                  }))}
                                />
                              ))}
                            </div>
                          </div>
                        </details>

                        {/* Bathrooms Accordion */}
                        <details className="group/sub bg-white border border-slate-200 rounded-xl overflow-hidden transition-all">
                          <summary className="flex items-center justify-between p-4 cursor-pointer hover:bg-slate-50 transition-colors list-none">
                            <span className="text-sm font-bold text-navy">Bathrooms</span>
                            <ChevronDown className="text-gold transition-transform group-open/sub:rotate-180" size={18} />
                          </summary>
                          <div className="p-4 pt-2 border-t border-slate-100 mt-1">
                            {[
                              'Mirrors',
                              'Bathroom cabinets',
                              'Towel rails',
                              'Soap/glass holders',
                              'Toilet roll holders'
                            ].map((item) => (
                              <TA10ItemRow 
                                key={item}
                                name={item}
                                data={ta10Data?.bathrooms?.[item] || { status: '', price: '', comments: '' }}
                                onChange={(newData) => setTa10Data((prev: any) => ({
                                  ...prev,
                                  bathrooms: {
                                    ...(prev?.bathrooms || {}),
                                    [item]: newData
                                  }
                                }))}
                              />
                            ))}
                          </div>
                        </details>

                        {/* Carpets and Floor Coverings Accordion */}
                        <details className="group/sub bg-white border border-slate-200 rounded-xl overflow-hidden transition-all">
                          <summary className="flex items-center justify-between p-4 cursor-pointer hover:bg-slate-50 transition-colors list-none">
                            <span className="text-sm font-bold text-navy">Carpets and Floor Coverings</span>
                            <ChevronDown className="text-gold transition-transform group-open/sub:rotate-180" size={18} />
                          </summary>
                          <div className="p-4 pt-2 border-t border-slate-100 mt-1">
                            {[
                              'Hall/stairs/landing',
                              'Living room',
                              'Dining room',
                              'Bedrooms'
                            ].map((item) => (
                              <TA10ItemRow 
                                key={item}
                                name={item}
                                data={ta10Data?.carpets?.[item] || { status: '', price: '', comments: '' }}
                                onChange={(newData) => setTa10Data((prev: any) => ({
                                  ...prev,
                                  carpets: {
                                    ...(prev?.carpets || {}),
                                    [item]: newData
                                  }
                                }))}
                              />
                            ))}
                          </div>
                        </details>

                        {/* Curtains and Blinds Accordion */}
                        <details className="group/sub bg-white border border-slate-200 rounded-xl overflow-hidden transition-all">
                          <summary className="flex items-center justify-between p-4 cursor-pointer hover:bg-slate-50 transition-colors list-none">
                            <span className="text-sm font-bold text-navy">Curtains and Blinds</span>
                            <ChevronDown className="text-gold transition-transform group-open/sub:rotate-180" size={18} />
                          </summary>
                          <div className="p-4 pt-2 border-t border-slate-100 mt-1">
                            {[
                              'Hall/stairs/landing',
                              'Living room',
                              'Dining room',
                              'Bedrooms'
                            ].map((item) => (
                              <TA10ItemRow 
                                key={item}
                                name={item}
                                data={ta10Data?.curtains?.[item] || { status: '', price: '', comments: '' }}
                                onChange={(newData) => setTa10Data((prev: any) => ({
                                  ...prev,
                                  curtains: {
                                    ...(prev?.curtains || {}),
                                    [item]: newData
                                  }
                                }))}
                              />
                            ))}
                          </div>
                        </details>

                        {/* Light Fittings Accordion */}
                        <details className="group/sub bg-white border border-slate-200 rounded-xl overflow-hidden transition-all">
                          <summary className="flex items-center justify-between p-4 cursor-pointer hover:bg-slate-50 transition-colors list-none">
                            <span className="text-sm font-bold text-navy">Light Fittings</span>
                            <ChevronDown className="text-gold transition-transform group-open/sub:rotate-180" size={18} />
                          </summary>
                          <div className="p-4 pt-2 border-t border-slate-100 mt-1">
                            {[
                              'Hall/stairs/landing',
                              'Living room',
                              'Dining room',
                              'Bedrooms'
                            ].map((item) => (
                              <TA10ItemRow 
                                key={item}
                                name={item}
                                data={ta10Data?.lightFittings?.[item] || { status: '', price: '', comments: '' }}
                                onChange={(newData) => setTa10Data((prev: any) => ({
                                  ...prev,
                                  lightFittings: {
                                    ...(prev?.lightFittings || {}),
                                    [item]: newData
                                  }
                                }))}
                              />
                            ))}
                          </div>
                        </details>

                        {/* Outdoor Area Accordion */}
                        <details className="group/sub bg-white border border-slate-200 rounded-xl overflow-hidden transition-all">
                          <summary className="flex items-center justify-between p-4 cursor-pointer hover:bg-slate-50 transition-colors list-none">
                            <span className="text-sm font-bold text-navy">Outdoor Area</span>
                            <ChevronDown className="text-gold transition-transform group-open/sub:rotate-180" size={18} />
                          </summary>
                          <div className="p-4 pt-2 border-t border-slate-100 mt-1">
                            {[
                              'Dustbins',
                              'Garden furniture',
                              'Garden ornaments',
                              'Trees/plants/shrubs',
                              'Shed/greenhouse',
                              'Outdoor heater/barbecue'
                            ].map((item) => (
                              <TA10ItemRow 
                                key={item}
                                name={item}
                                data={ta10Data?.outdoorArea?.[item] || { status: '', price: '', comments: '' }}
                                onChange={(newData) => setTa10Data((prev: any) => ({
                                  ...prev,
                                  outdoorArea: {
                                    ...(prev?.outdoorArea || {}),
                                    [item]: newData
                                  }
                                }))}
                              />
                            ))}
                          </div>
                        </details>

                        <button 
                          type="submit"
                          disabled={updatingTA10}
                          className={cn(
                            "w-full py-4 rounded-xl font-bold transition-all flex items-center justify-center gap-2 shadow-lg",
                            ta10SaveSuccess 
                              ? "bg-green-600 text-white shadow-green-200" 
                              : "bg-navy text-white hover:bg-navy-light shadow-navy/10"
                          )}
                        >
                          {updatingTA10 ? (
                            <Loader2 className="animate-spin" size={20} />
                          ) : ta10SaveSuccess ? (
                            <>
                              <CheckCircle2 size={20} />
                              Saved!
                            </>
                          ) : (
                            'Save TA10 Progress'
                          )}
                        </button>
                      </form>
                    )}
                    
                    <div className="space-y-3">
                      <h4 className="text-xs font-bold text-navy uppercase tracking-wider">Preparation Checklist</h4>
                      {prep.items.map((item, idx) => (
                        <div key={idx} className="flex gap-3 text-sm text-slate-600">
                          <div className="w-1.5 h-1.5 rounded-full bg-navy/20 mt-1.5 shrink-0" />
                          <p>{item}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                </details>
              ))}
            </div>
          </div>

          <div className="flex justify-center">
            <div className="w-full max-w-xl">
              {renderUploadSlot(
                'solicitor_forms', 
                'Upload Other Solicitor Forms', 
                'Any other forms from your solicitor',
                'Any extra forms provided by your legal team for your specific sale.'
              )}
            </div>
          </div>

          {profile.vaultProgress.forms && (
            <div className="bg-green-50 border border-green-100 p-6 rounded-2xl flex items-center gap-4">
              <div className="w-10 h-10 bg-green-500 text-white rounded-full flex items-center justify-center">
                <CheckCircle2 size={20} />
              </div>
              <p className="text-green-800 font-medium">Step 2 complete. The big forms are done. You're making great progress!</p>
            </div>
          )}
        </div>
      );

    case 'money':
      const currentYear = new Date().getFullYear();
      return (
        <div className="space-y-10">
          <div className="space-y-6">
            <h3 className="text-xs font-bold text-navy uppercase tracking-widest border-b border-slate-100 pb-2">Financial Enclosures</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {renderUploadSlot(
                'sc_accounts', 
                'Service Charge Accounts', 
                `Last 3 years of audited accounts (${currentYear-3}-${currentYear-1})`,
                'Summaries of building expenditure. Essential for verifying management financial health.'
              )}
              {renderUploadSlot(
                'sc_budget', 
                `${currentYear} Service Charge Budget`, 
                'The upcoming year\'s financial plan',
                'The breakdown of expected spending for the current year. Essential for buyer planning.'
              )}
              {renderUploadSlot(
                'ground_rent_receipt', 
                'Ground Rent Receipt', 
                'Proof of payment for the current period',
                'Proof that you are up to date with payments to the Freeholder.'
              )}
              <div className="space-y-4">
                {renderUploadSlot(
                  'reserve_fund_confirmation', 
                  'Reserve Fund', 
                  'Statement showing amount held for major works',
                  'The sinking fund held for big future repairs like roof work or lift replacements.'
                )}
                <form onSubmit={handleFinancialSubmit} className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-navy uppercase tracking-wider ml-1">Reserve Fund Amount</label>
                    <div className="relative">
                      <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 font-bold">£</span>
                      <input 
                        type="text"
                        value={financialData.reserveFundAmount}
                        onChange={(e) => setFinancialData({...financialData, reserveFundAmount: e.target.value})}
                        className="w-full pl-8 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-navy focus:border-transparent outline-none transition-all"
                        placeholder="e.g. 15,000"
                      />
                    </div>
                  </div>
                  <button 
                    type="submit"
                    disabled={updatingFinancial}
                    className="w-full py-3 bg-navy text-white rounded-xl font-bold text-sm hover:bg-navy-light transition-all flex items-center justify-center gap-2"
                  >
                    {updatingFinancial ? <Loader2 className="animate-spin" size={16} /> : 'Update Amount'}
                  </button>
                </form>
              </div>
            </div>
          </div>
          {profile.vaultProgress.money && (
            <div className="bg-green-50 border border-green-100 p-6 rounded-2xl flex items-center gap-4">
              <div className="w-10 h-10 bg-green-500 text-white rounded-full flex items-center justify-center">
                <CheckCircle2 size={20} />
              </div>
              <p className="text-green-800 font-medium">Step 3 complete. You’ve done your bit for the financials. Peace of mind achieved.</p>
            </div>
          )}
        </div>
      );

    case 'safety':
      return (
        <div className="space-y-10">
          <div className="space-y-6">
            <h3 className="text-xs font-bold text-navy uppercase tracking-widest border-b border-slate-100 pb-2">Safety Reports</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {renderUploadSlot(
                'fra', 
                'Fire Risk Assessment (FRA)', 
                'Current building fire safety report',
                'A safety report for shared areas. Now a critical requirement for most mortgage lenders.'
              )}
              {renderUploadSlot(
                'asbestos_survey', 
                'Communal Asbestos Survey', 
                'Report on communal area asbestos management',
                'A safety report confirming the building is safe from asbestos risks in shared areas.'
              )}
              {renderUploadSlot(
                'eicr', 
                'Communal Electrical (EICR)', 
                'Electrical safety certificate for common parts',
                'A certificate ensuring the shared electrical systems are safe and compliant.'
              )}
            </div>
          </div>

          <div className="space-y-6">
            <h3 className="text-xs font-bold text-navy uppercase tracking-widest border-b border-slate-100 pb-2">Legal Structure</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {renderUploadSlot(
                'insurance', 
                'Building Insurance Policy', 
                'Current schedule and summary',
                'Proof that the building is fully insured against fire, flood, and other major risks.'
              )}
              {renderUploadSlot(
                'bsa', 
                'Leaseholder Deed (BSA 2022)', 
                'Building Safety Act certificate',
                'A certificate determining if you are a qualifying leaseholder for cost protections.'
              )}
              {renderUploadSlot(
                'headlease', 
                'The Headlease', 
                'The overarching building contract',
                'The main contract between the Freeholder and the Management Company.'
              )}
              {renderUploadSlot(
                'management_articles', 
                'Articles & Share Cert', 
                'Management Company Articles of Association',
                'The governing rules for how your Management Company is run.'
              )}
              {renderUploadSlot(
                'transfer_fees', 
                'Notice of Transfer Fees', 
                'Managing Agent list of fees',
                'The fees charged by the agent to update records with the new owner\'s details.'
              )}
            </div>
          </div>

          {profile.vaultProgress.safety && (
            <div className="bg-green-50 border border-green-100 p-6 rounded-2xl flex items-center gap-4">
              <div className="w-10 h-10 bg-green-500 text-white rounded-full flex items-center justify-center">
                <CheckCircle2 size={20} />
              </div>
              <p className="text-green-800 font-medium">Step 4 complete. Safety first! Your pack is almost ready for the solicitor.</p>
            </div>
          )}
        </div>
      );

    default:
      return null;
  }
};
