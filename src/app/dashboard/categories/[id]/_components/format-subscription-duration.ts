export function formatSubscriptionDuration(days?: number): string | null {
  if (!days) return null;
  if (days >= 365) {
    const years = Math.floor(days / 365);
    return `${years} ${years > 1 ? 'years' : 'year'}`;
  }
  if (days >= 30) {
    const months = Math.floor(days / 30);
    return `${months} ${months > 1 ? 'months' : 'month'}`;
  }
  return `${days} days`;
}