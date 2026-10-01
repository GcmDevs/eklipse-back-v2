import { Injectable } from '@nestjs/common';
import { DetalleRadicacionOrm, DocumentoOrm, FacturaOrm, RadicacionOrm, UsuarioOrm } from '../orm';
import { ESTADOS_RADICACION, TIPOS_FACTURA } from '../../domain/types';
import { orderBy } from 'lodash';
import { BaseSource } from '@common/infrastructure/services';
import { getDateRangeByDayFixed } from '../../functions';

export interface EstadisticaI {
  facturado: {
    cantidad: number;
    valor: number;
  };
  anulado: {
    cantidad: number;
    valor: number;
  };
  radicable: {
    cantidad: number;
    valor: number;
  };
  radicado: {
    cantidad: number;
    valor: number;
  };
  cumplimiento: {
    cumplido: number;
    porCumplir: number;
  };
  pendienteRadicar: {
    cantidad: number;
    valor: number;
  };
}

export interface InfoDocI {
  nombre: string;
  facturadas: number;
  radicadas: number;
  anuladas: number;
  valorFacturado: number;
  valorRadicable: number;
  valorRadicado: number;
  porcentajeRadicado: number;
  contratos?: InfoDocI[];
}

export interface DocsI {
  porDocumentos: InfoDocI[];
  porEstado: InfoDocI[];
  porEntidad: InfoDocI[];
  porRadicador: InfoDocI[];
  porCreadorRadicacion: InfoDocI[];
}

export interface Chart1 {
  fecha: string;
  dia: number;
  facturado: number;
  radicado: number;
}

export interface Chart2 {
  fecha: string;
  dia: number;
  facturadas: number;
  pendientes: number;
  radicadas: number;
  anuladas: number;
}

