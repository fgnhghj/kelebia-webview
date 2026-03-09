import React, { createContext, useContext, useState, useEffect } from 'react';

export type Lang = 'fr' | 'en' | 'ar_tn';

const translations = {
  fr: {
    good_morning: 'Bonjour',
    good_afternoon: 'Bon après-midi',
    good_evening: 'Bonsoir',
    your_rooms: 'Vos salles',
    no_rooms: 'Aucune salle',
    create_room: 'Créer une salle',
    join_room: 'Rejoindre',
    my_grades: 'Mes notes',
    refresh: 'Actualiser',
    home: 'Accueil',
    explore: 'Explorer',
    grades: 'Notes',
    notifications: 'Alertes',
    profile: 'Profil',
    create: 'Créer',
    content: 'Contenu',
    tasks: 'Devoirs',
    news: 'Annonces',
    no_content: 'Aucun contenu',
    no_assignments: 'Aucun devoir',
    no_announcements: 'Aucune annonce',
    loading: 'Chargement...',
    error: 'Erreur',
    cancel: 'Annuler',
    save: 'Enregistrer',
    submit: 'Soumettre',
    delete: 'Supprimer',
    leave_room: 'Quitter la salle',
    add_section: 'Ajouter une section',
    add_content: 'Ajouter du contenu',
    add_assignment: 'Ajouter un devoir',
    add_announcement: 'Faire une annonce',
    your_submission: 'Votre soumission',
    submitted: 'Soumis',
    graded: 'Noté',
    settings: 'Paramètres',
    language: 'Langue',
    logout: 'Déconnexion',
    version: 'Version',
    made_by: 'Fait par',
    enter_code: "Code d'invitation...",
    join: 'Rejoindre',
    mark_all_read: 'Tout marquer lu',
    delete_all: 'Tout supprimer',
    no_notifications: 'Aucune notification',
    overall_avg: 'Moyenne',
    rooms: 'Salles',
    no_grades: 'Aucune note',
    welcome_back: 'Bon retour',
    sign_in: 'Se connecter',
    create_account: 'Créer un compte',
    comments: 'Commentaires',
    add_comment: 'Ajouter un commentaire...',
    post: 'Publier',
    no_comments: 'Aucun commentaire',
    no_deadline: 'Pas de délai',
    past_due: 'En retard',
    due_soon: 'Urgent',
    today: "Aujourd'hui",
    yesterday: 'Hier',
    students: 'étudiants',
    invite_code: "Code d'invitation",
    section_name: 'Nom de la section',
    title: 'Titre',
    description: 'Description',
    deadline: 'Date limite',
    max_score: 'Note max',
    link: 'Lien',
    file: 'Fichier',
    content_type: 'Type',
    pinned: 'Épinglé',
    optional: 'Optionnel',
    leave_confirm: 'Quitter cette salle ?',
  },
  en: {
    good_morning: 'Good morning',
    good_afternoon: 'Good afternoon',
    good_evening: 'Good evening',
    your_rooms: 'Your Rooms',
    no_rooms: 'No rooms yet',
    create_room: 'Create Room',
    join_room: 'Join Room',
    my_grades: 'My Grades',
    refresh: 'Refresh',
    home: 'Home',
    explore: 'Explore',
    grades: 'Grades',
    notifications: 'Alerts',
    profile: 'Profile',
    create: 'Create',
    content: 'Content',
    tasks: 'Tasks',
    news: 'News',
    no_content: 'No content yet',
    no_assignments: 'No assignments yet',
    no_announcements: 'No announcements yet',
    loading: 'Loading...',
    error: 'Error',
    cancel: 'Cancel',
    save: 'Save',
    submit: 'Submit',
    delete: 'Delete',
    leave_room: 'Leave Room',
    add_section: 'Add Section',
    add_content: 'Add Content',
    add_assignment: 'Add Assignment',
    add_announcement: 'New Announcement',
    your_submission: 'Your Submission',
    submitted: 'Submitted',
    graded: 'Graded',
    settings: 'Settings',
    language: 'Language',
    logout: 'Log out',
    version: 'Version',
    made_by: 'Made by',
    enter_code: 'Enter invite code...',
    join: 'Join',
    mark_all_read: 'Mark all read',
    delete_all: 'Delete all',
    no_notifications: 'No notifications',
    overall_avg: 'Overall Avg',
    rooms: 'Rooms',
    no_grades: 'No grades yet',
    welcome_back: 'Welcome back',
    sign_in: 'Sign In',
    create_account: 'Create Account',
    comments: 'Comments',
    add_comment: 'Add a comment...',
    post: 'Post',
    no_comments: 'No comments yet',
    no_deadline: 'No deadline',
    past_due: 'Past due',
    due_soon: 'Due soon',
    today: 'Today',
    yesterday: 'Yesterday',
    students: 'students',
    invite_code: 'Invite Code',
    section_name: 'Section name',
    title: 'Title',
    description: 'Description',
    deadline: 'Deadline',
    max_score: 'Max score',
    link: 'Link',
    file: 'File',
    content_type: 'Type',
    pinned: 'Pinned',
    optional: 'Optional',
    leave_confirm: 'Leave this room?',
  },
  ar_tn: {
    good_morning: 'صباح الخير',
    good_afternoon: 'مسا الخير',
    good_evening: 'مسا النور',
    your_rooms: 'قاعاتك',
    no_rooms: 'ما فماش قاعات',
    create_room: 'سوّق قاعة',
    join_room: 'دخل قاعة',
    my_grades: 'نتائجي',
    refresh: 'حدّث',
    home: 'الرئيسية',
    explore: 'اكتشف',
    grades: 'النتائج',
    notifications: 'الإشعارات',
    profile: 'الملف',
    create: 'سوّق',
    content: 'المحتوى',
    tasks: 'الواجبات',
    news: 'الأخبار',
    no_content: 'ما فماش محتوى',
    no_assignments: 'ما فماش واجبات',
    no_announcements: 'ما فماش إعلانات',
    loading: 'يتحمّل...',
    error: 'خطأ',
    cancel: 'باطل',
    save: 'حفظ',
    submit: 'سلّم',
    delete: 'امسح',
    leave_room: 'اخرج من القاعة',
    add_section: 'زيد فصل',
    add_content: 'زيد محتوى',
    add_assignment: 'زيد واجب',
    add_announcement: 'إعلان جديد',
    your_submission: 'تسليمك',
    submitted: 'تسلّم',
    graded: 'مصحّح',
    settings: 'الإعدادات',
    language: 'اللغة',
    logout: 'اخرج',
    version: 'الإصدار',
    made_by: 'صنع بيدو',
    enter_code: 'حط الكود...',
    join: 'دخل',
    mark_all_read: 'علّم كلش مقروء',
    delete_all: 'احذف كلش',
    no_notifications: 'ما فماش إشعارات',
    overall_avg: 'المعدل',
    rooms: 'القاعات',
    no_grades: 'ما فماش نتائج',
    welcome_back: 'مرحبا بيك',
    sign_in: 'دخل',
    create_account: 'سجّل',
    comments: 'التعليقات',
    add_comment: 'زيد تعليق...',
    post: 'نشر',
    no_comments: 'ما فماش تعليقات',
    no_deadline: 'بلا أجل',
    past_due: 'فات الأجل',
    due_soon: 'يحلّ قريب',
    today: 'اليوم',
    yesterday: 'أمس',
    students: 'طلاب',
    invite_code: 'كود الدعوة',
    section_name: 'اسم الفصل',
    title: 'العنوان',
    description: 'الوصف',
    deadline: 'أجل التسليم',
    max_score: 'أقصى نقطة',
    link: 'رابط',
    file: 'ملف',
    content_type: 'النوع',
    pinned: 'مثبّت',
    optional: 'اختياري',
    leave_confirm: 'تخرج من القاعة؟',
  },
};

