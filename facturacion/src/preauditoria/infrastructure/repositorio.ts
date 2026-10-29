import {
  ConflictException,
  Injectable,
  NotFoundException,
  ServiceUnavailableException,
} from '@nestjs/common';
import { DataSource } from 'typeorm';
import {
  Actor,
  Auditoria,
  CONFIGURACION_PRE,
  ConfiguracionPre,
  ESTADOS_PRE,
  FiltrosPre,
} from '../domain/modelo';
import { fechaDia, puede, texto } from '../domain/reglas';

export interface SqlPre {
  query(sql: string, parametros?: any[]): Promise<any>;
}
export const TABLAS_PRE = [
  'EKSLNPREAUDINSTALACION',
  'EKSLNPREAUDITORIA',
  'EKSLNPREAUDHALLAZGO',
  'EKSLNPREAUDREVISION',
  'EKSLNPREAUDBORRADOR',
  'EKSLNPREAUDHISTORIAL',
  'EKSLNPREAUDENTREGA',
  'EKSLNPREAUDENTREGADETALLE',
  'EKSLNPREAUDNOTIFICACION',
  'EKSLNPREAUDCONFIGURACION',
  'EKSLNPREAUDCUP',
  'EKSLNPREAUDSALARIO',
  'EKSLNPREAUDHORA',
  'EKSLNPREAUDHORAHISTORIAL',
] as const;
export const leerJson = <T>(v: string): T => JSON.parse(v) as T;

