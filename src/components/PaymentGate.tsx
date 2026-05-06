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

const PRICE_ID_MAIN = 'price_1TRZAWPhsw8zx7itaZtcYpZg';
const PRICE_ID_UPSELL = 'price_1TRZAtPhsw8zx7it8xCrKgxP';

interface PaymentGateProps {
  property: PropertyProfile;
  userId: string;
  paidPropertiesCount: number;
}

export const PaymentGate: React.FC<PaymentGateProps> = ({ 
  property, 
  userId,
  paidPropertiesCount
}) => {
  const [selectedProductId, setSelectedProductId] = React.useState(
    paidPropertiesCount === 0 ? PRICE_ID_MAIN : PRICE_ID_UPSELL
  );
  const [isRedirecting, setIsRedirecting] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [checkoutUrl, setCheckoutUrl] = React.useState<string | null>(null);

  const currentPrice = selectedProductId === PRICE_ID_MAIN ? 50 : 25;
  const vatAmount = currentPrice * 0.20;
  const totalPrice = currentPrice + vatAmount;

  React.useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      if (event.data?.type === 'PAYMENT_SUCCESS') {
        console.log('Payment complete signal received in PaymentGate');
        // Add a slight delay to ensure Firestore has finished the write
        // before we reload the data
        setTimeout(() => {
          window.location.reload();
        }, 1500);
      }
    };

    const handleFocus = () => {
      // Aggressively re-check status when user returns to tab
      console.log('Window focused, reloading to ensure state is synced...');
      // By checking a flag or just reloading, we ensure the latest Firestore data is fetched.
      // If a payment was just made in another tab, this guarantees the change is picked up.
      window.location.reload();
    };

    window.addEventListener('message', handleMessage);
    window.addEventListener('focus', handleFocus);
    return () => {
      window.removeEventListener('message', handleMessage);
      window.removeEventListener('focus', handleFocus);
    };
  }, []);

  const handleCheckout = async () => {
    try {
      setIsRedirecting(true);
      setError(null);
      setCheckoutUrl(null);
      
      const response = await fetch('/api/create-checkout-session', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId: userId,
          priceId: selectedProductId,
          propertyId: property.id
        }),
      });

      if (!response.ok) {
        let errorMessage = 'Failed to create checkout session';
        try {
          const errorData = await response.json();
          errorMessage = errorData.error || errorMessage;
        } catch (e) {
          // Fallback if response is not JSON
          const text = await response.text();
          errorMessage = text || errorMessage;
        }
        throw new Error(errorMessage);
      }

      const data = await response.json();
      if (data.url) {
        setCheckoutUrl(data.url);
        const newWindow = window.open(data.url, '_blank', 'noopener,noreferrer');
        
        if (!newWindow || newWindow.closed || typeof newWindow.closed === 'undefined') {
          console.warn('Popup may have been blocked');
        }
        setIsRedirecting(false);
      } else {
        throw new Error('No checkout URL received from server');
      }
    } catch (err: any) {
      console.error('Payment Error Detail:', err);
      setError(err.message || 'An unexpected error occurred during checkout');
      setIsRedirecting(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="max-w-4xl mx-auto py-12 px-6"
    >
      {error && (
        <motion.div 
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          className="mb-8 p-4 bg-red-50 border border-red-200 rounded-2xl text-red-700 flex items-start gap-3"
        >
          <Zap size={20} className="shrink-0 mt-0.5" />
          <div>
            <p className="font-bold">Checkout Error</p>
            <p className="text-sm">{error}</p>
          </div>
        </motion.div>
      )}

      {checkoutUrl && (
        <motion.div 
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          className="mb-8 p-6 bg-gold/10 border border-gold/20 rounded-2xl text-navy flex flex-col gap-4 shadow-sm"
        >
          <div className="flex items-start gap-3">
            <CheckCircle2 size={24} className="text-gold shrink-0" />
            <div>
              <p className="font-bold">Checkout Ready</p>
              <p className="text-sm text-slate-600">
                If the payment window didn't open automatically, please click the button below to complete your transaction in a new tab.
              </p>
            </div>
          </div>
          <a 
            href={checkoutUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center justify-center gap-2 px-8 py-3 bg-gold text-navy rounded-xl font-bold hover:bg-gold/90 transition-all self-start shadow-md active:scale-95"
          >
            Complete Payment
            <ArrowRight size={18} />
          </a>
        </motion.div>
      )}

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
            <div className="flex justify-between items-center mb-6">
              <span className="text-slate-300 text-sm font-bold uppercase tracking-widest">
                Select your package
              </span>
              <ShieldCheck size={24} className="text-gold" />
            </div>

            <div className="space-y-4">
              <button
                onClick={() => setSelectedProductId(PRICE_ID_MAIN)}
                className={cn(
                  "w-full p-4 rounded-xl border transition-all text-left group",
                  selectedProductId === PRICE_ID_MAIN
                    ? "bg-white/10 border-gold/50"
                    : "border-white/10 hover:border-white/20"
                )}
              >
                <div className="flex justify-between items-center">
                  <div className="flex items-center gap-3">
                    <div className={cn(
                      "w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 transition-colors",
                      selectedProductId === PRICE_ID_MAIN ? "border-gold bg-gold" : "border-white/30"
                    )}>
                      {selectedProductId === PRICE_ID_MAIN && <div className="w-2 h-2 bg-navy rounded-full" />}
                    </div>
                    <div>
                      <p className="font-bold text-sm">Initial Property Pack</p>
                      <p className="text-slate-400 text-xs">Full setup for your first property sale</p>
                    </div>
                  </div>
                  <span className="font-bold text-xl">£50.00</span>
                </div>
              </button>

              <button
                onClick={() => setSelectedProductId(PRICE_ID_UPSELL)}
                className={cn(
                  "w-full p-4 rounded-xl border transition-all text-left group",
                  selectedProductId === PRICE_ID_UPSELL
                    ? "bg-white/10 border-gold/50"
                    : "border-white/10 hover:border-white/20"
                )}
              >
                <div className="flex justify-between items-center">
                  <div className="flex items-center gap-3">
                    <div className={cn(
                      "w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 transition-colors",
                      selectedProductId === PRICE_ID_UPSELL ? "border-gold bg-gold" : "border-white/30"
                    )}>
                      {selectedProductId === PRICE_ID_UPSELL && <div className="w-2 h-2 bg-navy rounded-full" />}
                    </div>
                    <div>
                      <p className="font-bold text-sm">Additional Property Pack</p>
                      <p className="text-slate-400 text-xs">Exclusively for your subsequent properties</p>
                    </div>
                  </div>
                  <span className="font-bold text-xl">£25.00</span>
                </div>
              </button>
            </div>
          </div>

          <div className="p-8 space-y-6">
            <div className="space-y-3">
              <div className="flex justify-between text-sm">
                <span className="text-slate-500 text-sm font-bold uppercase tracking-widest">Pricing Summary</span>
                <span className="text-slate-300 text-xs uppercase tracking-widest">Excluding VAT</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-slate-500">Base Verification Fee</span>
                <span className="font-bold text-navy">£{currentPrice.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-slate-500">VAT (20%)</span>
                <span className="font-bold text-navy">£{vatAmount.toFixed(2)}</span>
              </div>
              <div className="pt-3 border-t border-slate-100 flex justify-between items-center">
                <span className="font-bold text-navy">Total to Pay</span>
                <span className="text-3xl font-bold text-navy">£{totalPrice.toFixed(2)}</span>
              </div>
            </div>

            <button
              onClick={handleCheckout}
              disabled={isRedirecting}
              className="w-full py-5 bg-navy text-white rounded-2xl font-bold text-lg hover:bg-navy-light transition-all flex items-center justify-center gap-3 shadow-lg active:scale-95 disabled:opacity-50"
            >
              <CreditCard size={20} />
              {isRedirecting ? 'Redirecting...' : 'Proceed to Stripe Checkout'}
              <ArrowRight size={20} />
            </button>

            <div className="pt-4 text-center">
              <p className="text-xs text-slate-400 flex items-center justify-center gap-2">
                <Lock size={12} />
                Secure Payment via Stripe. Built-in property pack protection.
              </p>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
};
