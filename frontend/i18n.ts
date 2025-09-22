import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';

// Static resources for quick start. You can switch to http backend later.
import enCommon from './locales/en/common.json';
import hiCommon from './locales/hi/common.json';
import taCommon from './locales/ta/common.json';
import teCommon from './locales/te/common.json';
import mlCommon from './locales/ml/common.json';

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    fallbackLng: 'en',
    supportedLngs: ['en', 'hi', 'ta', 'te', 'ml'],
    defaultNS: 'common',
    ns: ['common'],
    resources: {
      en: { common: enCommon },
      hi: { common: hiCommon },
      ta: { common: taCommon },
      te: { common: teCommon },
      ml: { common: mlCommon },
    },
    interpolation: { escapeValue: false },
    detection: {
      order: ['localStorage', 'navigator', 'htmlTag', 'cookie'],
      caches: ['localStorage'],
    },
  });

export default i18n;


