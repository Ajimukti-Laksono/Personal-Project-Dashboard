/**
 * Utility functions for formatting dates in Indonesian with Asia/Jakarta (WIB) timezone.
 */

/**
 * Returns a human-friendly relative time string in Indonesian.
 * Examples: "baru saja", "3 menit lalu", "2 jam lalu", "kemarin", "5 hari lalu".
 */
export function formatRelativeTime(dateInput: Date | string | number): string {
  const date = typeof dateInput === "object" ? dateInput : new Date(dateInput);
  const now = new Date();
  const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

  if (isNaN(diffInSeconds)) {
    return "-";
  }

  if (diffInSeconds < 10) {
    return "baru saja";
  }
  if (diffInSeconds < 60) {
    return `${diffInSeconds} detik lalu`;
  }

  const diffInMinutes = Math.floor(diffInSeconds / 60);
  if (diffInMinutes < 60) {
    return `${diffInMinutes} menit lalu`;
  }

  const diffInHours = Math.floor(diffInMinutes / 60);
  if (diffInHours < 24) {
    return `${diffInHours} jam lalu`;
  }

  const diffInDays = Math.floor(diffInHours / 24);
  if (diffInDays === 1) {
    return "kemarin";
  }
  if (diffInDays < 7) {
    return `${diffInDays} hari lalu`;
  }

  const diffInWeeks = Math.floor(diffInDays / 7);
  if (diffInWeeks < 4) {
    return `${diffInWeeks} minggu lalu`;
  }

  const diffInMonths = Math.floor(diffInDays / 30);
  if (diffInMonths < 12) {
    return `${diffInMonths} bulan lalu`;
  }

  const diffInYears = Math.floor(diffInDays / 365);
  return `${diffInYears} tahun lalu`;
}

/**
 * Formats a Date object or ISO string in Asia/Jakarta timezone.
 * Example output: "14 Okt 2026, 22:30 WIB"
 */
export function formatJakartaDateTime(dateInput: Date | string | number): string {
  const date = typeof dateInput === "object" ? dateInput : new Date(dateInput);
  if (isNaN(date.getTime())) {
    return "-";
  }

  const formatter = new Intl.DateTimeFormat("id-ID", {
    timeZone: "Asia/Jakarta",
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });

  return `${formatter.format(date)} WIB`;
}
