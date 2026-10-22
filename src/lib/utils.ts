import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatPhone(phone: string) {
  return phone.replace(/\D/g, "");
}

export function orderCode(id: number) {
  return `#G-${id}`;
}

export function parseOrderCode(text: string): number | null {
  const match = text.match(/#?G-(\d+)/i);
  return match ? Number(match[1]) : null;
}