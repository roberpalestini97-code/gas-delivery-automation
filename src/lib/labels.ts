export const deliveryLabels: Record<string, string> = {
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
  finalized: "Finalizado",
};

export const paymentLabels: Record<string, string> = {
  pending: "Pendiente de pago",
  paid_cash: "Pagado en efectivo",
  paid_transfer: "Pagado por transferencia",
  paid_prepaid: "Pagado anticipado",
  unpaid: "No pagó",
  failed: "Pago fallido",
};

export const paymentMethodLabels: Record<string, string> = {
  cash: "Efectivo en el momento",
  transfer: "Transferencia",
  prepaid: "Prepago / ya pagó",
};

export function labelPayment(status: string) {
  return paymentLabels[status] || status;
}

export function labelDelivery(status: string) {
  return deliveryLabels[status] || status;
}

export function paymentStatusFromMethod(method: string) {
  if (method === "cash") return "paid_cash";
  if (method === "transfer") return "paid_transfer";
  if (method === "prepaid") return "paid_prepaid";
  return "pending";
}