import { useState, useEffect, useContext } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import axios from 'axios';
import { CreditCard, ShieldCheck, Lock, CheckCircle, Clock, X, ExternalLink, Loader2 } from 'lucide-react';
import BASE_URL from '../api/config';

const paymentMethods = [
  { id: 'chapa', name: 'Ethiopian Banking (Telebirr, CBE Birr, Banks)', icon: '🇪🇹', color: 'bg-emerald-50 border-emerald-200 dark:bg-emerald-950/20 dark:border-emerald-800' },
  { id: 'cbe', name: 'CBE Bank Transfer (Manual)', icon: '🏦', color: 'bg-blue-50 border-blue-200 dark:bg-blue-900/10' },
  { id: 'telebirr', name: 'TeleBirr (Manual)', icon: '📱', color: 'bg-pink-50 border-pink-200 dark:bg-pink-900/10' },
  { id: 'balance', name: 'Pay with Earnings Balance', icon: '💰', color: 'bg-amber-50 border-amber-200 dark:bg-amber-950/20 dark:border-amber-800' },
  { id: 'stripe', name: 'International Credit Card (Stripe)', icon: '💳', color: 'bg-slate-50 border-slate-200 dark:bg-slate-950/20 dark:border-slate-800' },
  { id: 'paypal', name: 'PayPal', icon: '🅿️', color: 'bg-blue-100 border-blue-300 dark:bg-blue-900/20 dark:border-blue-700' },
];

const BundleCheckoutPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useContext(AuthContext);
  const [bundle, setBundle] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedMethod, setSelectedMethod] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [processing, setProcessing] = useState(false);
  const [userBalance, setUserBalance] = useState(0);
  const [paymentInitiated, setPaymentInitiated] = useState(null);
  const [paymentData, setPaymentData] = useState(null);
  const [verificationCode, setVerificationCode] = useState('');
  const [transactionId, setTransactionId] = useState('');
  const [verifying, setVerifying] = useState(false);
  const [timeLeft, setTimeLeft] = useState(0);
  const [couponCode, setCouponCode] = useState('');
  const [validatingCoupon, setValidatingCoupon] = useState(false);
  const [appliedCoupon, setAppliedCoupon] = useState(null);
  const [finalPrice, setFinalPrice] = useState(null);
  const [enrolledFree, setEnrolledFree] = useState(false);

  // Check if user is restricted from purchasing - do this immediately
  const restrictedRoles = ['instructor', 'cashManager', 'admin', 'superAdmin'];
  if (user && restrictedRoles.includes(user.role)) {
    alert(`${user.role.charAt(0).toUpperCase() + user.role.slice(1)}s cannot purchase bundles.`);
    navigate('/courses');
    return null;
  }

  useEffect(() => {
    const fetchBundle = async () => {
      try {
        const { data } = await axios.get(`${BASE_URL}/bundles/${id}`);
        setBundle(data);
      } catch (error) {
        console.error('Error fetching bundle');
      } finally {
        setLoading(false);
      }
    };
    fetchBundle();
  }, [id]);

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const config = { headers: { Authorization: `Bearer ${user.token}` } };
        const { data } = await axios.get(`${BASE_URL}/auth/profile`, config);
        setUserBalance(data.commissionBalance || 0);
      } catch (err) {
        console.error('Error fetching profile');
      }
    };
    if (user) fetchProfile();
  }, [user]);

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

  // Initialize finalPrice once bundle is loaded
  useEffect(() => {
    if (bundle) setFinalPrice(bundle.price);
  }, [bundle]);

  const handleApplyCoupon = async () => {
    if (!couponCode.trim()) return;
    setValidatingCoupon(true);
    try {
      const config = { headers: { Authorization: `Bearer ${user.token}` } };
      const { data } = await axios.post(`${BASE_URL}/lms/coupons/validate`, { code: couponCode, bundleId: id }, config);
      setAppliedCoupon(data);
      let newPrice = bundle.price;
      if (data.discountType === 'percentage') {
        newPrice = bundle.price - (bundle.price * (data.discountAmount / 100));
      } else {
        newPrice = Math.max(0, bundle.price - data.discountAmount);
      }
      setFinalPrice(Math.max(0, newPrice));
      alert('Coupon applied successfully!');
    } catch (error) {
      alert(error.response?.data?.message || 'Invalid coupon code');
      setAppliedCoupon(null);
      setFinalPrice(bundle.price);
    } finally {
      setValidatingCoupon(false);
    }
  };

  const handleInitiatePayment = async (e) => {
    e.preventDefault();
    
    // If the coupon makes it 100% free, skip payment method check
    if (finalPrice > 0) {
      if (!selectedMethod) {
        alert('Please select a payment method');
        return;
      }
      if (selectedMethod !== 'balance' && (!phoneNumber || phoneNumber.length < 10)) {
        alert('Please enter a valid phone number');
        return;
      }
    }

    setProcessing(true);
    
    try {
      const config = { headers: { Authorization: `Bearer ${user.token}` } };
      const { data } = await axios.post(
        `${BASE_URL}/payments/initiate-bundle`,
        { bundleId: id, paymentMethod: finalPrice <= 0 ? 'free' : selectedMethod, phoneNumber: selectedMethod === 'balance' ? 'N/A' : phoneNumber, couponCode: appliedCoupon ? couponCode : undefined },
        config
      );

      // Free after coupon
      if (data.isFree) {
        setEnrolledFree(true);
        return;
      }

      if (data.payment && data.payment.redirectUrl) {
        // Store bundleId in localStorage for retrieval on success page
        localStorage.setItem('pendingBundleId', id);
        localStorage.setItem('pendingSessionId', data.payment.sessionId || data.payment.transactionId);
        window.location.href = data.payment.redirectUrl;
        return;
      }

      setPaymentData(data.payment);
      setPaymentInitiated(true);
    } catch (error) {
      console.error('Payment initiation error:', error);
      alert(error.response?.data?.message || 'Failed to initiate payment');
    } finally {
      setProcessing(false);
    }
  };

  const handleVerifyPayment = async (e) => {
    e.preventDefault();
    
    if (!verificationCode || !transactionId) {
      alert('Please enter both verification code and transaction ID');
      return;
    }

    setVerifying(true);
    
    try {
      const config = { headers: { Authorization: `Bearer ${user.token}` } };
      const { data } = await axios.post(
        `${BASE_URL}/payments/verify-bundle`,
        { 
          bundleId: id,
          verificationCode,
          transactionId,
          sessionId: paymentData?.sessionId
        },
        config
      );

      if (data.success) {
        alert('Payment verified successfully! You have been enrolled in all courses.');
        navigate('/dashboard');
      } else {
        alert(data.message || 'Payment verification failed');
      }
    } catch (error) {
      console.error('Payment verification error:', error);
      alert(error.response?.data?.message || 'Failed to verify payment');
    } finally {
      setVerifying(false);
    }
  };

  const handlePayWithBalance = async () => {
    if (userBalance < finalPrice) {
      alert('Insufficient balance');
      return;
    }

    setProcessing(true);
    
    try {
      const config = { headers: { Authorization: `Bearer ${user.token}` } };
      const { data } = await axios.post(
        `${BASE_URL}/payments/pay-bundle-with-balance`,
        { bundleId: id, couponCode: appliedCoupon ? couponCode : undefined },
        config
      );

      if (data.success) {
        alert('Payment successful! You have been enrolled in all courses.');
        navigate('/dashboard');
      } else {
        alert(data.message || 'Payment failed');
      }
    } catch (error) {
      console.error('Balance payment error:', error);
      alert(error.response?.data?.message || 'Failed to pay with balance');
    } finally {
      setProcessing(false);
    }
  };

  if (loading) return (
    <div className="flex justify-center items-center min-h-screen bg-white dark:bg-zinc-950">
      <Loader2 className="animate-spin h-16 w-16 text-violet-600" />
    </div>
  );


  if (!bundle) return (
    <div className="flex flex-col justify-center items-center min-h-screen text-center p-8 bg-white dark:bg-zinc-950">
      <h1 className="text-3xl font-black text-gray-900 dark:text-white mb-2">Bundle Not Found</h1>
    </div>
  );

  // Success screen after 100% coupon discount
  if (enrolledFree) return (
    <div className="min-h-screen bg-gray-50 dark:bg-zinc-950 flex items-center justify-center px-4">
      <div className="bg-white dark:bg-zinc-900 rounded-3xl shadow-2xl p-10 max-w-md w-full text-center">
        <div className="w-20 h-20 bg-emerald-100 dark:bg-emerald-900/30 rounded-full flex items-center justify-center mx-auto mb-6">
          <CheckCircle className="h-10 w-10 text-emerald-500" />
        </div>
        <h1 className="text-3xl font-black text-gray-900 dark:text-white mb-2">You're Enrolled! 🎉</h1>
        <p className="text-gray-600 dark:text-gray-400 mb-2">
          Your 100% discount coupon unlocked
        </p>
        <p className="text-lg font-bold text-violet-600 dark:text-violet-400 mb-8">
          "{bundle.title}"
        </p>
        <div className="space-y-3">
          <button
            onClick={() => navigate(`/bundle-player/${id}`)}
            className="w-full py-4 bg-violet-600 hover:bg-violet-700 text-white rounded-xl font-bold text-lg flex items-center justify-center gap-3 transition-all shadow-lg hover:shadow-violet-200 dark:hover:shadow-violet-900/30"
          >
            <ExternalLink className="h-5 w-5" />
            Start Learning Now
          </button>
          <button
            onClick={() => navigate('/dashboard')}
            className="w-full py-3 bg-gray-100 dark:bg-zinc-800 hover:bg-gray-200 dark:hover:bg-zinc-700 text-gray-700 dark:text-gray-300 rounded-xl font-semibold transition-all"
          >
            Go to Dashboard
          </button>
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-zinc-950 py-12 px-4">
      <div className="max-w-6xl mx-auto">
        <div className="mb-8">
          <button 
            onClick={() => navigate(-1)}
            className="text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white flex items-center gap-2"
          >
            <X className="h-5 w-5" /> Cancel
          </button>
        </div>

        {!paymentInitiated ? (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            
            {/* Left: Payment Form & Coupon */}
            <div className="lg:col-span-2 space-y-6">
              <div>
                <h1 className="text-3xl font-black text-gray-900 dark:text-white mb-2">Checkout</h1>
                <p className="text-gray-600 dark:text-gray-400 mb-8">Complete your purchase for "{bundle.title}"</p>
              </div>

              {/* Coupon Section (Left Corner, parallel with Payment Method) */}
              <div className="bg-white dark:bg-zinc-900 rounded-3xl shadow-xl p-8 border border-gray-200 dark:border-zinc-800 mb-6">
                <h2 className="text-xl font-black text-gray-900 dark:text-white mb-4">Have a Coupon?</h2>
                <div className="flex gap-2">
                  <input
                    type="text"
                    placeholder="Enter discount code..."
                    value={couponCode}
                    disabled={!!appliedCoupon}
                    onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
                    className="flex-1 px-4 py-3 bg-gray-50 dark:bg-zinc-950 border border-gray-200 dark:border-zinc-700 rounded-xl text-sm font-bold uppercase outline-none focus:border-violet-500 text-gray-900 dark:text-white"
                  />
                  <button
                    type="button"
                    onClick={appliedCoupon ? () => { setAppliedCoupon(null); setFinalPrice(bundle.price); setCouponCode(''); } : handleApplyCoupon}
                    className={`px-6 py-3 rounded-xl text-sm font-black uppercase transition-all ${appliedCoupon ? 'bg-red-100 text-red-600 hover:bg-red-200' : 'bg-violet-600 text-white hover:bg-violet-700'}`}
                  >
                    {appliedCoupon ? 'Remove' : validatingCoupon ? '...' : 'Apply'}
                  </button>
                </div>
                {appliedCoupon && (
                  <div className="mt-4 p-3 bg-emerald-50 dark:bg-emerald-900/10 border border-emerald-200 dark:border-emerald-900/30 rounded-xl">
                    <p className="text-sm text-emerald-600 dark:text-emerald-400 font-black uppercase">
                      ✓ {appliedCoupon.discountType === 'percentage' ? `${appliedCoupon.discountAmount}%` : `${appliedCoupon.discountAmount} ETB`} Discount Applied
                    </p>
                  </div>
                )}
              </div>

              {/* Payment Methods */}
              <div className="bg-white dark:bg-zinc-900 rounded-3xl shadow-xl p-8 border border-gray-200 dark:border-zinc-800">
                <form onSubmit={handleInitiatePayment} className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                  Select Payment Method
                </label>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {paymentMethods.map((method) => (
                    <button
                      key={method.id}
                      type="button"
                      onClick={() => setSelectedMethod(method.id)}
                      disabled={method.id === 'balance' && userBalance < (finalPrice ?? bundle.price)}
                      className={`p-4 rounded-xl border-2 transition-all flex items-center gap-3 ${
                        selectedMethod === method.id
                          ? 'border-violet-600 bg-violet-50 dark:bg-violet-900/20'
                          : 'border-gray-200 dark:border-zinc-700 hover:border-gray-300 dark:hover:border-zinc-600'
                      } ${method.id === 'balance' && userBalance < (finalPrice ?? bundle.price) ? 'opacity-50 cursor-not-allowed' : ''}`}
                    >
                      <span className="text-2xl">{method.icon}</span>
                      <span className="font-medium text-gray-900 dark:text-white text-sm">{method.name}</span>
                      {method.id === 'balance' && (
                        <span className="ml-auto text-xs text-gray-500 dark:text-gray-400">
                          Balance: {userBalance} ETB
                        </span>
                      )}
                    </button>
                  ))}
                </div>
              </div>

              {selectedMethod && selectedMethod !== 'balance' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Phone Number
                  </label>
                  <input
                    type="tel"
                    value={phoneNumber}
                    onChange={(e) => setPhoneNumber(e.target.value)}
                    placeholder="0912345678"
                    className="w-full px-4 py-3 border border-gray-300 dark:border-zinc-700 rounded-xl focus:ring-2 focus:ring-violet-500 dark:bg-zinc-800 dark:text-white"
                    required
                  />
                </div>
              )}

              {selectedMethod === 'balance' && (
                <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-xl p-4">
                  <p className="text-amber-800 dark:text-amber-200 text-sm">
                    Your current balance: <strong>{userBalance} ETB</strong>
                  </p>
                  {userBalance >= (finalPrice ?? bundle.price) ? (
                    <p className="text-green-600 dark:text-green-400 text-sm mt-1">
                      ✓ Sufficient balance to complete purchase
                    </p>
                  ) : (
                    <p className="text-red-600 dark:text-red-400 text-sm mt-1">
                      ✗ Insufficient balance. You need {((finalPrice ?? bundle.price) - userBalance).toFixed(2)} ETB more.
                    </p>
                  )}
                </div>
              )}

              <button
                type="submit"
                onClick={selectedMethod === 'balance' && finalPrice > 0 ? (e) => { e.preventDefault(); handlePayWithBalance(); } : undefined}
                disabled={processing || (finalPrice > 0 && !selectedMethod) || (selectedMethod === 'balance' && userBalance < (finalPrice ?? bundle.price))}
                className="w-full py-4 bg-violet-600 hover:bg-violet-700 text-white rounded-xl font-bold text-lg flex items-center justify-center gap-3 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {processing ? (
                  <><Loader2 className="h-5 w-5 animate-spin" /> Processing...</>
                ) : finalPrice !== null && finalPrice <= 0 ? (
                  <>🎉 Claim for Free</>
                ) : selectedMethod === 'balance' ? (
                  <>Pay with Balance</>
                ) : (
                  <>Continue to Payment</>
                )}
              </button>
            </form>

              <div className="mt-6 flex items-center justify-center gap-6 text-xs text-gray-500 dark:text-gray-400">
                <div className="flex items-center gap-1">
                  <ShieldCheck className="h-4 w-4" /> Secure Payment
                </div>
                <div className="flex items-center gap-1">
                  <Lock className="h-4 w-4" /> SSL Encrypted
                </div>
              </div>
              </div>
            </div>

            {/* Right: Order Summary */}
            <div className="lg:col-span-1 space-y-6">
              <div className="bg-white dark:bg-zinc-900 rounded-3xl p-6 border border-gray-200 dark:border-zinc-800 shadow-xl sticky top-6">
                <h3 className="text-xl font-black text-gray-900 dark:text-white border-b border-gray-100 dark:border-zinc-800 pb-4 mb-4">Order Summary</h3>
                
                <div className="flex gap-4 mb-6">
                  {bundle.image ? (
                    <img src={bundle.image} alt={bundle.title} className="w-16 h-16 object-cover rounded-xl shadow-sm" />
                  ) : (
                    <div className="w-16 h-16 bg-violet-100 dark:bg-violet-900/30 rounded-xl flex flex-shrink-0 items-center justify-center">
                      <Package className="h-8 w-8 text-violet-500" />
                    </div>
                  )}
                  <div>
                    <h4 className="font-bold text-gray-900 dark:text-white text-sm line-clamp-2">{bundle.title}</h4>
                    <p className="text-xs text-gray-500 mt-1">{bundle.courses?.length} Courses Included</p>
                  </div>
                </div>

                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600 dark:text-gray-400">Original Price</span>
                    <span className={`font-bold ${appliedCoupon ? 'line-through text-gray-400 text-sm' : 'text-gray-900 dark:text-white text-lg'}`}>{bundle.price} ETB</span>
                  </div>
                  {appliedCoupon && (
                    <div className="flex justify-between items-center animate-in fade-in slide-in-from-top-2 duration-300">
                      <span className="text-emerald-600 dark:text-emerald-400 font-bold">Discount</span>
                      <span className="text-emerald-600 dark:text-emerald-400 font-bold">- {(bundle.price - finalPrice).toFixed(2)} ETB</span>
                    </div>
                  )}
                  <div className="flex justify-between items-center border-t border-gray-200 dark:border-zinc-700 pt-4 mt-4">
                    <span className="font-bold text-gray-900 dark:text-white">Total</span>
                    <span className="text-3xl font-black text-violet-600 dark:text-violet-400">{finalPrice !== null ? finalPrice.toFixed(2) : bundle.price} <span className="text-lg">ETB</span></span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="bg-white dark:bg-zinc-900 rounded-3xl shadow-xl p-8">
            <div className="text-center mb-8">
              <div className="w-16 h-16 bg-amber-100 dark:bg-amber-900/20 rounded-full flex items-center justify-center mx-auto mb-4">
                <Clock className="h-8 w-8 text-amber-600 dark:text-amber-400 animate-pulse" />
              </div>
              <h2 className="text-2xl font-black text-gray-900 dark:text-white mb-2">Awaiting Payment</h2>
              <p className="text-gray-600 dark:text-gray-400">
                Complete the payment using your selected method
              </p>
              {timeLeft > 0 && (
                <div className="mt-4 inline-flex items-center gap-2 bg-red-100 dark:bg-red-900/20 text-red-700 dark:text-red-400 px-4 py-2 rounded-full text-sm font-bold">
                  <Clock className="h-4 w-4" /> {Math.floor(timeLeft / 60)}:{(timeLeft % 60).toString().padStart(2, '0')} remaining
                </div>
              )}
            </div>

            {paymentData && (
              <div className="bg-gray-50 dark:bg-zinc-800 rounded-2xl p-6 mb-6">
                <h3 className="font-bold text-gray-900 dark:text-white mb-4">Payment Details</h3>
                <div className="space-y-3 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600 dark:text-gray-400">Amount</span>
                    <span className="font-medium text-gray-900 dark:text-white">{finalPrice !== null ? finalPrice.toFixed(2) : bundle.price} ETB</span>
                  </div>
                  {paymentData.accountNumber && (
                    <div className="flex justify-between">
                      <span className="text-gray-600 dark:text-gray-400">Account Number</span>
                      <span className="font-medium text-gray-900 dark:text-white">{paymentData.accountNumber}</span>
                    </div>
                  )}
                  {paymentData.accountName && (
                    <div className="flex justify-between">
                      <span className="text-gray-600 dark:text-gray-400">Account Name</span>
                      <span className="font-medium text-gray-900 dark:text-white">{paymentData.accountName}</span>
                    </div>
                  )}
                  {paymentData.reference && (
                    <div className="flex justify-between">
                      <span className="text-gray-600 dark:text-gray-400">Reference</span>
                      <span className="font-medium text-gray-900 dark:text-white">{paymentData.reference}</span>
                    </div>
                  )}
                </div>
              </div>
            )}

            <form onSubmit={handleVerifyPayment} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Transaction ID
                </label>
                <input
                  type="text"
                  value={transactionId}
                  onChange={(e) => setTransactionId(e.target.value)}
                  placeholder="Enter transaction ID from your bank app"
                  className="w-full px-4 py-3 border border-gray-300 dark:border-zinc-700 rounded-xl focus:ring-2 focus:ring-violet-500 dark:bg-zinc-800 dark:text-white"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Verification Code
                </label>
                <input
                  type="text"
                  value={verificationCode}
                  onChange={(e) => setVerificationCode(e.target.value)}
                  placeholder="Enter verification code sent to your phone"
                  className="w-full px-4 py-3 border border-gray-300 dark:border-zinc-700 rounded-xl focus:ring-2 focus:ring-violet-500 dark:bg-zinc-800 dark:text-white"
                  required
                />
              </div>

              <button
                type="submit"
                disabled={verifying}
                className="w-full py-4 bg-green-600 hover:bg-green-700 text-white rounded-xl font-bold text-lg flex items-center justify-center gap-3 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {verifying ? (
                  <><Loader2 className="h-5 w-5 animate-spin" /> Verifying...</>
                ) : (
                  <><CheckCircle className="h-5 w-5" /> Verify Payment</>
                )}
              </button>
            </form>

            <div className="mt-6 text-center">
              <button
                onClick={() => setPaymentInitiated(false)}
                className="text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white text-sm"
              >
                Change payment method
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default BundleCheckoutPage;
