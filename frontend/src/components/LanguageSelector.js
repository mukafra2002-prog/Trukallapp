import { useTranslation } from 'react-i18next';
import { languages } from '@/i18n/i18n';
import { Button } from '@/components/ui/button';
import { Globe } from 'lucide-react';
import { useState } from 'react';

export default function LanguageSelector({ variant = 'default' }) {
  const { i18n } = useTranslation();
  const [isOpen, setIsOpen] = useState(false);

  const currentLang = languages.find(l => l.code === i18n.language) || languages[0];

  const changeLanguage = (code) => {
    i18n.changeLanguage(code);
    setIsOpen(false);
  };

  return (
    <div className="relative">
      <Button
        variant={variant === 'hero' ? 'ghost' : 'outline'}
        size="sm"
        onClick={() => setIsOpen(!isOpen)}
        className={variant === 'hero' ? 'text-white hover:bg-white/20' : ''}
        data-testid="language-selector"
      >
        <Globe className="w-4 h-4 mr-2" />
        <span className="mr-1">{currentLang.flag}</span>
        <span className="hidden sm:inline">{currentLang.name}</span>
      </Button>

      {isOpen && (
        <>
          <div 
            className="fixed inset-0 z-40" 
            onClick={() => setIsOpen(false)}
          />
          <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-xl border z-50 py-2">
            {languages.map((lang) => (
              <button
                key={lang.code}
                onClick={() => changeLanguage(lang.code)}
                className={`w-full px-4 py-2 text-left hover:bg-slate-100 flex items-center gap-3 ${
                  i18n.language === lang.code ? 'bg-blue-50 text-blue-600' : ''
                }`}
                data-testid={`lang-${lang.code}`}
              >
                <span className="text-xl">{lang.flag}</span>
                <span>{lang.name}</span>
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
