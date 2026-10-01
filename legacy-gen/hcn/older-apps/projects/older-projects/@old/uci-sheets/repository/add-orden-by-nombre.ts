export const addOrdenByName = (_: string) => {
  if (_ === 'TENSION ARTERIAL') return 1;
  if (_ === 'TENSION ARTERIAL MEDIA') return 2;
  if (_ === 'FRECUENCIA CARDIACA') return 3;
  if (_ === 'FRECUENCIA RESPIRATORIA') return 4;
  if (_ === 'TEMPERATURA') return 5;
  if (_ === 'SATURACION DE OXIGENO') return 6;
  else return 7;
  /*  if(_ === 'TENSION ARTERIAL') return 7;
    if(_ === 'TENSION ARTERIAL') return 8;
    if(_ === 'TENSION ARTERIAL') return 9;
    if(_ === 'TENSION ARTERIAL') return 10;
    if(_ === 'TENSION ARTERIAL') return 11;
    if(_ === 'TENSION ARTERIAL') return 12;
    if(_ === 'TENSION ARTERIAL') return 13;
    if(_ === 'TENSION ARTERIAL') return 14;
    if(_ === 'TENSION ARTERIAL') return 15; */
};
