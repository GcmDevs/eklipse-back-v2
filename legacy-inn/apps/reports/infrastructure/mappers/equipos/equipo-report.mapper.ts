import { ensureArray, unwrapJsonString } from '@common/application/services';
import {
  CategoriaDocumento,
  CODIGOS_VALIDOS,
  OTROS_PREFIX,
  Riesgo,
  TipoActividad,
  TipoAdquisicion,
  TipoManual,
  TipoMedidaCodigo,
  VariableCalibracionCodigo,
  VariableCalibracionCodigoForHumans,
} from '@equipos/domain/enums';
import { DatosTecnicos, VariableCalibracion } from '@equipos/domain/value-objects';
import { MedidasTecnicas } from '@equipos/domain/value-objects/medidas-tecnicas.vo';
import { ResponsableView } from '@orm/cor';
import { AccesorioUnidadOrm, EquipoOrm } from '@orm/inn/equipos';
import { DocumentoTipoEquipoOrm } from '@orm/inn/equipos/catalogo/documento-tipo-equipo.orm';
import {
  formatMedida,
  formatMedidaEtiquetaAdicional,
  formatMedidaValorAdicional,
  formatPeriodoTiempo,
  ParseFechaFromUnclearType,
  toReportUpper,
  truncateReportText,
} from 'apps/reports/domain/helpers';
import {
  AccesorioPdf,
  DocumentoEquipoPdf,
  EquipoPdf,
  MedidaAdicionalPdf,
  VariableCalibracionFilaPdf,
  VariableCalibracionSlotPdf,
} from 'apps/reports/domain/types';

export class HdvEquipoReportMapper {
  private static readonly CALIB_VAR_SLOTS_PER_ROW = 5;
  private static readonly CALIB_VAR_SLOT_COLS = 3;
  private static readonly CALIB_VAR_ROW_COLS = 17;

  private static readonly CALIB_VAR_CATALOGO: Array<{
    etiqueta: string;
    codigo: VariableCalibracionCodigo;
  }> = [
    { etiqueta: 'PRESIÓN', codigo: VariableCalibracionCodigo.PRESION },
    { etiqueta: 'PESO', codigo: VariableCalibracionCodigo.PESO },
    { etiqueta: 'POTENCIA', codigo: VariableCalibracionCodigo.POTENCIA },
    { etiqueta: 'FLUJO', codigo: VariableCalibracionCodigo.FLUJO },
    { etiqueta: 'ENERGÍA', codigo: VariableCalibracionCodigo.ENERGIA },
    { etiqueta: 'TEMPERATURA', codigo: VariableCalibracionCodigo.TEMPERATURA },
    { etiqueta: 'HUMEDAD', codigo: VariableCalibracionCodigo.HUMEDAD },
    { etiqueta: 'VELOCIDAD', codigo: VariableCalibracionCodigo.VELOCIDAD },
    { etiqueta: 'LONGITUD', codigo: VariableCalibracionCodigo.LONGITUD },
    { etiqueta: 'TIEMPO', codigo: VariableCalibracionCodigo.TIEMPO },
  ];

  private static clipPdf(value: string | undefined | null, max: number): string {
    if (value == null || value === '') {
      return '';
    }
    return truncateReportText(String(value), max);
  }

  private static clipPdfOptional(value: string | undefined, max: number): string | undefined {
    if (!value) {
      return undefined;
    }
    return truncateReportText(value, max);
  }

