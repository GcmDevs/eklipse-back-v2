import { Injectable } from '@nestjs/common';
import { createHash } from 'crypto';
import {
  CandidatoInvima,
  ConsultaFuente,
  CriterioInvima,
  FuenteInvima,
  PaginaCandidatos,
  TipoProductoInvima,
  GRUPOS_REGISTROS,
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
const CAMPOS_DISPOSITIVOS = [
  'expediente',
  'registro_sanitario',
  'estado_registro',
  'fecha_vencimiento',
  'grupo',
  'prodcuto',
  'marca',
  'presentacion_comercial',
  'titular',
];
const CAMPOS_REGISTROS = [
  'expediente',
  'producto',
  'rsynso',
  'estadoregistro',
  'titular',
  'grupo',
  'fechaexpedicion',
  'fechavencimiento',
];
const camposFuente = (f: FuenteInvima) =>
  f.id === 'registros' ? CAMPOS_REGISTROS : f.id === 'dispositivos' ? CAMPOS_DISPOSITIVOS : CAMPOS;
const literal = (value: string) => `'${value.replace(/'/g, "''")}'`;
function grupoFuente(fuente: FuenteInvima): string {
  if (!fuente.grupo || !Object.values(GRUPOS_REGISTROS).includes(fuente.grupo))
    throw new Error('La fuente de registros requiere un grupo de producto permitido.');
  return fuente.grupo;
}
export function fuentesInvima(tipo?: TipoProductoInvima): FuenteInvima[] {
  if (tipo === 'SIN_CLASIFICAR') return [];
  if (tipo && GRUPOS_REGISTROS[tipo])
    return [
      {
        id: 'registros',
        nombre: 'Registros sanitarios y NSO',
        dataset: process.env.INVIMA_DATASET_REGISTROS_GENERALES || 'ui32-p9f2',
        grupo: GRUPOS_REGISTROS[tipo],
      },
    ];
  if (tipo === 'DISPOSITIVO')
    return [
      {
        id: 'dispositivos',
        nombre: 'Dispositivos y reactivos',
        dataset: process.env.INVIMA_DATASET_DISPOSITIVOS || 'y4qt-w6tk',
      },
    ];
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
  private readonly metadata = new Map<
    string,
    { expires: number; updated: number; grupos?: string[] }
  >();

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
    const cacheKey = fuente.id + ':' + fuente.dataset;
    const cached = this.metadata.get(cacheKey);
    const grupo = fuente.id === 'registros' ? grupoFuente(fuente) : undefined;
    if (!fresh && cached && cached.expires > Date.now()) {
      if (grupo && !cached.grupos?.includes(grupo))
        throw new Error('El grupo no está publicado en esta fuente.');
      return cached.updated;
    }
    const meta = await this.json(
      new URL(`https://www.datos.gov.co/api/views/${fuente.dataset}.json`)
    );
    if (
      !Array.isArray(meta.columns) ||
      camposFuente(fuente).some(campo => !meta.columns.some((c: any) => c.fieldName === campo))
    )
      throw new Error('La fuente cambió de estructura o no contiene los campos requeridos.');
    const updated = Number(meta.rowsUpdatedAt);
    if (!Number.isFinite(updated))
      throw new Error('La fuente no informa su fecha de actualización.');
    let grupos: string[] | undefined;
    if (grupo) {
      const url = new URL(`https://www.datos.gov.co/resource/${fuente.dataset}.json`);
      url.search = new URLSearchParams({
        $select: 'grupo',
        $group: 'grupo',
        $order: 'grupo',
        $limit: '200',
      }).toString();
      const rows = await this.json(url);
      if (!Array.isArray(rows) || rows.some(r => typeof r?.grupo !== 'string'))
        throw new Error('La fuente no informa sus grupos de producto.');
      grupos = rows.map(r => r.grupo);
    }
    this.metadata.set(cacheKey, { updated, grupos, expires: Date.now() + 300000 });
    if (grupo && !grupos?.includes(grupo))
      throw new Error('El grupo no está publicado en esta fuente.');
    return updated;
  }

  async pagina(fuente: FuenteInvima, where: string, offset: number): Promise<PaginaCandidatos> {
    if (!/^[a-z0-9]{4}-[a-z0-9]{4}$/.test(fuente.dataset))
      throw new Error('Identificador de fuente inválido.');
    const url = new URL(`https://www.datos.gov.co/resource/${fuente.dataset}.json`);
    const campos = camposFuente(fuente);
    url.search = new URLSearchParams({
      $select: `distinct ${campos.join(',')}`,
      $where:
        fuente.id === 'registros'
          ? `grupo = ${literal(grupoFuente(fuente))} AND (${where})`
          : where,
      $order: campos.join(','),
      $limit: String(TAMANO_PAGINA + 1),
      $offset: String(offset),
    }).toString();
    const rows = await this.json(url);
    if (
      !Array.isArray(rows) ||
      rows.some(
        r =>
          !r ||
          (fuente.id === 'registros'
            ? typeof r.producto !== 'string' ||
              typeof r.rsynso !== 'string' ||
              typeof r.estadoregistro !== 'string' ||
              r.grupo !== fuente.grupo
            : fuente.id === 'dispositivos'
              ? typeof r.prodcuto !== 'string' ||
                typeof r.registro_sanitario !== 'string' ||
                typeof r.estado_registro !== 'string'
              : typeof r.producto !== 'string' ||
                typeof r.registrosanitario !== 'string' ||
                typeof r.estadoregistro !== 'string' ||
                !/^\d+$/.test(r.expedientecum ?? '') ||
                !/^\d+$/.test(r.consecutivocum ?? ''))
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
    const raw = Object.fromEntries(camposFuente(fuente).map(c => [c, row[c] ?? '']));
    const dispositivo = fuente.id === 'dispositivos';
    const registros = fuente.id === 'registros';
    return {
      clave: createHash('sha256')
        .update(fuente.dataset + JSON.stringify(raw))
        .digest('hex'),
      fuenteId: fuente.id,
      dataset: fuente.dataset,
      url: `https://www.datos.gov.co/d/${fuente.dataset}`,
      cum: dispositivo || registros ? null : `${row.expedientecum}-${row.consecutivocum}`,
      nombre: dispositivo ? row.prodcuto : row.producto,
      titular: row.titular ?? '',
      registroSanitario: registros
        ? row.rsynso
        : dispositivo
          ? row.registro_sanitario
          : row.registrosanitario,
      presentacion: registros
        ? ''
        : ((dispositivo ? row.presentacion_comercial : row.descripcioncomercial) ?? ''),
      formaFarmaceutica: registros ? '' : (row.formafarmaceutica ?? ''),
      estadoRegistro: dispositivo ? row.estado_registro : row.estadoregistro,
      estadoCum: dispositivo || registros ? null : (row.estadocum ?? ''),
      ...(registros ? { grupo: row.grupo, expediente: row.expediente ?? '' } : {}),
      ...(dispositivo ? { grupo: row.grupo, marca: row.marca === 'null' ? '' : row.marca } : {}),
      fechaExpedicion: row.fechaexpedicion ?? '',
      fechaVencimiento: (dispositivo ? row.fecha_vencimiento : row.fechavencimiento) ?? '',
      fechaActivo: row.fechaactivo ?? '',
      fechaInactivo: row.fechainactivo ?? '',
    };
  }
}