export type TranslationKey = keyof typeof translations.en;

interface LanguageContextType {
  lang: Lang;
  setLang: (lang: Lang) => void;
  t: (key: TranslationKey) => string;
  isRTL: boolean;
}

const LanguageContext = createContext<LanguageContextType | null>(null);

const LANG_LABELS: Record<Lang, string> = {
  fr: 'Français',
  en: 'English',
  ar_tn: 'تونسي',
};

export const LANG_OPTIONS: { value: Lang; label: string; flag: string }[] = [
  { value: 'fr', label: 'Français', flag: '🇫🇷' },
  { value: 'en', label: 'English', flag: '🇬🇧' },
  { value: 'ar_tn', label: 'تونسي', flag: '🇹🇳' },
];

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const stored = localStorage.getItem('app_lang') as Lang | null;
  const [lang, setLangState] = useState<Lang>(stored || 'fr');

  const setLang = (newLang: Lang) => {
    localStorage.setItem('app_lang', newLang);
    setLangState(newLang);
    document.documentElement.dir = newLang === 'ar_tn' ? 'rtl' : 'ltr';
    document.documentElement.lang = newLang === 'ar_tn' ? 'ar' : newLang;
  };

  useEffect(() => {
    document.documentElement.dir = lang === 'ar_tn' ? 'rtl' : 'ltr';
    document.documentElement.lang = lang === 'ar_tn' ? 'ar' : lang;
  }, [lang]);

  const t = (key: TranslationKey): string => {
    return (translations[lang] as any)[key] ?? (translations.en as any)[key] ?? key;
  };

  return (
    <LanguageContext.Provider value={{ lang, setLang, t, isRTL: lang === 'ar_tn' }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const ctx = useContext(LanguageContext);
  if (!ctx) throw new Error('useLanguage must be used within LanguageProvider');
  return ctx;
}

export { LANG_LABELS };
