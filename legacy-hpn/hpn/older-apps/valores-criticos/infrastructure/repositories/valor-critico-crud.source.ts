import { BadRequestException, Injectable } from '@nestjs/common';
import {
  ConductaOrm,
  RecepcionTecnicaReactivosOrm,
  ValorCriticoOrm,
  ValoresCriticosReactivosOrm,
} from '../orm';
import { ADMIN_AUTHORITY } from '@authorities/principal';
import { HPN_AUTHORITIES } from '@authorities/hospitalizacion';
import { BaseSource } from '@common/infrastructure/services';
import {
  AuditadoDto,
  RecepcionTecnicaReactivosDto,
  ValorCriticoDto,
  ValoresCriticosReactivosDto,
} from '@hpn/old/valores-criticos/presentation/dtos';
import { Between } from 'typeorm';
import { TipoProductoCode } from '../../domain/types';

@Injectable()
export class ValorCriticoCrudSource extends BaseSource {
  public async fetchRecepcionTecnicaReactivos(inicio: Date, final: Date) {
    try {
      const valTecReactivosRp = this.conn.getRepository(RecepcionTecnicaReactivosOrm);
      const response = await valTecReactivosRp.find({
        where: {
          fechaCreacion: inicio && final ? Between(new Date(inicio), new Date(final)) : undefined,
        },
        relations: ['usuario'],
        order: {
          fechaCreacion: 'DESC',
        },
      });

      return response.map(res => ({
        id: res.id,
        fechaCreacion: res.fechaCreacion,
        fechaRecepcion: res.fechaRecepcion,
        nombre: res.nombre,
        presentacion: res.presentacion,
        marca: res.marca,
        cantidadRecepcionada: res.cantidadRecepcionada,
        lote: res.lote,
        fechaVencimiento: res.fechaVencimiento,
        registroInvima: res.registroInvima,
        empaque: res.empaque,
        cadenaFrio: res.cadenaFrio,
        temperaturaAmbienteEmbalaje: res.temperaturaAmbienteEmbalaje,
        refrigeradoEmbalaje: res.refrigeradoEmbalaje,
        temperaturaAmbienteRecepcion: res.temperaturaAmbienteRecepcion,
        refrigeradoRecepcion: res.refrigeradoRecepcion,
        observacion: res.observacion,
        usuarioRecibido: res.usuarioRecibido,
        usuarioId: res.usuario.nombreCompleto,
      }));
    } catch (error) {
      throw new BadRequestException(error.message);
    }
  }
  public async crearRecepcionTecnicaReactivos(body: RecepcionTecnicaReactivosDto) {
    console.log(body);

    try {
      await this.qr.connect();
      await this.qr.startTransaction();

      const {
        fechaRecepcion,
        nombre,
        presentacion,
        marca,
        cantidadRecepcionada,
        lote,
        fechaVencimiento,
        registroInvima,
        empaque,
        cadenaFrio,
        temperaturaAmbienteEmbalaje,
        refrigeradoEmbalaje,
        temperaturaAmbienteRecepcion,
        refrigeradoRecepcion,
        observacion,
        usuarioRecibido,
      } = body;

      const valTecReactivosRp = this.conn.getRepository(RecepcionTecnicaReactivosOrm);

      const valTecReactivo = new RecepcionTecnicaReactivosOrm();

      valTecReactivo.fechaCreacion = new Date();
      valTecReactivo.fechaRecepcion = fechaRecepcion;
      valTecReactivo.nombre = nombre;
      valTecReactivo.presentacion = presentacion;
      valTecReactivo.marca = marca;
      valTecReactivo.cantidadRecepcionada = cantidadRecepcionada;
      valTecReactivo.lote = lote;
      valTecReactivo.fechaVencimiento = fechaVencimiento;
      valTecReactivo.registroInvima = registroInvima;
      valTecReactivo.empaque = empaque;
      valTecReactivo.cadenaFrio = cadenaFrio;
      valTecReactivo.temperaturaAmbienteEmbalaje = temperaturaAmbienteEmbalaje;
      valTecReactivo.refrigeradoEmbalaje = refrigeradoEmbalaje;
      valTecReactivo.temperaturaAmbienteRecepcion = temperaturaAmbienteRecepcion;
      valTecReactivo.refrigeradoRecepcion = refrigeradoRecepcion;
      valTecReactivo.observacion = observacion;
      valTecReactivo.usuarioRecibido = usuarioRecibido;
      valTecReactivo.usuarioId = this.auth.id;

      const newValTecReactivo = await valTecReactivosRp.save(valTecReactivo);
      await this.qr.commitTransaction();
      return newValTecReactivo;
    } catch (error) {
      console.log(error);

      throw new BadRequestException(error.message);
    }
  }
  public async fetchReactivos(inicio: Date, final: Date) {
    try {
      const valCriReactivosRp = this.conn.getRepository(ValoresCriticosReactivosOrm);

      const response = await valCriReactivosRp.find({
        where: {
          fechaCreacion: inicio && final ? Between(new Date(inicio), new Date(final)) : undefined,
        },
        relations: ['usuario'],
        order: {
          fechaCreacion: 'DESC',
        },
      });

      return response.map(dataRes => ({
        id: dataRes.id,
        fechaCreacion: dataRes.fechaCreacion,
        tipoProducto: dataRes.tipoProducto,
        tipoEvento: dataRes.tipoEvento,
        nombre: dataRes.nombre,
        fuentePublicacion: dataRes.fuentePublicacion,
        risaRH: dataRes.risaRH,
        acciones: dataRes.acciones,
        relInstitucion: dataRes.relInstitucion,
        usuario: dataRes.usuario.nombreCompleto,
      }));
    } catch (error) {
      throw new BadRequestException(error.message);
    }
  }
  public async createReactivos(body: ValoresCriticosReactivosDto) {
    console.log(body);

    try {
      await this.qr.connect();
      await this.qr.startTransaction();
      const valCriReactivosRp = this.conn.getRepository(ValoresCriticosReactivosOrm);

      const {
        fuentePublicacion,
        tipoProducto,
        tipoEvento,
        nombre,
        risaRH,
        acciones,
        relInstitucion,
      } = body;

      if (!fuentePublicacion || !tipoProducto || !tipoEvento || !nombre || !risaRH || !acciones) {
        throw new BadRequestException('Faltan campos requeridos');
      }

      const valCriReactivo = new ValoresCriticosReactivosOrm();

      valCriReactivo.fechaCreacion = new Date();
      valCriReactivo.fuentePublicacion = fuentePublicacion;
      valCriReactivo.tipoProducto = tipoProducto as TipoProductoCode;
      valCriReactivo.tipoEvento = tipoEvento as TipoProductoCode;
      valCriReactivo.nombre = nombre;
      valCriReactivo.risaRH = risaRH;
      valCriReactivo.acciones = acciones;
      valCriReactivo.relInstitucion = relInstitucion;
      valCriReactivo.usuarioId = this.auth.id;

      const valCriReactivoStored = await valCriReactivosRp.save(valCriReactivo);

      await this.qr.commitTransaction();
      return valCriReactivoStored;
    } catch (error) {
      throw new BadRequestException(error.message);
    } finally {
      await this.qr.release();
    }
  }

