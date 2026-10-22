import { Badge } from "@/components/ui/badge";
import { deliveryLabels, paymentLabels } from "@/lib/labels";

const deliveryTone: Record<
  string,
  "default" | "accent" | "success" | "warn" | "danger" | "muted"
> = {
  draft: "muted",
  confirmed: "accent",
  dispatched: "accent",
  en_route: "accent",
  arriving: "warn",
  outside: "warn",
  waiting: "warn",
  delivered: "success",
  finalized: "success",
  not_home: "danger",
  cancelled: "muted",
};

const paymentTone: Record<
  string,
  "default" | "accent" | "success" | "warn" | "danger" | "muted"
> = {
  pending: "warn",
  paid_cash: "success",
  paid_transfer: "success",
  paid_prepaid: "success",
  unpaid: "danger",
  failed: "danger",
};

export function DeliveryBadge({ status }: { status: string }) {
  return (
    <Badge tone={deliveryTone[status] || "default"}>
      {deliveryLabels[status] || status}
    </Badge>
  );
}

export function PaymentBadge({ status }: { status: string }) {
  return (
    <Badge tone={paymentTone[status] || "default"}>
      {paymentLabels[status] || status}
    </Badge>
  );
}