  public static toHojaVidaPdfReport(
    equipo: EquipoOrm,
    responsable: ResponsableView | undefined | null,
    documentosSoporteAnexo: DocumentoEquipoPdf[] = []
  ): EquipoPdf {
    const tipoEquipo = equipo.tipoEquipoRel;
    const fichaTecnica = tipoEquipo?.fichaTecnica;
    const clasificacion = fichaTecnica?.clasificacionBiomedica;
    const datosTecnicos = DatosTecnicos.create(fichaTecnica?.datosTecnicos?.medidas);
    const variablesCalibracion = this.resolveVariablesCalibracion(fichaTecnica?.dtCalibVariables);
    const compra = equipo.compra;
    const tipoAdquisicion = compra?.tipoAdquisicion;
    const riesgo = clasificacion?.riesgo;

    const planMantenimiento = equipo?.planesActividad?.find(
      p => p.tipo === TipoActividad.MANTENIMIENTO
    );
    const planCalibracion = equipo?.planesActividad?.find(
      p => p.tipo === TipoActividad.CALIBRACION
    );

    const combinedDocumentos = [...tipoEquipo?.documentos, ...compra.documentos];
    const documentosTipoEquipo: DocumentoTipoEquipoOrm[] = ensureArray(combinedDocumentos).filter(
      d => d.activo !== false
    );
    const manuales = documentosTipoEquipo.filter(
      d => d.tipoDocumento?.categoria === CategoriaDocumento.MANUAL
    );

    return {
      encabezado: {
        pagina: '1 de 1',
      },

      identificacion: {
        nombreActivo: this.clipPdf(equipo?.nombre ?? '', 48),
        codigo: this.clipPdf(equipo?.codigo ?? '', 20),
        fechaAprobacion: '',
        version: '01',
        marca: this.clipPdf(tipoEquipo?.modelo?.marca?.nombre ?? '', 22),
        modelo: this.clipPdf(tipoEquipo?.modelo?.nombre ?? '', 22),
        numeroSerie: this.clipPdf(equipo?.numeroSerie ?? '', 20),
        numeroPlaca: this.clipPdf(equipo?.numeroPlaca ?? '', 20),
        ubicacion: this.clipPdf(responsable?.departamentoNombre ?? '', 28),
        localizacion: this.clipPdf(equipo?.localizacion ?? '', 28),
        periodicidadMantenimiento: planMantenimiento?.periocidad
          ? `Cada ${formatPeriodoTiempo(planMantenimiento.periocidad)}`
          : 'N/A',
        fotoEquipo: undefined,

        adquisicion: {
          tipoAdquisicion: {
            compra: tipoAdquisicion === TipoAdquisicion.COMPRA,
            comodato: tipoAdquisicion === TipoAdquisicion.COMODATO,
            alquiler: tipoAdquisicion === TipoAdquisicion.ALQUILER,
            otros: tipoAdquisicion === TipoAdquisicion.OTROS,
          },
          fechaAdquisicion: ParseFechaFromUnclearType(compra?.fechaCompra),
          fechaVencimientoGarantia: ParseFechaFromUnclearType(compra?.fechVencGarantia),
          fechaPuestaFuncionamiento: ParseFechaFromUnclearType(equipo?.fechaPuestaFuncionamiento),
          fechaFabricacion: ParseFechaFromUnclearType(compra?.fechaFabricacion),
          vidaUtil: fichaTecnica?.vidaUtil ? formatPeriodoTiempo(fichaTecnica.vidaUtil) : undefined,
        },
      },

      fichaTecnica: {
        clasificacionBiomedica: {
          prevencion: !!clasificacion?.prevencion,
          diagnostico: !!clasificacion?.diagnostico,
          rehabilitacion: !!clasificacion?.rehabilitacion,
          analisisLaboratorio: !!clasificacion?.analisisLaboratorio,
          tratamientoMantVida: !!clasificacion?.tratamientoMantenimientoDeVida,
          registroSanitario: {
            aplica: !!clasificacion?.aplicaRegSanitario,
            numero: this.clipPdfOptional(clasificacion?.numeroRegSanitario ?? undefined, 50),
          },
        },

        riesgo: {
          noAplica: riesgo === Riesgo.NO_APLICA,
          muyAltoIII: riesgo === Riesgo.MUY_ALTO,
          altoIIB: riesgo === Riesgo.ALTO,
          moderadoIIA: riesgo === Riesgo.MODERADO,
          bajoI: riesgo === Riesgo.BAJO,
        },

        datosTecnicos: {
          voltaje: this.clipPdfOptional(
            formatMedida(datosTecnicos?.getMedidas?.getByTipo(TipoMedidaCodigo.VOLTAJE)),
            16
          ),
          corriente: this.clipPdfOptional(
            formatMedida(datosTecnicos?.getMedidas?.getByTipo(TipoMedidaCodigo.CORRIENTE)),
            16
          ),
          frecuencia: this.clipPdfOptional(
            formatMedida(datosTecnicos?.getMedidas?.getByTipo(TipoMedidaCodigo.FRECUENCIA)),
            16
          ),
          potencia: this.clipPdfOptional(
            formatMedida(datosTecnicos?.getMedidas?.getByTipo(TipoMedidaCodigo.POTENCIA)),
            16
          ),
          revoluciones: this.clipPdfOptional(
            formatMedida(datosTecnicos?.getMedidas?.getByTipo(TipoMedidaCodigo.REVOLUCIONES)),
            16
          ),
          condicionesAmbientales: this.clipPdfOptional(
            datosTecnicos?.getMedidas?.getByTipo(TipoMedidaCodigo.TEMPMIN) ||
              datosTecnicos?.getMedidas?.getByTipo(TipoMedidaCodigo.TEMPMAX)
              ? `Min: ${
                  formatMedida(datosTecnicos?.getMedidas?.getByTipo(TipoMedidaCodigo.TEMPMIN)) ??
                  '-'
                } / Max: ${formatMedida(datosTecnicos?.getMedidas?.getByTipo(TipoMedidaCodigo.TEMPMAX)) ?? '-'}`
              : undefined,
            22
          ),
          medidasAdicionales: this.mapMedidasAdicionales(datosTecnicos?.getMedidas),
        },

        datosCalibracion: {
          requiereCalibracion: {
            si: fichaTecnica?.reqCalibracion === true,
            no: fichaTecnica?.reqCalibracion === false,
          },
          frecuencia: planCalibracion?.periocidad
            ? `Cada ${formatPeriodoTiempo(planCalibracion.periocidad)}`
            : 'N/A',
          codigoUltimaCalibracion: '',
          variables: this.mapVariablesCalibracion(variablesCalibracion),
        },

        manuales: {
          servicio: this.hasManual(manuales, TipoManual.SERVICIO),
          usuario: this.hasManual(manuales, TipoManual.USUARIO),
          fichaTecnica: this.hasManual(manuales, TipoManual.FICHA_TECNICA),
        },
      },

      proveedor: {
        nombre: this.clipPdf(compra?.proveedor?.nombre ?? compra?.proveedorSnap ?? '', 28),
        telefono: this.clipPdf(compra?.proveedor?.tel1 || compra?.proveedor?.tel2 || '', 16),
        direccion: this.clipPdf(compra?.proveedor?.direccion ?? '', 36),
        email: '',
      },

      accesorios: this.mapAccesorios(ensureArray(equipo.accesoriosUnidad)),

      documentos: documentosSoporteAnexo.map(doc => ({
        nombre: this.clipPdf(doc.nombre ?? '', 48),
        aplica: !!doc.aplica,
        observaciones: this.clipPdfOptional(doc.observaciones, 75),
      })),
    };
  }

