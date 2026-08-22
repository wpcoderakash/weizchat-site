import type { LandingPage } from '../schema';

/**
 * The Hebrew landing page, as content (ADR-0032).
 *
 * Migrated verbatim from messages/he.json `home.*` — the page renders
 * identically. This file is the fallback the site ships with; once the
 * platform CMS holds a published version, that wins and this stays as the
 * answer to "what if the CMS is unreachable".
 */
export const homeHE: LandingPage = {
  slug: 'home',
  locale: 'he',
  published: true,
  seo: {
    title: 'WeizChat — תיבת וואטסאפ משותפת עם סוכן מכירות AI',
    description: 'תיבת צוות אחת לוואטסאפ העסקי, סוכן AI שנותן מחירים אמיתיים מהקטלוג, צ\'אטבוט ואוטומציה — על ה־Cloud API הרשמי של Meta.',
  },
  sections: [
    {
      id: 'hero',
      visible: true,
      title: 'אף לקוח בוואטסאפ לא מחכה יותר.',
      sub: 'WeizChat היא תיבת וואטסאפ משותפת לכל הצוות, עם וויזיק — סוכן AI שעונה מיד, נותן מחירים אמיתיים מהקטלוג שלכם, ומעביר לנציג אנושי בכל רגע שצריך.',
      primary: { label: 'התחלת ניסיון חינם', href: 'https://app.weiz.chat/login', newTab: false, enabled: true },
      secondary: { label: 'לתיאום הדגמה', href: '/contact', newTab: false, enabled: true },
      image: { src: '/product/inbox-chat.png', alt: 'תיבת WeizChat האמיתית: רשימת שיחות של הצוות ושיחת וואטסאפ פתוחה עם כרטיס הלקוח.' },
    },
    {
      id: 'trust',
      visible: true,
      label: 'עובדות על המוצר',
      facts: [
        { id: 'cloudApi', text: 'בנוי על WhatsApp Business Platform‏ (Cloud API) הרשמי' },
        { id: 'ownWaba', text: 'מתחברים עם חשבון ה־WhatsApp Business שלכם — והוא נשאר שלכם' },
        { id: 'trilingual', text: 'תמיכה מלאה בעברית ובאנגלית' },
        { id: 'humanControl', text: 'נציג אנושי יכול להשתלט על כל שיחה, בכל רגע' },
      ],
      techProvider: 'ספק טכנולוגיה מאושר של Meta',
      businessPartner: 'שותף עסקי של Meta',
    },
    {
      id: 'problem',
      visible: true,
      title: 'וואטסאפ עסקי בלי מערכת — זה כאוס.',
      items: [
        { id: 'scattered', title: 'שיחות מפוזרות', body: 'לקוחות כותבים לטלפונים הפרטיים של העובדים — והעסק לא רואה את השיחה בכלל.' },
        { id: 'noHistory', title: 'אין בעלות, אין היסטוריה', body: 'כשנציג עוזב — השיחות, אנשי הקשר והעסקאות הפתוחות עוזבים איתו.' },
        { id: 'waiting', title: 'לקוחות מחכים שעות', body: 'עד שמישהו עונה, הלקוח כבר קנה במקום אחר.' },
      ],
    },
    {
      id: 'pillars',
      visible: true,
      title: 'פלטפורמה אחת, שלוש עבודות',
      linkLabel: 'למידע נוסף',
      items: [
        { id: 'inbox', title: 'תיבת צוות משותפת', body: 'כל השיחות במקום אחד — הקצאות, סטטוסים והערות פנימיות. כל נציג רואה בדיוק את מה שהוא צריך.', href: '/shared-inbox', icon: 'inbox' },
        { id: 'ai', title: 'סוכן מכירות AI', body: 'וויזיק עונה מיד, מזהה מוצרים, נותן מחירים אמיתיים מהקטלוג — ויודע מתי להעביר לבן אדם.', href: '/ai-sales-agent', icon: 'ai' },
        { id: 'bot', title: 'צ\'אטבוט ואוטומציה', body: 'מענה מחוץ לשעות הפעילות, ניתוב פניות ואוטומציות — בלי לאבד את המגע האנושי.', href: '/chatbot', icon: 'bot' },
      ],
    },
    {
      id: 'ai',
      visible: true,
      kicker: 'הבידול שלנו',
      title: 'מתמונה להצעת מחיר — לבד.',
      steps: [
        { id: 'photo', title: 'הלקוח שולח תמונה או מק"ט', body: 'צילום של מוצר, שם דגם או מספר סידורי — ככה לקוחות באמת כותבים.' },
        { id: 'research', title: 'וויזיק מוצא את הדגם המדויק', body: 'ה־AI מחפש בקטלוג שלכם ומתאים את המוצר המדויק.' },
        { id: 'answer', title: 'מחיר אמיתי, מלאי אמיתי', body: 'התשובה כוללת מוצר, מק"ט, מחיר ומלאי מהנתונים שלכם. וויזיק אף פעם לא ממציא מחיר.' },
        { id: 'escalate', title: 'לא בטוח? נציג נכנס לתמונה', body: 'ביטחון נמוך או בקשה רגישה — השיחה עוברת לצוות שלכם עם כל ההקשר.' },
      ],
      honest: 'נציג אנושי יכול להשתלט על כל שיחה, בכל רגע. תמיד.',
    },
    {
      id: 'platform',
      visible: true,
      title: 'בנוי על הפלטפורמה הרשמית',
      body: 'WeizChat עובד עם WhatsApp Business Platform‏ (Cloud API) של Meta — בלי מעקפים ובלי סיכון למספר שלכם.',
      link: { label: 'למרכז המידע', href: '/information-center', newTab: false, enabled: true },
      cards: [
        { id: 'cloudApi', title: 'Cloud API רשמי', body: 'החיבור עובר דרך ה־API הרשמי של Meta, עם חשבון WhatsApp Business שבבעלותכם.' },
        { id: 'templates', title: 'הודעות תבנית', body: 'פנייה יזומה ללקוח נעשית עם תבניות הודעה שאושרו מראש על ידי Meta.' },
        { id: 'optIn', title: 'קודם הסכמה (Opt-in)', body: 'הודעות נשלחות רק ללקוחות שהסכימו לשמוע מכם — כך דורשת מדיניות וואטסאפ, וכך נכון לעסק.' },
        { id: 'greenTick', title: 'עסק מאומת', body: 'עסקים שעומדים בקריטריונים של Meta יכולים לבקש את תג האימות הרשמי.' },
        { id: 'pricing', title: 'תמחור מבוסס שיחות', body: 'Meta מחייבת לפי שיחות, בנפרד מהמנוי. אנחנו מסבירים בדיוק איך זה עובד.' },
      ],
    },
    {
      id: 'useCases',
      visible: true,
      title: 'איך צוותים עובדים עם זה',
      tabs: [
        { id: 'service', label: 'שירות לקוחות', points: ['כל פנייה נכנסת לתור אחד ומוקצית לנציג פנוי.', 'וויזיק עונה על השגרתיות — שעות פתיחה, סטטוס הזמנה, מדיניות החזרות.', 'הערות פנימיות על כל שיחה, בלי שהלקוח רואה.'] },
        { id: 'sales', label: 'מכירות', points: ['לקוח שואל על מוצר — וויזיק מזהה אותו ונותן את מחיר הקטלוג.', 'עסקאות מורכבות עוברות לאיש מכירות עם כל היסטוריית השיחה.', 'אף ליד לא נעלם: כל שיחה מתועדת בכרטיס הלקוח.'] },
        { id: 'marketing', label: 'שיווק', points: ['קמפיינים בתבניות מאושרות, לקהלים מסוננים לפי תגיות.', 'מדידה אמיתית: נשלח, נמסר, נקרא, נענה.', 'תשובה לקמפיין נוחתת ישר בתיבה המשותפת כשיחה חיה.'] },
      ],
    },
    {
      id: 'crm',
      visible: true,
      title: 'CRM פשוט, כבר בפנים',
      body: 'בלי מערכת נוספת: כל לקוח מקבל כרטיס עם כל מה שחשוב.',
      link: { label: 'עוד על ה־CRM', href: '/crm', newTab: false, enabled: true },
      features: [
        { id: 'card', text: 'כרטיס לקוח מלא' },
        { id: 'fields', text: 'שדות מותאמים אישית' },
        { id: 'tags', text: 'תגיות וסינון' },
        { id: 'notes', text: 'הערות צוות' },
        { id: 'history', text: 'היסטוריית שיחות מלאה' },
      ],
    },
    {
      id: 'testimonials',
      visible: true,
      title: 'מה הלקוחות אומרים',
      // Empty until real, written-consent entries exist (brief rule 0.2).
      items: [],
    },
    {
      id: 'pricing',
      visible: true,
      title: 'תמחור',
      perMonth: 'לחודש',
      metaNote: 'בנוסף למנוי, Meta גובה תשלום נפרד על שיחות לפי התעריפים הרשמיים שלה. אצלנו אין עמלות הודעה נסתרות.',
      cta: { label: 'לעמוד התמחור המלא', href: '/pricing', newTab: false, enabled: true },
    },
    {
      id: 'faq',
      visible: true,
      title: 'שאלות נפוצות',
      items: [
        { id: 'waba', q: 'האם אני צריך חשבון WhatsApp Business משלי?', a: 'כן. אתם מחברים חשבון WhatsApp Business‏ (WABA) שבבעלותכם — הוא נשאר שלכם, ואנחנו מלווים אתכם בהקמה.' },
        { id: 'charges', q: 'מי גובה ממני על הודעות?', a: 'Meta מחייבת על שיחות ישירות, לפי התעריפים הרשמיים שלה. המנוי ל־WeizChat נפרד ואינו כולל את חיובי Meta.' },
        { id: 'keepNumber', q: 'אפשר לשמור על המספר הקיים שלי?', a: 'ברוב המקרים כן. מספר שנמצא כיום באפליקציית וואטסאפ עובר תהליך העברה לפלטפורמה העסקית — אנחנו מלווים אתכם שלב אחרי שלב.' },
        { id: 'data', q: 'מה קורה למידע שלי?', a: 'הנתונים שלכם מבודדים ברמת הארגון, לעולם לא נמכרים, ונמחקים לפי בקשה. הפרטים במדיניות הפרטיות ובעמוד מחיקת הנתונים.' },
        { id: 'aiSafety', q: 'ה־AI יכול להגיד ללקוחות שלי משהו שגוי?', a: 'וויזיק פועל רק לפי הכללים והקטלוג שהגדרתם, אף פעם לא ממציא מחיר, וכשהוא לא בטוח — שואל או מעביר לנציג. אפשר גם לעבור למצב טיוטות בלבד, שבו אדם מאשר כל תשובה.' },
      ],
    },
    {
      id: 'finalCta',
      visible: true,
      title: 'תראו את זה עונה על המספר שלכם.',
      sub: 'מחברים את חשבון ה־WhatsApp Business שלכם ורואים את וויזיק מטפל בשיחות אמיתיות — כשהצוות שלכם בשליטה.',
      primary: { label: 'התחלת ניסיון חינם', href: 'https://app.weiz.chat/login', newTab: false, enabled: true },
      secondary: { label: 'לתיאום הדגמה', href: '/contact', newTab: false, enabled: true },
    },
  ],
};
