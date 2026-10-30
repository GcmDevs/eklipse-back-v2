import { FuenteLecturaOdometro } from '../enums';

export type LecturaOdometroReferenciaRow = {
  id: number;
  lectura: number;
  fechaLectura: Date;
  confiable: boolean;
  fuente: FuenteLecturaOdometro;
  referenciaId: number | null;
};

/**
 * Última lectura con confiable=true anterior al momento del tanqueo (por fecha y OID).
 * Ignora lecturas no confiables al retroceder.
 */
export function seleccionarKmConfiableAntesDelTanqueo(
  lecturas: LecturaOdometroReferenciaRow[],
  fechaTanqueo: Date,
  tanqueoId?: number | null
): number | null {
  const candidatas = lecturas
    .filter(row => esLecturaAnteriorAlTanqueo(row, fechaTanqueo, tanqueoId))
    .filter(row => row.confiable)
    .sort((a, b) => {
      const t = b.fechaLectura.getTime() - a.fechaLectura.getTime();
      if (t !== 0) return t;
      return b.id - a.id;
    });
  return candidatas[0]?.lectura ?? null;
}

export function esLecturaAnteriorAlTanqueo(
  row: LecturaOdometroReferenciaRow,
  fechaTanqueo: Date,
  tanqueoId?: number | null
): boolean {
  if (row.fechaLectura.getTime() < fechaTanqueo.getTime()) {
    return true;
  }
  if (row.fechaLectura.getTime() > fechaTanqueo.getTime()) {
    return false;
  }
  if (tanqueoId == null) {
    return false;
  }
  if (row.fuente !== FuenteLecturaOdometro.TANQUEO) {
    return true;
  }
  return (row.referenciaId ?? 0) < tanqueoId;
}
