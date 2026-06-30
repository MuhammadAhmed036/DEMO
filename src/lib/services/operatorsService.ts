import type { Operator } from "@/lib/types";
import { OPERATORS, getOperatorById } from "@/lib/mock/operators";

const LATENCY_MS = 150;

function delay<T>(value: T, ms = LATENCY_MS): Promise<T> {
  return new Promise((resolve) => setTimeout(() => resolve(value), ms));
}

export async function fetchOperators(): Promise<Operator[]> {
  return delay(OPERATORS);
}

export async function fetchOperatorById(id: string | null): Promise<Operator | null> {
  return delay(getOperatorById(id));
}
