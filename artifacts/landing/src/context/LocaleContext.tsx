import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { useGetGeoLocale, getGetGeoLocaleQueryKey } from "@workspace/api-client-react";
import { DEFAULT_LOCALE, SUPPORTED_LOCALES, getLocaleMeta } from "@/i18n/locales";
import { translate, type TranslationKey } from "@/i18n/translations";

const LOCALE_STORAGE_KEY = "landing_locale_override";
const injectedFontHrefs = new Set<string>();

function injectFont(href: string | null) {
  if (!href || injectedFontHrefs.has(href)) return;
  const link = document.createElement("link");
  link.rel = "stylesheet";
  link.href = href;
  document.head.appendChild(link);
  injectedFontHrefs.add(href);
}

interface LocaleContextType {
  locale: string;
  setLocale: (locale: string) => void;
  t: (key: TranslationKey) => string;
  isRtl: boolean;
  isDetecting: boolean;
  detectedCountry: string | null;
}

const LocaleContext = createContext<LocaleContextType | null>(null);

export function LocaleProvider({ children }: { children: ReactNode }) {
  const [locale, setLocaleState] = useState<string>(DEFAULT_LOCALE);
  const [hasOverride, setHasOverride] = useState(false);

  const { data: geoLocale, isLoading: isDetecting } = useGetGeoLocale({
    query: { enabled: !hasOverride, staleTime: Infinity, queryKey: getGetGeoLocaleQueryKey() },
  });

  useEffect(() => {
    const stored = window.localStorage.getItem(LOCALE_STORAGE_KEY);
    if (stored && SUPPORTED_LOCALES.some((l) => l.code === stored)) {
      setLocaleState(stored);
      setHasOverride(true);
    }
  }, []);

  useEffect(() => {
    if (hasOverride) return;
    if (geoLocale?.locale && SUPPORTED_LOCALES.some((l) => l.code === geoLocale.locale)) {
      setLocaleState(geoLocale.locale);
    }
  }, [geoLocale, hasOverride]);

  const meta = useMemo(() => getLocaleMeta(locale), [locale]);

  useEffect(() => {
    document.documentElement.lang = locale;
    document.documentElement.dir = meta.rtl ? "rtl" : "ltr";
    injectFont(meta.fontHref);
    document.documentElement.style.setProperty(
      "--landing-font-override",
      meta.fontFamily ?? "",
    );
  }, [locale, meta]);

  const setLocale = (newLocale: string) => {
    setLocaleState(newLocale);
    setHasOverride(true);
    window.localStorage.setItem(LOCALE_STORAGE_KEY, newLocale);
  };

  const t = useMemo(() => (key: TranslationKey) => translate(locale, key), [locale]);

  return (
    <LocaleContext.Provider
      value={{
        locale,
        setLocale,
        t,
        isRtl: meta.rtl,
        isDetecting: isDetecting && !hasOverride,
        detectedCountry: geoLocale?.country ?? null,
      }}
    >
      {children}
    </LocaleContext.Provider>
  );
}

export function useLocale(): LocaleContextType {
  const ctx = useContext(LocaleContext);
  if (!ctx) throw new Error("useLocale must be used within a LocaleProvider");
  return ctx;
}
