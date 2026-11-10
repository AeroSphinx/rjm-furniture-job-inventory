"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { cn } from "@/lib/utils";
import { savePreferences } from "@/actions/preferences";
import { PreferencesSchema, type Preferences } from "@/schemas/preferences";

const TEXT_SIZE_OPTIONS = [
  { value: "standard", key: "textSizeStandard", sizeClass: "text-base" },
  { value: "large", key: "textSizeLarge", sizeClass: "text-lg" },
  { value: "xl", key: "textSizeXl", sizeClass: "text-2xl" },
] as const;

/**
 * The four 2×2 cards (Language, Text Size, Display, Accessibility) plus
 * the Simple mode toggle and the bottom "Save Preferences" bar (design
 * §15.3, §20). Applies the change optimistically — the `<html>`
 * attributes the root layout renders from the database only update after
 * the round trip, so this form drives its own live preview through the
 * same data attributes while the request is in flight, and keeps the
 * user's chosen values on screen (rather than reverting them) if the save
 * fails (Requirement 15.15).
 */
function PreferenceForm({ initial }: { initial: Preferences }) {
  const t = useTranslations("Settings");
  const [pending, setPending] = useState(false);

  const form = useForm<Preferences>({
    resolver: zodResolver(PreferencesSchema),
    defaultValues: initial,
  });

  function applyLivePreview(values: Preferences) {
    const html = document.documentElement;
    html.setAttribute("data-text-size", values.text_size);
    html.setAttribute("data-high-contrast", values.high_contrast ? "on" : "off");
    html.setAttribute("data-reduce-motion", values.reduce_motion ? "on" : "off");
    html.setAttribute("data-visible-focus", values.visible_focus ? "on" : "off");
    html.setAttribute("data-show-labels", values.show_labels ? "on" : "off");
    html.setAttribute("data-simple-mode", values.simple_mode ? "on" : "off");
    html.lang = values.language;
  }

  async function onSubmit(values: Preferences) {
    applyLivePreview(values);
    setPending(true);
    const result = await savePreferences(values);
    setPending(false);

    if (result.ok) {
      toast.success(t("saveSuccess"));
    } else {
      toast.error(t("saveFailed"), {
        action: { label: t("tryAgain"), onClick: () => form.handleSubmit(onSubmit)() },
      });
    }
  }

  const values = form.watch();

  return (
    <form onSubmit={form.handleSubmit(onSubmit)} className="flex flex-col gap-6">
      <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
        {/* Language Preferences */}
        <Card>
          <CardHeader>
            <CardTitle>{t("languageCardTitle")}</CardTitle>
            <CardDescription>{t("languageCardSubtitle")}</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-1.5">
            <Label htmlFor="pref-language">{t("systemLanguageLabel")}</Label>
            <Select
              value={values.language}
              onValueChange={(v) => form.setValue("language", v as Preferences["language"], { shouldDirty: true })}
            >
              <SelectTrigger id="pref-language">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="en">{t("languageEnglish")}</SelectItem>
                <SelectItem value="fil">{t("languageFilipino")}</SelectItem>
              </SelectContent>
            </Select>
          </CardContent>
        </Card>

        {/* Text Size Preferences */}
        <Card>
          <CardHeader>
            <CardTitle>{t("textSizeCardTitle")}</CardTitle>
            <CardDescription>{t("textSizeCardSubtitle")}</CardDescription>
          </CardHeader>
          <CardContent>
            <div role="radiogroup" aria-label={t("textSizeCardTitle")} className="grid grid-cols-3 gap-2">
              {TEXT_SIZE_OPTIONS.map((opt) => {
                const checked = values.text_size === opt.value;
                return (
                  <button
                    key={opt.value}
                    type="button"
                    role="radio"
                    aria-checked={checked}
                    onClick={() => form.setValue("text_size", opt.value, { shouldDirty: true })}
                    className={cn(
                      "flex min-h-11 flex-col items-center justify-center gap-1 rounded-md border p-3 outline-none",
                      "focus-visible:ring-2 focus-visible:ring-ring",
                      checked ? "border-primary-border bg-accent" : "border-input",
                    )}
                  >
                    <span className={cn("font-semibold text-foreground", opt.sizeClass)}>Aa</span>
                    <span className="text-xs text-muted-foreground">{t(opt.key)}</span>
                  </button>
                );
              })}
            </div>
          </CardContent>
        </Card>

        {/* Display Preferences */}
        <Card>
          <CardHeader>
            <CardTitle>{t("displayCardTitle")}</CardTitle>
            <CardDescription>{t("displayCardSubtitle")}</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-3">
            <PreferenceCheckbox
              id="pref-high-contrast"
              checked={values.high_contrast}
              onCheckedChange={(v) => form.setValue("high_contrast", v, { shouldDirty: true })}
              label={t("highContrastLabel")}
              hint={t("highContrastHint")}
            />
            <PreferenceCheckbox
              id="pref-reduce-motion"
              checked={values.reduce_motion}
              onCheckedChange={(v) => form.setValue("reduce_motion", v, { shouldDirty: true })}
              label={t("reduceMotionLabel")}
              hint={t("reduceMotionHint")}
            />
          </CardContent>
        </Card>

        {/* Accessibility Options */}
        <Card>
          <CardHeader>
            <CardTitle>{t("accessibilityCardTitle")}</CardTitle>
            <CardDescription>{t("accessibilityCardSubtitle")}</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-3">
            <PreferenceCheckbox
              id="pref-visible-focus"
              checked={values.visible_focus}
              onCheckedChange={(v) => form.setValue("visible_focus", v, { shouldDirty: true })}
              label={t("visibleFocusLabel")}
              hint={t("visibleFocusHint")}
            />
            <PreferenceCheckbox
              id="pref-show-labels"
              checked={values.show_labels}
              onCheckedChange={(v) => form.setValue("show_labels", v, { shouldDirty: true })}
              label={t("showLabelsLabel")}
              hint={t("showLabelsHint")}
            />
          </CardContent>
        </Card>
      </div>

      {/* Simple mode — indicator 5; the wireframe lacks this toggle. */}
      <Card>
        <CardHeader className="flex-row items-center justify-between gap-4">
          <div>
            <CardTitle>{t("simpleModeCardTitle")}</CardTitle>
            <CardDescription>{t("simpleModeHint")}</CardDescription>
          </div>
          <div className="flex items-center gap-3">
            <Label htmlFor="pref-simple-mode" className="text-sm">
              {t("simpleModeLabel")}
            </Label>
            <Switch
              id="pref-simple-mode"
              checked={values.simple_mode}
              onCheckedChange={(v) => form.setValue("simple_mode", v, { shouldDirty: true })}
            />
          </div>
        </CardHeader>
      </Card>

      <div className="flex flex-col items-start gap-3 rounded-md border border-border bg-card p-4 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-sm text-muted-foreground">{t("footerNote")}</p>
        <Button type="submit" disabled={pending}>
          {pending ? t("saving") : t("saveButton")}
        </Button>
      </div>
    </form>
  );
}

function PreferenceCheckbox({
  id,
  checked,
  onCheckedChange,
  label,
  hint,
}: {
  id: string;
  checked: boolean;
  onCheckedChange: (checked: boolean) => void;
  label: string;
  hint: string;
}) {
  return (
    <div className="flex items-start gap-2">
      <Checkbox id={id} checked={checked} onCheckedChange={(v) => onCheckedChange(v === true)} />
      <div className="flex flex-col pt-2.5">
        <Label htmlFor={id}>{label}</Label>
        <p className="text-xs text-muted-foreground">{hint}</p>
      </div>
    </div>
  );
}

export { PreferenceForm };