  private static hasManual(manuales: DocumentoTipoEquipoOrm[], tipo: TipoManual): boolean {
    return manuales.some(m => {
      if (m.aplica === false) {
        return false;
      }
      const nombre = (m.tipoDocumento?.nombre ?? '')
        .toUpperCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/[^A-Z0-9]+/g, ' ')
        .trim();

      switch (tipo) {
        case TipoManual.USUARIO:
          return nombre.includes('USUARIO');
        case TipoManual.SERVICIO:
          return nombre.includes('SERVICIO');
        case TipoManual.FICHA_TECNICA:
          return (
            nombre.includes('FICHA') && (nombre.includes('TECNIC') || nombre.includes('TENIC'))
          );
        default:
          return false;
      }
    });
  }

  private static resolveVariablesCalibracion(raw: unknown): VariableCalibracion {
    if (raw instanceof VariableCalibracion) {
      return raw;
    }

    if (
      raw &&
      typeof raw === 'object' &&
      typeof (raw as VariableCalibracion).has === 'function' &&
      typeof (raw as VariableCalibracion).getAll === 'function'
    ) {
      return raw as VariableCalibracion;
    }

    if (typeof raw === 'string') {
      const parsed = unwrapJsonString(raw);
      if (parsed !== undefined) {
        return this.resolveVariablesCalibracion(parsed);
      }
      return VariableCalibracion.create();
    }

    if (Array.isArray(raw)) {
      if (!raw.length) {
        return VariableCalibracion.create();
      }

      if (typeof raw[0] === 'string') {
        return VariableCalibracion.fromPrimitives(
          raw.map(entry => this.normalizeCodigoCalibracion(String(entry)))
        );
      }

      if (typeof raw[0] === 'object' && raw[0] !== null) {
        const items = raw
          .map((entry: Record<string, unknown>) => {
            const tipoRaw = entry?.tipo ?? entry?.codigo ?? entry?.variable;
            if (!tipoRaw) return null;

            const tipo = String(tipoRaw);
            if (tipo === 'OTR' || tipo.startsWith(OTROS_PREFIX)) {
              const nombre = entry?.nombre ?? entry?.name ?? tipo.slice(OTROS_PREFIX.length);
              return {
                tipo: 'OTR' as const,
                nombre: String(nombre ?? '').trim(),
              };
            }

            const codigo = this.normalizeCodigoCalibracion(tipo);
            if (!CODIGOS_VALIDOS.has(codigo as VariableCalibracionCodigo)) {
              return null;
            }

            return { tipo: codigo as VariableCalibracionCodigo };
          })
          .filter(Boolean) as Array<{
          tipo: VariableCalibracionCodigo | 'OTR';
          nombre?: string;
        }>;

        return VariableCalibracion.create(items);
      }
    }

    return VariableCalibracion.create();
  }

  private static normalizeCodigoCalibracion(entry: string): string {
    if (entry.startsWith(OTROS_PREFIX)) {
      return entry;
    }

    if (CODIGOS_VALIDOS.has(entry as VariableCalibracionCodigo)) {
      return entry;
    }

    const fromHumanLabel = Object.entries(VariableCalibracionCodigoForHumans).find(
      ([, label]) => label === entry || label === entry.toUpperCase()
    )?.[0];

    return fromHumanLabel ?? entry;
  }

  private static mapVariablesCalibracion(variables: VariableCalibracion) {
    const slots: VariableCalibracionSlotPdf[] = [
      ...this.CALIB_VAR_CATALOGO.map(({ etiqueta, codigo }) => ({
        etiqueta,
        marcado: variables.has(codigo),
      })),
      ...variables
        .getAll()
        .filter(item => item.tipo === 'OTR')
        .map(item => ({
          etiqueta: this.clipPdf(toReportUpper(item.nombre?.trim() || 'OTRO'), 11),
          marcado: true,
        })),
    ];

    return {
      filas: this.mapVariablesCalibracionFilas(slots),
    };
  }

  private static mapVariablesCalibracionFilas(
    slots: VariableCalibracionSlotPdf[]
  ): VariableCalibracionFilaPdf[] {
    const filas: VariableCalibracionFilaPdf[] = [];
    const perRow = this.CALIB_VAR_SLOTS_PER_ROW;
    const slotCols = this.CALIB_VAR_SLOT_COLS;
    const rowCols = this.CALIB_VAR_ROW_COLS;

    for (let i = 0; i < slots.length; i += perRow) {
      const rowSlots = slots.slice(i, i + perRow);
      filas.push({
        slots: rowSlots,
        blanks: Math.max(0, rowCols - rowSlots.length * slotCols),
      });
    }

    return filas;
  }

  private static mapMedidasAdicionales(
    medidas: MedidasTecnicas | undefined | null
  ): MedidaAdicionalPdf[] {
    if (!medidas) return [];

    return medidas
      .getAll()
      .filter(medida => medida.getTipo === TipoMedidaCodigo.OTROS)
      .map(medida => ({
        etiqueta: this.clipPdf(formatMedidaEtiquetaAdicional(medida), 28),
        valor: this.clipPdf(formatMedidaValorAdicional(medida), 16),
      }));
  }

  private static mapAccesorios(accesorios: AccesorioUnidadOrm[]): AccesorioPdf[] {
    if (!accesorios?.length) return [];
    return accesorios
      .filter(acc => !acc.descontinuado)
      .map(acc => {
        const estandar = acc.accesorioEstandar;
        return {
          cantidad: estandar?.cantidad ?? 1,
          parte: this.clipPdf(acc.parteSnap || estandar?.parteSnap || '', 24),
          marca: this.clipPdf(estandar?.marca?.nombre ?? '', 20),
          referencia: this.clipPdf(estandar?.referencia ?? '', 24),
        };
      });
  }
}
