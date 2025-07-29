import React, { createContext, useContext, useEffect, useState } from 'react';

type Theme = 'dark' | 'light' | 'system';
type Language = 'English' | 'Spanish' | 'French' | 'German' | 'Chinese' | 'Japanese';

type ThemeProviderProps = {
  children: React.ReactNode;
  defaultTheme?: Theme;
  defaultLanguage?: Language;
  storageKey?: string;
};

type ThemeProviderState = {
  theme: Theme;
  language: Language;
  setTheme: (theme: Theme) => void;
  setLanguage: (language: Language) => void;
  toggleTheme: () => void;
};

const initialState: ThemeProviderState = {
  theme: 'system',
  language: 'English',
  setTheme: () => null,
  setLanguage: () => null,
  toggleTheme: () => null,
};

const ThemeProviderContext = createContext<ThemeProviderState>(initialState);

// Language translations
const translations = {
  English: {
    settings: 'Settings',
    profile: 'Profile',
    email: 'Email',
    dataControls: 'Data controls',
    manage: 'Manage',
    app: 'App',
    language: 'Language',
    appearance: 'Appearance',
    fontSize: 'Font size',
    about: 'About',
    checkForUpdates: 'Check for updates',
    serviceAgreement: 'Service agreement',
    contactUs: 'Contact us',
    logOut: 'Log out',
    improveModel: 'Improve the model for everyone',
    improveModelDescription: 'Allow your content to be used to train our models and improve our services. We secure your data privacy.',
    logOutAllDevices: 'Log out of all devices',
    deleteAllChats: 'Delete all chats',
    deleteAccount: 'Delete account'
  },
  Spanish: {
    settings: 'Configuración',
    profile: 'Perfil',
    email: 'Correo electrónico',
    dataControls: 'Controles de datos',
    manage: 'Gestionar',
    app: 'Aplicación',
    language: 'Idioma',
    appearance: 'Apariencia',
    fontSize: 'Tamaño de fuente',
    about: 'Acerca de',
    checkForUpdates: 'Buscar actualizaciones',
    serviceAgreement: 'Acuerdo de servicio',
    contactUs: 'Contáctanos',
    logOut: 'Cerrar sesión',
    improveModel: 'Mejorar el modelo para todos',
    improveModelDescription: 'Permitir que su contenido se use para entrenar nuestros modelos y mejorar nuestros servicios. Aseguramos la privacidad de sus datos.',
    logOutAllDevices: 'Cerrar sesión en todos los dispositivos',
    deleteAllChats: 'Eliminar todas las conversaciones',
    deleteAccount: 'Eliminar cuenta'
  },
  French: {
    settings: 'Paramètres',
    profile: 'Profil',
    email: 'E-mail',
    dataControls: 'Contrôles des données',
    manage: 'Gérer',
    app: 'Application',
    language: 'Langue',
    appearance: 'Apparence',
    fontSize: 'Taille de police',
    about: 'À propos',
    checkForUpdates: 'Vérifier les mises à jour',
    serviceAgreement: 'Accord de service',
    contactUs: 'Nous contacter',
    logOut: 'Se déconnecter',
    improveModel: 'Améliorer le modèle pour tous',
    improveModelDescription: 'Permettre que votre contenu soit utilisé pour entraîner nos modèles et améliorer nos services. Nous sécurisons la confidentialité de vos données.',
    logOutAllDevices: 'Se déconnecter de tous les appareils',
    deleteAllChats: 'Supprimer toutes les discussions',
    deleteAccount: 'Supprimer le compte'
  },
  German: {
    settings: 'Einstellungen',
    profile: 'Profil',
    email: 'E-Mail',
    dataControls: 'Datenkontrollen',
    manage: 'Verwalten',
    app: 'App',
    language: 'Sprache',
    appearance: 'Erscheinungsbild',
    fontSize: 'Schriftgröße',
    about: 'Über',
    checkForUpdates: 'Nach Updates suchen',
    serviceAgreement: 'Servicevereinbarung',
    contactUs: 'Kontaktieren Sie uns',
    logOut: 'Abmelden',
    improveModel: 'Das Modell für alle verbessern',
    improveModelDescription: 'Erlauben Sie, dass Ihr Inhalt zur Schulung unserer Modelle und zur Verbesserung unserer Dienste verwendet wird. Wir sichern Ihre Datenprivatsphäre.',
    logOutAllDevices: 'Von allen Geräten abmelden',
    deleteAllChats: 'Alle Chats löschen',
    deleteAccount: 'Konto löschen'
  },
  Chinese: {
    settings: '设置',
    profile: '个人资料',
    email: '邮箱',
    dataControls: '数据控制',
    manage: '管理',
    app: '应用',
    language: '语言',
    appearance: '外观',
    fontSize: '字体大小',
    about: '关于',
    checkForUpdates: '检查更新',
    serviceAgreement: '服务协议',
    contactUs: '联系我们',
    logOut: '登出',
    improveModel: '为所有人改进模型',
    improveModelDescription: '允许您的内容用于训练我们的模型并改进我们的服务。我们保护您的数据隐私。',
    logOutAllDevices: '从所有设备登出',
    deleteAllChats: '删除所有聊天',
    deleteAccount: '删除账户'
  },
  Japanese: {
    settings: '設定',
    profile: 'プロフィール',
    email: 'メール',
    dataControls: 'データ制御',
    manage: '管理',
    app: 'アプリ',
    language: '言語',
    appearance: '外観',
    fontSize: 'フォントサイズ',
    about: 'について',
    checkForUpdates: 'アップデートを確認',
    serviceAgreement: 'サービス契約',
    contactUs: 'お問い合わせ',
    logOut: 'ログアウト',
    improveModel: '皆のためにモデルを改善',
    improveModelDescription: 'あなたのコンテンツを私たちのモデルの訓練とサービスの改善に使用することを許可します。私たちはあなたのデータプライバシーを保護します。',
    logOutAllDevices: 'すべてのデバイスからログアウト',
    deleteAllChats: 'すべてのチャットを削除',
    deleteAccount: 'アカウントを削除'
  }
};

