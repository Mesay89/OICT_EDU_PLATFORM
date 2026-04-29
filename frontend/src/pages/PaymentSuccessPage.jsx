import React, { useEffect, useState, useContext } from 'react';
import { useSearchParams, useNavigate, useLocation } from 'react-router-dom';
import axios from 'axios';
import { CheckCircle, AlertCircle, Loader2 } from 'lucide-react';
import { AuthContext } from '../context/AuthContext';
import BASE_URL from '../api/config';

const PaymentSuccessPage = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { state } = useLocation();
  const { user } = useContext(AuthContext);
  
  const [status, setStatus] = useState('verifying'); 
  const [message, setMessage] = useState('Verifying your payment...');
  const [receiptData, setReceiptData] = useState(null);

  useEffect(() => {
    const verifySession = async () => {
      const sessionId = searchParams.get('session_id');
      const gateway = searchParams.get('gateway');
      
      // Fast-Track for Wallet/Manual Success State
      if (state?.course && !sessionId) {
        setReceiptData({
          transactionId: `WAL-${Date.now()}`,
          amount: state.course.price,
          method: 'Earnings Balance',
          date: new Date(),
          courseTitle: state.course.title
        });
        setStatus('success');
        setMessage('Purchased successfully with your earnings balance!');
        return;
      }

      if (!sessionId) {
        setStatus('error');
        setMessage('No session ID found.');
        return;
      }

      try {
        const config = { headers: { Authorization: `Bearer ${user.token}` } };
        const { data } = await axios.post(`${BASE_URL}/payments/verify-gateway`, { sessionId, gateway }, config);
        
        setReceiptData(data.payment);
        setStatus('success');
        setMessage(data.message || 'Payment verified! You are now enrolled.');
      } catch (err) {
        setStatus('error');
        setMessage(err.response?.data?.message || 'Verification failed. Please contact support if you were charged.');
      }
    };

    if (user) {
      verifySession();
    }
  }, [searchParams, user, navigate]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-zinc-950 px-4 py-12">
      <div className="max-w-2xl w-full">
        {status === 'verifying' && (
          <div className="bg-white dark:bg-zinc-900 rounded-[2rem] p-12 shadow-xl text-center border border-gray-100 dark:border-zinc-800">
            <Loader2 className="h-20 w-20 text-indigo-600 animate-spin mx-auto mb-8" />
            <h2 className="text-3xl font-black mb-4">Verifying Payment</h2>
            <p className="text-gray-500 font-bold text-lg">{message}</p>
          </div>
        )}
        
        {status === 'success' && (
          <div className="space-y-8 animate-in slide-in-from-bottom-8 duration-700">
            {/* Success Banner */}
            <div className="bg-emerald-600 text-white rounded-[2rem] p-8 flex items-center gap-6 shadow-2xl no-print">
               <div className="h-16 w-16 bg-white/20 rounded-2xl flex items-center justify-center backdrop-blur-md">
                 <CheckCircle className="h-10 w-10 text-white" />
               </div>
               <div>
                 <h2 className="text-2xl font-black">Success!</h2>
                 <p className="font-bold opacity-90">{message}</p>
               </div>
            </div>

            {/* Receipt Card */}
            <div className="bg-white dark:bg-zinc-900 rounded-[2.5rem] shadow-2xl border-4 border-white dark:border-zinc-800 overflow-hidden" id="printable-receipt">
              <div className="p-10 border-b-2 border-gray-50 dark:border-zinc-800 flex justify-between items-start">
                 <div>
                   <h1 className="text-4xl font-black text-indigo-600 uppercase tracking-tighter mb-1">RECEIPT</h1>
                   <p className="text-xs font-black text-gray-400 uppercase tracking-[0.2em]">OICT TUTOR OFFICIAL</p>
                 </div>
                 <div className="text-right">
                   <p className="text-xs font-black text-gray-400 uppercase mb-1">Reference No</p>
                   <p className="text-xl font-black font-mono text-gray-900 dark:text-white">#{receiptData?.transactionId}</p>
                 </div>
              </div>

              <div className="p-10 space-y-8">
                 <div className="grid grid-cols-2 gap-8">
                    <div>
                      <p className="text-xs font-black text-indigo-500 uppercase mb-2">Billed To</p>
                      <p className="text-xl font-black text-gray-900 dark:text-white">{user.name}</p>
                      <p className="text-sm font-bold text-gray-500">{user.email}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-xs font-black text-indigo-500 uppercase mb-2">Payment Details</p>
                      <p className="text-xl font-black text-gray-900 dark:text-white uppercase">{receiptData?.method}</p>
                      <p className="text-sm font-bold text-gray-500">{receiptData?.phone}</p>
                    </div>
                 </div>

                 <div className="bg-gray-50 dark:bg-zinc-800/50 rounded-3xl p-8 border-2 border-dashed border-gray-200 dark:border-zinc-700">
                    <div className="flex justify-between items-center pb-4 border-b border-gray-200 dark:border-zinc-700 mb-4">
                       <p className="font-black text-gray-900 dark:text-white truncate max-w-[200px]">
                          {receiptData?.courseTitle || 'Course Enrollment'}
                       </p>
                       <p className="font-bold text-gray-500">Verified</p>
                    </div>
                    <div className="flex justify-between items-center text-3xl font-black">
                       <p className="text-gray-900 dark:text-white">TOTAL PAID</p>
                       <p className="text-indigo-600">{receiptData?.amount} ETB</p>
                    </div>
                 </div>

                 <div className="text-center pt-4">
                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">
                       Paid on {receiptData?.date ? new Date(receiptData.date).toLocaleString() : 'N/A'}
                    </p>
                 </div>
              </div>
            </div>

            {/* Actions */}
            <div className="flex gap-4 no-print">
              <button 
                onClick={() => navigate('/dashboard')}
                className="flex-1 py-5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-2xl font-black text-xl shadow-xl transition-all hover:scale-[1.02]"
              >
                Go to Learning
              </button>
              <button 
                onClick={() => window.print()}
                className="px-8 py-5 bg-white dark:bg-zinc-900 text-gray-900 dark:text-white border-2 border-gray-200 dark:border-zinc-800 rounded-2xl font-black transition-all hover:bg-gray-50"
              >
                Print / Save PDF
              </button>
            </div>
          </div>
        )}

        {status === 'error' && (
          <div className="bg-white dark:bg-zinc-900 rounded-[2rem] p-12 shadow-xl text-center border border-red-100 dark:border-red-900/20">
            <div className="h-24 w-24 bg-red-100 dark:bg-red-900/40 rounded-full flex items-center justify-center mx-auto mb-8">
              <AlertCircle className="h-12 w-12 text-red-600" />
            </div>
            <h2 className="text-3xl font-black mb-4 text-red-600">Verification Failed</h2>
            <p className="text-gray-500 font-bold text-lg mb-10">{message}</p>
            <button 
              onClick={() => navigate('/courses')}
              className="w-full py-5 bg-gray-900 dark:bg-white text-white dark:text-gray-900 rounded-2xl font-black text-xl"
            >
              Back to Catalog
            </button>
          </div>
        )}
      </div>

      <style>{`
        @media print {
          /* Hide EVERYTHING first */
          * { 
            visibility: hidden !important; 
          }
          
          /* Show only the receipt and its content */
          #printable-receipt, #printable-receipt * {
            visibility: visible !important;
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }

          /* Positioning the receipt perfectly */
          #printable-receipt {
            position: absolute !important;
            left: 0 !important;
            top: 0 !important;
            width: 100% !important;
            max-width: none !important;
            margin: 0 !important;
            padding: 40px !important;
            border: 2px solid #f0f0f0 !important;
            box-shadow: none !important;
            border-radius: 20px !important;
          }

          /* Hide specific UI noise */
          nav, footer, .no-print, button, header, aside {
            display: none !important;
            height: 0 !important;
            overflow: hidden !important;
          }

          /* Clean up background and margins */
          body, html {
            background: white !important;
            margin: 0 !important;
            padding: 0 !important;
          }

          .min-h-screen {
            background: white !important;
            min-height: 0 !important;
            padding: 0 !important;
          }
        }
      `}</style>
    </div>
  );
};

export default PaymentSuccessPage;
