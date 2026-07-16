import { UsuarioOrm } from '@orm/gen/usuarios';

export async function findUsuarioByDocumento(documento: string, conn: any): Promise<number> {
  const usuarioRp = conn.getRepository(UsuarioOrm);

  const usuario = await usuarioRp.findOne({ where: { cedula: documento } });

  const usuarioId = usuario.id;

  return usuarioId;
}
