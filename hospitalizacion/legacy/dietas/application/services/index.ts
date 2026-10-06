/** @deprecated Solo usable en dietas legacy, si está bien dejalo quieto. */
export const removeTimeZone = (date: Date) => {
  return new Date(date.getTime() - 300 * 60000);
};

/** @deprecated Solo usable en dietas legacy, si está bien dejalo quieto. */
export const getDateToExactMidNight = (date: Date) => {
  const result = date.toISOString().split('T')[0];
  return new Date(`${result}:00:00`);
};