  public async fetchMedicos(pattern: string) {
    const qr = `select top 5 U.OID id, U.USUNOMBRE documento, U.USUDESCRI nombre from GENMEDICO M
    inner join GENUSUARIO U ON M.GENUSUARIO = U.oid
    where U.USUESTADO = 1 AND U.USUNOMBRE != '999' AND (U.USUNOMBRE LIKE ${
      "'%" + pattern + "%'"
    } OR U.USUDESCRI LIKE ${"'%" + pattern + "%'"})`;

    const medicos = this.conn.query(qr);

    return medicos;
  }

  async fetchPacientes(codigoSubgrupo?: string, keyword?: string) {
    const ext1 = codigoSubgrupo ? ` AND HSUCODIGO = '${codigoSubgrupo}'` : '';
    const ext2 = keyword ? ` AND GPADOCPAC like '%${keyword}%'` : '';
    const ext = ext1 + ext2;

    const query = `SELECT TOP (5)  
    HPNESTANC estanciaId,
    ADNINGRESO ingresoId,
    AINCONSEC consecutivo,
    GPANOMPAC pacienteNombreCompleto,
    GENPACIEN pacienteId,
    GPADOCPAC pacienteDocumento,
    HCACODIGO camaCodigo,
    HCANOMBRE camaNombre,
    HSUCODIGO subgrupoCodigo,
    HSUNOMBRE subgrupoNombre
    FROM     GCVHOSCENPAC
    WHERE  (HESFECSAL IS NULL) 
    AND (HCAESTADO < 3) 
    AND AINURGCON <> 1${ext}`;

    const pacientes: any[] = await this.conn.query(query);

    return pacientes;
  }

  public async fetch(fechaInicio: Date, fechaFinal: Date) {
    const rp = this.conn.getRepository(ValorCriticoOrm);

    const conditions: any = {
      where: {
        createdAt: fechaInicio && fechaFinal ? Between(fechaInicio, fechaFinal) : undefined,
      },
      relations: [
        'paciente',
        'estancia',
        'estancia.cama',
        'estancia.cama.subgrupo',
        'usuarioAsignado',
        'createdBy',
        'auditadoBy',
        'conductas',
      ],
    };

    const canSeeAll = await this.hasAnyAuthority([
      ADMIN_AUTHORITY,
      HPN_AUTHORITIES.GESTION_CLINICA.VER_TODOS_REPO_VAL_CRI,
    ]);

    if (!canSeeAll) {
      conditions.where = [
        { createdById: this.auth.user.id, createdAt: Between(fechaInicio, fechaFinal) },
        { usuarioAsignadoId: this.auth.user.id, createdAt: Between(fechaInicio, fechaFinal) },
      ];
    }

    const reportes = await rp.find(conditions);

    reportes.map(rp => {
      rp.paciente.setTypes(true);
      rp.paciente.justNombreCompleto();
      delete rp.paciente.estratoId;
      delete rp.paciente.paisId;
      delete rp.paciente.direccionId;
      delete rp.paciente.telefonoId;

      rp.estancia.setTypes(true);
      rp.estancia.cama.setTypes(true);

      rp.setTypes(true);
      delete rp.pacienteId;
      delete rp.estanciaId;
      delete rp.usuarioAsignadoId;
      delete rp.createdById;
    });

    return reportes;
  }

