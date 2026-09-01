import { BadRequestException, Injectable } from '@nestjs/common';
import { BaseSource } from '@common/infrastructure/services';
import { Brackets, Like } from 'typeorm';
import { MunicipioOrm, PacienteOrm, ServicioIpsOrm } from '@hpn/lgc/tas/orm/gen';
import { ALL_CONTEXTS_WITH_AUTHORITIES, GCM_CONTEXTS } from '@common/domain/types';
import {
  EkEmpleadoOrm,
  EntidadOrm,
  MotivoTrasladoOrm,
  ServicioOrm,
  VehiculoOrm,
} from '@hpn/lgc/tas/orm/gcn';
import { DiagnosticoOrm, EstanciaOrm } from '@hpn/lgc/tas/orm/temp';
import { newDataToUbicaciones } from '../factories';
import { ProcedimientoTempOrm, ProductoOrm } from '@hpn/lgc/tas/orm/gcn/traslados-asistenciales';
import { TipoEmpleadoCode } from '@hpn/lgc/tas/types/gcn';
import { TIPOS_EMPLEADO } from '@hpn/lgc/tas/types/gcn';
import { _PrivSecUserOrm } from '@common/infrastructure/orm/user.orm';
import { _PrivSecAuthOrm } from '@common/infrastructure/orm/authority.orm';
import { ESTADOS_USUARIO } from '@ctypes/gen/usuarios';

@Injectable()
export class TrasladoRecursosImpl extends BaseSource {
  private ignoreCaseAccent = 'COLLATE Latin1_General_CI_AI';

  public async fetchInstitucionesByPattern(pattern: string) {
    const entidadRp = this.conn.getRepository(EntidadOrm);

    const value = pattern?.trim();
    const palabras = value.split(/\s+/).filter(p => p.length > 0);

    const qb = entidadRp.createQueryBuilder('entidad');

    if (palabras.length > 0) {
      qb.where(
        new Brackets(subQb => {
          palabras.forEach((palabra, index) => {
            subQb.andWhere(`entidad.nombre ${this.ignoreCaseAccent} LIKE :nombre${index}`, {
              [`nombre${index}`]: `%${palabra}%`,
            });
          });
        })
      );
    }

    const entidades = await qb
      .leftJoinAndSelect('entidad.tercero', 'tercero')
      .leftJoinAndSelect('tercero.municipio', 'municipio')
      .leftJoinAndSelect('tercero.direccion', 'direccion')
      .leftJoinAndSelect('municipio.departamento', 'departamento')
      .take(5)
      .getMany();

    return newDataToUbicaciones(entidades);
  }

  public async fetchMunicipiosByPattern(pattern: string) {
    const municipiosRp = this.conn.getRepository(MunicipioOrm);

    const value = pattern?.trim();

    let municipios: MunicipioOrm[] = [];

    const palabras = value.split(/\s+/).filter(p => p.length > 0);

    const qb = municipiosRp
      .createQueryBuilder('municipio')
      .leftJoinAndSelect('municipio.departamento', 'departamento');

    qb.where(
      new Brackets(subQb => {
        if (palabras.length > 0) {
          palabras.forEach((palabra, index) => {
            subQb.andWhere(`municipio.nombre ${this.ignoreCaseAccent} LIKE :nombre${index}`, {
              [`nombre${index}`]: `%${palabra}%`,
            });
          });
        }
      })
    );

    municipios = await qb.orderBy('municipio.nombre', 'ASC').take(10).getMany();

    return municipios.map(municipio => {
      return {
        id: municipio.id,
        codigo: municipio.codigo,
        nombre: municipio.nombre,
        departamento: {
          id: municipio.departamento.id,
          codigo: municipio.departamento.codigo,
          nombre: municipio.departamento.nombre,
        },
      };
    });
  }

