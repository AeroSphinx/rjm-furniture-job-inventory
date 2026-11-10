"use client";

import { useRef, useState, useTransition } from "react";
import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Eye, EyeOff } from "lucide-react";
import { useTranslations } from "next-intl";

import { signIn } from "@/actions/auth";
import { LoginSchema, type LoginFormValues } from "@/schemas/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { FormField } from "@/components/patterns/FormField";
import { ForgotPasswordDialog } from "@/components/features/auth/ForgotPasswordDialog";

/**
 * The right-hand sign-in card (Requirement 1.3). Client-side validation
 * (react-hook-form + the same `LoginSchema` the server action uses) stops
 * an empty submit from ever reaching the authentication service and moves
 * focus to the first field in error (Requirement 1.10). The server action
 * is called directly — not through a native `<form action>` — so the
 * pending state and the one generic error message are easy to show
 * without a page navigation.
 */
type LoginFormProps = {
  /**
   * Set when `requireUser()` redirected here with `?reason=deactivated`
   * (design §14.3). The copy stays the same generic helper text either
   * way — nothing about the account's state is disclosed — only its
   * emphasis changes, so a visitor who was just signed out for that
   * reason notices the "contact the administrator" line without the page
   * saying why.
   */
  deactivated?: boolean;
};

function LoginForm({ deactivated = false }: LoginFormProps) {
  const t = useTranslations("Auth");
  const [isPending, startTransition] = useTransition();
  const [showPassword, setShowPassword] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const identifierRef = useRef<HTMLInputElement>(null);
  const passwordToggleRef = useRef<HTMLButtonElement>(null);
  const [forgotOpen, setForgotOpen] = useState(false);

  const {
    register,
    control,
    handleSubmit,
    setFocus,
    formState: { errors },
  } = useForm<LoginFormValues>({
    resolver: zodResolver(LoginSchema),
    defaultValues: { identifier: "", password: "", remember: false },
  });

  const identifierField = register("identifier");
  const passwordField = register("password");

  function onSubmit(values: LoginFormValues) {
    setFormError(null);
    startTransition(async () => {
      const result = await signIn(values);
      if (!result.ok) {
        if (result.code === "TOO_MANY_ATTEMPTS") {
          setFormError(t("tooManyAttempts", { seconds: result.secondsRemaining }));
        } else {
          setFormError(t("invalidCredentials"));
        }
        setFocus("identifier");
      }
      // On success the action redirects server-side; nothing else to do here.
    });
  }

  return (
    <>
      <form onSubmit={handleSubmit(onSubmit)} noValidate className="flex flex-col gap-4">
        <FormField
          name="identifier"
          label={t("identifierLabel")}
          required
          error={errors.identifier?.message ? t("identifierRequired") : undefined}
        >
          {(fieldProps) => (
            <Input
              {...fieldProps}
              {...identifierField}
              ref={(element) => {
                identifierField.ref(element);
                identifierRef.current = element;
              }}
              type="text"
              autoComplete="username"
            />
          )}
        </FormField>

        <FormField
          name="password"
          label={t("passwordLabel")}
          required
          error={errors.password?.message ? t("passwordRequired") : undefined}
        >
          {(fieldProps) => (
            <div className="relative">
              <Input
                {...fieldProps}
                {...passwordField}
                type={showPassword ? "text" : "password"}
                autoComplete="current-password"
                className="pr-12"
              />
              <button
                ref={passwordToggleRef}
                type="button"
                onClick={() => setShowPassword((value) => !value)}
                aria-label={showPassword ? t("hidePassword") : t("showPassword")}
                className="absolute right-1 top-1/2 flex size-11 -translate-y-1/2 items-center justify-center rounded-md text-muted-foreground outline-none hover:bg-accent focus-visible:ring-2 focus-visible:ring-ring"
              >
                {showPassword ? <EyeOff className="size-4" aria-hidden /> : <Eye className="size-4" aria-hidden />}
              </button>
            </div>
          )}
        </FormField>

        <div className="flex items-center justify-between">
          <Controller
            name="remember"
            control={control}
            render={({ field }) => (
              // eslint-disable-next-line jsx-a11y/no-noninteractive-element-interactions -- the
              // label wraps a Radix (button-based) checkbox, which native label-click
              // auto-activation does not reliably cover, so the label's own click toggles it too.
              <label
                className="flex items-center gap-2 text-sm text-foreground"
                onClick={() => field.onChange(!field.value)}
              >
                <Checkbox
                  checked={field.value}
                  onCheckedChange={field.onChange}
                  onClick={(event) => event.stopPropagation()}
                  ref={field.ref}
                />
                {t("rememberMe")}
              </label>
            )}
          />
          <button
            type="button"
            onClick={() => setForgotOpen(true)}
            className="text-sm font-medium text-orange-700 underline-offset-4 hover:underline"
          >
            {t("forgotPassword")}
          </button>
        </div>

        {formError && (
          <p role="alert" className="text-sm font-medium text-danger-text">
            {formError}
          </p>
        )}

        <Button type="submit" size="default" disabled={isPending} className="w-full">
          {isPending ? t("loggingIn") : t("loginButton")}
        </Button>

        <p
          className={
            deactivated
              ? "text-center text-xs font-semibold text-foreground"
              : "text-center text-xs text-muted-foreground"
          }
        >
          {t("helperText")}
        </p>
      </form>

      <ForgotPasswordDialog
        open={forgotOpen}
        onOpenChange={setForgotOpen}
        onBackToLogin={() => identifierRef.current?.focus()}
        labels={{
          title: t("forgotPasswordDialogTitle"),
          body: t("forgotPasswordDialogBody"),
          backToLogin: t("backToLogin"),
        }}
      />
    </>
  );
}

export { LoginForm };