@Injectable()
export class RepositorioPre {
  constructor(private readonly conn: DataSource) {}
  get baseDatos(): string {
    return String(this.conn.options.database ?? '');
  }
  async instalado(): Promise<boolean> {
    if (!this.conn.isInitialized)
      throw new ServiceUnavailableException(
        'La conexión de la sede de la sesión no está disponible.'
      );
    const [estado] = await this.conn.query(
      `SELECT ${TABLAS_PRE.map((t, i) => `OBJECT_ID('dbo.${t}', 'U') AS t${i}`).join(',')}`
    );
    if (!TABLAS_PRE.every((_, i) => estado[`t${i}`])) return false;
    const filas = await this.conn.query(
      'SELECT Version FROM dbo.EKSLNPREAUDINSTALACION WHERE Id = 1'
    );
    return filas[0]?.Version === 1;
  }
  async asegurar(): Promise<void> {
    if (!(await this.instalado()))
      throw new ServiceUnavailableException({
        code: 'PREAUDITORIA_INSTALACION_PENDIENTE',
        message: `Preauditoría está pendiente de instalación en la base ${this.baseDatos} de la sede de la sesión. El administrador debe comprobar las tablas y la versión en esa base.`,
      });
  }
  query(sql: string, parametros: any[] = []): Promise<any> {
    return this.conn.query(sql, parametros);
  }
  async transaccion<T>(accion: (sql: SqlPre) => Promise<T>): Promise<T> {
    const qr = this.conn.createQueryRunner();
    await qr.connect();
    try {
      await qr.startTransaction('SERIALIZABLE');
      const resultado = await accion(qr);
      await qr.commitTransaction();
      return resultado;
    } catch (e) {
      if (qr.isTransactionActive) await qr.rollbackTransaction();
      const numero =
        e?.number ?? e?.driverError?.number ?? e?.driverError?.originalError?.info?.number;
      if ([2601, 2627].includes(numero))
        throw new ConflictException('El registro ya existe. Actualiza antes de continuar.');
      if (numero === 1205)
        throw new ConflictException(
          'Otra operación coincidió con esta. Reintenta sin cambiar tus datos.'
        );
      throw e;
    } finally {
      await qr.release();
    }
  }
  async auditoria(
    contexto: string,
    id: string,
    sql: SqlPre = this,
    bloquear = false
  ): Promise<Auditoria> {
    const filas = await sql.query(
      `SELECT Payload FROM dbo.EKSLNPREAUDITORIA ${bloquear ? 'WITH (UPDLOCK,HOLDLOCK)' : ''}
      WHERE Contexto=@0 AND Id=@1`,
      [contexto, id]
    );
    if (!filas.length) throw new NotFoundException('Auditoría no encontrada.');
    return leerJson<Auditoria>(filas[0].Payload);
  }
  async existe(contexto: string, ingreso: string): Promise<boolean> {
    return (
      (
        await this.query('SELECT Id FROM dbo.EKSLNPREAUDITORIA WHERE Contexto=@0 AND Ingreso=@1', [
          contexto,
          ingreso,
        ])
      ).length > 0
    );
  }
  async guardar(sql: SqlPre, r: Auditoria, anterior: number | null): Promise<void> {
    const parametros = [
      r.id,
      r.contexto,
      r.paciente.ingreso,
      r.paciente.nombre,
      r.paciente.documento,
      r.paciente.centro,
      r.estado,
      r.responsableId,
      r.valor,
      r.recibido,
      r.asignado,
      r.auditado,
      r.entregado,
      r.actualizado,
      r.version,
      JSON.stringify(r),
    ];
    if (anterior === null)
      await sql.query(
        `INSERT dbo.EKSLNPREAUDITORIA
      (Id,Contexto,Ingreso,PacienteNombre,PacienteDocumento,Centro,Estado,ResponsableId,Valor,Recibido,Asignado,Auditado,Entregado,Actualizado,Version,Payload)
      VALUES (@0,@1,@2,@3,@4,@5,@6,@7,@8,@9,@10,@11,@12,@13,@14,@15)`,
        parametros
      );
    else {
      const filas = await sql.query(
        `UPDATE dbo.EKSLNPREAUDITORIA SET PacienteNombre=@3,PacienteDocumento=@4,Centro=@5,
        Estado=@6,ResponsableId=@7,Valor=@8,Recibido=@9,Asignado=@10,Auditado=@11,Entregado=@12,Actualizado=@13,Version=@14,Payload=@15
        OUTPUT INSERTED.Id WHERE Id=@0 AND Contexto=@1 AND Version=@16`,
        [...parametros, anterior]
      );
      if (!filas.length)
        throw new ConflictException('La auditoría cambió; no se sobrescribió ningún dato.');
    }
    await sql.query('DELETE FROM dbo.EKSLNPREAUDHALLAZGO WHERE AuditoriaId=@0', [r.id]);
    if (r.hallazgos.length)
      await sql.query(
        `INSERT dbo.EKSLNPREAUDHALLAZGO
      (Id,AuditoriaId,Codigo,ServicioCodigo,Servicio,Cantidad,ValorUnitario,Destino,Preglosa,PorFacturar,Payload)
      SELECT Id,@0,Codigo,ServicioCodigo,Servicio,Cantidad,ValorUnitario,Destino,Preglosa,PorFacturar,Payload
      FROM OPENJSON(@1) WITH (Id uniqueidentifier '$.id', Codigo nvarchar(10) '$.codigo',
        ServicioCodigo nvarchar(30) '$.servicioCodigo', Servicio nvarchar(600) '$.servicio', Cantidad decimal(18,3) '$.cantidad',
        ValorUnitario decimal(19,2) '$.valorUnitario', Destino varchar(20) '$.destino', Preglosa decimal(19,2) '$.preglosa',
        PorFacturar decimal(19,2) '$.porFacturar', Payload nvarchar(max) '$' AS JSON)`,
        [r.id, JSON.stringify(r.hallazgos)]
      );
  }
  async historial(
    sql: SqlPre,
    a: Actor,
    objetivo: string,
    accion: string,
    antes: unknown,
    despues: unknown,
    motivo = ''
  ): Promise<void> {
    await sql.query(
      `INSERT dbo.EKSLNPREAUDHISTORIAL (Contexto,Objetivo,Usuario,Responsable,Accion,Fecha,Payload)
      VALUES (@0,@1,@2,@3,@4,SYSUTCDATETIME(),@5)`,
      [a.contexto, objetivo, a.id, a.nombre, accion, JSON.stringify({ antes, despues, motivo })]
    );
  }
  async notificar(
    sql: SqlPre,
    a: Actor,
    usuario: number,
    auditoriaId: string,
    mensaje: string
  ): Promise<void> {
    await sql.query(
      `INSERT dbo.EKSLNPREAUDNOTIFICACION (Id,Contexto,Usuario,AuditoriaId,Mensaje,Fecha,Vista)
      VALUES (NEWID(),@0,@1,@2,@3,SYSUTCDATETIME(),0)`,
      [a.contexto, usuario, auditoriaId, mensaje]
    );
  }
  filtros(a: Actor, f: FiltrosPre, omitirEstado = false): { where: string; p: any[] } {
    const p: any[] = [a.contexto],
      condiciones = ['Contexto=@0'];
    const agregar = (sql: string, valor: any) => {
      condiciones.push(sql.replace('?', `@${p.length}`));
      p.push(valor);
    };
    if (!puede(a, 'equipo') || f.propios === 'true') agregar('ResponsableId=?', a.id);
    if (f.buscar)
      agregar(
        "(PacienteNombre LIKE ? ESCAPE '~' OR PacienteDocumento LIKE $ ESCAPE '~' OR Ingreso LIKE $ ESCAPE '~')",
        '%' + texto(f.buscar, 100).replace(/[~%_\[]/g, '~$&') + '%'
      );
    // El mismo parámetro se reutiliza en las tres columnas de búsqueda.
    if (f.buscar)
      condiciones[condiciones.length - 1] = condiciones.at(-1).replace(/\$/g, `@${p.length - 1}`);
    if (f.estado && !omitirEstado) {
      if (!(ESTADOS_PRE as readonly string[]).includes(f.estado))
        throw new ConflictException('Estado de filtro inválido.');
      agregar('Estado=?', f.estado);
    }
    if (f.centro) agregar('Centro=?', texto(f.centro));
    if (f.responsable && puede(a, 'equipo')) {
      const id = Number(f.responsable);
      if (!Number.isSafeInteger(id) || id < 1) throw new ConflictException('Responsable inválido.');
      agregar('ResponsableId=?', id);
    }
    if (f.desde)
      agregar('Recibido>=CONVERT(datetimeoffset,?)', fechaDia(f.desde) + 'T00:00:00-05:00');
    if (f.hasta)
      agregar(
        'Recibido<DATEADD(day,1,CONVERT(datetimeoffset,?))',
        fechaDia(f.hasta) + 'T00:00:00-05:00'
      );
    if (f.desde && f.hasta && f.desde > f.hasta)
      throw new ConflictException('El rango de fechas no es válido.');
    return { where: condiciones.join(' AND '), p };
  }
  async listado(a: Actor, filtros: FiltrosPre, exportar = false) {
    const pagina = Number(filtros.pagina || 1),
      tamano = Number(filtros.tamano || 25);
    if (
      !Number.isSafeInteger(pagina) ||
      pagina < 1 ||
      pagina > 1e6 ||
      ![10, 25, 50, 100].includes(tamano)
    )
      throw new ConflictException('Paginación inválida.');
    const { where, p } = this.filtros(a, filtros);
    const [resumen] = await this.query(
      `SELECT COUNT(*) cantidad,COALESCE(SUM(Valor),0) valor FROM dbo.EKSLNPREAUDITORIA WHERE ${where}`,
      p
    );
    if (exportar && resumen.cantidad > 5000)
      throw new ConflictException('La exportación admite 5000 ingresos. Acota los filtros.');
    const filas = await this.query(
      `SELECT Payload FROM dbo.EKSLNPREAUDITORIA WHERE ${where}
      ORDER BY Recibido DESC,Id OFFSET @${p.length} ROWS FETCH NEXT @${p.length + 1} ROWS ONLY`,
      [...p, exportar ? 0 : (pagina - 1) * tamano, exportar ? 5000 : tamano]
    );
    return {
      registros: filas.map((r: any) => leerJson<Auditoria>(r.Payload)),
      total: resumen.cantidad,
      valor: Number(resumen.valor),
      pagina,
      tamano,
    };
  }
  async configuracion(contexto: string, sql: SqlPre = this): Promise<ConfiguracionPre> {
    const [r] = await sql.query(
      'SELECT Payload FROM dbo.EKSLNPREAUDCONFIGURACION WHERE Contexto=@0',
      [contexto]
    );
    return r ? leerJson<ConfiguracionPre>(r.Payload) : { ...CONFIGURACION_PRE };
  }
}