  async fetchPacientesByPattern(pattern: string, onlyActivos: boolean = true) {
    try {
      const estanciaRp = this.conn.getRepository(EstanciaOrm);
      const pacienteRp = this.conn.getRepository(PacienteOrm);

      const value = pattern?.trim();
      const isNumeric = /^\d+$/.test(value);

      let pacientes: PacienteOrm[] = [];

      if (!onlyActivos) {
        const qb = pacienteRp
          .createQueryBuilder('paciente')
          .leftJoinAndSelect('paciente.detalleContrato', 'detalleContrato');
        if (!isNumeric) {
          const palabras = value.split(/\s+/).filter(p => p.length > 0);
          if (palabras.length > 0) {
            qb.where(
              new Brackets(subQb => {
                palabras.forEach((palabra, index) => {
                  subQb.andWhere(
                    `paciente.nombreCompleto ${this.ignoreCaseAccent} LIKE :nombre${index}`,
                    { [`nombre${index}`]: `%${palabra}%` }
                  );
                });
              })
            );
          }
        } else {
          qb.andWhere(`paciente.numeroDoc ${this.ignoreCaseAccent} LIKE :numeroDoc`, {
            numeroDoc: `%${value}%`,
          });
        }

        pacientes = await qb.orderBy('paciente.nombreCompleto', 'ASC').take(5).getMany();
        /*   } */
      } else {
        const qb = estanciaRp
          .createQueryBuilder('estancia')
          .leftJoinAndSelect('estancia.ingreso', 'ingreso')
          .leftJoinAndSelect('ingreso.paciente', 'paciente')
          .leftJoinAndSelect('paciente.detalleContrato', 'detalleContrato')
          .where('estancia.fechaEgreso IS NULL');

        if (!isNumeric) {
          const palabras = value.split(/\s+/).filter(p => p.length > 0);

          if (palabras.length > 0) {
            qb.andWhere(
              new Brackets(subQb => {
                palabras.forEach((palabra, index) => {
                  subQb.andWhere(
                    `paciente.nombreCompleto ${this.ignoreCaseAccent} LIKE :nombre${index}`,
                    { [`nombre${index}`]: `%${palabra}%` }
                  );
                });
              })
            );
          }
        } else {
          qb.andWhere(`paciente.numeroDoc ${this.ignoreCaseAccent} LIKE :numeroDoc`, {
            numeroDoc: `%${value}%`,
          });
        }

        const estancias = await qb.orderBy('paciente.nombreCompleto', 'ASC').take(5).getMany();

        estancias.map(estancia => {
          estancia.ingreso.paciente.ingreso = estancia.ingreso;
          pacientes.push(estancia.ingreso.paciente);
        });
      }

      return pacientes.map(pac => {
        return {
          id: pac.id,
          apellidos: (pac.primerApellido ?? '') + ' ' + (pac.segundoApellido ?? ''),
          nombres: (pac.primerNombre ?? '') + ' ' + (pac.segundoNombre ?? ''),
          documento: { numero: pac.numeroDoc, tipoCode: pac.tipoDocumentoCode },
          ingreso: pac.ingreso ? { consecutivo: pac.ingreso.consecutivo } : {},
          fechaNacimiento: pac.fechaNacimiento,
          generoCode: pac.generoCode,
          estado: pac.estadoCode,
          afiliacionContrato: {
            id: pac.detalleContrato.id,
            codigo: pac.detalleContrato.codigo,
            nombre: pac.detalleContrato.nombre,
          },
        };
      });
    } catch (error: any) {
      throw new BadRequestException(error.message);
    }
  }

  public async fetchUsuarioByPattern(pattern: string, tipoCode: TipoEmpleadoCode) {
    const ekConn = this.dynamicConn(GCM_CONTEXTS.EKLIPSE);
    const empleadoRp = ekConn.getRepository(EkEmpleadoOrm);

    const value = pattern?.trim();
    const isNumeric = /^\d+$/.test(value);
    const conductorCode = TIPOS_EMPLEADO.CONDUCTOR.getCode();

    let empleados: EkEmpleadoOrm[] = [];

    const qbEmpleado = empleadoRp.createQueryBuilder('empleado');

    if (!isNumeric) {
      const palabras = value.split(/\s+/).filter(p => p.length > 0);

      qbEmpleado.andWhere(
        new Brackets(subQb => {
          if (palabras.length > 0) {
            palabras.forEach((palabra, index) => {
              subQb.andWhere(`empleado.nombre ${this.ignoreCaseAccent} LIKE :nombre${index}`, {
                [`nombre${index}`]: `%${palabra}%`,
              });
            });
          }
        })
      );
    } else {
      qbEmpleado.andWhere(`empleado.documento ${this.ignoreCaseAccent} LIKE :documento`, {
        documento: `%${value}%`,
      });
    }

    if (tipoCode === conductorCode) {
      qbEmpleado.andWhere('empleado.tipoCode = :tipoCode', { tipoCode: conductorCode });
    } else {
      qbEmpleado.andWhere('empleado.tipoCode != :tipoCode', { tipoCode: conductorCode });
    }

    empleados = await qbEmpleado.orderBy('empleado.nombre', 'ASC').take(10).getMany();

    if (tipoCode === TIPOS_EMPLEADO.CONDUCTOR.getCode()) {
      return empleados.map(e => ({
        nombre: e.nombre,
        documento: e.documento,
        tipoEmpleado: e.tipoCode,
        tipoCode: e.tipoCode,
      }));
    }

    const resultados = empleados.map(e => ({
      nombre: e.nombre,
      documento: e.documento,
      tipoEmpleado: e.tipoCode,
      tipoCode: e.tipoCode,
    }));

    const allUsuarios: _PrivSecUserOrm[] = [];

    for (const contexto of ALL_CONTEXTS_WITH_AUTHORITIES) {
      const qr = this.dynamicQR(contexto);
      await qr.connect();

      try {
        const usuarioRp = qr.manager.getRepository(_PrivSecUserOrm);
        const qbUsuario = usuarioRp
          .createQueryBuilder('u')
          .leftJoinAndSelect('u.role', 'role')
          .where('u.statusCode = :estado', {
            estado: ESTADOS_USUARIO.ACTIVO.getCode(),
          });

        if (isNumeric) {
          qbUsuario.andWhere('u.document LIKE :doc', { doc: `%${value}%` });
        } else {
          const palabras = value.split(/\s+/).filter(p => p.length > 0);

          qbUsuario.andWhere(
            new Brackets(subQb => {
              if (palabras.length > 0) {
                palabras.forEach((palabra, index) => {
                  subQb.andWhere(`u.fullName ${this.ignoreCaseAccent} LIKE :nombre${index}`, {
                    [`nombre${index}`]: `%${palabra}%`,
                  });
                });
              }
            })
          );
        }

        const usuarios = await qbUsuario.take(25).getMany();

        allUsuarios.push(...usuarios);
      } catch (error: any) {
        console.error(`Error en contexto ${contexto.getCode()}:`, error.message);
      } finally {
        await qr.release();
      }
    }

    resultados.push(
      ...allUsuarios.map(u => ({
        id: u.id,
        nombre: u.fullName,
        documento: u.document,
        tipoEmpleado: tipoCode,
        tipoCode,
        rol: u.role.name,
      }))
    );

    const seen = new Set<string>();

    return resultados.filter(r => {
      if (seen.has(r.documento)) {
        return false;
      }

      seen.add(r.documento);
      return true;
    });
  }

