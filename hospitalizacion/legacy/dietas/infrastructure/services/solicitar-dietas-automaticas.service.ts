import { Injectable, Logger } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { dietasAutomaticas } from '../utils/dieta-automatica';
import { CierreDietaProgramado } from '../utils/horarios-automaticos';
import { ConsultaPacientesDietasService } from './consulta-pacientes-dietas.service';
import { RegistrarDietasSubgrupoService } from './registrar-dietas-subgrupo.service';

export const SUBGRUPOS_EXENTOS_AUTOMATICOS = new Set([
  'TEM001AC',
  'TEMCM01',
  'AC0118',
  '00409',
  'TEM002AC',
]);

export interface ControlSolicitudAutomatica {
  activo(): boolean;
  esperar(ms: number): Promise<boolean>;
}

interface SubgrupoPendiente {
  id: number;
  codigo: string;
}

@Injectable()
export class SolicitarDietasAutomaticasService {
  private readonly logger = new Logger(SolicitarDietasAutomaticasService.name);

  constructor(
    private readonly consulta: ConsultaPacientesDietasService,
    private readonly registro: RegistrarDietasSubgrupoService
  ) {}

  async ejecutar(
    conn: DataSource,
    cierre: CierreDietaProgramado,
    control: ControlSolicitudAutomatica
  ): Promise<void> {
    const subgrupos = await this.reintentar(
      async () =>
        conn.query<SubgrupoPendiente[]>(
          `SELECT DISTINCT SG.OID id, SG.HSUCODIGO codigo
           FROM HPNESTANC E
           INNER JOIN HPNDEFCAM C ON C.OID = E.HPNDEFCAM
           INNER JOIN HPNSUBGRU SG ON SG.OID = C.HPNSUBGRU
           WHERE E.HESFECSAL IS NULL AND C.ADNCENATE = @0
           AND NOT EXISTS (
             SELECT 1 FROM PDYDIEGRU G
             INNER JOIN PDYDIEJOR J ON J.OID = G.PDYDIEJOR
             INNER JOIN PDYDIECEN DC ON DC.OID = J.PDYDIECEN
             WHERE G.HPNSUBGRU = SG.OID AND J.DIEHORARIO = @1
               AND J.DIEFECJOR = @2 AND DC.ADNCENATE = @0
           )
           ORDER BY SG.HSUCODIGO`,
          [cierre.centroId, cierre.horarioId, cierre.fecha.toISOString().slice(0, 10)]
        ),
      cierre,
      control
    );
    if (!subgrupos || !control.activo()) return;

    for (const subgrupo of subgrupos) {
      if (!control.activo()) return;
      if (SUBGRUPOS_EXENTOS_AUTOMATICOS.has(subgrupo.codigo.trim())) continue;
      await this.reintentar(
        async () => {
          const precarga = await this.consulta.execute(
            conn,
            cierre.context,
            cierre.centroId,
            cierre.horarioId,
            subgrupo.codigo,
            cierre.fecha
          );
          if (!control.activo()) return;
          // Puede haber sido solicitado mientras se esperaba en la cola.
          if (precarga.dieSubgrupoId != null) {
            this.log(cierre, 'YA_REGISTRADO', subgrupo.id);
            return;
          }
          const { dietas, omitidas } = dietasAutomaticas(precarga.pacientes);
          if (!dietas.length) {
            this.log(cierre, 'SIN_DIETAS_VALIDAS', subgrupo.id, 0, omitidas);
            return;
          }
          const resultado = await this.registro.execute(
            {
              centroId: cierre.centroId,
              horarioId: cierre.horarioId,
              jornadaCode: cierre.jornadaCode,
              subgrupoId: subgrupo.id,
              dietas,
            },
            {
              conn,
              context: cierre.context,
              usuarioId: 1,
              fecha: cierre.fecha,
              origen: 'AUTOMATICA',
              canIgnoreHorario: true,
            }
          );
          this.log(cierre, resultado.codigo, subgrupo.id, resultado.registradas, omitidas);
        },
        cierre,
        control,
        subgrupo.id
      );
    }
    this.log(cierre, 'CIERRE_FINALIZADO');
  }

  private async reintentar<T>(
    operation: () => Promise<T>,
    cierre: CierreDietaProgramado,
    control: ControlSolicitudAutomatica,
    subgrupoId?: number
  ): Promise<T | undefined> {
    for (let intento = 1; intento <= 3 && control.activo(); intento++) {
      try {
        return await operation();
      } catch (error) {
        this.logger.error(
          JSON.stringify({
            ...this.metadata(cierre),
            subgrupoId,
            resultado: 'ERROR_TECNICO',
            intento,
            error: error instanceof Error ? error.message : String(error),
          })
        );
        if (intento < 3 && !(await control.esperar(intento * 30000))) return;
      }
    }
    return;
  }

  private metadata(cierre: CierreDietaProgramado) {
    return {
      origen: 'AUTOMATICA',
      contexto: cierre.context.getCode(),
      centroId: cierre.centroId,
      horarioId: cierre.horarioId,
      fecha: cierre.fecha.toISOString().slice(0, 10),
    };
  }

  private log(
    cierre: CierreDietaProgramado,
    resultado: string,
    subgrupoId?: number,
    registradas = 0,
    omitidas = 0
  ): void {
    this.logger.log(
      JSON.stringify({
        ...this.metadata(cierre),
        subgrupoId,
        resultado,
        registradas,
        omitidas,
        motivoOmitidas: omitidas ? 'SIN_CONFIGURACION_VALIDA' : undefined,
      })
    );
  }
}
