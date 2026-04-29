import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';

import enTranslations from './locales/en.json';
import amTranslations from './locales/am.json';
import omTranslations from './locales/om.json';
import esTranslations from './locales/es.json';
import frTranslations from './locales/fr.json';
import arTranslations from './locales/ar.json';

const resources = {
  en: { translation: enTranslations },
  am: { translation: amTranslations },
  om: { translation: omTranslations },
  es: { translation: esTranslations },
  fr: { translation: frTranslations },
  ar: { translation: arTranslations }
};

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources,
    fallbackLng: 'en',
    interpolation: {
      escapeValue: false // react already safes from xss
    }
  });

export default i18n;
