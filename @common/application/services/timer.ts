import * as dayjs from 'dayjs';

export enum FormatTimeEnum {
  /** Example: 2022-25-02 */
  YYYY_DD_MM = 1,
  /** Example: 01-feb-2022 */
  DD_MMM_YYYY = 2,
  /** Example: 15/feb/2022 */
  D_MMM_YYYY = 3,
  /** Example: 15/feb/2022, 3:30:25 pm */
  D_MMM_YYYY__h_mm_ss_a = 4,
  /** Example: 15/02/2022 */
  D_MM_YYYY = 5,
  /** Example: 15/02/2022, 3:30:25 pm */
  D_MM_YYYY__h_mm_ss_a = 6,
  /** Example: 15 de febrero de 2022 */
  DD_OF_MMMM_OF_YYYY = 7,
  /** Example: febrero de 2022 */
  MMMM_OF_YYYY = 8,
  /** Example: feb-01-2022 */
  MMM_dd_YYYY = 9,
  /** Example: 3:30:25 pm */
  h_mm_ss_a = 10,
  /** Example: 3:30 pm */
  h_mm_a = 11,
  /** Example: 2022-02-25 */
  YYYY_MM_DD = 12,
}

export const GCM_TIME_LANG: any = {
  es: {
    year: 'año',
    years: 'años',
    month: 'mes',
    months: 'meses',
    day: 'dia',
    days: 'dias',
    hour: 'hora',
    hours: 'horas',
    minute: 'minuto',
    minutes: 'minutos',
    second: 'segundo',
    seconds: 'segundos',
  },
  en: {
    year: 'year',
    years: 'years',
    month: 'month',
    months: 'months',
    day: 'day',
    days: 'days',
    hour: 'hour',
    hours: 'hours',
    minute: 'minute',
    minutes: 'minutes',
    second: 'second',
    seconds: 'seconds',
  },
};

export type TimeLang = 'es' | 'en';
export type ValueCanTryToBeDate = string | number | Date | undefined | null;

const extensionAgo = (time: string, lang: TimeLang, upd: boolean, ago: boolean, add: boolean) => {
  switch (lang) {
    case 'es':
      return add ? `${upd ? 'Actualizado ' : ''}${ago ? 'hace ' : ''}${time}` : time;
    case 'en':
      return add ? `${upd ? 'Updated ' : ''}${time}${ago ? ' ago' : ''}` : time;
  }
};

const formatTimeAgo = (
  exedent: number,
  type: 1 | 2 | 3 | 4 | 5 | 6,
  concatenated: boolean,
  lg: TimeLang,
  upd: boolean,
  ago: boolean,
  add = false
) => {
  let calendar = '';
  if (type === 1) calendar = 'second';
  if (type === 2) calendar = 'minute';
  if (type === 3) calendar = 'hour';
  if (type === 4) calendar = 'day';
  if (type === 5) calendar = 'month';
  if (type === 6) calendar = 'year';

  const tv = GCM_TIME_LANG[lg];

  if (Math.floor(exedent) > 0) {
    const v = `${concatenated ? ', ' : ''}${Math.floor(exedent)} ${
      Math.floor(exedent) === 1 ? tv[calendar] : tv[`${calendar}s`]
    }`;

    return extensionAgo(v, lg, upd, ago, add);
  } else {
    return '';
  }
};

