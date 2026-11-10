"use client";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

/**
 * The honest "Forgot password?" dialog (Requirement 2, settled decision
 * D4): no email, no SMTP dependency. It names the real recovery path — the
 * shop owner resets the password on the Users page (Requirement 2.6) —
 * and returns focus to the "Username or Email" field on close rather than
 * to the link that opened it, which is what Radix's default focus-restore
 * would otherwise do (Requirement 2.3). Focus trap, `aria-labelledby` and
 * `Escape`-to-close all come from Radix (Requirement 2.4, 17.6).
 */
function ForgotPasswordDialog({
  open,
  onOpenChange,
  onBackToLogin,
  labels,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onBackToLogin: () => void;
  labels: {
    title: string;
    body: string;
    backToLogin: string;
  };
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        onCloseAutoFocus={(event) => {
          event.preventDefault();
          onBackToLogin();
        }}
      >
        <DialogHeader>
          <DialogTitle>{labels.title}</DialogTitle>
          <DialogDescription>{labels.body}</DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button type="button" onClick={() => onOpenChange(false)}>
            {labels.backToLogin}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export { ForgotPasswordDialog };
