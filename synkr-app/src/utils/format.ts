/** 90 -> "1 h 30 min", 60 -> "1 h", 30 -> "30 min" (sem sinal) */
export function formatMinutes(minutes: number): string {
  const m = Math.abs(Math.round(minutes));
  const h = Math.floor(m / 60);
  const r = m % 60;
  if (h && r) return `${h} h ${r} min`;
  if (h) return `${h} h`;
  return `${r} min`;
}

/** +60 -> "+1 h", -30 -> "-30 min" */
export function formatSigned(minutes: number): string {
  return `${minutes > 0 ? '+' : minutes < 0 ? '-' : ''}${formatMinutes(minutes)}`;
}

export function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('pt-PT', { day: 'numeric', month: 'short', year: 'numeric' });
}