@Injectable()
export class FacturaCrudSource extends BaseSource {
  public async fetch(start: Date, end: Date, centroId: number) {
    const facturaRp = this.conn.getRepository(FacturaOrm);

    const filterByCentro =
      centroId && centroId != 99 ? ` and ingreso.centro.id in(${centroId})` : '';

    const facturas = await facturaRp
      .createQueryBuilder('factura')
      .leftJoinAndSelect('factura.ingreso', 'ingreso', 'factura.ingresoId = ingreso.id')
      .leftJoinAndSelect('ingreso.centro', 'centro', 'ingreso.centroId = centro.id')
      .leftJoinAndSelect(
        'factura.detalleRadicacion',
        'detalleRadicacion',
        'detalleRadicacion.facturaId = factura.id'
      )
      .leftJoinAndSelect(
        'factura.detalleContrato',
        'detalleContrato',
        'factura.detalleContratoId = detalleContrato.id'
      )
      .leftJoinAndSelect(
        'detalleContrato.contrato',
        'contrato',
        'detalleContrato.contratoId = contrato.id'
      )
      .leftJoinAndSelect('contrato.tercero', 'tercero', 'contrato.terceroId = tercero.id')
      .leftJoinAndSelect(
        'detalleRadicacion.radicacion',
        'radicacion',
        'detalleRadicacion.radicacionId = radicacion.id'
      )
      .leftJoinAndSelect(
        'detalleRadicacion.usuario',
        'usuario',
        'detalleRadicacion.usuarioId = usuario.id'
      )
      .leftJoinAndSelect('radicacion.documento', 'documento', 'radicacion.id = documento.id')
      .leftJoinAndSelect(
        'documento.confirmadoPor',
        'confirmadoPor',
        'documento.confirmadoPorId = confirmadoPor.id'
      )
      .where(
        `factura.fechaCreacion between :start and :end
        and isnull(radicacion.estadoCode, 4) in(-1, 0, 1, 2, 4)
        and factura.tipoCode in(0, 1, 16)${filterByCentro}
        `,
        {
          start,
          end,
        }
      )
      .getMany();

    const estadisticas: EstadisticaI = {
      facturado: {
        cantidad: 0,
        valor: 0,
      },
      anulado: {
        cantidad: 0,
        valor: 0,
      },
      radicable: {
        cantidad: 0,
        valor: 0,
      },
      radicado: {
        cantidad: 0,
        valor: 0,
      },
      cumplimiento: {
        cumplido: 0,
        porCumplir: 0,
      },
      pendienteRadicar: {
        cantidad: 0,
        valor: 0,
      },
    };
    const documentos: DocsI = {
      porDocumentos: [],
      porEstado: [],
      porEntidad: [],
      porRadicador: [],
      porCreadorRadicacion: [],
    };
    let acumulado: Chart1[] = [];
    let diario: Chart2[] = [];

    facturas.map(ft => {
      ft.fechaCreacion = new Date(ft.fechaCreacion.getTime() - 18000000);

      const isRadicada = ft.detalleRadicacion && !ft.isAnulado;
      const isRadicable = ft.tipoCode != TIPOS_FACTURA.facturaPaciente.getCode() && !ft.isAnulado;

      const docAcu = acumulado.filter(
        acu => acu.fecha === ft.fechaCreacion.toISOString().split('T')[0]
      );

      const docDia = diario.filter(
        dia => dia.fecha === ft.fechaCreacion.toISOString().split('T')[0]
      );

      if (!docAcu.length) {
        acumulado.push({
          fecha: ft.fechaCreacion.toISOString().split('T')[0],
          dia: ft.fechaCreacion.getDate(),
          facturado: ft.valorTotal,
          radicado: isRadicada ? ft.valorTotal : 0,
        });
      } else {
        const dtAcu = docAcu[0];
        dtAcu.facturado += ft.valorTotal;
        if (isRadicada) dtAcu.radicado += ft.valorTotal;
      }

      if (!docDia.length) {
        diario.push({
          fecha: ft.fechaCreacion.toISOString().split('T')[0],
          dia: ft.fechaCreacion.getDate(),
          facturadas: 1,
          pendientes: isRadicable && !isRadicada ? 1 : 0,
          radicadas: isRadicada ? 1 : 0,
          anuladas: ft.isAnulado ? 1 : 0,
        });
      } else {
        const dtDia = docDia[0];
        dtDia.facturadas++;
        if (isRadicable && !isRadicada) dtDia.pendientes++;
        if (isRadicada) dtDia.radicadas++;
        if (ft.isAnulado) dtDia.anuladas++;
      }
      /*******************************/
      /********* END CHARTS **********/
      /*******************************/
      estadisticas.facturado.cantidad++;
      estadisticas.facturado.valor += ft.valorTotal;

      if (ft.fechaAnulacion) {
        estadisticas.anulado.cantidad++;
        estadisticas.anulado.valor += ft.valorTotal;
      }

      if (
        ft.tipoCode != TIPOS_FACTURA.facturaPaciente.getCode() &&
        !ft.detalleRadicacion &&
        !ft.isAnulado
      ) {
        estadisticas.pendienteRadicar.cantidad++;
        estadisticas.pendienteRadicar.valor += ft.valorTotal;
      } else if (ft.detalleRadicacion && !ft.isAnulado) {
        estadisticas.radicado.cantidad++;
        estadisticas.radicado.valor += ft.valorTotal;
      }

      ft.setTypes(true);
      if (ft.detalleRadicacion) {
        if (ft.detalleRadicacion.radicacion) {
          if (ft.detalleRadicacion.radicacion.estadoCode === null) {
            ft.detalleRadicacion.radicacion.estadoCode = 4;
          }
          ft.detalleRadicacion.radicacion.setTypes();
          delete ft.detalleRadicacion.radicacion.terceroId;
        }
        delete ft.detalleRadicacion.facturaId;
        delete ft.detalleRadicacion.radicacionId;
      }
      delete ft.ingresoId;
      if (ft.ingreso) delete ft.ingreso.centroId;

      if (!ft.detalleRadicacion) {
        ft.detalleRadicacion = new DetalleRadicacionOrm();
        ft.detalleRadicacion.usuario = new UsuarioOrm();
        ft.detalleRadicacion.usuario.nombreCompleto = 'USUARIO POR ASIGNAR';
        ft.detalleRadicacion.radicacion = new RadicacionOrm();
        ft.detalleRadicacion.radicacion.estado = ESTADOS_RADICACION.noRadicado;
        ft.detalleRadicacion.radicacion.documento = new DocumentoOrm();
        ft.detalleRadicacion.radicacion.documento.confirmadoPor = new UsuarioOrm();
        ft.detalleRadicacion.radicacion.documento.confirmadoPor.nombreCompleto =
          'USUARIO POR ASIGNAR';
      }

      if (ft.detalleRadicacion && !ft.detalleRadicacion.usuario) {
        ft.detalleRadicacion.usuario = new UsuarioOrm();
        ft.detalleRadicacion.usuario.nombreCompleto = 'USUARIO POR ASIGNAR';
      }

      if (
        ft.detalleRadicacion &&
        ft.detalleRadicacion.radicacion &&
        (!ft.detalleRadicacion.radicacion.documento ||
          !ft.detalleRadicacion.radicacion.documento.confirmadoPorId)
      ) {
        if (!ft.detalleRadicacion.radicacion.documento) {
          ft.detalleRadicacion.radicacion.documento = new DocumentoOrm();
        }
        ft.detalleRadicacion.radicacion.documento.confirmadoPor = new UsuarioOrm();
        ft.detalleRadicacion.radicacion.documento.confirmadoPor.nombreCompleto =
          'USUARIO POR ASIGNAR';
      }

      /*******************************/
      /******** POR DOCUMENTOS *******/
      /*******************************/
      const perDoc = documentos.porDocumentos.filter(el => el.nombre === ft.tipo.getForHumans());
      if (!perDoc.length) {
        documentos.porDocumentos.push({
          nombre: ft.tipo.getForHumans(),
          facturadas: 1,
          radicadas: isRadicada ? 1 : 0,
          anuladas: ft.isAnulado ? 1 : 0,
          valorFacturado: ft.valorTotal,
          valorRadicable: isRadicable ? ft.valorTotal : 0,
          valorRadicado: isRadicada ? ft.valorTotal : 0,
          porcentajeRadicado: 0,
        });
      } else {
        const doc = perDoc[0];
        doc.facturadas++;
        if (isRadicada) doc.radicadas++;
        if (ft.isAnulado) doc.anuladas++;
        doc.valorFacturado += ft.valorTotal;
        if (isRadicable) doc.valorRadicable += ft.valorTotal;
        if (isRadicada) doc.valorRadicado += ft.valorTotal;
        doc.porcentajeRadicado = 0;
      }
      /*******************************/
      /********** POR ESTADO *********/
      /*******************************/
      const perEst = documentos.porEstado.filter(
        el => el.nombre === ft.detalleRadicacion.radicacion.estado.getForHumans()
      );
      if (!perEst.length) {
        documentos.porEstado.push({
          nombre: ft.detalleRadicacion.radicacion.estado.getForHumans(),
          facturadas: 1,
          radicadas: isRadicada ? 1 : 0,
          anuladas: ft.isAnulado ? 1 : 0,
          valorFacturado: ft.valorTotal,
          valorRadicable: isRadicable ? ft.valorTotal : 0,
          valorRadicado: isRadicada ? ft.valorTotal : 0,
          porcentajeRadicado: 0,
        });
      } else {
        const doc = perEst[0];
        doc.facturadas++;
        if (isRadicada) doc.radicadas++;
        if (ft.isAnulado) doc.anuladas++;
        doc.valorFacturado += ft.valorTotal;
        if (isRadicable) doc.valorRadicable += ft.valorTotal;
        if (isRadicada) doc.valorRadicado += ft.valorTotal;
        doc.porcentajeRadicado = 0;
      }
      /*******************************/
      /********* POR ENTIDAD *********/
      /*******************************/
      const perDetCont = documentos.porEntidad.filter(
        el => el.nombre === ft.detalleContrato.contrato.tercero.nombre.trim()
      );
      if (!perDetCont.length) {
        documentos.porEntidad.push({
          nombre: ft.detalleContrato.contrato.tercero.nombre.trim(),
          facturadas: 1,
          radicadas: isRadicada ? 1 : 0,
          anuladas: ft.isAnulado ? 1 : 0,
          valorFacturado: ft.valorTotal,
          valorRadicable: isRadicable ? ft.valorTotal : 0,
          valorRadicado: isRadicada ? ft.valorTotal : 0,
          porcentajeRadicado: 0,
          contratos: [
            {
              nombre: ft.detalleContrato.contrato.nombre.trim(),
              facturadas: 1,
              radicadas: isRadicada ? 1 : 0,
              anuladas: ft.isAnulado ? 1 : 0,
              valorFacturado: ft.valorTotal,
              valorRadicable: isRadicable ? ft.valorTotal : 0,
              valorRadicado: isRadicada ? ft.valorTotal : 0,
              porcentajeRadicado: 0,
            },
          ],
        });
      } else {
        const doc = perDetCont[0];
        const perCont = doc.contratos.filter(
          el => el.nombre === ft.detalleContrato.contrato.nombre.trim()
        );
        doc.facturadas++;
        if (isRadicada) doc.radicadas++;
        if (ft.isAnulado) doc.anuladas++;
        doc.valorFacturado += ft.valorTotal;
        if (isRadicable) doc.valorRadicable += ft.valorTotal;
        if (isRadicada) doc.valorRadicado += ft.valorTotal;
        doc.porcentajeRadicado = 0;
        if (!perCont.length) {
          doc.contratos.push({
            nombre: ft.detalleContrato.contrato.nombre.trim(),
            facturadas: 1,
            radicadas: isRadicada ? 1 : 0,
            anuladas: ft.isAnulado ? 1 : 0,
            valorFacturado: ft.valorTotal,
            valorRadicable: isRadicable ? ft.valorTotal : 0,
            valorRadicado: isRadicada ? ft.valorTotal : 0,
            porcentajeRadicado: 0,
          });
        } else {
          const docPerCont = perCont[0];
          docPerCont.facturadas++;
          if (isRadicada) docPerCont.radicadas++;
          if (ft.isAnulado) docPerCont.anuladas++;
          docPerCont.valorFacturado += ft.valorTotal;
          if (isRadicable) docPerCont.valorRadicable += ft.valorTotal;
          if (isRadicada) docPerCont.valorRadicado += ft.valorTotal;
          docPerCont.porcentajeRadicado = 0;
        }
      }
      /*******************************/
      /********* POR RADICADOR *******/
      /*******************************/
      const perRadic = documentos.porRadicador.filter(
        el => el.nombre === ft.detalleRadicacion.radicacion.documento.confirmadoPor.nombreCompleto
      );
      if (!perRadic.length) {
        documentos.porRadicador.push({
          nombre: ft.detalleRadicacion.radicacion.documento.confirmadoPor.nombreCompleto,
          facturadas: 1,
          radicadas: isRadicada ? 1 : 0,
          anuladas: ft.isAnulado ? 1 : 0,
          valorFacturado: ft.valorTotal,
          valorRadicable: isRadicable ? ft.valorTotal : 0,
          valorRadicado: isRadicada ? ft.valorTotal : 0,
          porcentajeRadicado: 0,
        });
      } else {
        const doc = perRadic[0];
        doc.facturadas++;
        if (isRadicada) doc.radicadas++;
        if (ft.isAnulado) doc.anuladas++;
        doc.valorFacturado += ft.valorTotal;
        if (isRadicable) doc.valorRadicable += ft.valorTotal;
        if (isRadicada) doc.valorRadicado += ft.valorTotal;
        doc.porcentajeRadicado = 0;
      }
      /*******************************/
      /**** POR CREADOR RADICACIÓN ***/
      /*******************************/
      const perCreRadic = documentos.porCreadorRadicacion.filter(
        el => el.nombre === ft.detalleRadicacion.usuario.nombreCompleto
      );
      if (!perCreRadic.length) {
        documentos.porCreadorRadicacion.push({
          nombre: ft.detalleRadicacion.usuario.nombreCompleto,
          facturadas: 1,
          radicadas: isRadicada ? 1 : 0,
          anuladas: ft.isAnulado ? 1 : 0,
          valorFacturado: ft.valorTotal,
          valorRadicable: isRadicable ? ft.valorTotal : 0,
          valorRadicado: isRadicada ? ft.valorTotal : 0,
          porcentajeRadicado: 0,
        });
      } else {
        const doc = perCreRadic[0];
        doc.facturadas++;
        if (isRadicada) doc.radicadas++;
        if (ft.isAnulado) doc.anuladas++;
        doc.valorFacturado += ft.valorTotal;
        if (isRadicable) doc.valorRadicable += ft.valorTotal;
        if (isRadicada) doc.valorRadicado += ft.valorTotal;
        doc.porcentajeRadicado = 0;
      }
    });

    estadisticas.radicable.cantidad =
      estadisticas.pendienteRadicar.cantidad + estadisticas.radicado.cantidad;
    estadisticas.radicable.valor =
      estadisticas.pendienteRadicar.valor + estadisticas.radicado.valor;

    estadisticas.cumplimiento.cumplido = +(
      (estadisticas.radicado.valor * 100) /
      estadisticas.facturado.valor
    ).toFixed(2);
    estadisticas.cumplimiento.porCumplir = +(100 - estadisticas.cumplimiento.cumplido).toFixed(2);

    documentos.porDocumentos.map(dc => {
      if (!dc.radicadas) dc.porcentajeRadicado = 0;
      else dc.porcentajeRadicado = +((dc.valorRadicado * 100) / dc.valorRadicable).toFixed(2);
    });

    documentos.porEstado.map(dc => {
      if (dc.nombre !== ESTADOS_RADICACION.noRadicado.getForHumans()) dc.porcentajeRadicado = 100;
    });

    documentos.porEntidad.map(dc => {
      if (!dc.radicadas) dc.porcentajeRadicado = 0;
      else dc.porcentajeRadicado = +((dc.valorRadicado * 100) / dc.valorRadicable).toFixed(2);
      dc.contratos.map(dt => {
        if (!dt.radicadas) dt.porcentajeRadicado = 0;
        else dt.porcentajeRadicado = +((dt.valorRadicado * 100) / dt.valorRadicable).toFixed(2);
      });
    });

    documentos.porRadicador.map(dc => {
      if (!dc.radicadas) dc.porcentajeRadicado = 0;
      else dc.porcentajeRadicado = +((dc.valorRadicado * 100) / dc.valorRadicable).toFixed(2);
    });

    documentos.porCreadorRadicacion.map(dc => {
      if (!dc.radicadas) dc.porcentajeRadicado = 0;
      else dc.porcentajeRadicado = +((dc.valorRadicado * 100) / dc.valorRadicable).toFixed(2);
    });

    const dateRange = getDateRangeByDayFixed(start, end);

    dateRange.forEach(dt => {
      const fecha = dt.toISOString().split('T')[0];
      const existAcu = acumulado.filter(acu => acu.fecha === fecha);
      const existDia = diario.filter(acu => acu.fecha === fecha);
      if (!existAcu.length) {
        acumulado.push({
          fecha,
          dia: dt.getDate(),
          facturado: 0,
          radicado: 0,
        });
      }
      if (!existDia.length) {
        diario.push({
          fecha,
          dia: dt.getDate(),
          facturadas: 0,
          pendientes: 0,
          radicadas: 0,
          anuladas: 0,
        });
      }
    });

    acumulado = orderBy(acumulado, 'fecha', 'asc');
    diario = orderBy(diario, 'fecha', 'asc');

    acumulado.map((dt, i) => {
      if (i) {
        dt.facturado += acumulado[i - 1].facturado;
        dt.radicado += acumulado[i - 1].radicado;
      }
    });

    return {
      estadisticas: [
        {
          title: 'Facturado',
          subtitle: `${estadisticas.facturado.cantidad} factura(s)`,
          result: estadisticas.facturado.valor,
        },
        {
          title: 'Anulado',
          subtitle: `${estadisticas.anulado.cantidad} factura(s)`,
          result: estadisticas.anulado.valor,
        },
        {
          title: 'Radicable',
          subtitle: `${estadisticas.radicable.cantidad} factura(s)`,
          result: estadisticas.radicable.valor,
        },
        {
          title: 'Radicado',
          subtitle: `${estadisticas.radicado.cantidad} factura(s)`,
          result: estadisticas.radicado.valor,
        },
        {
          title: 'Cumplimiento',
          subtitle: '',
          result: estadisticas.cumplimiento.cumplido,
          result2: estadisticas.cumplimiento.porCumplir,
        },
        {
          title: 'Pend. radicar',
          subtitle: `${estadisticas.pendienteRadicar.cantidad} factura(s)`,
          result: estadisticas.pendienteRadicar.valor,
        },
      ],
      documentos,
      charts: {
        acumulado,
        diario,
      },
      //facturas,
    };
  }
}
