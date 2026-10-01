export const getDateRangeByDayFixed = (start: Date, end: Date): Date[] => {
  start = new Date(start.getTime() - 18000000);
  end = new Date(end.getTime() - 18000000);

  const dates: Date[] = [];
  while (end.getTime() >= start.getTime()) {
    start.setDate(start.getDate() + 1);

    const date = new Date(`${start.getFullYear()}-${start.getMonth() + 1}-${start.getDate()}`);

    dates.push(date);
  }

  return dates;
};
