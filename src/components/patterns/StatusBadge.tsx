import {
  AlertTriangle,
  ArrowDownToLine,
  ArrowUpFromLine,
  CheckCircle,
  CircleX,
  Clock,
  Loader,
  PauseCircle,
  Settings2,
} from "lucide-react";

import { Badge, type badgeVariants } from "@/components/ui/badge";
import type { VariantProps } from "class-variance-authority";

type BadgeVariant = NonNullable<VariantProps<typeof badgeVariants>["variant"]>;

type StockValue = "in_stock" | "low_stock" | "out_of_stock";
type JobValue = "pending" | "in_progress" | "on_hold" | "completed";
type TxnValue = "stock_in" | "stock_out" | "adjustment";

const STOCK_MAP: Record<StockValue, { icon: typeof CheckCircle; variant: BadgeVariant }> = {
  in_stock: { icon: CheckCircle, variant: "success" },
  low_stock: { icon: AlertTriangle, variant: "warning" },
  out_of_stock: { icon: CircleX, variant: "danger" },
};

const JOB_MAP: Record<JobValue, { icon: typeof CheckCircle; variant: BadgeVariant }> = {
  pending: { icon: Clock, variant: "neutral" },
  in_progress: { icon: Loader, variant: "info" },
  on_hold: { icon: PauseCircle, variant: "warning" },
  completed: { icon: CheckCircle, variant: "success" },
};

const TXN_MAP: Record<TxnValue, { icon: typeof CheckCircle; variant: BadgeVariant }> = {
  stock_in: { icon: ArrowDownToLine, variant: "success" },
  stock_out: { icon: ArrowUpFromLine, variant: "danger" },
  adjustment: { icon: Settings2, variant: "neutral" },
};

type Props =
  | { kind: "stock"; value: StockValue; label: string }
  | { kind: "job"; value: JobValue; label: string }
  | { kind: "txn"; value: TxnValue; label: string };

/**
 * The one component every status renders through (design §5.5). Colour is
 * never the only signal: the icon is `aria-hidden` because the text label
 * — passed in already translated by the caller — is what carries the
 * meaning for assistive technology (Requirement 19.1). The `loader` icon
 * does not spin when reduce-motion is active, via the global
 * `prefers-reduced-motion` / `data-reduce-motion` rules (design §15.2).
 */
function StatusBadge(props: Props) {
  const entry =
    props.kind === "stock"
      ? STOCK_MAP[props.value]
      : props.kind === "job"
        ? JOB_MAP[props.value]
        : TXN_MAP[props.value];
  const Icon = entry.icon;
  // The spin itself is frozen by the global `data-reduce-motion` /
  // `prefers-reduced-motion` rules (design §15.2), not by this component.
  const spins = props.kind === "job" && props.value === "in_progress";

  return (
    <Badge variant={entry.variant}>
      <Icon className={spins ? "size-3.5 animate-spin" : "size-3.5"} aria-hidden="true" />
      <span>{props.label}</span>
    </Badge>
  );
}

export { StatusBadge };
