import React, { useState, useRef, useEffect } from 'react';
import { useTranslation, LanguageOption } from '../i18n/I18nContext';
import { Globe, ChevronDown, Check } from 'lucide-react';

export const LanguagePicker: React.FC<{ compact?: boolean }> = ({ compact = false }) => {
  const { lang, setLang, languages } = useTranslation();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const activeLang = languages.find((l) => l.code === lang) || languages[0];

  return (
    <div className="relative inline-block text-left" ref={ref}>
      <button
        type="button"
        onClick={() => setOpen((prev) => !prev)}
        className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-xs font-medium text-stone-600 hover:text-stone-900 bg-stone-50 hover:bg-stone-100 border border-stone-200 transition shadow-2xs"
        title="Change Language / Canviar idioma / Cambiar idioma"
        aria-label="Select language"
      >
        <Globe className="w-3.5 h-3.5 text-indigo-600" />
        <span className="font-semibold">{activeLang.short}</span>
        <ChevronDown className={`w-3 h-3 text-stone-400 transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>

      {open && (
        <div className="absolute right-0 mt-1.5 w-36 bg-white border border-stone-200 rounded-xl shadow-lg z-50 p-1 animate-in fade-in zoom-in-95 duration-100 text-xs">
          {languages.map((l: LanguageOption) => {
            const isSelected = l.code === lang;
            return (
              <button
                key={l.code}
                type="button"
                onClick={() => {
                  setLang(l.code);
                  setOpen(false);
                }}
                className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg text-left transition ${
                  isSelected
                    ? 'bg-indigo-50 text-indigo-800 font-semibold'
                    : 'text-stone-700 hover:bg-stone-100'
                }`}
              >
                <div className="flex items-center gap-2">
                  <span>{l.flag}</span>
                  <span>{l.name}</span>
                </div>
                {isSelected && <Check className="w-3.5 h-3.5 text-indigo-600 shrink-0" />}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
};
