import * as relativeTime from 'dayjs/plugin/relativeTime';
import * as dayjs from 'dayjs';
import { CanBeDate, GCM_TIME_FROM_NOW_LANG, Lang, extensionAgo } from './lang';
import(`dayjs/locale/es`);

dayjs.extend(relativeTime);

export enum FormatTimes {
  /** Example: 2022-02-25 */
  YYYY_MM_DD = 1,
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
}

export class BaseTimer {
  /**
   * Convierte una fecha (si es valida) en un objeto Dayjs.
   * @param date Date | number | string
   * @returns dayjs.Dayjs
   */
  public getDate(date: Date | number | string = new Date()): dayjs.Dayjs {
    let dateFt = null;

    if (typeof date === 'string') {
      if (!isNaN(Date.parse(date))) {
        dateFt = new Date(date);
      }
    } else {
      dateFt = typeof date === 'number' ? new Date(date) : date;
    }

    return dateFt ? dayjs(dateFt).locale('es') : dayjs(new Date()).locale('es');
  }

  /**
   * Ejemplos:
   *
   * 1 -- 2022-02-25
   *
   * 2 -- 01-feb-2022
   *
   * 3 -- 15/feb/2022
   *
   * 4 -- 15/feb/2022, 3:30:25 pm
   *
   * 5 --  15/02/2022
   *
   * 6 -- 15/02/2022, 3:30:25 pm
   *
   * 7 -- 15 de febrero de 2022
   *
   * 8 -- febrero de 2022
   * @param date string | Date | number
   * @param format FormatTimes
   * @param upperCase boolean
   * @returns string | Date | number
   */
  public formatDate(
    date: string | Date | number = new Date(),
    format: FormatTimes = 1,
    upperCase?: boolean
  ): any {
    let dateFt = null;

    if (typeof date === 'string') {
      if (!isNaN(Date.parse(date))) {
        dateFt = new Date(date);
      }
    } else {
      dateFt = typeof date === 'number' ? new Date(date) : date;
    }

    if (dateFt) {
      let formatOnString = 'YYYY-MM-DD';

      if (format === 2) formatOnString = 'DD-MMM-YYYY';
      if (format === 3) formatOnString = 'D/MMM/YYYY';
      if (format === 4) formatOnString = 'D/MMM/YYYY, h:mm:ss a';
      if (format === 5) formatOnString = 'D/MM/YYYY';
      if (format === 6) formatOnString = 'D/MM/YYYY, h:mm:ss a';
      if (format === 7) formatOnString = 'DD [de] MMMM [de] YYYY';
      if (format === 8) formatOnString = 'MMMM [de] YYYY';
      if (format === 9) formatOnString = 'MMM-DD-YYYY';
      if (format === 10) formatOnString = 'h:mm:ss a';

      let result: string;

      result = dayjs(dateFt).locale('es').format(formatOnString);

      if (upperCase) return result.toUpperCase();
      else return result.toLowerCase();
    } else {
      return date;
    }
  }

