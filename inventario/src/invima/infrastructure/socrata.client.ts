import { Injectable } from '@nestjs/common';
import { createHash } from 'crypto';
import {
  CandidatoInvima,
  ConsultaFuente,
  CriterioInvima,
  FuenteInvima,
  PaginaCandidatos,
} from '../domain/invima.models';

export const TAMANO_PAGINA = 20;
const CAMPOS = [
  'producto',
  'titular',
  'registrosanitario',
  'expedientecum',
  'consecutivocum',
  'descripcioncomercial',
  'formafarmaceutica',
  'estadoregistro',
  'estadocum',
  'fechaexpedicion',
  'fechavencimiento',
  'fechaactivo',
  'fechainactivo',
];
export function fuentesInvima(): FuenteInvima[] {
  return [
    {
      id: 'vigentes',
      nombre: 'CUM vigentes',
      dataset: process.env.INVIMA_DATASET_VIGENTES || 'i7cb-raxc',
    },
    {
      id: 'vencidos',
      nombre: 'CUM vencidos',
      dataset: process.env.INVIMA_DATASET_VENCIDOS || 'vwwf-4ftk',
    },
    {
      id: 'renovacion',
      nombre: 'CUM en renovación',
      dataset: process.env.INVIMA_DATASET_RENOVACION || 'vgr4-gemg',
    },
    {
      id: 'otros',
      nombre: 'CUM otros estados',
      dataset: process.env.INVIMA_DATASET_OTROS || 'spzp-dfuc',
    },
  ];
}

@Injectable()
export class SocrataClient {
  private readonly metadata = new Map<string, { expires: number; updated: number }>();

  private async json(url: URL): Promise<any> {
    for (let intento = 0; intento < 2; intento++) {
      try {
        const response = await fetch(url, {
          headers: process.env.INVIMA_APP_TOKEN
            ? { 'X-App-Token': process.env.INVIMA_APP_TOKEN }
            : {},
          signal: AbortSignal.timeout(12000),
        });
        if (!response.ok) {
          if (intento === 0 && (response.status === 429 || response.status >= 500)) {
            const wait = Math.min(
              2000,
              Math.max(500, Number(response.headers.get('retry-after') || 1) * 1000)
            );
            await response.body?.cancel();
            await new Promise(resolve => setTimeout(resolve, wait));
            continue;
          }
          await response.body?.cancel();
          throw new Error(`Datos Abiertos respondió HTTP ${response.status}.`);
        }
        return await response.json();
      } catch (error) {
        if (
          intento === 1 ||
          (error instanceof Error && error.message.startsWith('Datos Abiertos respondió'))
        )
          throw error;
        await new Promise(resolve => setTimeout(resolve, 500));
      }
    }
  }

  async validarFuente(fuente: FuenteInvima, fresh = false): Promise<number> {
    if (!/^[a-z0-9]{4}-[a-z0-9]{4}$/.test(fuente.dataset))
      throw new Error('Identificador de fuente inválido.');
    const cached = this.metadata.get(fuente.dataset);
    if (!fresh && cached && cached.expires > Date.now()) return cached.updated;
    const meta = await this.json(
      new URL(`https://www.datos.gov.co/api/views/${fuente.dataset}.json`)
    );
    if (
      !Array.isArray(meta.columns) ||
      CAMPOS.some(campo => !meta.columns.some((c: any) => c.fieldName === campo))
    )
      throw new Error('La fuente cambió de estructura o no contiene los campos requeridos.');
    const updated = Number(meta.rowsUpdatedAt);
    if (!Number.isFinite(updated))
      throw new Error('La fuente no informa su fecha de actualización.');
    this.metadata.set(fuente.dataset, { updated, expires: Date.now() + 300000 });
    return updated;
  }

  async pagina(fuente: FuenteInvima, where: string, offset: number): Promise<PaginaCandidatos> {
    const url = new URL(`https://www.datos.gov.co/resource/${fuente.dataset}.json`);
    url.search = new URLSearchParams({
      $select: `distinct ${CAMPOS.join(',')}`,
      $where: where,
      $order: CAMPOS.join(','),
      $limit: String(TAMANO_PAGINA + 1),
      $offset: String(offset),
    }).toString();
    const rows = await this.json(url);
    if (
      !Array.isArray(rows) ||
      rows.some(
        r =>
          !r ||
          typeof r.producto !== 'string' ||
          typeof r.registrosanitario !== 'string' ||
          typeof r.estadoregistro !== 'string' ||
          !/^\d+$/.test(r.expedientecum ?? '') ||
          !/^\d+$/.test(r.consecutivocum ?? '')
      )
    )
      throw new Error('La fuente devolvió registros con estructura inesperada.');
    return {
      offset,
      hayMas: rows.length > TAMANO_PAGINA,
      candidatos: rows.slice(0, TAMANO_PAGINA).map(row => this.candidato(fuente, row)),
    };
  }

  async consultar(
    fuente: FuenteInvima,
    criterio: CriterioInvima,
    where: string
  ): Promise<ConsultaFuente> {
    const consulta: ConsultaFuente = {
      fuente,
      criterio,
      where,
      consultadaEn: new Date().toISOString(),
      paginas: [],
    };
    try {
      consulta.actualizadaEn = await this.validarFuente(fuente);
      consulta.paginas = [await this.pagina(fuente, where, 0)];
    } catch (error) {
      consulta.error =
        error instanceof Error ? error.message : 'No fue posible consultar esta fuente.';
    }
    return consulta;
  }

  private candidato(fuente: FuenteInvima, row: Record<string, string>): CandidatoInvima {
    const raw = Object.fromEntries(CAMPOS.map(c => [c, row[c] ?? '']));
    return {
      clave: createHash('sha256')
        .update(fuente.dataset + JSON.stringify(raw))
        .digest('hex'),
      fuenteId: fuente.id,
      dataset: fuente.dataset,
      url: `https://www.datos.gov.co/d/${fuente.dataset}`,
      cum: `${row.expedientecum}-${row.consecutivocum}`,
      nombre: row.producto,
      titular: row.titular ?? '',
      registroSanitario: row.registrosanitario,
      presentacion: row.descripcioncomercial ?? '',
      formaFarmaceutica: row.formafarmaceutica ?? '',
      estadoRegistro: row.estadoregistro,
      estadoCum: row.estadocum ?? '',
      fechaExpedicion: row.fechaexpedicion ?? '',
      fechaVencimiento: row.fechavencimiento ?? '',
      fechaActivo: row.fechaactivo ?? '',
      fechaInactivo: row.fechainactivo ?? '',
    };
  }
}
