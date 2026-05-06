import React, { useState } from 'react';
import { NavLink, useLocation, useNavigate } from 'react-router-dom';
import { ShieldCheck, Building2, BookOpen, LogOut, LogIn, Menu, X } from 'lucide-react';
import { cn } from '../lib/utils';
import { useAuth } from './FirebaseProvider';
import { auth } from '../firebase';
import { signOut } from 'firebase/auth';
import { motion, AnimatePresence } from 'motion/react';

export const Navbar: React.FC<{ onToggleSidebar?: () => void }> = ({ onToggleSidebar }) => {
  const { setCurrentPropertyId, user } = useAuth();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();

  React.useEffect(() => {
    const mainContainer = document.getElementById('main-scroll-container');
    if (isMenuOpen && mainContainer) {
      mainContainer.classList.add('overflow-hidden');
    } else if (mainContainer) {
      mainContainer.classList.remove('overflow-hidden');
    }
    return () => {
      if (mainContainer) mainContainer.classList.remove('overflow-hidden');
    };
  }, [isMenuOpen]);

  const handlePropertiesClick = () => {
    setCurrentPropertyId(null);
    setIsMenuOpen(false);
  };

  const handleSignOut = async () => {
    try {
      await signOut(auth);
      setIsMenuOpen(false);
      navigate('/');
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  const navLinks = [
    { to: "/properties", icon: Building2, label: "Properties", onClick: handlePropertiesClick },
    { to: "/glossary", icon: BookOpen, label: "Glossary", onClick: () => setIsMenuOpen(false) },
  ];

  return (
    <nav className="bg-navy sticky top-0 z-[100] border-b border-white/10 shadow-lg px-4 md:px-0">
      <div className="max-w-7xl mx-auto px-2 md:px-6 h-16 flex items-center justify-between">
        <div className="flex items-center gap-2">
          {/* Dashboard Sidebar Toggle (Desktop/Mobile contexts) */}
          {onToggleSidebar && location.pathname !== '/' && location.pathname !== '/properties' ? (
            <div className="md:hidden">
              <button 
                onClick={onToggleSidebar}
                className="p-2 text-gold hover:text-white hover:bg-white/5 rounded-lg transition-all"
                aria-label="Toggle Dashboard Sidebar"
              >
                <Menu size={28} />
              </button>
            </div>
          ) : (
            <div className="md:hidden">
              <button 
                onClick={() => setIsMenuOpen(!isMenuOpen)}
                className="p-2 text-gold hover:text-white hover:bg-white/5 rounded-lg transition-all"
                aria-label="Toggle Navigation Menu"
              >
                {isMenuOpen ? <X size={28} /> : <Menu size={28} />}
              </button>
            </div>
          )}
          
          <NavLink 
            to="/properties" 
            onClick={handlePropertiesClick}
            className="flex items-center gap-3 group mr-4"
          >
            <div className="w-10 h-10 bg-white/5 rounded-xl flex items-center justify-center border border-white/10 group-hover:border-gold/50 transition-all">
              <ShieldCheck className="text-gold" size={24} />
            </div>
            <div className="flex flex-col">
              <span className="text-lg font-serif font-bold text-white leading-tight tracking-tight">Prepped Seller</span>
              <span className="text-[9px] text-gold/80 font-bold uppercase tracking-[0.2em] leading-none">Property Vault</span>
            </div>
          </NavLink>

          <div className="hidden md:flex items-center gap-8">
            {navLinks.map((link) => (
              <NavLink 
                key={link.to}
                to={link.to} 
                onClick={link.onClick}
                className={({ isActive }) => cn(
                  "flex items-center gap-2 font-bold transition-all hover:text-white",
                  (isActive || (link.to === '/properties' && location.pathname.startsWith('/properties') && !isActive)) ? "text-white" : "text-gold"
                )}
              >
                <link.icon size={18} />
                <span>{link.label}</span>
              </NavLink>
            ))}
          </div>
        </div>

        <div className="flex items-center gap-3 md:gap-6">
          {user && (
            <div className="h-8 w-px bg-white/10 mx-2 hidden md:block" />
          )}
          
          {user && (
            <div className="relative group flex items-center">
              <span className="text-[10px] text-slate-400 font-medium hidden lg:block cursor-default py-2">
                Logged in as <span className="text-gold">{user.email}</span>
              </span>
              
              <div className="hidden md:block relative ml-4">
                <button
                  onClick={handleSignOut}
                  className="p-2 text-gold hover:text-white transition-colors"
                  title="Log Out"
                >
                  <LogOut size={18} />
                </button>
              </div>
            </div>
          )}

          {!user && (
            <button
              onClick={() => navigate('/auth')}
              className="flex items-center gap-2 px-4 md:px-6 py-2 bg-gold text-navy rounded-xl font-bold hover:bg-white transition-all active:scale-95 shadow-lg group text-xs md:text-sm"
            >
              <LogIn size={16} className="group-hover:rotate-12 transition-transform" />
              <span>Log In</span>
            </button>
          )}
        </div>
      </div>

      {/* Mobile Menu Overlay */}
      <AnimatePresence>
        {isMenuOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsMenuOpen(false)}
              className="fixed inset-0 bg-navy/60 backdrop-blur-sm z-[90] md:hidden"
            />
            <motion.div
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="fixed top-0 left-0 bottom-0 w-[280px] bg-navy border-r border-white/10 z-[101] md:hidden p-6 flex flex-col pt-20"
            >
              <div className="space-y-6">
                {navLinks.map((link) => (
                  <NavLink 
                    key={link.to}
                    to={link.to} 
                    onClick={link.onClick}
                    className={({ isActive }) => cn(
                      "flex items-center gap-4 text-lg font-bold transition-all",
                      (isActive || (link.to === '/properties' && location.pathname.startsWith('/properties') && !isActive)) ? "text-white" : "text-gold"
                    )}
                  >
                    <link.icon size={24} />
                    <span>{link.label}</span>
                  </NavLink>
                ))}
              </div>
              
              {user && (
                <div className="mt-auto border-t border-white/10 pt-6">
                  <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mb-4">Account</p>
                  <p className="text-xs text-white truncate mb-4">{user.email}</p>
                  <button
                    onClick={handleSignOut}
                    className="w-full flex items-center gap-3 py-4 px-4 bg-red-500/10 hover:bg-red-500/20 text-red-400 font-bold text-sm rounded-xl transition-colors"
                  >
                    <LogOut size={18} />
                    Log Out
                  </button>
                </div>
              )}

              {!user && (
                <div className="mt-auto border-t border-white/10 pt-6">
                  <button
                    onClick={() => {
                      setIsMenuOpen(false);
                      navigate('/auth');
                    }}
                    className="w-full flex items-center justify-center gap-3 py-4 px-4 bg-gold text-navy font-bold text-base rounded-xl transition-all shadow-lg active:scale-95"
                  >
                    <LogIn size={20} />
                    Log In
                  </button>
                </div>
              )}
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </nav>
  );
};
