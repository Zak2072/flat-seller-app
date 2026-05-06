import { 
  LayoutDashboard, 
  ShieldCheck, 
  CreditCard, 
  Settings, 
  HelpCircle, 
  LogOut, 
  Send,
  Users,
  FileText,
  BadgePoundSterling,
  ShieldAlert,
  CheckCircle2,
  ChevronLeft,
  MapPin
} from 'lucide-react';
import { cn } from '../lib/utils';
import { auth } from '../firebase';
import { signOut } from 'firebase/auth';
import type { PropertyProfile, VaultSectionId } from '../types';

interface SidebarProps {
  activeSection: string;
  onSectionChange: (section: string) => void;
  profile: PropertyProfile | null;
  onBackToProperties: () => void;
  isOpen: boolean;
  onClose: () => void;
}

export function Sidebar({ activeSection, onSectionChange, profile, onBackToProperties, isOpen, onClose }: SidebarProps) {
  const handleSignOut = async () => {
    try {
      await signOut(auth);
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  const steps: { id: VaultSectionId | 'dashboard'; label: string; icon: any }[] = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'team', label: 'Step 1: Stakeholders', icon: Users },
    { id: 'forms', label: 'Step 2: The Forms', icon: FileText },
    { id: 'money', label: 'Step 3: The Money', icon: BadgePoundSterling },
    { id: 'safety', label: 'Step 4: The Safety', icon: ShieldAlert },
    { id: 'handoff', label: 'Step 5: The Handoff', icon: Send },
    { id: 'postSale', label: 'Step 6: Post-Sale', icon: CheckCircle2 },
  ];

  const secondaryItems = [
    { id: 'payment', label: 'Payment', icon: CreditCard },
    { id: 'settings', label: 'Settings', icon: Settings },
  ];

  const handleNavClick = (id: string) => {
    onSectionChange(id);
    onClose();
  };

  return (
    <>
      {/* Mobile Overlay */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-navy/60 backdrop-blur-sm z-[90] md:hidden" 
          onClick={onClose}
        />
      )}
      
      <div className={cn(
        "w-64 bg-navy h-[calc(100vh-4rem)] fixed left-0 top-16 text-white flex flex-col p-6 border-r border-navy-light shadow-2xl z-[100] overflow-y-auto transition-transform duration-300 ease-in-out",
        isOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"
      )}>
        <div className="mb-8 flex items-center gap-3">
          <div className="w-8 h-8 bg-white rounded-lg flex items-center justify-center shrink-0">
            <ShieldCheck className="text-navy" size={20} />
          </div>
          <h1 className="text-xl font-serif font-bold tracking-tight uppercase">Prepped Seller</h1>
        </div>

        {profile && (
          <>
            <button
              onClick={() => {
                onBackToProperties();
                onClose();
              }}
              className="mb-8 flex items-center gap-2 text-xs font-bold text-slate-400 hover:text-gold transition-colors group"
            >
              <ChevronLeft size={14} className="group-hover:-translate-x-1 transition-transform" />
              Back to Your Properties
            </button>

            <div className="mb-8 p-4 bg-white/5 rounded-2xl border border-white/10">
              <div className="flex items-center gap-2 text-gold font-bold text-[10px] uppercase tracking-widest mb-2">
                <MapPin size={12} />
                Current Property
              </div>
              <p className="text-xs font-medium text-white line-clamp-2 leading-relaxed">
                {profile.address}
              </p>
            </div>
          </>
        )}

        {!profile && (
          <div className="mb-8 p-4 bg-white/5 rounded-2xl border border-white/10">
             <p className="text-xs font-medium text-slate-400 italic">No property selected</p>
          </div>
        )}

        <nav className="flex-1 space-y-2">
          <p className="text-[10px] uppercase tracking-[0.2em] text-slate-400 font-semibold mb-4 px-3">
            Navigation
          </p>
          <button
            onClick={() => handleNavClick('dashboard')}
            className={cn(
              "w-full flex items-center justify-between px-4 py-3 rounded-lg transition-all duration-200 group",
              activeSection === 'dashboard'
                ? "bg-white/10 text-white border border-white/20 shadow-lg"
                : "text-slate-400 hover:text-white hover:bg-white/5"
            )}
          >
            <div className="flex items-center gap-3">
              <LayoutDashboard size={20} className={cn(
                "transition-colors",
                activeSection === 'dashboard' ? "text-white" : "text-slate-500 group-hover:text-white"
              )} />
              <span className="font-medium text-sm">Dashboard</span>
            </div>
          </button>

          {profile && (
            <>
              <p className="text-[10px] uppercase tracking-[0.2em] text-slate-400 font-semibold mt-8 mb-4 px-3">
                6-Step Pathway
              </p>
              {steps.filter(s => s.id !== 'dashboard').map((item) => {
                const isCompleted = item.id !== 'dashboard' && profile.vaultProgress[item.id as VaultSectionId];
                const isActive = activeSection === item.id;

                return (
                  <button
                    key={item.id}
                    onClick={() => handleNavClick(item.id)}
                    className={cn(
                      "w-full flex items-center justify-between px-4 py-3 rounded-lg transition-all duration-200 group",
                      isActive
                        ? "bg-white/10 text-white border border-white/20 shadow-lg"
                        : isCompleted 
                          ? "text-gold hover:bg-white/5"
                          : "text-slate-400 hover:text-white hover:bg-white/5"
                    )}
                  >
                    <div className="flex items-center gap-3">
                      <item.icon size={20} className={cn(
                        "transition-colors",
                        isActive ? "text-white" : isCompleted ? "text-gold" : "text-slate-500 group-hover:text-white"
                      )} />
                      <span className="font-medium text-sm">{item.label}</span>
                    </div>
                    {isCompleted && <CheckCircle2 size={16} className="text-green-400" />}
                  </button>
                );
              })}
            </>
          )}

          <div className={cn("pt-4", profile && "pt-8")}>
            <p className="text-[10px] uppercase tracking-[0.2em] text-slate-400 font-semibold mb-4 px-3">
              Account
            </p>
            {secondaryItems.map((item) => {
              // Only show payment if a property is selected
              if (item.id === 'payment' && !profile) return null;
              
              return (
                <button
                  key={item.id}
                  onClick={() => handleNavClick(item.id)}
                  className={cn(
                    "w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200 text-slate-400 hover:text-white hover:bg-white/5",
                    activeSection === item.id && "bg-white/10 text-white border border-white/20 shadow-lg"
                  )}
                >
                  <item.icon size={20} className={cn(
                    "transition-colors",
                    activeSection === item.id ? "text-white" : "text-slate-500 group-hover:text-white"
                  )} />
                  <span className="font-medium text-sm">{item.label}</span>
                </button>
              );
            })}
          </div>
        </nav>

        <div className="mt-auto pt-6 border-t border-white/10">
          <button 
            onClick={handleSignOut}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-lg text-slate-400 hover:text-red-400 transition-colors"
          >
            <LogOut size={20} />
            <span className="font-medium">Sign Out</span>
          </button>
        </div>
      </div>
    </>
  );
}
