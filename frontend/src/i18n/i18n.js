import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';

// Import translations
import en from './locales/en.json';
import es from './locales/es.json';
import pl from './locales/pl.json';
import ru from './locales/ru.json';
import hi from './locales/hi.json';
import pt from './locales/pt.json';
import ro from './locales/ro.json';
import de from './locales/de.json';
import fr from './locales/fr.json';
import uk from './locales/uk.json';

const resources = {
  en: { translation: en },
  es: { translation: es },
  pl: { translation: pl },
  ru: { translation: ru },
  hi: { translation: hi },
  pt: { translation: pt },
  ro: { translation: ro },
  de: { translation: de },
  fr: { translation: fr },
  uk: { translation: uk }
};

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources,
    fallbackLng: 'en',
    interpolation: {
      escapeValue: false
    },
    detection: {
      order: ['localStorage', 'navigator', 'htmlTag'],
      caches: ['localStorage']
    }
  });

export const languages = [
  { code: 'en', name: 'English', flag: '🇺🇸' },
  { code: 'es', name: 'Español', flag: '🇪🇸' },
  { code: 'pl', name: 'Polski', flag: '🇵🇱' },
  { code: 'ru', name: 'Русский', flag: '🇷🇺' },
  { code: 'hi', name: 'हिन्दी', flag: '🇮🇳' },
  { code: 'pt', name: 'Português', flag: '🇧🇷' },
  { code: 'ro', name: 'Română', flag: '🇷🇴' },
  { code: 'de', name: 'Deutsch', flag: '🇩🇪' },
  { code: 'fr', name: 'Français', flag: '🇫🇷' },
  { code: 'uk', name: 'Українська', flag: '🇺🇦' }
];

export default i18n;
