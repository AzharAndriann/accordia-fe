export type DynamicIslandToastPayload = {
  id: number;
  title: string;
  message: string;
};

let currentToast: DynamicIslandToastPayload | null = null;
let nextId = 1;
const listeners = new Set<() => void>();

function emit() {
  listeners.forEach((listener) => listener());
}

export function showDynamicIslandToast(input: Omit<DynamicIslandToastPayload, 'id'>) {
  currentToast = { ...input, id: nextId++ };
  emit();
}

export function dismissDynamicIslandToast(id: number) {
  if (currentToast?.id !== id) return;
  currentToast = null;
  emit();
}

export function getDynamicIslandToastSnapshot() {
  return currentToast;
}

export function subscribeDynamicIslandToast(listener: () => void) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}
