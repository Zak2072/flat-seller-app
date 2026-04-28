import React from 'react';
import { NavLink, useLocation, useNavigate } from 'react-router-dom';
import { Home, Building2, BookOpen, LogOut, LogIn } from 'lucide-react';
import { cn } from '../lib/utils';
import { useAuth } from './FirebaseProvider';
import { auth } from '../firebase';
import { signOut } from 'firebase/auth';

export const Navbar: React.FC = () => {
  const { setCurrentPropertyId, user } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  const handlePropertiesClick = () => {
    setCurrentPropertyId(null);
  };

  const handleSignOut = async () => {
    try {
      await signOut(auth);
      navigate('/');
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  return (
    <nav className="bg-navy sticky top-0 z-[100] border-b border-white/10 shadow-lg">
      <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
        <div className="flex items-center gap-8">
          <NavLink 
            to="/" 
            className={({ isActive }) => cn(
              "flex items-center gap-2 font-bold transition-all hover:text-white",
              isActive ? "text-white" : "text-gold"
            )}
          >
            <Home size={18} />
            <span>Home</span>
          </NavLink>
          
          <NavLink 
            to="/properties" 
            onClick={handlePropertiesClick}
            className={({ isActive }) => cn(
              "flex items-center gap-2 font-bold transition-all hover:text-white",
              (isActive || (location.pathname.startsWith('/properties') && !isActive)) ? "text-white" : "text-gold"
            )}
          >
            <Building2 size={18} />
            <span>Properties</span>
          </NavLink>
        </div>
        
        <div className="flex items-center gap-6">
          <NavLink 
            to="/glossary" 
            className={({ isActive }) => cn(
              "flex items-center gap-2 text-xs font-bold uppercase tracking-widest transition-all hover:text-white",
              isActive ? "text-white" : "text-gold"
            )}
          >
            <BookOpen size={14} />
            Glossary
          </NavLink>
          
          {user && (
            <div className="h-8 w-px bg-white/10 mx-2" />
          )}
          
          {user && (
            <div className="relative group">
              <span className="text-[10px] text-slate-400 font-medium hidden md:block cursor-default py-2">
                Logged in as <span className="text-gold">{user.email}</span>
              </span>
              
              <div className="absolute right-0 top-full pt-2 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-[110]">
                <div className="bg-navy border border-white/10 rounded-xl shadow-2xl overflow-hidden min-w-[120px]">
                  <button
                    onClick={handleSignOut}
                    className="w-full flex items-center gap-2 px-4 py-3 text-xs font-bold text-white hover:text-gold transition-colors text-left"
                  >
                    <LogOut size={14} />
                    Log Out
                  </button>
                </div>
              </div>
            </div>
          )}

          {!user && (
            <button
              onClick={() => navigate('/auth')}
              className="flex items-center gap-2 px-6 py-2 bg-gold text-navy rounded-xl font-bold hover:bg-white transition-all active:scale-95 shadow-lg group"
            >
              <LogIn size={16} className="group-hover:rotate-12 transition-transform" />
              <span>Log In</span>
            </button>
          )}
        </div>
      </div>
    </nav>
  );
};