export function ThemeProvider({
  children,
  defaultTheme = 'system',
  defaultLanguage = 'English',
  storageKey = 'theme',
  ...props
}: ThemeProviderProps) {
  const [theme, setTheme] = useState<Theme>(
    () => (localStorage.getItem(storageKey) as Theme) || defaultTheme
  );

  const [language, setLanguage] = useState<Language>(
    () => (localStorage.getItem('language') as Language) || defaultLanguage
  );

  useEffect(() => {
    const root = window.document.documentElement;

    root.classList.remove('light', 'dark');

    if (theme === 'system') {
      const systemTheme = window.matchMedia('(prefers-color-scheme: dark)')
        .matches
        ? 'dark'
        : 'light';

      root.classList.add(systemTheme);
      return;
    }

    root.classList.add(theme);
  }, [theme]);

  // Update document language when language changes
  useEffect(() => {
    const langCodes = {
      English: 'en',
      Spanish: 'es',
      French: 'fr',
      German: 'de',
      Chinese: 'zh',
      Japanese: 'ja'
    };

    document.documentElement.lang = langCodes[language];
  }, [language]);

  const value = {
    theme,
    language,
    setTheme: (theme: Theme) => {
      localStorage.setItem(storageKey, theme);
      setTheme(theme);
    },
    setLanguage: (language: Language) => {
      localStorage.setItem('language', language);
      setLanguage(language);
    },
    toggleTheme: () => {
      const themes: Theme[] = ['system', 'light', 'dark'];
      const currentIndex = themes.indexOf(theme);
      const nextTheme = themes[(currentIndex + 1) % themes.length];
      localStorage.setItem(storageKey, nextTheme);
      setTheme(nextTheme);
    }
  };

  return (
    <ThemeProviderContext.Provider {...props} value={value}>
      {children}
    </ThemeProviderContext.Provider>
  );
}

export const useTheme = () => {
  const context = useContext(ThemeProviderContext);

  if (context === undefined)
    throw new Error('useTheme must be used within a ThemeProvider');

  return context;
};

export const useTranslations = () => {
  const { language } = useTheme();
  return translations[language];
};