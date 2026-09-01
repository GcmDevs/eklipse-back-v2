export interface DateRangeI {
  start: Date;
  end: Date;
}

function getDateRange(start: Date, end: Date, byDay = false): DateRangeI[] {
  const startMonth = Number(start.toISOString().split('-')[1]);
  const startYear = Number(start.toISOString().split('-')[0]);
  const endMonth = Number(end.toISOString().split('-')[1]);
  const endYear = Number(end.toISOString().split('-')[0]);

  const newArray: { month: string; year: string }[] = [];

  if (startYear > endYear) {
    throw new Error("Last year can't be minor than first year");
  } else {
    if (startYear === endYear && startMonth > endMonth) {
      throw new Error("Last month can't be minor than first month");
    } else {
      let isFirstYear = true;

      for (let i = startYear; i <= endYear; i++) {
        let firstMonth = startMonth;
        let lastMonth = endMonth;

        if (startYear !== endYear) lastMonth = 12;
        if (i === endYear) lastMonth = endMonth;
        if (!isFirstYear) firstMonth = 1;

        for (let j = firstMonth; j <= lastMonth; j++) {
          const value = { month: `${j >= 10 ? j : '0' + j}`, year: i.toString() };
          newArray.push(value);
        }

        isFirstYear = false;
      }

      const result = newArray.length > 12 ? newArray.slice(newArray.length - 12) : newArray;
      const dates: DateRangeI[] = [];

      result.forEach(r => {
        const start = new Date(`${r.year}-${r.month}-01T00:00:00`);
        dates.push({ start: start, end: new Date(start.getFullYear(), start.getMonth() + 1, 0) });
      });

      if (byDay) {
        dates[0].start = new Date(`${start.toISOString().split('T')[0]}:00:00:00`);
        dates[dates.length - 1].end = new Date(`${end.toISOString().split('T')[0]}:00:00:00`);
      }

      return dates;
    }
  }
}

function getDateRangeByDay(start: Date, end: Date): Date[] {
  const dates: Date[] = [];
  while (end.getTime() >= start.getTime()) {
    start.setDate(start.getDate() + 1);

    const date = new Date(`${start.getFullYear()}-${start.getMonth() + 1}-${start.getDate()}`);

    dates.push(date);
  }

  return dates;
}

export const dateUtilities = {
  getDateRange,
  getDateRangeByDay,
};
