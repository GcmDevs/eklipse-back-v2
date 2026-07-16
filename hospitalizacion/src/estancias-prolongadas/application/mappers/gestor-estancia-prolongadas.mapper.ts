import { GestorEstanciaProlongadaUsuarioOrm } from '@orm/hpn/estancias-prolongadas';
import {
  sanitizeGestorEstanciaProlongadasKey,
  sanitizeGestorEstanciaProlongadasValue,
} from '../sanitizers';

type QueryRow = Record<string, unknown>;

function mapRow(row: QueryRow) {
  return Object.entries(row).reduce(
    (accumulator, [key, value]) => {
      accumulator[sanitizeGestorEstanciaProlongadasKey(key)] =
        sanitizeGestorEstanciaProlongadasValue(value);
      return accumulator;
    },
    {} as Record<string, unknown>
  );
}

export function mapGestorEstanciaProlongadasRows<T extends QueryRow>(rows: T[]) {
  return rows.map(row => mapRow(row));
}

export function mapGestorEstanciaProlongadaUsuario(usuario: GestorEstanciaProlongadaUsuarioOrm) {
  return {
    id: usuario.id,
    nombre: sanitizeGestorEstanciaProlongadasValue(usuario.nombre),
    cargo: sanitizeGestorEstanciaProlongadasValue(usuario.cargo),
    usuarioId: sanitizeGestorEstanciaProlongadasValue(usuario.usuarioId),
    numeroTelefono: sanitizeGestorEstanciaProlongadasValue(usuario.numeroTelefono),
    correo: sanitizeGestorEstanciaProlongadasValue(usuario.correo),
    fechaCreacion: sanitizeGestorEstanciaProlongadasValue(usuario.fechaCreacion),
    usuarioCreacionId: sanitizeGestorEstanciaProlongadasValue(usuario.usuarioCreacionId),
  };
}

export function mapGestorEstanciaProlongadaUsuarios(
  usuarios: GestorEstanciaProlongadaUsuarioOrm[]
) {
  return usuarios.map(mapGestorEstanciaProlongadaUsuario);
}
