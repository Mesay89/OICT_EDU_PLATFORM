import { useState, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import { CheckCircle, Zap, Star } from 'lucide-react';
import axios from 'axios';
import BASE_URL from '../api/config';

const PricingPage = () => {
  const { user } = useContext(AuthContext);
  const navigate = useNavigate();
  const [loadingType, setLoadingType] = useState(null);

  const handleSubscribe = async (planType) => {
    if (!user) {
      navigate('/login');
      return;
    }

    setLoadingType(planType);
    try {
      const config = { headers: { Authorization: `Bearer ${user.token}` } };
      // Use stripe implicitly or handle redirect
      const { data } = await axios.post(`${BASE_URL}/subscriptions/initiate`, {
        planType,
        paymentMethod: 'stripe'
      }, config);
      
      if (data.redirectUrl) {
        window.location.href = data.redirectUrl;
      }
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to initiate subscription');
    } finally {
      setLoadingType(null);
    }
  };

  return (
    <div className="min-h-[80vh] bg-gray-50 dark:bg-zinc-950 py-20 px-4">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-16">
          <h1 className="text-5xl font-black text-gray-900 dark:text-white mb-6">Unlock All Content</h1>
          <p className="text-xl text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
            Choose the subscription plan that fits your learning journey. Get unlimited access to comprehensive masterclasses and premium content.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto">
          {/* Monthly Plan */}
          <div className="bg-white dark:bg-zinc-900 rounded-[3rem] p-10 border border-gray-200 dark:border-zinc-800 shadow-xl flex flex-col hover:border-indigo-500 transition-colors duration-300">
            <div className="mb-8">
              <h3 className="text-2xl font-black text-gray-900 dark:text-white mb-2 flex items-center gap-2">
                <Zap className="h-6 w-6 text-indigo-500" /> Montly Pro
              </h3>
              <div className="text-5xl font-black text-gray-900 dark:text-white mb-2">
                500 <span className="text-xl text-gray-500">ETB /mo</span>
              </div>
              <p className="text-gray-500">Perfect for intense short-term learning sprints.</p>
            </div>
            
            <ul className="space-y-4 mb-10 flex-grow">
              <li className="flex gap-3 text-gray-600 dark:text-gray-300 font-medium text-lg">
                <CheckCircle className="h-6 w-6 text-emerald-500 flex-shrink-0" /> Full access to all courses
              </li>
              <li className="flex gap-3 text-gray-600 dark:text-gray-300 font-medium text-lg">
                <CheckCircle className="h-6 w-6 text-emerald-500 flex-shrink-0" /> Access to quizzes and peer reviews
              </li>
              <li className="flex gap-3 text-gray-600 dark:text-gray-300 font-medium text-lg">
                <CheckCircle className="h-6 w-6 text-emerald-500 flex-shrink-0" /> Earn certificates for completed courses
              </li>
              <li className="flex gap-3 text-gray-600 dark:text-gray-300 font-medium text-lg">
                <CheckCircle className="h-6 w-6 text-emerald-500 flex-shrink-0" /> Fast-track customer support
              </li>
            </ul>

            <button 
              onClick={() => handleSubscribe('monthly')}
              disabled={loadingType === 'monthly'}
              className="w-full py-5 rounded-2xl bg-gray-900 dark:bg-white text-white dark:text-gray-900 text-lg font-black hover:scale-[1.02] active:scale-[0.98] transition-all"
            >
              {loadingType === 'monthly' ? 'Processing...' : 'Subscribe Monthly'}
            </button>
          </div>

          {/* Yearly Plan */}
          <div className="bg-gradient-to-br from-indigo-600 to-purple-700 rounded-[3rem] p-10 shadow-2xl flex flex-col relative overflow-hidden transform md:-translate-y-4">
            <div className="absolute top-0 right-0 p-6 bg-white/10 rounded-bl-[3rem] text-sm font-black text-white px-6 py-2 uppercase tracking-widest backdrop-blur-md">
              Most Popular
            </div>
            
            <div className="mb-8 relative z-10">
              <h3 className="text-2xl font-black text-white mb-2 flex items-center gap-2">
                <Star className="h-6 w-6 text-yellow-400" /> Yearly Master
              </h3>
              <div className="text-5xl font-black text-white mb-2">
                5000 <span className="text-xl text-indigo-200">ETB /yr</span>
              </div>
              <p className="text-indigo-100">Save 1,000 ETB! Best value for consistent career growth.</p>
            </div>
            
            <ul className="space-y-4 mb-10 flex-grow relative z-10">
              <li className="flex gap-3 text-white font-medium text-lg">
                <CheckCircle className="h-6 w-6 text-emerald-300 flex-shrink-0" /> Everything in Monthly Pro
              </li>
              <li className="flex gap-3 text-white font-medium text-lg">
                <CheckCircle className="h-6 w-6 text-emerald-300 flex-shrink-0" /> Exclusive private cohorts
              </li>
              <li className="flex gap-3 text-white font-medium text-lg">
                <CheckCircle className="h-6 w-6 text-emerald-300 flex-shrink-0" /> 1-on-1 mentorship sessions monthly
              </li>
              <li className="flex gap-3 text-white font-medium text-lg">
                <CheckCircle className="h-6 w-6 text-emerald-300 flex-shrink-0" /> Free entry to premium webinars
              </li>
            </ul>

            <button 
              onClick={() => handleSubscribe('yearly')}
              disabled={loadingType === 'yearly'}
              className="w-full py-5 rounded-2xl bg-white text-indigo-600 text-lg font-black hover:scale-[1.02] active:scale-[0.98] transition-all shadow-xl shadow-indigo-900/20 relative z-10"
            >
              {loadingType === 'yearly' ? 'Processing...' : 'Subscribe Yearly'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PricingPage;
