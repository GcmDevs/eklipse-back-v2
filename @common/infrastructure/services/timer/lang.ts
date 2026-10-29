export type Lang = 'es' | 'en';

export type CanBeDate = string | number | Date | undefined | null;

export const GCM_TIME_FROM_NOW_LANG: any = {
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

export const extensionAgo = (
  time: string,
  lang: Lang,
  upd: boolean,
  ago: boolean,
  add: boolean
) => {
  switch (lang) {
    case 'es':
      return add ? `${upd ? 'Actualizado ' : ''} ${ago ? 'hace ' : ''}${time}` : time;
    case 'en':
      return add ? `${upd ? 'Updated ' : ''}${time}${ago ? ' ago' : ''}` : time;
  }
};
