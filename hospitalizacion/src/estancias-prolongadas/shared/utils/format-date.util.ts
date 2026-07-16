function formatColombiaTimestamp(date: Date): string {
  const colombiaTime = new Date(date.getTime() - 5 * 60 * 60 * 1000);
  return `${colombiaTime.toISOString().slice(0, 19)}-05:00`;
}
function isValidDate(date: Date): boolean {
  return date instanceof Date && !Number.isNaN(date.getTime());
}
