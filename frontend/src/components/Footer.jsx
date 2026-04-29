import { GraduationCap, Mail, Phone, MapPin } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

const Footer = () => {
  const { t } = useTranslation();
  return (
    <footer className="bg-white dark:bg-zinc-950 border-t pt-12 pb-6">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
          {/* Brand Section */}
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <div className="p-2 bg-gradient-to-br from-indigo-600 to-purple-600 rounded-lg shadow-md">
                <GraduationCap className="h-6 w-6 text-white" />
              </div>
              <span className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-indigo-600 to-purple-600">
                OICT TUTOR
              </span>
            </div>
            <p className="text-gray-600 dark:text-gray-400 text-sm leading-relaxed">
              {t('footer.desc')}
            </p>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="text-gray-900 dark:text-white font-semibold mb-4">{t('footer.quick_links')}</h4>
            <ul className="space-y-3">
              <li><Link to="/" className="text-gray-600 dark:text-gray-400 hover:text-indigo-600 transition-colors text-sm">{t('nav.home')}</Link></li>
              <li><Link to="/courses" className="text-gray-600 dark:text-gray-400 hover:text-indigo-600 transition-colors text-sm">{t('nav.courses')}</Link></li>
              <li><Link to="/about" className="text-gray-600 dark:text-gray-400 hover:text-indigo-600 transition-colors text-sm">{t('nav.about')}</Link></li>
              <li><Link to="/register" className="text-gray-600 dark:text-gray-400 hover:text-indigo-600 transition-colors text-sm">{t('footer.become_instructor')}</Link></li>
            </ul>
          </div>

          {/* For Students */}
          <div>
            <h4 className="text-gray-900 dark:text-white font-semibold mb-4">{t('footer.for_students')}</h4>
            <ul className="space-y-3">
              <li><Link to="/dashboard" className="text-gray-600 dark:text-gray-400 hover:text-indigo-600 transition-colors text-sm">{t('nav.dashboard')}</Link></li>
              <li><Link to="/courses" className="text-gray-600 dark:text-gray-400 hover:text-indigo-600 transition-colors text-sm">{t('course.catalog_title')}</Link></li>
              <li><Link to="/login" className="text-gray-600 dark:text-gray-400 hover:text-indigo-600 transition-colors text-sm">{t('nav.login')}</Link></li>
              <li><Link to="/register" className="text-gray-600 dark:text-gray-400 hover:text-indigo-600 transition-colors text-sm">{t('nav.register')}</Link></li>
            </ul>
          </div>

          {/* Contact Info */}
          <div>
            <h4 className="text-gray-900 dark:text-white font-semibold mb-4">{t('footer.contact_us')}</h4>
            <ul className="space-y-3">
              <li className="flex items-center gap-2 text-gray-600 dark:text-gray-400 text-sm">
                <Mail className="h-4 w-4 text-indigo-600" />
                <a href="mailto:mesayboja3@gmail.com" className="hover:text-indigo-600 transition-colors">
                  mesayboja3@gmail.com
                </a>
              </li>
              <li className="flex items-center gap-2 text-gray-600 dark:text-gray-400 text-sm">
                <Phone className="h-4 w-4 text-indigo-600" />
                <a href="tel:+251939648955" className="hover:text-indigo-600 transition-colors">
                  +251 939 648 955
                </a>
              </li>
              <li className="flex items-start gap-2 text-gray-600 dark:text-gray-400 text-sm">
                <MapPin className="h-4 w-4 text-indigo-600 mt-0.5" />
                <span>{t('footer.address')}</span>
              </li>
            </ul>
          </div>
        </div>

        <div className="pt-6 border-t border-gray-200 dark:border-zinc-800 flex flex-col md:flex-row justify-between items-center gap-4">
          <p className="text-gray-500 dark:text-gray-400 text-sm">
            &copy; {new Date().getFullYear()} OICT TUTOR. {t('footer.rights_reserved')}
          </p>
          <div className="flex gap-6 text-sm">
            <Link to="/privacy" className="text-gray-500 dark:text-gray-400 hover:text-indigo-600 transition-colors">
              {t('footer.privacy')}
            </Link>
            <Link to="/terms" className="text-gray-500 dark:text-gray-400 hover:text-indigo-600 transition-colors">
              {t('footer.terms')}
            </Link>
            <Link to="/contact" className="text-gray-500 dark:text-gray-400 hover:text-indigo-600 transition-colors">
              {t('footer.contact')}
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
