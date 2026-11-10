import { cookies } from "next/headers";
import { getRequestConfig } from "next-intl/server";

import en from "../../messages/en.json";
import fil from "../../messages/fil.json";

export type Locale = "en" | "fil";

/** Deep-merges `fil` over `en` so a missing Filipino key falls back to English (Requirement 16.10). */
function deepMerge(base: Record<string, unknown>, override: Record<string, unknown>): Record<string, unknown> {
  const result: Record<string, unknown> = { ...base };
  for (const key of Object.keys(override)) {
    const baseValue = base[key];
    const overrideValue = override[key];
    if (
      baseValue &&
      overrideValue &&
      typeof baseValue === "object" &&
      typeof overrideValue === "object" &&
      !Array.isArray(baseValue) &&
      !Array.isArray(overrideValue)
    ) {
      result[key] = deepMerge(baseValue as Record<string, unknown>, overrideValue as Record<string, unknown>);
    } else {
      result[key] = overrideValue;
    }
  }
  return result;
}

/**
 * Language is a per-user preference, not a route (design §16.1): no
 * `[locale]` segment, no `createMiddleware`, no `requestLocale`. The
 * locale comes from the `locale` cookie that `savePreferences` writes
 * (Phase 2) and that the login page also reads before any session exists.
 */
export default getRequestConfig(async () => {
  const store = await cookies();
  const locale: Locale = store.get("locale")?.value === "fil" ? "fil" : "en";

  return {
    locale,
    // `_README` is a deliberate non-namespace key (design/requirement 16.7's
    // header-comment equivalent in a format that cannot hold real comments);
    // it is never looked up by `useTranslations` and costs nothing to merge.
    messages: locale === "fil" ? deepMerge(en, fil) : en,
    timeZone: "Asia/Manila",
    formats: {
      dateTime: {
        short: { year: "numeric", month: "short", day: "numeric" },
        medium: { year: "numeric", month: "long", day: "numeric" },
      },
      number: {
        money: { style: "currency", currency: "PHP", minimumFractionDigits: 2 },
      },
    },
    onError(error) {
      if (process.env.NODE_ENV !== "production") {
        console.warn(error);
      }
    },
    getMessageFallback({ key, namespace }) {
      return namespace ? `${namespace}.${key}` : key;
    },
  };
});
