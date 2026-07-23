import { useState, useContext, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import axios from 'axios';
import { AuthContext } from '../context/AuthContext';
import { GraduationCap, Eye, EyeOff, Upload, FileText, X } from 'lucide-react';
import BASE_URL from '../api/config';

const getPostAuthRoute = (nextUser) => {
  if (nextUser?.role === 'superAdmin' || nextUser?.role === 'admin') return '/admin-dashboard';
  if (nextUser?.role === 'cashManager') return '/cash-manager-dashboard';
  if (nextUser?.role === 'instructor') return '/instructor/courses';
  return '/dashboard';
};

const RegisterPage = () => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [role, setRole] = useState('student');
  const [referralCode, setReferralCode] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  
  // Instructor document uploads
  const [cvFile, setCvFile] = useState(null);
  const [certificateFiles, setCertificateFiles] = useState([]);
  
  const [step, setStep] = useState(1);
  const [otp, setOtp] = useState('');
  
  const { login } = useContext(AuthContext);
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const ref = params.get('ref');
    if (ref) {
      setReferralCode(ref.toUpperCase());
    }
  }, [location]);

  const validateForm = () => {
    if (!name.trim()) {
      setError('Name is required');
      return false;
    }
    if (name.trim().length < 2) {
      setError('Name must be at least 2 characters long');
      return false;
    }
    if (!email.trim()) {
      setError('Email is required');
      return false;
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email.trim())) {
      setError('Please enter a valid email address');
      return false;
    }
    if (!password) {
      setError('Password is required');
      return false;
    }
    if (password.length < 6) {
      setError('Password must be at least 6 characters long');
      return false;
    }
    if (!confirmPassword) {
      setError('Please confirm your password');
      return false;
    }
    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return false;
    }
    // Instructor-specific validation
    if (role === 'instructor') {
      if (!cvFile) {
        setError('CV is required for instructor registration. Please upload your CV.');
        return false;
      }
      const allowedTypes = ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];
      const allowedExts = /\.(pdf|doc|docx)$/i;
      if (!allowedTypes.includes(cvFile.type) && !allowedExts.test(cvFile.name)) {
        setError('CV must be a PDF or Word document (.pdf, .doc, .docx)');
        return false;
      }
      for (const cert of certificateFiles) {
        if (!allowedTypes.includes(cert.type) && !allowedExts.test(cert.name)) {
          setError(`Certificate "${cert.name}" must be a PDF or Word document (.pdf, .doc, .docx)`);
          return false;
        }
      }
    }
    return true;
  };

  const submitHandler = async (e) => {
    e.preventDefault();
    setError('');
    
    if (!validateForm()) {
      return;
    }

    setLoading(true);
    
    try {
      const normalizedEmail = email.trim();

      let data;

      if (role === 'instructor') {
        // Use FormData for instructor registration (file uploads)
        const formData = new FormData();
        formData.append('name', name.trim());
        formData.append('email', normalizedEmail);
        formData.append('password', password);
        formData.append('role', role);
        if (referralCode.trim()) formData.append('referralCode', referralCode.trim().toUpperCase());
        if (cvFile) formData.append('cv', cvFile);
        certificateFiles.forEach(f => formData.append('certificates', f));

        const response = await axios.post(`${BASE_URL}/users`, formData, {
          headers: { 'Content-Type': 'multipart/form-data' },
        });
        data = response.data;
      } else {
        // Student: plain JSON
        const response = await axios.post(
          `${BASE_URL}/users`,
          {
            name: name.trim(),
            email: normalizedEmail,
            password,
            role,
            referralCode: referralCode.trim().toUpperCase()
          },
          { headers: { 'Content-Type': 'application/json' } }
        );
        data = response.data;
      }
      
      setError('');
      setLoading(false);
      
      if (data.requiresOTP) {
        setStep(2);
        alert(data.message);
      } else {
        const successMessage = role === 'instructor' 
          ? 'Registration successful! Your instructor account is pending approval.' 
          : 'Registration successful! Redirecting to dashboard...';
        
        alert(successMessage);
        
        login(data);
        navigate(getPostAuthRoute(data));
      }
    } catch (err) {
      console.error('Registration error:', err);
      
      if (err.code === 'ECONNABORTED' || err.message === 'Network Error') {
        setError('The server is taking a bit longer to respond. If you are redirected shortly, it worked! Otherwise, please try signing in.');
      } else if (err.response?.data?.message) {
        setError(err.response.data.message);
      } else {
        setError('Registration failed. Please check your connection or try a different email.');
      }
    } finally {
      setLoading(false);
    }
  };

  const verifyOtpHandler = async (e) => {
    e.preventDefault();
    if (!otp.trim()) {
      setError('Please enter the OTP');
      return;
    }
    
    setLoading(true);
    setError('');
    
    try {
      const config = { headers: { 'Content-Type': 'application/json' } };
      const { data } = await axios.post(
        `${BASE_URL}/users/verify-otp`, 
        { email: email.trim(), otp: otp.trim() }, 
        config
      );
      
      setLoading(false);
      const successMessage = data.role === 'instructor' 
        ? 'Verification successful! Your instructor account is pending approval.' 
        : 'Verification successful! Redirecting to dashboard...';
        
      alert(successMessage);
      
      login(data);
      navigate(getPostAuthRoute(data));
    } catch (err) {
      console.error('OTP Verification error:', err);
      setError(err.response?.data?.message || 'Verification failed. Please check the code and try again.');
      setLoading(false);
    }
  };

  const resendOtpHandler = async () => {
    setLoading(true);
    setError('');
    
    try {
      const config = { headers: { 'Content-Type': 'application/json' } };
      const { data } = await axios.post(
        `${BASE_URL}/users/resend-otp`, 
        { email: email.trim() }, 
        config
      );
      
      setLoading(false);
      alert(data.message || 'A new OTP has been sent to your email.');
    } catch (err) {
      console.error('Resend OTP error:', err);
      setError(err.response?.data?.message || 'Failed to resend OTP. Please try again.');
      setLoading(false);
    }
  };

  /* Shared input class */
  const inputClass =
    "mt-1 block w-full px-4 py-3 border border-gray-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 placeholder-gray-400 dark:placeholder-zinc-500 text-[#111827] dark:text-[#F9FAFB] rounded-xl text-[16px] font-bold leading-[1.5] focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors";

  const labelClass = "block text-[16px] font-bold leading-[1.5] text-[#111827] dark:text-[#F9FAFB]";

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50 dark:from-zinc-950 dark:via-indigo-950 dark:to-zinc-950 py-12 px-4 sm:px-6 lg:px-8 transition-colors duration-300"
    
     style={{
        backgroundImage: "url('/images/signup.jpg')",
        backgroundSize: "cover",
        backgroundPosition: "center",
        backgroundRepeat: "no-repeat"
      }}
    >
      <div className="max-w-md w-full space-y-8 bg-gradient-to-br from-indigo-600 via-purple-600 to-pink-600 p-1 rounded-2xl shadow-2xl">
        <div className="bg-white dark:bg-zinc-900 p-10 rounded-xl transition-colors duration-300"
       
        >
          <div className="text-center">
            <div className="flex justify-center mb-4">
              <div className="p-3 bg-gradient-to-br from-indigo-600 to-purple-600 rounded-xl shadow-lg">
                <GraduationCap className="h-8 w-8 text-white" />
              </div>
            </div>
            <h2 className="text-[32px] font-bold leading-[1.5] text-[#111827] dark:text-[#F9FAFB]">Create an account</h2>
            <p className="mt-2 text-[16px] leading-[1.5] font-bold text-gray-600 dark:text-gray-300">Join OICT TUTOR today</p>
          </div>
          
          {error && (
            <div className="mt-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-600 dark:text-red-400 p-4 rounded-lg text-[16px] font-bold leading-[1.5]">
              {error}
            </div>
          )}

          {step === 1 ? (
          <form className="mt-8 space-y-6" onSubmit={submitHandler}>
            <div className="space-y-4">
              <div>
                <label className={labelClass}>Full Name *</label>
                <input 
                  type="text" 
                  required 
                  autoComplete="name"
                  className={inputClass}
                  placeholder="John Doe" 
                  value={name} 
                  onChange={(e) => setName(e.target.value)}
                  disabled={loading}
                />
              </div>
              <div>
                <label className={labelClass}>Email address *</label>
                <input 
                  type="email" 
                  name="email"
                  required 
                  autoComplete="email"
                  autoCapitalize="none"
                  inputMode="email"
                  spellCheck={false}
                  className={inputClass}
                  placeholder="you@example.com" 
                  value={email} 
                  onChange={(e) => setEmail(e.target.value)}
                  disabled={loading}
                />
              </div>
              <div>
                <label className={labelClass}>Password *</label>
                <div className="relative mt-1">
                  <input 
                    type={showPassword ? "text" : "password"}
                    name="password"
                    required 
                    autoComplete="new-password"
                    className="block w-full px-4 py-3 pr-12 border border-gray-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 placeholder-gray-400 dark:placeholder-zinc-500 text-[#111827] dark:text-[#F9FAFB] rounded-xl text-[16px] font-bold leading-[1.5] focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors"
                    placeholder="••••••••" 
                    value={password} 
                    onChange={(e) => setPassword(e.target.value)}
                    disabled={loading}
                    minLength={6}
                  />
                  <button
                    type="button"
                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 transition-colors"
                    onClick={() => setShowPassword(!showPassword)}
                    disabled={loading}
                  >
                    {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                  </button>
                </div>
                <p className="mt-1 text-[16px] leading-[1.5] font-bold text-gray-600 dark:text-gray-300">Minimum 6 characters</p>
              </div>
              <div>
                <label className={labelClass}>Confirm Password *</label>
                <div className="relative mt-1">
                  <input 
                    type={showConfirmPassword ? "text" : "password"}
                    name="confirmPassword"
                    required 
                    autoComplete="new-password"
                    className="block w-full px-4 py-3 pr-12 border border-gray-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 placeholder-gray-400 dark:placeholder-zinc-500 text-[#111827] dark:text-[#F9FAFB] rounded-xl text-[16px] font-bold leading-[1.5] focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors"
                    placeholder="••••••••" 
                    value={confirmPassword} 
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    disabled={loading}
                    minLength={6}
                  />
                  <button
                    type="button"
                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 transition-colors"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    disabled={loading}
                  >
                    {showConfirmPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                  </button>
                </div>
              </div>
              <div>
                <label className={labelClass}>I am a...</label>
                <select 
                  className="mt-1 block w-full px-4 py-3 border border-gray-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-[#111827] dark:text-[#F9FAFB] rounded-xl text-[16px] font-bold leading-[1.5] focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors"
                  value={role} 
                  onChange={(e) => setRole(e.target.value)}
                  disabled={loading}
                >
                  <option value="student">Student</option>
                  <option value="instructor">Instructor</option>
                </select>
              </div>

              {/* Instructor document uploads – shown only for instructor role */}
              {role === 'instructor' && (
                <div className="space-y-4 border border-indigo-200 dark:border-indigo-800 rounded-xl p-4 bg-indigo-50/60 dark:bg-indigo-950/30">
                  <div className="flex items-start gap-2 mb-1">
                    <FileText className="h-5 w-5 text-indigo-500 mt-0.5 flex-shrink-0" />
                    <div>
                      <p className="text-[15px] font-bold text-indigo-700 dark:text-indigo-300">Instructor Documents</p>
                      <p className="text-[13px] text-indigo-600 dark:text-indigo-400">These documents help the admin verify your qualifications before approving your account.</p>
                    </div>
                  </div>

                  {/* CV Upload – Required */}
                  <div>
                    <label className="block text-[15px] font-bold leading-[1.5] text-[#111827] dark:text-[#F9FAFB]">
                      CV / Resume <span className="text-red-500">*</span> <span className="text-[12px] font-normal text-gray-500">(PDF or Word)</span>
                    </label>
                    {cvFile ? (
                      <div className="mt-2 flex items-center gap-2 bg-white dark:bg-zinc-800 border border-indigo-300 dark:border-indigo-700 rounded-lg px-3 py-2">
                        <FileText className="h-4 w-4 text-indigo-500 flex-shrink-0" />
                        <span className="text-sm text-gray-700 dark:text-gray-300 flex-1 truncate">{cvFile.name}</span>
                        <button
                          type="button"
                          onClick={() => setCvFile(null)}
                          disabled={loading}
                          className="text-red-500 hover:text-red-700 transition-colors flex-shrink-0"
                          title="Remove CV"
                        >
                          <X className="h-4 w-4" />
                        </button>
                      </div>
                    ) : (
                      <label className="mt-2 flex items-center gap-3 cursor-pointer border-2 border-dashed border-indigo-300 dark:border-indigo-700 rounded-xl p-4 hover:border-indigo-500 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 transition-all">
                        <Upload className="h-5 w-5 text-indigo-500 flex-shrink-0" />
                        <span className="text-[14px] font-medium text-gray-600 dark:text-gray-400">Click to upload your CV</span>
                        <input
                          type="file"
                          className="hidden"
                          accept=".pdf,.doc,.docx,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
                          disabled={loading}
                          onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (file) setCvFile(file);
                            e.target.value = '';
                          }}
                        />
                      </label>
                    )}
                  </div>

                  {/* Certificates Upload – Optional */}
                  <div>
                    <label className="block text-[15px] font-bold leading-[1.5] text-[#111827] dark:text-[#F9FAFB]">
                      Certificates <span className="text-[12px] font-normal text-gray-500">(Optional, PDF or Word, up to 5)</span>
                    </label>
                    {certificateFiles.length > 0 && (
                      <div className="mt-2 space-y-1">
                        {certificateFiles.map((f, idx) => (
                          <div key={idx} className="flex items-center gap-2 bg-white dark:bg-zinc-800 border border-gray-200 dark:border-zinc-700 rounded-lg px-3 py-2">
                            <FileText className="h-4 w-4 text-gray-400 flex-shrink-0" />
                            <span className="text-sm text-gray-700 dark:text-gray-300 flex-1 truncate">{f.name}</span>
                            <button
                              type="button"
                              onClick={() => setCertificateFiles(prev => prev.filter((_, i) => i !== idx))}
                              disabled={loading}
                              className="text-red-500 hover:text-red-700 transition-colors flex-shrink-0"
                              title="Remove"
                            >
                              <X className="h-4 w-4" />
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                    {certificateFiles.length < 5 && (
                      <label className="mt-2 flex items-center gap-3 cursor-pointer border-2 border-dashed border-gray-300 dark:border-zinc-700 rounded-xl p-4 hover:border-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 transition-all">
                        <Upload className="h-5 w-5 text-gray-400 flex-shrink-0" />
                        <span className="text-[14px] font-medium text-gray-600 dark:text-gray-400">
                          {certificateFiles.length === 0 ? 'Click to add certificates (optional)' : 'Add another certificate'}
                        </span>
                        <input
                          type="file"
                          className="hidden"
                          accept=".pdf,.doc,.docx,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
                          multiple
                          disabled={loading}
                          onChange={(e) => {
                            const newFiles = Array.from(e.target.files || []);
                            setCertificateFiles(prev => {
                              const combined = [...prev, ...newFiles];
                              return combined.slice(0, 5);
                            });
                            e.target.value = '';
                          }}
                        />
                      </label>
                    )}
                  </div>
                </div>
              )}

              <div>
                <label className={labelClass}>Referral Code (Optional)</label>
                <input 
                  type="text" 
                  className={`${inputClass} uppercase`}
                  placeholder="XXXXXX" 
                  value={referralCode} 
                  onChange={(e) => setReferralCode(e.target.value)}
                  disabled={loading}
                />
                <p className="mt-1 text-[16px] leading-[1.5] font-bold text-gray-600 dark:text-gray-300">Were you referred by someone? Enter their code above.</p>
              </div>
            </div>

            <button  
              type="submit" 
              disabled={loading} 
              className="w-full flex justify-center py-3 px-4 border border-transparent text-[16px] font-bold leading-[1.5] rounded-xl text-[#F9FAFB] bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg shadow-indigo-600/25 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 dark:focus:ring-offset-zinc-900"
            >
              {loading ? (
                <div className="flex items-center gap-2">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  Creating account...
                </div>
              ) : (
                'Create account'
              )}
            </button>
          </form>
          ) : (
          <form className="mt-8 space-y-6" onSubmit={verifyOtpHandler}>
            <div className="space-y-4">
              <div>
                <label className={labelClass}>Enter OTP</label>
                <input 
                  type="text" 
                  required 
                  className={inputClass}
                  placeholder="123456" 
                  value={otp} 
                  onChange={(e) => setOtp(e.target.value)}
                  disabled={loading}
                  maxLength={6}
                />
                <p className="mt-2 text-[16px] leading-[1.5] font-bold text-gray-600 dark:text-gray-300">
                  We sent a verification code to <strong className="text-[#111827] dark:text-[#F9FAFB]">{email}</strong>.
                </p>
              </div>
            </div>

            <div className="flex flex-col space-y-4">
              <button  
                type="submit" 
                disabled={loading} 
                className="w-full flex justify-center py-3 px-4 border border-transparent text-[16px] font-bold leading-[1.5] rounded-xl text-[#F9FAFB] bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg shadow-indigo-600/25 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 dark:focus:ring-offset-zinc-900"
              >
                {loading ? (
                  <div className="flex items-center gap-2">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    Verifying...
                  </div>
                ) : (
                  'Verify Email'
                )}
              </button>
              
              <button
                type="button"
                onClick={resendOtpHandler}
                disabled={loading}
                className="text-[16px] font-bold leading-[1.5] text-indigo-600 dark:text-indigo-400 hover:text-indigo-500 dark:hover:text-indigo-300 transition-colors bg-transparent border-none cursor-pointer text-center"
              >
                Didn't receive the code? Resend OTP
              </button>
              <button
                type="button"
                onClick={() => setStep(1)}
                disabled={loading}
                className="text-[16px] font-bold leading-[1.5] text-gray-600 dark:text-gray-300 hover:text-[#111827] dark:hover:text-[#F9FAFB] transition-colors bg-transparent border-none cursor-pointer text-center"
              >
                Back to Registration
              </button>
            </div>
          </form>
          )}
          
          <p className="mt-4 text-center text-[16px] leading-[1.5] font-bold text-gray-600 dark:text-gray-300">
            Already have an account?{' '}
            <Link to="/login" className="font-bold text-indigo-600 dark:text-indigo-400 hover:text-indigo-500 dark:hover:text-indigo-300 transition-colors">
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default RegisterPage;
