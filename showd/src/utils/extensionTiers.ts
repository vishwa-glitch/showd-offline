export interface ExtensionTier {
  /** Extension duration options in minutes (e.g. [5, 10]) */
  options: number[];
  /** Maximum number of extensions allowed */
  maxExtensions: number;
}

/**
 * Get extension tier based on task duration.
 * Determines how many extensions are allowed and what duration options are available.
 */
export function getExtensionTier(durationMinutes: number): ExtensionTier {
  if (durationMinutes < 30) {
    return { options: [5, 10], maxExtensions: 2 };
  }
  if (durationMinutes <= 120) {
    return { options: [10, 15], maxExtensions: 3 };
  }
  return { options: [15, 30], maxExtensions: 2 };
}

/**
 * Format seconds into a human-readable duration string.
 * e.g. 1800 → "30 minutes", 5400 → "1h 30m"
 */
export function formatDuration(totalSeconds: number): string {
  const minutes = Math.floor(totalSeconds / 60);
  if (minutes < 60) {
    return `${minutes} minute${minutes !== 1 ? 's' : ''}`;
  }
  const hours = Math.floor(minutes / 60);
  const remainingMinutes = minutes % 60;
  if (remainingMinutes === 0) {
    return `${hours}h`;
  }
  return `${hours}h ${remainingMinutes}m`;
}

/**
 * Format seconds into MM:SS or H:MM:SS countdown string.
 */
export function formatCountdown(totalSeconds: number): string {
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  if (hours > 0) {
    return `${hours}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  }
  return `${minutes}:${seconds.toString().padStart(2, '0')}`;
}
