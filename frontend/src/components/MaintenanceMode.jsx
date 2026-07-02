import { useEffect, useState } from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';
import BASE_URL from '../api/config';

const MaintenanceMode = () => {
  const [settings, setSettings] = useState(null);
  const [countdown, setCountdown] = useState(30);

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const response = await fetch(`${BASE_URL}/settings`);
        const data = await response.json();
        setSettings(data);
      } catch (error) {
        console.error('Error fetching settings:', error);
      }
    };

    fetchSettings();
    const interval = setInterval(fetchSettings, 10000); // Check every 10 seconds
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (!settings?.maintenanceMode) return;
    
    const timer = setInterval(() => {
      setCountdown(prev => prev > 0 ? prev - 1 : 30);
    }, 1000);
    
    return () => clearInterval(timer);
  }, [settings?.maintenanceMode]);

  if (!settings?.maintenanceMode) return null;

  return (
    <div className="min-h-screen bg-gradient-to-br from-red-50 via-orange-50 to-yellow-50 dark:from-zinc-900 dark:via-zinc-800 dark:to-zinc-900 flex items-center justify-center p-4">
      <div className="max-w-2xl w-full">
        <div className="bg-white dark:bg-zinc-900 rounded-[3rem] shadow-2xl p-12 border-4 border-red-200 dark:border-red-900/30">
          {/* Animated Icon */}
          <div className="flex justify-center mb-8">
            <div className="relative">
              <div className="absolute inset-0 bg-red-500/20 rounded-full animate-ping"></div>
              <div className="relative bg-red-100 dark:bg-red-900/30 p-6 rounded-full">
                <AlertTriangle className="h-16 w-16 text-red-600 dark:text-red-400" />
              </div>
            </div>
          </div>

          {/* Main Message */}
          <div className="text-center mb-8">
            <h1 className="text-4xl md:text-5xl font-black text-gray-900 dark:text-white mb-4 tracking-tight">
              System Under Maintenance
            </h1>
            <p className="text-xl text-gray-600 dark:text-gray-400 font-medium leading-relaxed">
              We're performing scheduled maintenance to improve your experience. 
              The platform will be back online shortly.
            </p>
          </div>

          {/* Info Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
            <div className="bg-red-50 dark:bg-red-900/10 rounded-2xl p-6 border border-red-100 dark:border-red-900/30">
              <div className="flex items-center gap-3 mb-2">
                <RefreshCw className="h-5 w-5 text-red-600 dark:text-red-400 animate-spin" />
                <span className="text-sm font-black text-red-900 dark:text-red-400 uppercase tracking-widest">
                  Auto-refreshing
                </span>
              </div>
              <p className="text-xs text-gray-600 dark:text-gray-400">
                Page will automatically reload when maintenance is complete
              </p>
            </div>
            <div className="bg-orange-50 dark:bg-orange-900/10 rounded-2xl p-6 border border-orange-100 dark:border-orange-900/30">
              <div className="text-sm font-black text-orange-900 dark:text-orange-400 uppercase tracking-widest mb-2">
                Next Check
              </div>
              <p className="text-2xl font-black text-gray-900 dark:text-white">
                {countdown}s
              </p>
            </div>
          </div>

          {/* Contact Info */}
          <div className="bg-gray-50 dark:bg-zinc-800 rounded-2xl p-6 border border-gray-100 dark:border-zinc-700">
            <h3 className="text-sm font-black text-gray-900 dark:text-white uppercase tracking-widest mb-3">
              Need Immediate Assistance?
            </h3>
            <p className="text-gray-600 dark:text-gray-400 text-sm mb-4">
              Contact our support team for urgent matters during maintenance:
            </p>
            <div className="flex flex-col gap-2">
              <a 
                href={`mailto:${settings?.siteEmail || 'support@oicttutor.com'}`}
                className="flex items-center gap-3 text-indigo-600 dark:text-indigo-400 font-black hover:underline"
              >
                <span className="bg-indigo-100 dark:bg-indigo-900/30 p-2 rounded-lg">
                  📧
                </span>
                {settings?.siteEmail || 'support@oicttutor.com'}
              </a>
            </div>
          </div>

          {/* Progress Bar */}
          <div className="mt-8">
            <div className="h-2 bg-gray-200 dark:bg-zinc-700 rounded-full overflow-hidden">
              <div 
                className="h-full bg-gradient-to-r from-red-500 via-orange-500 to-yellow-500 transition-all duration-1000"
                style={{ width: `${((30 - countdown) / 30) * 100}%` }}
              ></div>
            </div>
            <p className="text-center text-xs text-gray-500 dark:text-gray-400 mt-2 font-medium">
              Checking for updates...
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="text-center mt-8">
          <p className="text-sm text-gray-500 dark:text-gray-400 font-medium">
            {settings?.siteName || 'OICT TUTOR'} Platform
          </p>
          <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
            We apologize for any inconvenience
          </p>
        </div>
      </div>
    </div>
  );
};

export default MaintenanceMode;
