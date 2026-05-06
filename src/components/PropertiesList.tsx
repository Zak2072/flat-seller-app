import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Link } from 'react-router-dom';
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
  Archive,
  Search,
  Zap,
  Hash,
  HelpCircle,
  ExternalLink,
  Settings
} from 'lucide-react';
import { useAuth } from './FirebaseProvider';
import { cn } from '../lib/utils';
import type { PropertyProfile } from '../types';
import { searchProperties, HomedataProperty } from '../services/homedataService';
import { DeleteConfirmationModal } from './DeleteConfirmationModal';

interface PropertiesListProps {
  onPropertySelected: (id: string) => void;
}

export const PropertiesList: React.FC<PropertiesListProps> = ({ onPropertySelected }) => {
  const { properties, addProperty, deleteProperty, markAsSold, setCurrentPropertyId } = useAuth();
  const [isAdding, setIsAdding] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [activeMenu, setActiveMenu] = useState<string | null>(null);
  const [activeTooltip, setActiveTooltip] = useState<string | null>(null);
  
  const [propertyToDelete, setPropertyToDelete] = useState<PropertyProfile | null>(null);
  
  // Manual form state
  const [manualAddress, setManualAddress] = useState({
    line1: '',
    line2: '',
    town: '',
    postcode: '',
    uprn: ''
  });

  /* 
  const [newAddress, setNewAddress] = useState('');
  const [searchResults, setSearchResults] = useState<HomedataProperty[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [searchError, setSearchError] = useState<any | null>(null);
  const [hasSearched, setHasSearched] = useState(false);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newAddress.trim() || isSearching) return;

    setIsSearching(true);
    setHasSearched(false);
    setSearchError(null);
    try {
      const results = await searchProperties(newAddress.trim());
      setSearchResults(results);
      setHasSearched(true);
    } catch (error: any) {
      console.error('Failed to search properties:', error);
      setSearchError(error);
    } finally {
      setIsSearching(false);
    }
  };

  const handleSelectProperty = async (property: HomedataProperty) => {
    if (isSubmitting) return;

    setIsSubmitting(true);
    try {
      const id = await addProperty(property.address, {
        uprn: property.uprn,
        epc_rating: property.epc_rating,
        total_floor_area: property.total_floor_area,
        property_metadata: property.raw
      });
      setNewAddress('');
      setSearchResults([]);
      setIsAdding(false);
      onPropertySelected(id);
    } catch (error) {
      console.error('Failed to add property:', error);
      alert('Could not add property. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleAddManual = async () => {
    if (!newAddress.trim() || isSubmitting) return;

    setIsSubmitting(true);
    try {
      const id = await addProperty(newAddress.trim());
      setNewAddress('');
      setSearchResults([]);
      setIsAdding(false);
      onPropertySelected(id);
    } catch (error) {
      console.error('Failed to add property:', error);
      alert('Could not add property. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };
  */

  const handleManualSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!manualAddress.line1.trim() || !manualAddress.town.trim() || !manualAddress.postcode.trim() || isSubmitting) return;

    setIsSubmitting(true);
    try {
      const fullAddress = [
        manualAddress.line1.trim(),
        manualAddress.line2.trim(),
        manualAddress.town.trim(),
        manualAddress.postcode.trim()
      ].filter(Boolean).join(', ');

      const id = await addProperty(fullAddress, {
        addressLine1: manualAddress.line1.trim(),
        addressLine2: manualAddress.line2.trim(),
        town: manualAddress.town.trim(),
        postcode: manualAddress.postcode.trim(),
        uprn: manualAddress.uprn.trim() || 'Manual Entry',
        epc_rating: 'N/A',
        total_floor_area: 0
      });
      
      setManualAddress({ line1: '', line2: '', town: '', postcode: '', uprn: '' });
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
    <div className="min-h-screen bg-slate-50 p-4 sm:p-6 md:p-12">
      <div className="max-w-5xl mx-auto space-y-8 md:space-y-12">
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
                                setPropertyToDelete(property);
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
                    <div className="flex flex-wrap items-center gap-2 mt-2">
                      <span className={cn(
                        "px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-widest",
                        property.status === 'Active' ? "bg-green-100 text-green-700" : "bg-slate-100 text-slate-500"
                      )}>
                        {property.status}
                      </span>
                      {property.uprn && (
                        <span className="flex items-center gap-1 px-2 py-0.5 bg-slate-100 text-slate-500 rounded text-[10px] font-bold uppercase tracking-widest break-all">
                          <Hash size={10} className="text-gold flex-shrink-0" />
                          {property.uprn}
                        </span>
                      )}
                      {property.epc_rating && (
                        <span className="flex items-center gap-1 px-2 py-0.5 bg-slate-100 text-slate-500 rounded text-[10px] font-bold uppercase tracking-widest">
                          <Zap size={10} className="text-gold" />
                          EPC: {property.epc_rating}
                        </span>
                      )}
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
                    <p className="text-sm text-slate-500">Enter the address details to set up your vault.</p>
                  </div>
                </div>

                <form onSubmit={handleManualSubmit} className="space-y-4">
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-navy uppercase tracking-wider ml-1">Address Line 1</label>
                    <input
                      autoFocus
                      type="text"
                      required
                      value={manualAddress.line1}
                      onChange={(e) => setManualAddress(prev => ({ ...prev, line1: e.target.value }))}
                      placeholder="e.g. 42 Riverside Apartments"
                      className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-navy focus:border-transparent outline-none transition-all"
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-xs font-bold text-navy uppercase tracking-wider ml-1">Address Line 2 (Optional)</label>
                    <input
                      type="text"
                      value={manualAddress.line2}
                      onChange={(e) => setManualAddress(prev => ({ ...prev, line2: e.target.value }))}
                      placeholder="e.g. Riverside Way"
                      className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-navy focus:border-transparent outline-none transition-all"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="text-xs font-bold text-navy uppercase tracking-wider ml-1">Town/City</label>
                      <input
                        type="text"
                        required
                        value={manualAddress.town}
                        onChange={(e) => setManualAddress(prev => ({ ...prev, town: e.target.value }))}
                        placeholder="London"
                        className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-navy focus:border-transparent outline-none transition-all"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-xs font-bold text-navy uppercase tracking-wider ml-1">Postcode</label>
                      <input
                        type="text"
                        required
                        value={manualAddress.postcode}
                        onChange={(e) => setManualAddress(prev => ({ ...prev, postcode: e.target.value }))}
                        placeholder="SE1 7PB"
                        className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-navy focus:border-transparent outline-none transition-all"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center gap-2 ml-1">
                      <label className="text-xs font-bold text-navy uppercase tracking-wider">UPRN</label>
                      <div className="relative">
                        <button 
                          type="button"
                          onClick={() => setActiveTooltip(activeTooltip === 'uprn' ? null : 'uprn')}
                          className="text-gold hover:text-navy transition-colors"
                        >
                          <HelpCircle size={14} />
                        </button>
                        <AnimatePresence>
                          {activeTooltip === 'uprn' && (
                            <motion.div 
                              initial={{ opacity: 0, y: 5 }}
                              animate={{ opacity: 1, y: 0 }}
                              exit={{ opacity: 0, y: 5 }}
                              className="absolute z-50 left-0 top-6 w-64 bg-navy text-white p-4 rounded-xl text-xs shadow-2xl border border-gold/20"
                            >
                              <p className="leading-relaxed mb-2">The Unique Property Reference Number. A digital fingerprint for your property.</p>
                              <Link 
                                to="/glossary#uprn" 
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
                      value={manualAddress.uprn}
                      onChange={(e) => setManualAddress(prev => ({ ...prev, uprn: e.target.value }))}
                      placeholder="e.g. 100023332211"
                      className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-navy focus:border-transparent outline-none transition-all"
                    />
                    <p className="text-[10px] text-slate-400 ml-1">
                      Find your UPRN at{' '}
                      <a 
                        href="https://www.findmyaddress.co.uk/search" 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="text-gold hover:underline font-bold"
                      >
                        FindMyAddress
                      </a>
                    </p>
                  </div>

                  <div className="flex gap-3 pt-4">
                    <button
                      type="button"
                      onClick={() => setIsAdding(false)}
                      className="flex-1 py-4 text-slate-500 font-bold hover:bg-slate-50 rounded-2xl transition-all"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={isSubmitting}
                      className="flex-[2] py-4 bg-navy text-white rounded-2xl font-bold hover:bg-navy-light transition-all shadow-lg disabled:opacity-50 flex items-center justify-center gap-2"
                    >
                      {isSubmitting ? <Clock className="animate-spin" size={20} /> : <Plus size={20} />}
                      Add Property to Vault
                    </button>
                  </div>
                </form>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
      <DeleteConfirmationModal
        isOpen={!!propertyToDelete}
        onClose={() => setPropertyToDelete(null)}
        onConfirm={async () => {
          if (propertyToDelete) {
            await deleteProperty(propertyToDelete.id);
          }
        }}
        title="Delete Property"
        description={`This will permanently remove all documents and data for ${propertyToDelete?.address}. This action cannot be undone.`}
        confirmText="Permanently Delete"
        requireDoubleConfirm={true}
        doubleConfirmPhrase="DELETE"
      />
    </div>
  );
};
