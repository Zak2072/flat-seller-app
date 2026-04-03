import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Plus, 
  Home, 
  MoreVertical, 
  Trash2, 
  CheckCircle2, 
  ChevronRight,
  Building2,
  MapPin,
  Clock,
  Archive
} from 'lucide-react';
import { useAuth } from './FirebaseProvider';
import { cn } from '../lib/utils';
import type { PropertyProfile } from '../types';

interface PropertiesListProps {
  onPropertySelected: (id: string) => void;
}

export const PropertiesList: React.FC<PropertiesListProps> = ({ onPropertySelected }) => {
  const { properties, addProperty, deleteProperty, markAsSold, setCurrentPropertyId } = useAuth();
  const [isAdding, setIsAdding] = useState(false);
  const [newAddress, setNewAddress] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [activeMenu, setActiveMenu] = useState<string | null>(null);

  const handleAddProperty = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newAddress.trim() || isSubmitting) return;

    setIsSubmitting(true);
    try {
      const id = await addProperty(newAddress.trim());
      setNewAddress('');
      setIsAdding(false);
      onPropertySelected(id);
    } catch (error) {
      console.error('Failed to add property:', error);
      alert('Could not add property. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 p-6 md:p-12">
      <div className="max-w-5xl mx-auto space-y-12">
        <header className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <h1 className="text-4xl font-serif font-bold text-navy tracking-tight">Your Properties</h1>
            <p className="text-slate-500 mt-2">Select a property to manage its vault or add a new one.</p>
          </div>
          <button
            onClick={() => setIsAdding(true)}
            className="flex items-center justify-center gap-2 px-6 py-3 bg-navy text-white rounded-xl font-bold hover:bg-navy-light transition-all shadow-lg active:scale-95"
          >
            <Plus size={20} />
            Add Property
          </button>
        </header>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <AnimatePresence mode="popLayout">
            {properties.map((property) => (
              <motion.div
                key={property.id}
                layout
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                className={cn(
                  "group relative bg-white border border-slate-200 rounded-3xl p-6 shadow-sm hover:shadow-xl transition-all cursor-pointer",
                  property.status === 'Sold' && "opacity-75 grayscale-[0.5]"
                )}
                onClick={() => setCurrentPropertyId(property.id)}
              >
                <div className="flex justify-between items-start mb-4">
                  <div className={cn(
                    "w-12 h-12 rounded-2xl flex items-center justify-center transition-colors",
                    property.status === 'Active' ? "bg-navy text-white" : "bg-slate-100 text-slate-400"
                  )}>
                    <Home size={24} />
                  </div>
                  <div className="relative">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setActiveMenu(activeMenu === property.id ? null : property.id);
                      }}
                      className="p-2 text-slate-400 hover:text-navy hover:bg-slate-50 rounded-lg transition-all"
                    >
                      <MoreVertical size={20} />
                    </button>
                    <AnimatePresence>
                      {activeMenu === property.id && (
                        <>
                          <div 
                            className="fixed inset-0 z-10" 
                            onClick={(e) => {
                              e.stopPropagation();
                              setActiveMenu(null);
                            }} 
                          />
                          <motion.div
                            initial={{ opacity: 0, y: 10, scale: 0.95 }}
                            animate={{ opacity: 1, y: 0, scale: 1 }}
                            exit={{ opacity: 0, y: 10, scale: 0.95 }}
                            className="absolute right-0 top-10 w-48 bg-white border border-slate-200 rounded-2xl shadow-2xl z-20 overflow-hidden"
                          >
                            {property.status === 'Active' && (
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  markAsSold(property.id);
                                  setActiveMenu(null);
                                }}
                                className="w-full flex items-center gap-3 px-4 py-3 text-sm text-slate-600 hover:bg-slate-50 hover:text-navy transition-all"
                              >
                                <Archive size={16} />
                                Mark as Sold
                              </button>
                            )}
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                if (confirm('Are you sure you want to delete this property and all its files? This cannot be undone.')) {
                                  deleteProperty(property.id);
                                }
                                setActiveMenu(null);
                              }}
                              className="w-full flex items-center gap-3 px-4 py-3 text-sm text-red-600 hover:bg-red-50 transition-all"
                            >
                              <Trash2 size={16} />
                              Delete Property
                            </button>
                          </motion.div>
                        </>
                      )}
                    </AnimatePresence>
                  </div>
                </div>

                <div className="space-y-4">
                  <div>
                    <h3 className="text-xl font-serif font-bold text-navy line-clamp-2 leading-tight">
                      {property.address}
                    </h3>
                    <div className="flex items-center gap-2 mt-2 text-xs font-bold uppercase tracking-widest">
                      <span className={cn(
                        "px-2 py-0.5 rounded",
                        property.status === 'Active' ? "bg-green-100 text-green-700" : "bg-slate-100 text-slate-500"
                      )}>
                        {property.status}
                      </span>
                    </div>
                  </div>

                  <div className="pt-4 border-t border-slate-100 flex items-center justify-between">
                    <div className="flex items-center gap-4 text-slate-400">
                      <div className="flex items-center gap-1">
                        <Clock size={14} />
                        <span className="text-[10px] font-medium">
                          {new Date(property.createdAt).toLocaleDateString()}
                        </span>
                      </div>
                    </div>
                    <ChevronRight size={18} className="text-gold group-hover:translate-x-1 transition-transform" />
                  </div>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>

          {properties.length === 0 && !isAdding && (
            <div className="col-span-full py-20 text-center space-y-6">
              <div className="w-20 h-20 bg-slate-100 text-slate-300 rounded-full flex items-center justify-center mx-auto">
                <Building2 size={40} />
              </div>
              <div className="max-w-xs mx-auto">
                <h3 className="text-xl font-serif font-bold text-navy">No properties yet</h3>
                <p className="text-slate-500 text-sm mt-2">Add your first property to start organising your seller vault.</p>
              </div>
              <button
                onClick={() => setIsAdding(true)}
                className="px-8 py-3 bg-navy text-white rounded-xl font-bold hover:bg-navy-light transition-all shadow-lg"
              >
                Add Your First Property
              </button>
            </div>
          )}
        </div>
      </div>

      <AnimatePresence>
        {isAdding && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-6">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsAdding(false)}
              className="absolute inset-0 bg-navy/40 backdrop-blur-sm"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="relative w-full max-w-lg bg-white rounded-3xl shadow-2xl overflow-hidden"
            >
              <div className="p-8 space-y-6">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-gold/10 text-gold rounded-2xl flex items-center justify-center">
                    <MapPin size={24} />
                  </div>
                  <div>
                    <h2 className="text-2xl font-serif font-bold text-navy">Add New Property</h2>
                    <p className="text-sm text-slate-500">Enter the address to start setting up your vault.</p>
                  </div>
                </div>

                <form onSubmit={handleAddProperty} className="space-y-6">
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-navy uppercase tracking-wider ml-1">Property Address</label>
                    <input
                      autoFocus
                      type="text"
                      required
                      value={newAddress}
                      onChange={(e) => setNewAddress(e.target.value)}
                      placeholder="e.g. 42 Riverside Apartments, London, SE1"
                      className="w-full px-4 py-4 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-navy focus:border-transparent outline-none transition-all text-lg"
                    />
                  </div>

                  <div className="flex gap-3">
                    <button
                      type="button"
                      onClick={() => setIsAdding(false)}
                      className="flex-1 py-4 text-slate-500 font-bold hover:bg-slate-50 rounded-2xl transition-all"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={!newAddress.trim() || isSubmitting}
                      className="flex-[2] py-4 bg-navy text-white rounded-2xl font-bold hover:bg-navy-light transition-all shadow-lg disabled:opacity-50 flex items-center justify-center gap-2"
                    >
                      {isSubmitting ? (
                        <>
                          <Clock className="animate-spin" size={20} />
                          Setting up your vault...
                        </>
                      ) : (
                        <>
                          <Plus size={20} />
                          Add Property
                        </>
                      )}
                    </button>
                  </div>
                </form>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};