  async fetchVehiculosByPattern(pattern: string) {
    const conn = this.dynamicConn(GCM_CONTEXTS.EKLIPSE);

    const vehiculoRp = conn.getRepository(VehiculoOrm);
    const vehiculos = await vehiculoRp.find({
      where: [{ placa: Like(`%${pattern}%`) }],
      take: 5,
    });

    return vehiculos.map(vehiculo => {
      return {
        id: vehiculo.id,
        codigo: '',
        nombre: vehiculo.placa,
      };
    });
  }

  async fetchMotivosTrasladosByPattern(pattern: string) {
    const motivoTrasladoRp = this.conn.getRepository(MotivoTrasladoOrm);

    const value = pattern?.trim();
    const palabras = value.split(/\s+/).filter(p => p.length > 0);

    const qb = motivoTrasladoRp.createQueryBuilder('motivo');

    if (palabras.length > 0) {
      qb.where(
        new Brackets(subQb => {
          palabras.forEach((palabra, index) => {
            subQb.andWhere(`motivo.nombre ${this.ignoreCaseAccent} LIKE :nombre${index}`, {
              [`nombre${index}`]: `%${palabra}%`,
            });
          });
        })
      );
    }

    const motivostraslados = await qb.take(10).getMany();

    return motivostraslados.map(motivo => {
      return {
        id: motivo.id,
        codigo: motivo.id,
        nombre: motivo.nombre,
      };
    });
  }

  public async fetchServiciosByPattern(pattern: string) {
    const serviciosRp = this.conn.getRepository(ServicioOrm);

    const value = pattern?.trim();
    const palabras = value.split(/\s+/).filter(p => p.length > 0);

    const qb = serviciosRp.createQueryBuilder('servicio');

    if (palabras.length > 0) {
      qb.where(
        new Brackets(subQb => {
          palabras.forEach((palabra, index) => {
            subQb.andWhere(`servicio.nombre ${this.ignoreCaseAccent} LIKE :nombre${index}`, {
              [`nombre${index}`]: `%${palabra}%`,
            });
          });
        })
      );
    }

    const servicios = await qb.take(10).getMany();

    return servicios;
  }

