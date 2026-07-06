export interface LocaleMeta {
  code: string;
  label: string;
  rtl: boolean;
  /** Google Fonts family to load for scripts that need a non-Latin face. Null = use the default Inter stack. */
  fontFamily: string | null;
  /** Google Fonts CSS2 URL param (family name + weights) when fontFamily is set. */
  fontHref: string | null;
}

export const DEFAULT_LOCALE = "en";

export const SUPPORTED_LOCALES: LocaleMeta[] = [
  { code: "en", label: "English", rtl: false, fontFamily: null, fontHref: null },
  { code: "es", label: "Español", rtl: false, fontFamily: null, fontHref: null },
  { code: "pt", label: "Português", rtl: false, fontFamily: null, fontHref: null },
  {
    code: "ar",
    label: "العربية",
    rtl: true,
    fontFamily: "'Noto Sans Arabic', sans-serif",
    fontHref: "https://fonts.googleapis.com/css2?family=Noto+Sans+Arabic:wght@400;500;600;700&display=swap",
  },
  {
    code: "th",
    label: "ไทย",
    rtl: false,
    fontFamily: "'Noto Sans Thai', sans-serif",
    fontHref: "https://fonts.googleapis.com/css2?family=Noto+Sans+Thai:wght@400;500;600;700&display=swap",
  },
  { code: "vi", label: "Tiếng Việt", rtl: false, fontFamily: null, fontHref: null },
  { code: "id", label: "Bahasa Indonesia", rtl: false, fontFamily: null, fontHref: null },
  {
    code: "ja",
    label: "日本語",
    rtl: false,
    fontFamily: "'Noto Sans JP', sans-serif",
    fontHref: "https://fonts.googleapis.com/css2?family=Noto+Sans+JP:wght@400;500;600;700&display=swap",
  },
  {
    code: "ko",
    label: "한국어",
    rtl: false,
    fontFamily: "'Noto Sans KR', sans-serif",
    fontHref: "https://fonts.googleapis.com/css2?family=Noto+Sans+KR:wght@400;500;600;700&display=swap",
  },
  {
    code: "zh-Hant",
    label: "繁體中文",
    rtl: false,
    fontFamily: "'Noto Sans TC', sans-serif",
    fontHref: "https://fonts.googleapis.com/css2?family=Noto+Sans+TC:wght@400;500;600;700&display=swap",
  },
];

export function getLocaleMeta(code: string): LocaleMeta {
  return SUPPORTED_LOCALES.find((l) => l.code === code) ?? SUPPORTED_LOCALES[0];
}
