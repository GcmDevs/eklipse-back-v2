import { BadRequestException } from '@nestjs/common';
import { ETRegistroClinicoOrm } from '@orm/gcn';
import { EntityManager } from 'typeorm';

const campos = [
  ['diagnostico', 'DIAGNOSTICO', 'Diagnósticos'],
  ['reporteLab', 'REPORTELAB', 'Laboratorio'],
  ['reporteImg', 'REPORTEIMG', 'Imágenes'],
  ['pendientes', 'PENDIENTES', 'Pendientes'],
  ['tratamiento', 'TRATAMIENTO', 'Tratamiento'],
  ['especialidadTratante', 'ESPECIALIDADTRATANTE', 'Especialidad tratante'],
] as const;

/** Comprueba las columnas reales de cada base clínica, sin modificar su esquema. */
export async function validarCapacidadRegistro(
  manager: EntityManager,
  datos: Partial<Record<(typeof campos)[number][0], string>>
): Promise<void> {
  const tabla = manager.connection.getMetadata(ETRegistroClinicoOrm).tablePath;
  const limites: { columna: string; tipo: string; maxBytes: number; bytesRequeridos: number }[] =
    await manager.query(
      `SELECT c.name AS columna, t.name AS tipo,
       CASE WHEN t.name IN ('text', 'ntext') THEN -1 ELSE c.max_length END AS maxBytes,
       CASE WHEN t.name IN ('nchar', 'nvarchar', 'ntext')
         THEN DATALENGTH(CASE c.name ${campos.map(([, col], i) => `WHEN '${col}' THEN @${i + 1}`).join(' ')} END)
         ELSE DATALENGTH(CONVERT(varchar(max), CASE c.name ${campos.map(([, col], i) => `WHEN '${col}' THEN @${i + 1}`).join(' ')} END))
       END AS bytesRequeridos
     FROM sys.columns c INNER JOIN sys.types t ON t.user_type_id = c.system_type_id
     WHERE c.object_id = OBJECT_ID(@0) AND c.name IN (${campos.map(([, col]) => `'${col}'`).join(',')})`,
      [tabla, ...campos.map(([field]) => datos[field] ?? null)]
    );
  if (limites.length !== campos.length) {
    throw new BadRequestException(
      'No fue posible verificar la capacidad de los campos del registro clínico. No se guardaron cambios.'
    );
  }
  for (const limite of limites) {
    if (limite.maxBytes !== -1 && limite.bytesRequeridos > limite.maxBytes) {
      const campo = campos.find(([, columna]) => columna === limite.columna)!;
      throw new BadRequestException(
        `El contenido de ${campo[2]} supera la capacidad disponible, incluyendo el formato. Reduzca el contenido e intente nuevamente. No se guardaron cambios.`
      );
    }
  }
}
