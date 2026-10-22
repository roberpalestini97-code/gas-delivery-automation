import { Badge } from "@/components/ui/badge";

const deliveryTone: Record<string, "default" | "accent" | "success" | "warn" | "danger" | "muted"> = {
  draft: "muted",
  confirmed: "accent",
  dispatched: "accent",
  en_route: "accent",
  arriving: "warn",
  outside: "warn",
  waiting: "warn",
  delivered: "success",
  not_home: "danger",
  cancelled: "muted",
};

const paymentTone: Record<string, "default" | "accent" | "success" | "warn" | "danger" | "muted"> = {
  pending: "warn",
  paid_cash: "success",
  paid_transfer: "success",
  paid_prepaid: "success",
  unpaid: "danger",
  failed: "danger",
};

const deliveryLabels: Record<string, string> = {
  draft: "Borrador",
  confirmed: "Confirmado",
  dispatched: "Despachado",
  en_route: "En camino",
  arriving: "Llegando",
  outside: "Afuera",
  waiting: "Esperando",
  delivered: "Entregado",
  not_home: "No estaba",
  cancelled: "Cancelado",
};

const paymentLabels: Record<string, string> = {
  pending: "Pendiente",
  paid_cash: "Efectivo",
  paid_transfer: "Transferencia",
  paid_prepaid: "Prepago",
  unpaid: "No pagó",
  failed: "Fallido",
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