  /**
   * @param date - Define la fecha a evaluar.
   * @param from - Define la fecha desde la cual quiere saber cuanto ha pasado.
   * @param showAll - Define si quiere mostrar información mas detallada.
   * @returns string
   */
  public timeFromNow(
    date: CanBeDate,
    options: {
      from?: CanBeDate;
      showAll?: boolean;
      upd?: boolean;
      ago?: boolean;
      lang?: Lang;
    } = {}
  ) {
    options = {
      from: options.from ? options.from : new Date(),
      showAll: options.showAll !== undefined ? options.showAll : false,
      upd: options.upd !== undefined ? options.upd : true,
      ago: options.ago !== undefined ? options.ago : true,
      lang: options.lang ? options.lang : 'es',
    };

    const { from, showAll, upd, ago, lang } = options;

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
      result = this._formatTime(interval, 6, false, lg!, upd!, ago!, true);
      exedent = interval - Math.floor(interval);
      exedent = exedent * 12;
      if (exedent) result += this._formatTime(exedent, 5, true, lg!, upd!, ago!);
      exedent = (exedent - Math.floor(exedent)) * 30;
      if (showAll && exedent >= 15) result += this._formatTime(exedent, 4, true, lg!, upd!, ago!);
      return result;
    }
    /* ASIGNAR VALOR SI LA DIFERENCIA ES MAYOR A UN MES Y MENOR A UN AÑO */
    interval = Number((seconds / 2592000).toFixed(5));
    if (interval >= 1) {
      result = this._formatTime(interval, 5, false, lg!, upd!, ago!, true);
      exedent = interval - Math.floor(interval);
      exedent = exedent * 30;
      result += this._formatTime(exedent, 4, true, lg!, upd!, ago!);
      exedent = (exedent - Math.floor(exedent)) * 24;
      if (showAll && exedent >= 6) result += this._formatTime(exedent, 3, true, lg!, upd!, ago!);
      return result;
    }
    /* ASIGNAR VALOR SI LA DIFERENCIA ES MAYOR A UN DIA Y MENOR A UN MES */
    interval = Number((seconds / 86400).toFixed(5));
    if (interval >= 1) {
      result = this._formatTime(interval, 4, false, lg!, upd!, ago!, true);
      exedent = interval - Math.floor(interval);
      exedent = exedent * 24;
      result += this._formatTime(exedent, 3, true, lg!, upd!, ago!);
      exedent = (exedent - Math.floor(exedent)) * 60;
      if (showAll && exedent >= 15) result += this._formatTime(exedent, 2, true, lg!, upd!, ago!);
      return result;
    }
    /* ASIGNAR VALOR SI LA DIFERENCIA ES MAYOR A UNA HORA Y MENOR A UN DIA */
    interval = Number((seconds / 3600).toFixed(5));
    if (interval >= 1) {
      result = this._formatTime(interval, 3, false, lg!, upd!, ago!, true);
      exedent = interval - Math.floor(interval);
      exedent = exedent * 60;
      result += this._formatTime(exedent, 2, true, lg!, upd!, ago!);
      return result;
    }
    /* ASIGNAR VALOR SI LA DIFERENCIA ES MAYOR A UN MINUTO Y MENOR A UNA HORA */
    interval = Number((seconds / 60).toFixed(5));
    if (interval >= 1) {
      result = this._formatTime(interval, 2, false, lg!, upd!, ago!, true);
      exedent = interval - Math.floor(interval);
      exedent = exedent * 60;
      result += this._formatTime(exedent, 1, true, lg!, upd!, ago!);
      return result;
    } else {
      exedent = interval - Math.floor(interval);
      exedent = exedent * 60;
      result += this._formatTime(exedent, 1, false, lg!, upd!, ago!, true);
      return result;
    }
  }

  private _formatTime(
    exedent: number,
    type: 1 | 2 | 3 | 4 | 5 | 6,
    concatenated: boolean,
    lg: Lang,
    upd: boolean,
    ago: boolean,
    add = false
  ): string {
    let calendar = '';
    if (type === 1) calendar = 'second';
    if (type === 2) calendar = 'minute';
    if (type === 3) calendar = 'hour';
    if (type === 4) calendar = 'day';
    if (type === 5) calendar = 'month';
    if (type === 6) calendar = 'year';

    const tv = GCM_TIME_FROM_NOW_LANG[lg];

    if (Math.floor(exedent) > 0) {
      const v = `${concatenated ? ', ' : ''}${Math.floor(exedent)} ${
        Math.floor(exedent) === 1 ? tv[calendar] : tv[`${calendar}s`]
      }`;

      return extensionAgo(v, lg, upd, ago, add);
    } else {
      return '';
    }
  }

  public belongsToSameMonth(start: Date, end: Date): boolean {
    const inicioFormatted = start.toISOString().split('T')[0].split('-').slice(0, 2).toString();
    const finalFormatted = end.toISOString().split('T')[0].split('-').slice(0, 2).toString();

    return inicioFormatted === finalFormatted;
  }

  public firstDayOfMonth(date: Date = new Date()): Date {
    return new Date(date.getFullYear(), date.getMonth(), 1);
  }

  public lastDayOfMonth(date: Date = new Date()): Date {
    return new Date(date.getFullYear(), date.getMonth() + 1, 0);
  }

  public belongsToActualMonth(date: Date): boolean {
    const today = new Date();
    const actualMonth = `${today.getMonth() + 1}-${today.getFullYear()}`;
    const selectedMonth = `${date.getMonth() + 1}-${date.getFullYear()}`;
    if (actualMonth === selectedMonth) return true;
    else return false;
  }

  public belongsToPreviousMonth(date: Date): boolean {
    const previousDate = new Date(new Date().setMonth(new Date().getMonth() - 1));
    const previosMonth = `${previousDate.getMonth() + 1}-${previousDate.getFullYear()}`;
    const selectedMonth = `${date.getMonth() + 1}-${date.getFullYear()}`;
    if (previosMonth === selectedMonth) return true;
    else return false;
  }

  public daysInMonth(date: Date = new Date()): number {
    return new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
  }

  public diffInDays(start: Date, end: Date): number {
    return ((end as any) - (start as any)) / (1000 * 60 * 60 * 24);
  }

  public olderThanToday(date: Date): boolean {
    const today = new Date(`${new Date().toISOString().split('T')[0]}:00:00`);
    const dateFt = new Date(`${date.toISOString().split('T')[0]}:00:00`);

    if (dateFt >= today) return true;
    else return false;
  }

  public areSameDay(date1: Date, date2: Date): boolean {
    const today = date1.toISOString().split('T')[0];
    const dateFt = date2.toISOString().split('T')[0];

    if (dateFt === today) return true;
    else return false;
  }

  get dateForFiles(): string {
    return this._dateForFiles();
  }

  private _dateForFiles(): string {
    const date = ((new Date() as any) - 1).toString();
    return date.slice(date.length - 7);
  }
}
