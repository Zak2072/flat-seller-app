import React from 'react';
import { motion } from 'motion/react';
import { 
  ShieldCheck, 
  CreditCard, 
  CheckCircle2, 
  Lock, 
  Zap, 
  FileCheck, 
  Clock, 
  ArrowRight 
} from 'lucide-react';
import { calculatePrice } from '../lib/pricing';
import { cn } from '../lib/utils';
import type { PropertyProfile } from '../types';

interface PaymentGateProps {
  property: PropertyProfile;
  paidPropertiesCount: number;
  onProceed: () => void;
}

export const PaymentGate: React.FC<PaymentGateProps> = ({ 
  property, 
  paidPropertiesCount, 
  onProceed 
}) => {
  const { basePrice, vatAmount, totalPrice } = calculatePrice(paidPropertiesCount);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="max-w-4xl mx-auto py-12 px-6"
    >
      <div className="text-center mb-12">
        <div className="inline-flex items-center justify-center p-3 bg-gold/10 text-gold rounded-2xl mb-6">
          <Lock size={32} />
        </div>
        <h2 className="text-4xl font-serif font-bold text-navy mb-4">Secure Your Property Vault</h2>
        <p className="text-slate-500 text-lg max-w-2xl mx-auto">
          To begin prepping your Material Information pack for <span className="text-navy font-bold">{property.address}</span>, 
          a one-time verification and hosting fee is required.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-start">
        {/* Benefits Section */}
        <div className="space-y-8">
          <h3 className="text-xl font-serif font-semibold text-navy border-b border-slate-200 pb-4">
            Why unlock your vault?
          </h3>
          
          <div className="space-y-6">
            <div className="flex gap-4">
              <div className="mt-1 p-2 bg-navy/5 text-navy rounded-lg shrink-0">
                <FileCheck size={20} />
              </div>
              <div>
                <h4 className="font-bold text-navy mb-1">Solicitor-Approved Compliance</h4>
                <p className="text-sm text-slate-500">
                  Our AI-driven verification ensures your documents meet the latest Law Society and National Trading Standards requirements.
                </p>
              </div>
            </div>

            <div className="flex gap-4">
              <div className="mt-1 p-2 bg-navy/5 text-navy rounded-lg shrink-0">
                <Clock size={20} />
              </div>
              <div>
                <h4 className="font-bold text-navy mb-1">Accelerated Sale Process</h4>
                <p className="text-sm text-slate-500">
                  Properties with a completed vault are 40% more likely to reach exchange within 12 weeks by reducing enquiries.
                </p>
              </div>
            </div>

            <div className="flex gap-4">
              <div className="mt-1 p-2 bg-navy/5 text-navy rounded-lg shrink-0">
                <Zap size={20} />
              </div>
              <div>
                <h4 className="font-bold text-navy mb-1">Instant Digital Sharing</h4>
                <p className="text-sm text-slate-500">
                  Securely share your entire pack with estate agents and buyers at the touch of a button.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Pricing Card */}
        <div className="bg-white rounded-3xl border border-slate-200 shadow-2xl overflow-hidden">
          <div className="bg-navy p-8 text-white">
            <div className="flex justify-between items-center mb-2">
              <span className="text-slate-300 text-sm font-bold uppercase tracking-widest">
                {paidPropertiesCount === 0 ? 'First Property' : 'Loyalty Rate'}
              </span>
              <ShieldCheck size={24} className="text-gold" />
            </div>
            <div className="flex items-baseline gap-1">
              <span className="text-5xl font-bold">£{totalPrice.toFixed(2)}</span>
              <span className="text-slate-400 text-sm">inc. VAT</span>
            </div>
          </div>

          <div className="p-8 space-y-6">
            <div className="space-y-3">
              <div className="flex justify-between text-sm">
                <span className="text-slate-500">Base Verification Fee</span>
                <span className="font-bold text-navy">£{basePrice.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-slate-500">VAT (20%)</span>
                <span className="font-bold text-navy">£{vatAmount.toFixed(2)}</span>
              </div>
              <div className="pt-3 border-t border-slate-100 flex justify-between items-center">
                <span className="font-bold text-navy">Total to Pay</span>
                <span className="text-2xl font-bold text-navy">£{totalPrice.toFixed(2)}</span>
              </div>
            </div>

            <button
              onClick={onProceed}
              className="w-full py-5 bg-navy text-white rounded-2xl font-bold text-lg hover:bg-navy-light transition-all flex items-center justify-center gap-3 shadow-lg active:scale-95"
            >
              <CreditCard size={20} />
              Proceed to Payment
              <ArrowRight size={20} />
            </button>

            <div className="pt-4 text-center">
              <p className="text-xs text-slate-400 flex items-center justify-center gap-2">
                <Lock size={12} />
                Mock payment for preview environment. No card details required.
              </p>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
};
