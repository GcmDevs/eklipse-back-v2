// Reglas: CIE-10 ONCOLOGICOS.xlsx, Hoja2!A2:E14.
// Mantener equivalente en frontend y backend; la BD se valida de nuevo al guardar.
export interface ClasificacionCancer {
  codigo: number | null;
  edad: number | null;
  requiereEdad: boolean;
}

export function normalizarCie10(codigo: string): string {
  return codigo.trim().toUpperCase().replace(/\./g, '');
}

export function clasificarCancer(
  codigoCie10: string,
  fechaNacimiento: string | null,
  hoy = new Intl.DateTimeFormat('sv-SE', { timeZone: 'America/Bogota' }).format(new Date())
): ClasificacionCancer {
  const fechaValida = (fecha: string): boolean =>
    /^\d{4}-\d{2}-\d{2}$/.test(fecha) &&
    !fecha.startsWith('0000-') &&
    Number.isFinite(Date.parse(fecha)) &&
    new Date(fecha).toISOString().slice(0, 10) === fecha;
  let edad: number | null = null;
  if (
    fechaNacimiento &&
    fechaValida(fechaNacimiento) &&
    fechaValida(hoy) &&
    !['1800-01-01', '1845-01-01'].includes(fechaNacimiento) &&
    fechaNacimiento <= hoy
  ) {
    edad =
      Number(hoy.slice(0, 4)) -
      Number(fechaNacimiento.slice(0, 4)) -
      (hoy.slice(5) < fechaNacimiento.slice(5) ? 1 : 0);
  }
  const codigo = normalizarCie10(codigoCie10);
  if (!codigo) return { codigo: null, edad, requiereEdad: false };
  const prefijo = codigo.slice(0, 3);
  const grupos: Record<string, number> = {
    C50: 1,
    C53: 2,
    C18: 3,
    C19: 3,
    C20: 3,
    C16: 4,
    C61: 5,
    C33: 6,
    C34: 6,
  };
  if (grupos[prefijo]) return { codigo: grupos[prefijo], edad, requiereEdad: false };
  const linfoide = codigo === 'C910';
  const mieloide = ['C920', 'C924', 'C925'].includes(codigo);
  const linfoma = ['C82', 'C83', 'C84', 'C85'].includes(prefijo);
  if (linfoide || mieloide || linfoma) {
    return {
      codigo:
        edad === null
          ? null
          : linfoide
            ? edad < 18
              ? 7
              : 8
            : mieloide
              ? edad < 18
                ? 9
                : 10
              : edad < 18
                ? 12
                : 11,
      edad,
      requiereEdad: true,
    };
  }
  return { codigo: 12, edad, requiereEdad: false };
}