  public async create(body: ValorCriticoDto) {
    try {
      await this.qr.connect();
      await this.qr.startTransaction();

      const rp = this.qr.manager.getRepository(ValorCriticoOrm);

      const valCri = new ValorCriticoOrm();

      valCri.areaReportanteCode = body.areaReporta;
      valCri.createdAt = new Date();
      valCri.createdById = this.auth.user.id;
      valCri.estanciaId = body.estanciaId;
      valCri.pacienteId = body.pacienteId;
      valCri.valorCritico = body.valorCritico;
      valCri.observaciones = body.observaciones;
      valCri.usuarioAsignadoId = body.medicoId;

      const valCriStored = await rp.save(valCri);

      await this.qr.commitTransaction();
      return valCriStored;
    } catch (error) {
      await this.qr.rollbackTransaction();
      throw new BadRequestException(error.message);
    } finally {
      await this.qr.release();
    }
  }

  public async addConducta(body: { conducta: string }, id: number) {
    try {
      await this.qr.connect();
      await this.qr.startTransaction();

      const rp = this.qr.manager.getRepository(ValorCriticoOrm);
      const reporte = await rp.findOne({ where: { id }, relations: ['conductas'] });

      if (this.auth.user.id !== reporte.usuarioAsignadoId) {
        throw new Error('Solo el usuario asignado puede agregar una conducta');
      }

      const conductaRp = this.qr.manager.getRepository(ConductaOrm);

      const conducta = await conductaRp.findOne({
        where: { valorCriticoId: reporte.id },
        order: { id: 'DESC' },
      });

      if (reporte.conductas.length > 3) {
        throw new Error('Has alcanzado el limite de actualizaciones.');
      }

      if (conducta) {
        reporte.conductas.forEach(async value => {
          if (value.id === conducta.id) {
            if (reporte.isAprobado === false) {
              conducta.observacion = reporte.audiobserva;
              reporte.audiobserva = null;
              reporte.fechaAudi = null;
              await conductaRp.save(conducta);
            }
          }
        });
      }
      reporte.conducta = body.conducta.toUpperCase();
      reporte.fechaCierre = new Date();

      await rp.save(reporte);

      await this.qr.commitTransaction();
      return true;
    } catch (error) {
      await this.qr.rollbackTransaction();
      throw new BadRequestException(error.message);
    } finally {
      await this.qr.release();
    }
  }

  public async addAuditoria(body: AuditadoDto) {
    try {
      await this.qr.connect();
      await this.qr.startTransaction();

      const canAudit = await this.hasAnyAuthority([
        HPN_AUTHORITIES.GESTION_CLINICA.AUDITAR_REPORTE_VALORES_CRITICOS,
      ]);

      if (!canAudit) throw new Error('Usted no posee permisos para auditar reportes');

      const rp = this.qr.manager.getRepository(ValorCriticoOrm);
      const reporte = await rp.findOne({ where: { id: body.reporteId } });

      if (reporte.isAprobado) {
        throw new Error('Ya se agregó una respuesta previamente a este caso');
      }

      if (body.isAprobado === false) {
        const conductaRp = this.qr.manager.getRepository(ConductaOrm);

        const conductaHistorial = await conductaRp.find({
          where: { valorCriticoId: reporte.id },
        });

        if (conductaHistorial.length >= 3) {
          throw new Error('Has alcanzado el límite de actualizaciones.');
        }

        const newConducta = new ConductaOrm();
        // newConducta.observacion = reporte.audiobserva;
        newConducta.valorCriticoId = reporte.id;
        newConducta.conducta = reporte.conducta;
        await conductaRp.save(newConducta);
        if (conductaHistorial.length < 2) {
          reporte.conducta = null;
          reporte.fechaCierre = null;
        }
      }

      reporte.audiobserva = body.observacion ? body.observacion.toUpperCase() : body.observacion;
      reporte.auditadoById = this.auth.user.id;
      reporte.isAprobado = body.isAprobado;
      reporte.fechaAudi = new Date();

      await rp.save(reporte);

      await this.qr.commitTransaction();
      return true;
    } catch (error) {
      await this.qr.rollbackTransaction();
      throw new BadRequestException(error.message);
    } finally {
      await this.qr.release();
    }
  }
}