export const timeFromNow = (
  date: ValueCanTryToBeDate,
  options: {
    from?: ValueCanTryToBeDate;
    showAll?: boolean;
    shortVersion?: boolean;
    upd?: boolean;
    ago?: boolean;
    lang?: TimeLang;
  } = {}
) => {
  options = {
    from: options.from ? options.from : new Date(),
    showAll: options.showAll !== undefined ? options.showAll : false,
    shortVersion: options.shortVersion !== undefined ? options.shortVersion : false,
    upd: options.upd !== undefined ? options.upd : true,
    ago: options.ago !== undefined ? options.ago : true,
    lang: options.lang ? options.lang : 'es',
  };

  const { from, showAll, upd, ago, lang, shortVersion } = options;

  let value: number,
    seconds: number,
    interval: number,
    exedent: number,
    timeFrom: Date,
    lg = lang,
    result = '';

  /* TRANSFORMAR VALORES RECIBIDOS EN UN VALOR NUMERICO VALIDO COMO FECHA */
  if (typeof date === 'string') {
    if (!isNaN(Date.parse(date))) value = new Date(date).getTime();
    else return date;
  } else if (typeof date === 'number') value = new Date(date).getTime();
  else if (date) value = date.getTime();
  else {
    return date;
  }

  if (typeof from === 'string') {
    if (!isNaN(Date.parse(from))) timeFrom = new Date(from);
    else return from;
  } else if (typeof from === 'number') timeFrom = new Date(from);
  else timeFrom = from!;

  /* DETERMINAR SI LA FECHA ES MAYOR O MENOR A HOY */
  if (timeFrom >= new Date(value)) value = timeFrom.getTime() - value;
  else value = value - timeFrom.getTime();

  seconds = value / 1000;

  /* ASIGNAR VALOR SI LA DIFERENCIA ES MAYOR A UN AÑO */
  interval = Number((seconds / 31536000).toFixed(5));
  if (interval >= 1) {
    result = formatTimeAgo(interval, 6, false, lg!, upd!, ago!, true);
    exedent = interval - Math.floor(interval);
    exedent = exedent * 12;
    if (exedent) result += formatTimeAgo(exedent, 5, true, lg!, upd!, ago!);
    exedent = (exedent - Math.floor(exedent)) * 30;
    if (showAll && exedent >= 15 && !shortVersion) {
      result += formatTimeAgo(exedent, 4, true, lg!, upd!, ago!);
    }
    return result;
  }
  /* ASIGNAR VALOR SI LA DIFERENCIA ES MAYOR A UN MES Y MENOR A UN AÑO */
  interval = Number((seconds / 2592000).toFixed(5));
  if (interval >= 1) {
    result = formatTimeAgo(interval, 5, false, lg!, upd!, ago!, true);
    exedent = interval - Math.floor(interval);
    exedent = exedent * 30;
    result += formatTimeAgo(exedent, 4, true, lg!, upd!, ago!);
    exedent = (exedent - Math.floor(exedent)) * 24;
    if (showAll && exedent >= 6) result += formatTimeAgo(exedent, 3, true, lg!, upd!, ago!);
    return result;
  }
  /* ASIGNAR VALOR SI LA DIFERENCIA ES MAYOR A UN DIA Y MENOR A UN MES */
  interval = Number((seconds / 86400).toFixed(5));
  if (interval >= 1) {
    result = formatTimeAgo(interval, 4, false, lg!, upd!, ago!, true);
    exedent = interval - Math.floor(interval);
    exedent = exedent * 24;
    if (!shortVersion) result += formatTimeAgo(exedent, 3, true, lg!, upd!, ago!);
    exedent = (exedent - Math.floor(exedent)) * 60;
    if (showAll && exedent >= 15 && !shortVersion) {
      result += formatTimeAgo(exedent, 2, true, lg!, upd!, ago!);
    }
    return result;
  }
  /* ASIGNAR VALOR SI LA DIFERENCIA ES MAYOR A UNA HORA Y MENOR A UN DIA */
  interval = Number((seconds / 3600).toFixed(5));
  if (interval >= 1) {
    result = formatTimeAgo(interval, 3, false, lg!, upd!, ago!, true);
    exedent = interval - Math.floor(interval);
    exedent = exedent * 60;
    if (!shortVersion) result += formatTimeAgo(exedent, 2, true, lg!, upd!, ago!);
    return result;
  }
  /* ASIGNAR VALOR SI LA DIFERENCIA ES MAYOR A UN MINUTO Y MENOR A UNA HORA */
  interval = Number((seconds / 60).toFixed(5));
  if (interval >= 1) {
    result = formatTimeAgo(interval, 2, false, lg!, upd!, ago!, true);
    exedent = interval - Math.floor(interval);
    exedent = exedent * 60;
    if (!shortVersion) result += formatTimeAgo(exedent, 1, true, lg!, upd!, ago!);
    return result;
  } else {
    exedent = interval - Math.floor(interval);
    exedent = exedent * 60;
    result += formatTimeAgo(exedent, 1, false, lg!, upd!, ago!, true);
    return result;
  }
};

const getDiffInDays = (start: Date, end?: Date) => {
  if (!end) end = new Date();
  const fechaInicio = start.getTime();
  const fechaFin = end.getTime();
  const diff = fechaFin - fechaInicio;
  return diff / (1000 * 60 * 60 * 24);
};

/** Zona horaria de negocio GCM (Colombia). */
export const GCM_TIMEZONE = 'America/Bogota';

const DATE_ONLY_RE = /^\d{4}-\d{2}-\d{2}$/;

const generateDateFromQuery = (date: Date, endOfDay = false) => {
  return new Date(`${date}${endOfDay ? ':23:59' : ':00:00'}`);
};

/**
 * Partes de calendario (Y-M-D) en Colombia.
 * - Strings `YYYY-MM-DD` y columnas SQL `date` (medianoche UTC) se toman como
 *   día calendario literal (sin restar el offset -5).
 * - `datetime` / instantes reales se proyectan a America/Bogota.
 */
