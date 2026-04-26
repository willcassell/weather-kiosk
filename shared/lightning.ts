/** Lightning detection helpers shared between client and server */

export const LIGHTNING_RECENT_HOURS = 3;
export const LIGHTNING_RECENT_MS = LIGHTNING_RECENT_HOURS * 60 * 60 * 1000;

/** Returns true if the given time is within the recent lightning window */
export function isLightningRecent(time?: Date | null, now?: Date): boolean {
  if (!time) return false;
  const ref = now ?? new Date();
  const diffMs = ref.getTime() - new Date(time).getTime();
  return diffMs >= 0 && diffMs < LIGHTNING_RECENT_MS;
}

/** Returns a severity class based on lightning strike distance */
export function getLightningSeverity(distance?: number | null): string {
  if (distance == null) return "text-yellow-400";
  if (distance <= 5) return "text-red-400";
  if (distance <= 10) return "text-orange-400";
  return "text-yellow-400";
}
