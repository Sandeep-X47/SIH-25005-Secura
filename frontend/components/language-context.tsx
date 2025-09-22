import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import i18n from '../i18n';

type Language = 'en' | 'ta' | 'hi' | 'te' | 'ml';

interface LanguageContextType {
	language: Language;
	setLanguage: (lang: Language) => void;
	t: (key: string) => string;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export const LanguageProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
	const [language, setLanguageState] = useState<Language>((i18n.language as Language) || 'en');

	useEffect(() => {
		const handler = (lng: string) => setLanguageState(lng as Language);
		i18n.on('languageChanged', handler);
		return () => {
			i18n.off('languageChanged', handler);
		};
	}, []);

	const setLanguage = (lang: Language) => {
		i18n.changeLanguage(lang);
	};

	const t = (key: string): string => i18n.t(key);

	return (
		<LanguageContext.Provider value={{ language, setLanguage, t }}>
			{children}
		</LanguageContext.Provider>
	);
};

export const useLanguage = () => {
	const context = useContext(LanguageContext);
	if (context === undefined) {
		throw new Error('useLanguage must be used within a LanguageProvider');
	}
	return context;
};