function getColombiaDateParts(fecha: Date | string): {
  y: number;
  m: number;
  d: number;
} {
  if (typeof fecha === 'string' && DATE_ONLY_RE.test(fecha.trim())) {
    const [y, m, d] = fecha.trim().split('-').map(Number);
    return { y, m, d };
  }

  const date = fecha instanceof Date ? fecha : new Date(fecha);
  if (isNaN(date.getTime())) {
    throw new Error('Fecha inválida');
  }

  const isSqlDateOnly =
    date.getUTCHours() === 0 &&
    date.getUTCMinutes() === 0 &&
    date.getUTCSeconds() === 0 &&
    date.getUTCMilliseconds() === 0;

  if (isSqlDateOnly) {
    return {
      y: date.getUTCFullYear(),
      m: date.getUTCMonth() + 1,
      d: date.getUTCDate(),
    };
  }

  const formatted = new Intl.DateTimeFormat('en-CA', {
    timeZone: GCM_TIMEZONE,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(date);
  const [y, m, d] = formatted.split('-').map(Number);
  return { y, m, d };
}

/**
 * Normaliza a un Date estable del día calendario en Colombia (UTC 12:00).
 * Evita el corrimiento ±1 día al comparar o persistir fechas `date`.
 */
function normalizeDate(fecha: Date | string): Date {
  const { y, m, d } = getColombiaDateParts(fecha);
  return new Date(Date.UTC(y, m - 1, d, 12, 0, 0, 0));
}

/** YYYY-MM-DD del día calendario en Colombia. */
function toDateOnlyString(fecha: Date | string | null | undefined): string {
  if (fecha == null || fecha === '') return '';
  try {
    const { y, m, d } = getColombiaDateParts(fecha);
    return `${y}-${String(m).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
  } catch {
    return '';
  }
}

/**
 * @deprecated Usar {@link normalizeDate}. Antes restaba 5h a ciegas y movía el día.
 */
const removeTimeZone = (date: Date): Date => normalizeDate(date);

const isSameDay = (startDate: Date | string, endDate: Date | string): boolean => {
  const a = getColombiaDateParts(startDate);
  const b = getColombiaDateParts(endDate);
  return a.y === b.y && a.m === b.m && a.d === b.d;
};

const isFutureDate = (date: Date | string): boolean => {
  const inputDate = normalizeDate(date);
  const today = normalizeDate(new Date());
  return inputDate.getTime() > today.getTime();
};

export const formatDate = (
  date: ValueCanTryToBeDate,
  format: FormatTimeEnum,
  upperCase?: boolean
): any => {
  let dateFt = null;

  if (typeof date === 'string') {
    if (!isNaN(Date.parse(date))) dateFt = new Date(date);
  } else dateFt = typeof date === 'number' ? new Date(date) : date;

  if (dateFt) {
    let formatOnString = 'YYYY-DD-MM';
    if (format === 2) formatOnString = 'DD-MMM-YYYY';
    if (format === 3) formatOnString = 'D/MMM/YYYY';
    if (format === 4) formatOnString = 'D/MMM/YYYY, h:mm:ss a';
    if (format === 5) formatOnString = 'D/MM/YYYY';
    if (format === 6) formatOnString = 'D/MM/YYYY, h:mm:ss a';
    if (format === 7) formatOnString = 'DD [de] MMMM [de] YYYY';
    if (format === 8) formatOnString = 'MMMM [de] YYYY';
    if (format === 9) formatOnString = 'MMM-DD-YYYY';
    if (format === 10) formatOnString = 'h:mm:ss a';
    if (format === 11) formatOnString = 'h:mm a';
    if (format === 12) formatOnString = 'YYYY-MM-DD';

    let result: string;

    const dayjsObject = dayjs(dateFt);

    result = dayjsObject.format(formatOnString);

    if (upperCase) return result.toUpperCase();
    else return result.toLowerCase();
  } else return date;
};

export const ensureDate = (value?: Date | string | null): Date | null => {
  if (!value) return null;
  if (value instanceof Date) {
    return normalizeDate(value);
  }
  if (typeof value === 'string' && DATE_ONLY_RE.test(value.trim())) {
    return normalizeDate(value.trim());
  }
  const parsed = new Date(value);
  if (isNaN(parsed.getTime())) {
    throw new Error(`Fecha inválida: ${value}`);
  }
  return normalizeDate(parsed);
};

export const TimerServices = {
  timeFromNow,
  getDiffInDays,
  generateDateFromQuery,
  removeTimeZone,
  formatDate,
  isSameDay,
  normalizeDate,
  isFutureDate,
  ensureDate,
  toDateOnlyString,
  getColombiaDateParts,
};
