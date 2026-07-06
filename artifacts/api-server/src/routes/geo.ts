import { Router, type IRouter } from "express";
import { GetGeoLocaleResponse } from "@workspace/api-zod";
import { logger } from "../lib/logger";

const router: IRouter = Router();

const DEFAULT_LOCALE = "en";

const RTL_LOCALES = new Set(["ar"]);

// Country -> locale mapping. Kept in sync with the mobile app's supported
// locale set (en, es, pt, ar, th, vi, id, ja, ko, zh-Hant) so landing page
// copy and app UI language line up for the same user.
const COUNTRY_TO_LOCALE: Record<string, string> = {
  // Spanish-speaking
  ES: "es",
  MX: "es",
  AR: "es",
  CO: "es",
  CL: "es",
  PE: "es",
  VE: "es",
  EC: "es",
  GT: "es",
  CU: "es",
  BO: "es",
  DO: "es",
  HN: "es",
  PY: "es",
  SV: "es",
  NI: "es",
  CR: "es",
  PA: "es",
  UY: "es",
  // Portuguese-speaking
  BR: "pt",
  PT: "pt",
  AO: "pt",
  MZ: "pt",
  // Arabic-speaking
  SA: "ar",
  AE: "ar",
  EG: "ar",
  QA: "ar",
  KW: "ar",
  BH: "ar",
  OM: "ar",
  JO: "ar",
  LB: "ar",
  IQ: "ar",
  DZ: "ar",
  MA: "ar",
  TN: "ar",
  LY: "ar",
  YE: "ar",
  SD: "ar",
  // Thai
  TH: "th",
  // Vietnamese
  VN: "vi",
  // Indonesian
  ID: "id",
  // Japanese
  JP: "ja",
  // Korean
  KR: "ko",
  // Traditional Chinese
  TW: "zh-Hant",
  HK: "zh-Hant",
  MO: "zh-Hant",
};

function extractClientIp(req: { headers: Record<string, unknown>; ip?: string }): string | null {
  const forwarded = req.headers["x-forwarded-for"];
  if (typeof forwarded === "string" && forwarded.length > 0) {
    return forwarded.split(",")[0]?.trim() ?? null;
  }
  return req.ip ?? null;
}

async function lookupCountry(ip: string | null): Promise<string | null> {
  // Skip lookups for local/private addresses (dev environment) - no country to resolve.
  if (!ip || ip === "::1" || ip === "127.0.0.1" || ip.startsWith("10.") || ip.startsWith("192.168.")) {
    return null;
  }

  try {
    const res = await fetch(`http://ip-api.com/json/${encodeURIComponent(ip)}?fields=status,countryCode`, {
      signal: AbortSignal.timeout(2000),
    });
    if (!res.ok) return null;
    const data = (await res.json()) as { status?: string; countryCode?: string };
    if (data.status !== "success" || !data.countryCode) return null;
    return data.countryCode;
  } catch (err) {
    logger.warn({ err }, "Geo IP lookup failed");
    return null;
  }
}

router.get("/geo/locale", async (req, res): Promise<void> => {
  const ip = extractClientIp(req);
  const country = await lookupCountry(ip);
  const locale = (country && COUNTRY_TO_LOCALE[country]) || DEFAULT_LOCALE;

  res.json(
    GetGeoLocaleResponse.parse({
      locale,
      country: country ?? null,
      isRtl: RTL_LOCALES.has(locale),
    }),
  );
});

export default router;
