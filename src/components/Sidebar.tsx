import { LayoutDashboard, ShieldCheck, CreditCard, Settings, HelpCircle, LogOut, Send } from 'lucide-react';
import { cn } from '../lib/utils';
import { auth } from '../firebase';
import { signOut } from 'firebase/auth';

interface SidebarProps {
  activeSection: string;
  onSectionChange: (section: string) => void;
}

export function Sidebar({ activeSection, onSectionChange }: SidebarProps) {
  const handleSignOut = async () => {
    try {
      await signOut(auth);
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };
  const menuItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'vault', label: 'Document Vault', icon: ShieldCheck },
    { id: 'payment', label: 'Payment', icon: CreditCard },
    { id: 'handoff', label: 'Solicitor Handoff', icon: Send },
  ];

  const secondaryItems = [
    { id: 'settings', label: 'Settings', icon: Settings },
    { id: 'help', label: 'Help & Support', icon: HelpCircle },
  ];

  return (
    <div className="w-64 bg-navy h-screen fixed left-0 top-0 text-white flex flex-col p-6 border-r border-navy-light shadow-2xl z-50">
      <div className="mb-12 flex items-center gap-3">
        <div className="w-10 h-10 bg-white rounded-lg flex items-center justify-center">
          <ShieldCheck className="text-navy" size={24} />
        </div>
        <h1 className="text-2xl font-serif font-bold tracking-tight">VAULT</h1>
      </div>

      <nav className="flex-1 space-y-2">
        <p className="text-[10px] uppercase tracking-[0.2em] text-slate-400 font-semibold mb-4 px-3">
          Main Menu
        </p>
        {menuItems.map((item) => (
          <button
            key={item.id}
            onClick={() => onSectionChange(item.id)}
            className={cn(
              "w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200 group",
              activeSection === item.id
                ? "bg-white/10 text-white border border-white/20 shadow-lg"
                : "text-slate-400 hover:text-white hover:bg-white/5"
            )}
          >
            <item.icon size={20} className={cn(
              "transition-colors",
              activeSection === item.id ? "text-white" : "text-slate-500 group-hover:text-white"
            )} />
            <span className="font-medium">{item.label}</span>
          </button>
        ))}

        <div className="pt-8">
          <p className="text-[10px] uppercase tracking-[0.2em] text-slate-400 font-semibold mb-4 px-3">
            Account
          </p>
          {secondaryItems.map((item) => (
            <button
              key={item.id}
              onClick={() => onSectionChange(item.id)}
              className={cn(
                "w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200 text-slate-400 hover:text-white hover:bg-white/5"
              )}
            >
              <item.icon size={20} className="text-slate-500" />
              <span className="font-medium">{item.label}</span>
            </button>
          ))}
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
  );
}
