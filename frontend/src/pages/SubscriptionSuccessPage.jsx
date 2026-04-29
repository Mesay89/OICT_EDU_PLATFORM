import React, { useEffect, useState, useContext } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { CheckCircle, AlertCircle, Loader2, Sparkles } from 'lucide-react';
import { AuthContext } from '../context/AuthContext';
import BASE_URL from '../api/config';

const SubscriptionSuccessPage = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { user } = useContext(AuthContext);
  
  const [status, setStatus] = useState('verifying'); 
  const [message, setMessage] = useState('Activating your premium access...');

  useEffect(() => {
    const activateSubscription = async () => {
      const sessionId = searchParams.get('session_id');
      const planType = searchParams.get('plan');
      
      if (!sessionId || !planType) {
        setStatus('error');
        setMessage('Invalid subscription session.');
        return;
      }

      try {
        const config = { headers: { Authorization: `Bearer ${user.token}` } };
        const { data } = await axios.post(`${BASE_URL}/subscriptions/verify`, { 
          sessionId, 
          planType 
        }, config);
        
        setStatus('success');
        setMessage(data.message || 'Subscription activated successfully!');
      } catch (err) {
        setStatus('error');
        setMessage(err.response?.data?.message || 'Verification failed. Please contact support.');
      }
    };

    if (user) {
      activateSubscription();
    }
  }, [searchParams, user, navigate]);

  return (
    <div className="min-h-[80vh] flex items-center justify-center bg-gray-50 dark:bg-zinc-950 px-4">
      <div className="max-w-md w-full bg-white dark:bg-zinc-900 rounded-[3rem] p-10 shadow-2xl border border-gray-100 dark:border-zinc-800 text-center relative overflow-hidden">
        {status === 'verifying' && (
          <div className="flex flex-col items-center">
            <div className="relative mb-8">
               <Loader2 className="h-20 w-20 text-indigo-600 animate-spin" />
               <Sparkles className="absolute -top-2 -right-2 h-8 w-8 text-yellow-400 animate-bounce" />
            </div>
            <h2 className="text-3xl font-black mb-4 text-gray-900 dark:text-white">Setting Things Up</h2>
            <p className="text-gray-500 font-medium text-lg leading-relaxed">{message}</p>
          </div>
        )}
        
        {status === 'success' && (
          <div className="flex flex-col items-center animate-in zoom-in duration-500">
            <div className="h-28 w-28 bg-gradient-to-br from-emerald-400 to-teal-500 rounded-full flex items-center justify-center mb-8 shadow-xl shadow-emerald-500/20">
              <CheckCircle className="h-16 w-16 text-white" />
            </div>
            <h2 className="text-4xl font-black mb-4 text-emerald-600">You're Pro!</h2>
            <p className="text-gray-600 dark:text-zinc-400 font-bold text-lg mb-10">{message}</p>
            
            <div className="space-y-4 w-full">
              <button 
                onClick={() => navigate('/dashboard')}
                className="w-full py-5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-2xl font-black text-xl shadow-xl transition-all hover:scale-[1.02]"
              >
                Enter Learning Dashboard
              </button>
              <button 
                onClick={() => window.print()}
                className="text-gray-400 font-bold hover:text-gray-600 transition-colors text-sm uppercase tracking-widest"
              >
                Print Proof of Premium
              </button>
            </div>
          </div>
        )}

        {status === 'error' && (
          <div className="flex flex-col items-center">
            <div className="h-28 w-28 bg-red-100 dark:bg-red-900/40 rounded-full flex items-center justify-center mb-8">
              <AlertCircle className="h-16 w-16 text-red-600" />
            </div>
            <h2 className="text-4xl font-black mb-4 text-red-600">Something Went Wrong</h2>
            <p className="text-gray-600 dark:text-zinc-400 font-bold text-lg mb-10">{message}</p>
            <button 
              onClick={() => navigate('/pricing')}
              className="w-full py-5 bg-gray-900 dark:bg-white text-white dark:text-gray-900 rounded-2xl font-black text-xl hover:scale-105 transition-all shadow-xl"
            >
              Back to Pricing
            </button>
          </div>
        )}
      </div>
      
      <style>{`
        @keyframes progress {
          from { width: 0%; }
          to { width: 100%; }
        }
      `}</style>
    </div>
  );
};

export default SubscriptionSuccessPage;