  public async fetchProcedimientosByPattern(pattern: string) {
    const value = pattern?.trim();

    // Validar patrón vacío
    if (!value) return [];

    const palabras = value.split(/\s+/).filter(p => p.length > 0);

    // 1. Buscar primero en tabla LOCAL (ServicioIpsOrm) del contexto actual
    try {
      const procedimientoRp = this.conn.getRepository(ServicioIpsOrm);

      const qbLocal = procedimientoRp
        .createQueryBuilder('procedimiento')
        .where('procedimiento.tipo = :tipo', { tipo: 1 });

      qbLocal.andWhere(
        new Brackets(subQb => {
          subQb.orWhere('procedimiento.codigoCups LIKE :codigo', { codigo: `%${value}%` });

          if (palabras.length > 0) {
            subQb.orWhere(
              new Brackets(nombreQb => {
                palabras.forEach((palabra, index) => {
                  nombreQb.andWhere(
                    `procedimiento.nombre ${this.ignoreCaseAccent} LIKE :nombre${index}`,
                    { [`nombre${index}`]: `%${palabra}%` }
                  );
                });
              })
            );
          }
        })
      );

      const resultadosLocales = await qbLocal
        .orderBy('procedimiento.nombre', 'ASC')
        .take(10)
        .getMany();

      // Si encontró en tabla local, retornar inmediatamente
      if (resultadosLocales.length > 0) {
        return resultadosLocales.map(procedimiento => ({
          isTemporal: false,
          id: procedimiento.id,
          codigo: procedimiento.codigoCups,
          nombre: procedimiento.nombre,
        }));
      }
    } catch (error: any) {
      console.error('Error buscando en tabla local:', error.message);
      // Continuar con búsqueda compartida
    }

    // 2. Si NO encontró, buscar en tabla COMPARTIDA (ProcedimientoTempOrm) en EKLIPSE
    try {
      const conn = this.dynamicConn(GCM_CONTEXTS.EKLIPSE);
      const procedimientoTempRp = conn.getRepository(ProcedimientoTempOrm);

      const qbCompartida = procedimientoTempRp.createQueryBuilder('procedimiento');

      qbCompartida.andWhere(
        new Brackets(subQb => {
          subQb.orWhere('procedimiento.codigo LIKE :codigo', { codigo: `%${value}%` });

          if (palabras.length > 0) {
            subQb.orWhere(
              new Brackets(nombreQb => {
                palabras.forEach((palabra, index) => {
                  nombreQb.andWhere(
                    `procedimiento.nombre ${this.ignoreCaseAccent} LIKE :nombre${index}`,
                    { [`nombre${index}`]: `%${palabra}%` }
                  );
                });
              })
            );
          }
        })
      );

      const resultadosCompartidos = await qbCompartida
        .orderBy('procedimiento.nombre', 'ASC')
        .take(10)
        .getMany();

      return resultadosCompartidos.map(p => ({
        isTemporal: true,
        id: p.id,
        codigo: p.codigo,
        nombre: p.nombre,
      }));
    } catch (error: any) {
      console.error('Error buscando en tabla compartida:', error.message);
      return [];
    }
  }

  public async fetchMedicamentosByPattern(pattern: string) {
    const ProductoRp = this.conn.getRepository(ProductoOrm);

    const value = pattern?.trim();

    let productos: ProductoOrm[] = [];

    const palabras = value.split(/\s+/).filter(p => p.length > 0);

    const qb = ProductoRp.createQueryBuilder('producto').where(
      'producto.tipoProducto = :tipoProducto',
      { tipoProducto: 2 }
    );

    qb.andWhere(
      new Brackets(subQb => {
        subQb.orWhere('producto.codigo LIKE :codigo', { codigo: `%${value}%` });

        if (palabras.length > 0) {
          subQb.orWhere(
            new Brackets(nombreQb => {
              palabras.forEach((palabra, index) => {
                nombreQb.andWhere(`producto.nombre ${this.ignoreCaseAccent} LIKE :nombre${index}`, {
                  [`nombre${index}`]: `%${palabra}%`,
                });
              });
            })
          );
        }
      })
    );

    productos = await qb.orderBy('producto.nombre', 'ASC').take(10).getMany();

    return productos;
  }

  public async fetchDiagnosticosByPattern(pattern: string) {
    const diagnosticoRp = this.conn.getRepository(DiagnosticoOrm);

    const qb = diagnosticoRp.createQueryBuilder('diagnostico');

    const value = pattern?.trim();

    const palabras = value.split(/\s+/).filter(p => p.length > 0);

    qb.andWhere(
      new Brackets(subQb => {
        subQb.orWhere(`diagnostico.codigo ${this.ignoreCaseAccent} LIKE :codigo`, {
          codigo: `%${value}%`,
        });

        if (palabras.length > 0) {
          subQb.orWhere(
            new Brackets(nombreQb => {
              palabras.forEach((palabra, index) => {
                nombreQb.andWhere(
                  `diagnostico.nombre ${this.ignoreCaseAccent} LIKE :nombre${index}`,
                  { [`nombre${index}`]: `%${palabra}%` }
                );
              });
            })
          );
        }
      })
    );

    return qb.orderBy('diagnostico.nombre', 'ASC').take(15).getMany();
  }
}
