import type { ElementType, ReactNode } from "react";

import { Card, CardContent, CardHeader } from "@/components/ui/card";

/**
 * The card-header pattern repeated on every screen (design §6.2). The
 * heading level is always passed in rather than hardcoded, so a card never
 * accidentally skips a heading level (Requirement 17.5).
 */
function SectionCard({
  title,
  subtitle,
  headingLevel = "h2",
  action,
  children,
}: {
  title: string;
  subtitle?: string;
  headingLevel?: ElementType;
  action?: ReactNode;
  children: ReactNode;
}) {
  const Heading = headingLevel;

  return (
    <Card>
      <CardHeader className="flex-row items-start justify-between gap-4">
        <div>
          <Heading className="text-lg font-semibold text-foreground">{title}</Heading>
          {subtitle && <p className="mt-0.5 text-sm text-muted-foreground">{subtitle}</p>}
        </div>
        {action && <div className="shrink-0">{action}</div>}
      </CardHeader>
      <CardContent>{children}</CardContent>
    </Card>
  );
}

export { SectionCard };
