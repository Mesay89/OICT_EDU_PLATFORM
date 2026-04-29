import { useState, useEffect, useContext } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import axios from 'axios';
import { CreditCard, ShieldCheck, Lock, CheckCircle, Clock, X, ExternalLink } from 'lucide-react';
import BASE_URL from '../api/config';

const paymentMethods = [
  { id: 'chapa', name: 'Ethiopian Banking (Telebirr, CBE Birr, Banks)', icon: '🇪🇹', color: 'bg-emerald-50 border-emerald-200 dark:bg-emerald-950/20 dark:border-emerald-800' },
  { id: 'cbe', name: 'CBE Bank Transfer (Manual)', icon: '🏦', color: 'bg-blue-50 border-blue-200 dark:bg-blue-900/10' },
  { id: 'telebirr', name: 'TeleBirr (Manual)', icon: '📱', color: 'bg-pink-50 border-pink-200 dark:bg-pink-900/10' },
  { id: 'balance', name: 'Pay with Earnings Balance', icon: '💰', color: 'bg-amber-50 border-amber-200 dark:bg-amber-950/20 dark:border-amber-800' },
  { id: 'stripe', name: 'International Credit Card (Stripe)', icon: '💳', color: 'bg-slate-50 border-slate-200 dark:bg-slate-950/20 dark:border-slate-800' },
  { id: 'paypal', name: 'PayPal', icon: '🅿️', color: 'bg-blue-100 border-blue-300 dark:bg-blue-900/20 dark:border-blue-700' },
];

const CheckoutPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useContext(AuthContext);
  const [course, setCourse] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedMethod, setSelectedMethod] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [processing, setProcessing] = useState(false);
  const [userBalance, setUserBalance] = useState(0);
  const [paymentInitiated, setPaymentInitiated] = useState(false);
  const [paymentData, setPaymentData] = useState(null);
  const [verificationCode, setVerificationCode] = useState('');
  const [transactionId, setTransactionId] = useState('');
  const [verifying, setVerifying] = useState(false);
  const [timeLeft, setTimeLeft] = useState(0);

  const [couponCode, setCouponCode] = useState('');
  const [validatingCoupon, setValidatingCoupon] = useState(false);
  const [appliedCoupon, setAppliedCoupon] = useState(null);
  const [price, setPrice] = useState(0);

  useEffect(() => {
    const fetchCourse = async () => {
      try {
        const { data } = await axios.get(`${BASE_URL}/courses/${id}`);
        setCourse(data);
        setPrice(data.price);
      } catch (error) {
        console.error('Error fetching course');
      } finally {
        setLoading(false);
      }
    };
    fetchCourse();

    const fetchProfile = async () => {
      try {
        const config = { headers: { Authorization: `Bearer ${user.token}` } };
        const { data } = await axios.get(`${BASE_URL}/users/profile`, config);
        const balance = data.commissionBalance || 0;
        setUserBalance(balance);

        // Fast-Track Logic: If intent is use_balance, auto-select it
        const searchParams = new URLSearchParams(window.location.search);
        const intent = searchParams.get('intent');
        if (intent === 'use_balance' && balance >= price) {
          setSelectedMethod('balance');
        }
      } catch (err) {
        console.error('Error fetching profile');
      }
    };
    if (user) fetchProfile();
  }, [id, user]);

  const handleApplyCoupon = async () => {
    if (!couponCode.trim()) return;
    setValidatingCoupon(true);
    try {
      const config = { headers: { Authorization: `Bearer ${user.token}` } };
      const { data } = await axios.post(`${BASE_URL}/lms/coupons/validate`, { code: couponCode, courseId: id }, config);
      setAppliedCoupon(data);
      
      let newPrice = course.price;
      if (data.discountType === 'percentage') {
        newPrice = course.price - (course.price * (data.discountAmount / 100));
      } else {
        newPrice = Math.max(0, course.price - data.discountAmount);
      }
      setPrice(newPrice);
      alert('Coupon applied successfully!');
    } catch (error) {
      alert(error.response?.data?.message || 'Invalid coupon code');
      setAppliedCoupon(null);
      setPrice(course.price);
    } finally {
      setValidatingCoupon(false);
    }
  };

  // Timer for payment expiration
  useEffect(() => {
    if (paymentData && paymentData.expiresAt) {
      const interval = setInterval(() => {
        const now = new Date().getTime();
        const expiry = new Date(paymentData.expiresAt).getTime();
        const diff = Math.floor((expiry - now) / 1000);
        
        if (diff <= 0) {
          setTimeLeft(0);
          clearInterval(interval);
          alert('Payment session expired. Please try again.');
          setPaymentInitiated(false);
          setPaymentData(null);
        } else {
          setTimeLeft(diff);
        }
      }, 1000);

      return () => clearInterval(interval);
    }
  }, [paymentData]);

  const handleInitiatePayment = async (e) => {
    e.preventDefault();
    
    if (price > 0 && !selectedMethod) {
      alert('Please select a payment method');
      return;
    }

    if (price > 0 && (!phoneNumber || phoneNumber.length < 10)) {
      alert('Please enter a valid phone number');
      return;
    }

    setProcessing(true);
    
    try {
      const config = { headers: { Authorization: `Bearer ${user.token}` } };
      const { data } = await axios.post(
        `${BASE_URL}/payments/initiate`,
        { courseId: id, paymentMethod: price === 0 ? 'free' : selectedMethod, phoneNumber: price === 0 ? 'N/A' : phoneNumber, couponCode: appliedCoupon ? couponCode : undefined },
        config
      );

      if (data.isFree) {
        alert(data.message);
        navigate('/dashboard');
        return;
      }

      if (data.payment && data.payment.redirectUrl) {
        window.location.href = data.payment.redirectUrl;
        return;
      }

      setPaymentData(data.payment);
      if (data.payment.redirectUrl) {
        window.location.href = data.payment.redirectUrl;
      } else {
        setPaymentInitiated(true);
      }
    } catch (error) {
      alert(error.response?.data?.message || 'Failed to initiate payment');
    } finally {
      setProcessing(false);
    }
  };

  const handlePayWithBalance = async () => {
    setProcessing(true);
    try {
      const config = { headers: { Authorization: `Bearer ${user.token}` } };
      const { data } = await axios.post(`${BASE_URL}/payments/pay-with-balance`, { courseId: id }, config);
      if (data.success) {
        navigate('/payment-success', { state: { course } });
      }
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to pay with balance');
    } finally {
      setProcessing(false);
    }
  };

  const handleVerifyPayment = async (e) => {
    e.preventDefault();
    
    if (!verificationCode || verificationCode.length !== 6) {
      alert('Please enter a valid 6-digit verification code');
      return;
    }

    setVerifying(true);
    
    try {
      const config = { headers: { Authorization: `Bearer ${user.token}` } };
      const { data } = await axios.post(
        `${BASE_URL}/payments/verify`,
        { 
          paymentId: paymentData._id, 
          verificationCode: verificationCode.trim() 
        }, 
        config
      );

      if (data.status === 'pending_approval') {
        setVerificationCode('');
        setPaymentData({ ...paymentData, status: 'pending_approval' });
        return;
      }

      alert(data.message);
      navigate('/dashboard');
    } catch (error) {
      alert(error.response?.data?.message || 'Verification failed');
    } finally {
      setVerifying(false);
    }
  };

  const handleCancelPayment = async () => {
    if (!confirm('Are you sure you want to cancel this payment?')) return;

    try {
      const config = { headers: { Authorization: `Bearer ${user.token}` } };
      await axios.put(`${BASE_URL}/payments/${paymentData._id}/cancel`, {}, config);
      setPaymentInitiated(false);
      setPaymentData(null);
      setVerificationCode('');
    } catch (error) {
      alert('Failed to cancel payment');
    }
  };

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  if (loading) return <div className="p-20 text-center animate-pulse text-indigo-600 font-bold">Loading...</div>;
  if (!course) return <div className="p-20 text-center font-bold text-2xl">Course not found.</div>;

  return (
    <div className="max-w-6xl mx-auto px-4 py-12 min-h-screen">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left: Course Info */}
        <div className="lg:col-span-1 space-y-6">
          <div>
            <h1 className="text-3xl font-extrabold text-gray-900 dark:text-white mb-2">Checkout</h1>
            <p className="text-gray-600 dark:text-gray-400">Complete your purchase</p>
          </div>

          <div className="bg-white dark:bg-zinc-950 p-6 rounded-2xl border border-gray-200 dark:border-zinc-800 shadow-sm">
            <img src={course.image} alt={course.title} className="w-full h-40 object-cover rounded-xl mb-4" />
            <h3 className="font-bold text-lg text-gray-900 dark:text-white mb-2">{course.title}</h3>
            <p className="text-sm text-indigo-600 font-semibold mb-4">{course.category}</p>
            
            <div className="border-t border-gray-100 dark:border-zinc-800 pt-4 space-y-4">
              {/* Coupon Section */}
              {!paymentInitiated && (
                <div className="space-y-2">
                  <label className="text-xs font-black uppercase text-gray-400">Discount Code</label>
                  <div className="flex gap-2">
                    <input 
                      type="text"
                      placeholder="Enter Coupon..." 
                      value={couponCode}
                      disabled={appliedCoupon}
                      onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
                      className="flex-1 px-3 py-2 bg-gray-50 dark:bg-zinc-900 border border-gray-200 dark:border-zinc-800 rounded-lg text-sm font-bold uppercase outline-none focus:border-indigo-500 text-gray-900 dark:text-white"
                    />
                    <button 
                      onClick={appliedCoupon ? () => { setAppliedCoupon(null); setPrice(course.price); setCouponCode(''); } : handleApplyCoupon}
                      className={`px-4 py-2 rounded-lg text-xs font-black uppercase transition-all ${appliedCoupon ? 'bg-red-100 text-red-600 hover:bg-red-200' : 'bg-indigo-600 text-white hover:bg-indigo-700'}`}
                    >
                      {appliedCoupon ? 'Remove' : validatingCoupon ? '...' : 'Apply'}
                    </button>
                  </div>
                  {appliedCoupon && (
                    <div className="p-2 bg-emerald-50 dark:bg-emerald-900/10 border border-emerald-100 dark:border-emerald-900/30 rounded-lg">
                      <p className="text-[10px] text-emerald-600 font-black uppercase">
                        ✓ {appliedCoupon.discountType === 'percentage' ? `${appliedCoupon.discountAmount}%` : `${appliedCoupon.discountAmount} ETB`} Discount Applied
                      </p>
                    </div>
                  )}
                </div>
              )}

              <div className="flex justify-between items-center">
                <span className="text-gray-600 dark:text-gray-400">Original Price</span>
                <span className={`font-bold ${appliedCoupon ? 'line-through text-gray-400 text-sm' : 'text-gray-900 dark:text-white text-xl'}`}>{course.price} ETB</span>
              </div>
              
              {appliedCoupon && (
                <div className="flex justify-between items-center text-emerald-600 animate-in fade-in slide-in-from-top-2 duration-300">
                  <span className="font-bold">Final Price</span>
                  <span className="text-2xl font-black">{price} ETB</span>
                </div>
              )}

              {!appliedCoupon && !paymentInitiated && (
                <div className="flex justify-between items-center pt-2">
                  <span className="text-gray-600 dark:text-gray-400">Total</span>
                  <span className="text-2xl font-bold text-gray-900 dark:text-white">{course.price} ETB</span>
                </div>
              )}

              <div className="flex items-center gap-2 text-emerald-600 text-[10px] font-black uppercase mt-4">
                <ShieldCheck className="h-4 w-4" /> Military-Grade Secure Payment
              </div>
            </div>
          </div>
        </div>

        {/* Right: Payment Form */}
        <div className="lg:col-span-2">
          {!paymentInitiated ? (
            <div className="bg-white dark:bg-zinc-950 p-8 rounded-2xl border border-gray-200 dark:border-zinc-800 shadow-sm overflow-hidden relative">
              
              {/* Dynamic Content for Free Courses */}
              {price === 0 && (
                <div className="space-y-6 py-4 animate-in fade-in slide-in-from-bottom-4">
                   <div className="bg-indigo-50 dark:bg-indigo-900/10 p-10 rounded-[2rem] border-2 border-indigo-100 dark:border-indigo-900/30 text-center">
                      <div className="h-20 w-20 bg-indigo-600 rounded-3xl mx-auto mb-6 flex items-center justify-center shadow-lg shadow-indigo-500/20 rotate-12">
                         <CheckCircle className="h-10 w-10 text-white -rotate-12" />
                      </div>
                      <h2 className="text-4xl font-black text-gray-900 dark:text-white mb-4">You're All Set!</h2>
                      <p className="text-xl text-gray-500 font-bold mb-8 max-w-md mx-auto line-clamp-3">
                         Since you have a 100% discount, you don't need to provide any bank details or phone numbers.
                      </p>
                      <button 
                         onClick={handleInitiatePayment}
                         disabled={processing}
                         className="w-full py-5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-2xl font-black text-xl shadow-xl shadow-indigo-500/30 transition-all flex items-center justify-center gap-3 animate-bounce"
                      >
                         {processing ? (
                           <>
                             <div className="h-6 w-6 border-4 border-white/30 border-t-white rounded-full animate-spin" />
                             Claiming...
                           </>
                         ) : (
                           <>
                             Get Instant Access Now <ExternalLink className="h-6 w-6" />
                           </>
                         )}
                      </button>
                   </div>
                </div>
              )}

              {/* Standard Payment View for Paid Courses */}
              {price > 0 && (
                <div className="animate-in fade-in duration-500">
                  <h2 className="text-2xl font-bold mb-6 flex items-center gap-2 text-gray-900 dark:text-white">
                    <CreditCard className="h-6 w-6 text-indigo-600" /> 
                    {new URLSearchParams(window.location.search).get('intent') === 'use_balance' && userBalance >= price 
                      ? 'Confirm Wallet Purchase' 
                      : 'Select Payment Method'}
                  </h2>

                  <form onSubmit={handleInitiatePayment} className="space-y-6">
                    {/* Hide selection if fast-tracking and balance is enough */}
                    {!(new URLSearchParams(window.location.search).get('intent') === 'use_balance' && userBalance >= price) && (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {paymentMethods.map((method) => (
                          <button
                            key={method.id}
                            type="button"
                            onClick={() => setSelectedMethod(method.id)}
                            className={`p-4 rounded-xl border-2 transition-all text-left ${
                              selectedMethod === method.id
                                ? 'border-indigo-600 bg-indigo-50 dark:bg-indigo-950/20'
                                : method.color
                            }`}
                          >
                            <div className="flex items-center gap-3">
                              <span className="text-3xl">{method.icon}</span>
                              <div>
                                <div className="font-bold text-gray-900 dark:text-white">{method.name}</div>
                                {selectedMethod === method.id && (
                                  <div className="text-xs text-indigo-600 font-semibold mt-1">✓ Selected</div>
                                )}
                              </div>
                            </div>
                          </button>
                        ))}
                      </div>
                    )}

                    {/* Manual Payment Instructions */}
                    {(selectedMethod === 'cbe' || selectedMethod === 'telebirr') && (
                      <div className="p-6 bg-blue-50 dark:bg-blue-900/10 border-2 border-blue-100 dark:border-blue-900/30 rounded-2xl animate-in slide-in-from-top-2 duration-300">
                        <h4 className="font-black text-blue-900 dark:text-blue-400 uppercase tracking-widest text-xs mb-4">Payment Instructions</h4>
                        <div className="space-y-3">
                           {selectedMethod === 'cbe' ? (
                             <div className="flex justify-between items-center bg-white dark:bg-zinc-900 p-4 rounded-xl shadow-sm">
                                <div>
                                   <p className="text-[10px] font-black text-gray-400 uppercase">CBE Account Number</p>
                                   <p className="text-xl font-black text-indigo-600 font-mono">1000475739098</p>
                                </div>
                                <div className="text-right">
                                   <p className="text-[10px] font-black text-gray-400 uppercase">Account Name</p>
                                   <p className="font-bold text-gray-900 dark:text-white">Mesay Boja</p>
                                </div>
                             </div>
                           ) : (
                             <div className="flex justify-between items-center bg-white dark:bg-zinc-900 p-4 rounded-xl shadow-sm">
                                <div>
                                   <p className="text-[10px] font-black text-gray-400 uppercase">TeleBirr Number</p>
                                   <p className="text-xl font-black text-pink-600 font-mono">0939648955</p>
                                </div>
                                <div className="text-right">
                                   <p className="text-[10px] font-black text-gray-400 uppercase">Name</p>
                                   <p className="font-bold text-gray-900 dark:text-white">Mesay Boja</p>
                                </div>
                             </div>
                           )}
                           <p className="text-xs text-gray-500 font-medium leading-relaxed">
                              Please transfer the exact amount. After you complete the transfer, click "Pay Now" below to get your verification code. You will need to enter that code after sending the money.
                           </p>
                        </div>
                      </div>
                    )}

                    {selectedMethod !== 'balance' && (
                      <div className="space-y-2">
                        <label className="text-sm font-bold text-gray-700 dark:text-gray-300">Phone Number</label>
                        <input
                          type="tel"
                          required
                          className="w-full h-14 bg-gray-50 dark:bg-zinc-900 border-2 border-gray-100 dark:border-zinc-800 rounded-xl px-4 outline-none focus:border-indigo-600 transition-all dark:text-white"
                          placeholder="09..."
                          value={phoneNumber}
                          onChange={(e) => setPhoneNumber(e.target.value)}
                        />
                        <p className="text-xs text-gray-500">Enter the phone number registered with your payment method</p>
                      </div>
                    )}

                    <button
                      type="button"
                      onClick={selectedMethod === 'balance' ? handlePayWithBalance : handleInitiatePayment}
                      disabled={processing || !selectedMethod || (selectedMethod === 'balance' && userBalance < price)}
                      className={`w-full h-14 text-white rounded-xl font-bold text-lg transition-all shadow-lg flex justify-center items-center gap-2 ${
                        processing || !selectedMethod || (selectedMethod === 'balance' && userBalance < price)
                          ? 'bg-gray-400 cursor-not-allowed shadow-none' 
                          : 'bg-indigo-600 hover:bg-indigo-700'
                      }`}
                    >
                      {processing ? 'Processing...' : 
                       (selectedMethod === 'balance' && userBalance < price) ? 'Insufficient Earnings Balance' :
                       (selectedMethod === 'balance' ? `Use ${price} ETB from Balance` : `Pay ${price} ETB`)}
                    </button>
                  </form>
                </div>
              )}
            </div>
          ) : (
            <div className="bg-white dark:bg-zinc-950 p-10 md:p-12 rounded-[2.5rem] border border-gray-200 dark:border-zinc-800 shadow-2xl text-center space-y-8 animate-in zoom-in-95 duration-500 relative overflow-hidden">
              {paymentData?.redirectUrl ? (
                /* GATEWAY REDIRECT VIEW */
                <div className="space-y-8">
                  <div className="relative">
                    <div className="h-24 w-24 bg-indigo-600 rounded-[2.5rem] flex items-center justify-center mx-auto shadow-2xl shadow-indigo-500/40 rotate-12">
                       <ExternalLink className="h-12 w-12 text-white -rotate-12" />
                    </div>
                    <div className="absolute top-0 right-1/3 h-4 w-4 bg-emerald-500 rounded-full animate-ping"></div>
                  </div>
                  <div className="space-y-4">
                    <h2 className="text-4xl font-black text-gray-900 dark:text-white tracking-tight">Redirecting...</h2>
                    <p className="text-xl text-gray-500 font-bold max-w-sm mx-auto">
                       We are opening the secure {paymentData?.paymentMethod} gateway. Please complete your payment there.
                    </p>
                  </div>
                  <div className="flex items-center justify-center gap-2 text-indigo-600 font-black uppercase tracking-widest text-xs">
                     <div className="h-1 w-1 bg-indigo-600 rounded-full animate-bounce"></div>
                     <div className="h-1 w-1 bg-indigo-600 rounded-full animate-bounce [animation-delay:0.2s]"></div>
                     <div className="h-1 w-1 bg-indigo-600 rounded-full animate-bounce [animation-delay:0.4s]"></div>
                     Secure Handshake Active
                  </div>
                </div>
              ) : paymentData?.status === 'pending_approval' ? (
                /* MANUAL SUCCESS VIEW (WAITING FOR ADMIN) */
                <div className="space-y-8 py-4 animate-in fade-in zoom-in duration-500">
                   <div className="h-24 w-24 bg-emerald-600 rounded-[2.5rem] flex items-center justify-center mx-auto shadow-2xl shadow-emerald-500/30">
                      <CheckCircle className="h-12 w-12 text-white" />
                   </div>
                   <div className="space-y-4">
                      <h2 className="text-4xl font-black text-gray-900 dark:text-white tracking-tight">Verification Received!</h2>
                      <p className="text-xl text-gray-500 font-bold max-w-sm mx-auto">
                         Your payment is now with our Admin team. Please wait for approval to continue learning.
                      </p>
                   </div>
                   <div className="p-6 bg-emerald-50 dark:bg-emerald-900/10 border-2 border-emerald-100 dark:border-emerald-900/30 rounded-3xl">
                      <p className="text-sm font-bold text-emerald-800 dark:text-emerald-400">
                         We will verify your transfer to <b>{paymentData?.paymentMethod === 'cbe' ? 'CBE' : 'TeleBirr'}</b> and notify you within a few hours.
                      </p>
                   </div>
                   <button 
                      onClick={() => navigate('/dashboard')}
                      className="w-full h-16 bg-gray-900 dark:bg-white text-white dark:text-black rounded-2xl font-black text-xl hover:scale-[1.02] transition-all"
                   >
                      Go to My Dashboard
                   </button>
                </div>
              ) : (
                /* MANUAL VERIFICATION VIEW (INPUT CODE) */
                <div className="space-y-6">
                   <div className="bg-indigo-600 text-white h-20 w-20 rounded-3xl mx-auto flex items-center justify-center shadow-2xl shadow-indigo-500/30">
                      <Clock className="h-10 w-10 animate-pulse" />
                   </div>
                   
                   <div className="space-y-2">
                      <h2 className="text-3xl font-black text-gray-900 dark:text-white">Verify Your Payment</h2>
                      <p className="text-gray-500 font-bold">Please complete the transfer, then enter the code below.</p>
                   </div>

                   <div className="bg-gray-50 dark:bg-zinc-900 p-6 rounded-3xl border-2 border-dashed border-gray-200 dark:border-zinc-800">
                      <p className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] mb-2">Check Your Phone</p>
                      <p className="text-sm font-bold text-gray-500">A 6-digit code has been sent to your phone via SMS. Please enter it below to verify your payment.</p>
                   </div>

                   <form onSubmit={handleVerifyPayment} className="space-y-4">
                      <div className="space-y-2 text-left">
                         <label className="text-xs font-black uppercase text-gray-400 ml-2">Enter Code to Confirm</label>
                         <input 
                            type="text"
                            maxLength="6"
                            placeholder="......"
                            className="w-full h-16 text-center text-3xl font-black tracking-[0.5em] bg-white dark:bg-zinc-950 border-2 border-gray-100 dark:border-zinc-800 rounded-2xl outline-none focus:border-indigo-600 transition-all dark:text-white"
                            value={verificationCode}
                            onChange={(e) => setVerificationCode(e.target.value)}
                         />
                      </div>
                      
                      <button 
                         type="submit"
                         disabled={verifying}
                         className="w-full h-16 bg-emerald-600 hover:bg-emerald-700 text-white rounded-2xl font-black text-xl shadow-xl shadow-emerald-500/20 transition-all flex items-center justify-center gap-3"
                      >
                         {verifying ? 'Verifying...' : 'Submit Verification'}
                      </button>
                      
                      <button 
                        type="button"
                        onClick={handleCancelPayment}
                        className="text-gray-400 text-xs font-bold uppercase hover:text-red-500 transition-colors"
                      >
                        Cancel and try again
                      </button>
                   </form>

                   <div className="pt-4 border-t border-gray-100 dark:border-zinc-800">
                      <div className="flex justify-between items-center text-[10px] font-black uppercase text-gray-400">
                         <span>Session Expires In</span>
                         <span className="text-red-500">{formatTime(timeLeft)}</span>
                      </div>
                   </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default CheckoutPage;
