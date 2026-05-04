export function sanitise(value: unknown, fallback = "unknown"): string {
  if (typeof value !== "string" || !value) return fallback;

  return value.replace(/[\r\n]/g, "");
}
