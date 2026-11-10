import { z } from "zod";

/**
 * Shape and defaults for `profiles.preferences` (design §15.1). `.catch()`
 * on every key is Requirement 15.16: a corrupt or unknown stored value
 * falls back to that key's default and the page still renders, rather
 * than throwing.
 */
export const PreferencesSchema = z
  .object({
    language: z.enum(["en", "fil"]).catch("en"),
    text_size: z.enum(["standard", "large", "xl"]).catch("standard"),
    high_contrast: z.boolean().catch(false),
    reduce_motion: z.boolean().catch(false),
    visible_focus: z.boolean().catch(true),
    show_labels: z.boolean().catch(true),
    simple_mode: z.boolean().catch(false),
    tips_dismissed: z.boolean().catch(false),
  })
  .catch({
    language: "en",
    text_size: "standard",
    high_contrast: false,
    reduce_motion: false,
    visible_focus: true,
    show_labels: true,
    simple_mode: false,
    tips_dismissed: false,
  });

export type Preferences = z.infer<typeof PreferencesSchema>;

export const DEFAULT_PREFERENCES: Preferences = PreferencesSchema.parse({});

/** Parses whatever is stored (jsonb from the database, or a cookie string). */
export function parsePreferences(value: unknown): Preferences {
  if (typeof value === "string") {
    try {
      return PreferencesSchema.parse(JSON.parse(value));
    } catch {
      return DEFAULT_PREFERENCES;
    }
  }
  return PreferencesSchema.parse(value ?? {});
}
