"use client";

import { useRouter } from "next/navigation";

import { ErrorCard } from "@/components/patterns/ErrorCard";

/**
 * `ErrorCard` plus a working "Try again" (Requirement 7.13, 14.14): the
 * server components that read `dashboard_summary()`/`report_summary()`
 * catch their own query failure and render this instead of throwing, so
 * one slow or broken section never blanks the rest of the page. Retrying
 * means asking the server to re-render this route — `router.refresh()`
 * re-runs the failed section's own query without a full page reload.
 */
function ErrorCardRetry({ title, body }: { title: string; body: string }) {
  const router = useRouter();
  return <ErrorCard title={title} body={body} onRetry={() => router.refresh()} />;
}

export { ErrorCardRetry };
