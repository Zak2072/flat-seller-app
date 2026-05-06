import React, { useEffect, useState } from 'react';
import { motion } from 'motion/react';
import { CheckCircle2, Loader2, X } from 'lucide-react';
import { useSearchParams } from 'react-router-dom';
import { doc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../firebase';

export function PaymentSuccess() {
  const [searchParams] = useSearchParams();
  const sessionId = searchParams.get('session_id');
  const [status, setStatus] = useState<'verifying' | 'success' | 'error'>('verifying');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!sessionId) {
      setStatus('error');
      setError('Missing session ID');
      return;
    }

    const verifyPayment = async () => {
      try {
        setStatus('verifying');
        setError(null);
        console.log('Verifying with backend...');
        const response = await fetch(`/api/verify-payment?session_id=${sessionId}`);
        const data = await response.json();

        if (data.success) {
          const { userId, propertyId } = data.metadata;
          console.log(`Backend verified. Updating Firestore for user ${userId}, property ${propertyId}`);
          
          try {
            const propertyRef = doc(db, `users/${userId}/properties/${propertyId}`);
            await updateDoc(propertyRef, {
              paymentStatus: 'paid',
              hasPaid: true,
              isPaid: true,
              status: 'ready',
              updatedAt: serverTimestamp(),
              paidAt: serverTimestamp()
            });
            
            console.log('Firestore updated successfully');
            setStatus('success');
            
            // Signal the parent tab
            if (window.opener) {
              window.opener.postMessage({ type: 'PAYMENT_SUCCESS' }, '*');
            }
            
            // Auto-close after 2 seconds
            setTimeout(() => {
              window.close();
            }, 2000);
          } catch (dbErr: any) {
            console.error('Frontend DB Update Error:', dbErr);
            handleFirestoreError(dbErr, OperationType.UPDATE, `users/${userId}/properties/${propertyId}`);
          }
        } else {
          setStatus('error');
          setError(data.message || 'Payment verification failed');
        }
      } catch (err: any) {
        console.error('Verification Error:', err);
        setStatus('error');
        setError(err.message || 'An error occurred during verification');
      }
    };

    verifyPayment();
  }, [sessionId]);

  const handleClose = () => {
    window.close();
  };

  const handleRetry = () => {
    window.location.reload();
  };

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="max-w-md w-full bg-white rounded-3xl shadow-2xl p-10 text-center"
      >
        {status === 'verifying' && (
          <div className="space-y-6">
            <Loader2 className="animate-spin text-navy mx-auto" size={64} />
            <h2 className="text-2xl font-serif font-bold text-navy">Verifying Payment</h2>
            <p className="text-slate-500">Please wait while we confirm your transaction with Stripe...</p>
          </div>
        )}

        {status === 'success' && (
          <div className="space-y-6">
            <div className="w-20 h-20 bg-green-50 text-green-500 rounded-full flex items-center justify-center mx-auto mb-2">
              <CheckCircle2 size={48} />
            </div>
            <h2 className="text-3xl font-serif font-bold text-navy">Payment Successful!</h2>
            <p className="text-slate-600">
              Your property vault has been unlocked. This window will close automatically.
            </p>
            <div className="pt-4 flex flex-col gap-3">
              <button
                onClick={handleClose}
                className="w-full py-4 bg-navy text-white rounded-xl font-bold hover:bg-navy-light transition-all flex items-center justify-center gap-2"
              >
                Close Tab
                <X size={20} />
              </button>
            </div>
          </div>
        )}

        {status === 'error' && (
          <div className="space-y-6">
            <div className="w-20 h-20 bg-red-50 text-red-500 rounded-full flex items-center justify-center mx-auto mb-2">
              <X size={48} />
            </div>
            <h2 className="text-2xl font-serif font-bold text-navy">Verification Error</h2>
            <div className="p-4 bg-red-50 rounded-xl text-left border border-red-100">
              <p className="text-red-700 font-mono text-sm leading-relaxed">{error}</p>
            </div>
            <p className="text-slate-500 text-sm">
              We couldn't verify your payment automatically. Please retry or refresh your main dashboard.
            </p>
            <div className="pt-4 flex flex-col gap-3">
              <button
                onClick={handleRetry}
                className="w-full py-4 bg-navy text-white rounded-xl font-bold hover:bg-navy-light transition-all flex items-center justify-center gap-2"
              >
                Retry Verification
              </button>
              <button
                onClick={handleClose}
                className="w-full py-4 bg-slate-100 text-navy rounded-xl font-bold hover:bg-slate-200 transition-all flex items-center justify-center gap-2"
              >
                Close Window
              </button>
            </div>
          </div>
        )}
      </motion.div>
    </div>
  );
}
