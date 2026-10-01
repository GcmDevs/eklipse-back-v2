import { Injectable } from '@nestjs/common';
import { PgpAcostado, PgpConsolidado, PgpFacturado, PgpRepository } from './repository';
import { DefaultResponse } from '@sln/old/common/application/models';

@Injectable()
export class PgpService {
  public datos: any[] = [];
  constructor(
    private readonly pgpFacturado: PgpFacturado,
    private readonly pgpAcostado: PgpAcostado,
    private readonly pgpConsolidado: PgpConsolidado,
    private readonly pgp: PgpRepository
  ) {
    //this.pgp.agrupadores();
  }

  // async registrarPgp() {
  //   this.pgp.agrupadores();
  // }

  /**
   *
   * @param fechaInicio Fecha Inicial
   * @param fechaFinal Fecha Final
   * @returns Objeto con la respuesta de el consumido por cada contrato facturado
   */
  async consumidoPgpFacturado(
    fechaInicio: string,
    fechaFinal: string,
    centro1: number,
    centro2: number
  ): Promise<DefaultResponse> {
    try {
      const data = await this.pgpFacturado.consumido(fechaInicio, fechaFinal, centro1, centro2);
      if (!data) {
        return {
          success: false,
          message: 'Pgp',
        };
      } else {
        return {
          success: true,
          message: 'Consumido Pgp Facturados',
          data,
        };
      }
    } catch (error) {
      return {
        success: false,
        message: 'Pgp',
      };
    }
  }

  /**
   *
   * @param contrato1 Contrato Inicial
   * @param contrato2 Contrato Final
   * @param fechaInicio Fecha Inicial
   * @param fechaFinal Fecha Final
   * @returns Objeto con las respuestas de los agrupadores de un contrato facturado
   */
  async PgpAgrupadoresFinales(
    contrato1: string,
    contrato2: string,
    fechaInicio: string,
    fechaFinal: string,
    centro1: number,
    centro2: number
  ) {
    try {
      const data = await this.pgpFacturado.Agrupadores(
        contrato1,
        contrato2,
        fechaInicio,
        fechaFinal,
        centro1,
        centro2
      );
      if (!data) {
        return {
          success: false,
          message: 'Pgp',
        };
      } else {
        return {
          success: true,
          message: 'Pgp Agrupadoes Finales',
          data,
        };
      }
    } catch (error) {
      return {
        success: false,
        message: 'Pgp',
      };
    }
  }

  /**
   *
   * @param agrupador Agrupador donde pertenece el paciente
   * @param contrato1 Contrato Inicial
   * @param contrato2 Contrato Final
   * @param fechaInicio Fecha Inicial
   * @param fechaFinal Fecha Final
   * @returns Pacientes que pertenecen a un agrupador de un contrato ya seleccionado
   */
  async getPacientesAgrupador(
    agrupador: string,
    contrato1: string,
    contrato2: string,
    fechaInicio: string,
    fechaFinal: string,
    centro1: number,
    centro2: number
  ) {
    try {
      const data = await this.pgpFacturado.Pacientes(
        agrupador,
        contrato1,
        contrato2,
        fechaInicio,
        fechaFinal,
        centro1,
        centro2
      );
      if (!data) {
        return {
          success: false,
          message: 'Pgp',
        };
      } else {
        return {
          success: true,
          message: 'Pgp Pacientes por Agrupador',
          data,
        };
      }
    } catch (error) {
      return {
        success: false,
        message: 'Pgp',
      };
    }
  }

  /**
   *
   * @param contrato1 Contrato Inicial
   * @param ingreso Ingreso Paciente
   * @param fechaInicio fecha Inicial
   * @param fechaFin fecha Final
   */
  async getHistorialAgrupadores(
    contrato1: string,
    ingreso: string,
    fechaInicio: string,
    fechaFin: string
  ): Promise<DefaultResponse> {
    try {
      const data = await this.pgpFacturado.HistorialAgrupadores(
        contrato1,
        ingreso,
        fechaInicio,
        fechaFin
      );
      if (data && data.length > 0) {
        return {
          success: true,
          message: 'Historial Agrupadores',
          data,
        };
      } else {
        return {
          success: false,
          message: 'Sin Historial Agrupadores',
        };
      }
    } catch (error) {
      return {
        success: false,
        message: 'Sin Historial Agrupadores',
      };
    }
  }

  /**
   *
   * @param ingreso Ingreso Paciente
   * @param contrato Contrato (No es necesario)
   * @param fechaInicio Fecha Inicial
   * @param fechaFinal Fecha Final
   * @returns Servicios de un paciente facturado de cualquier contrato
   */
  async getServiciosPaciente(
    ingreso: number,
    contrato: string,
    fechaInicio: string,
    fechaFinal: string
  ) {
    try {
      const data = await this.pgpFacturado.ServiciosPaciente(
        ingreso,
        contrato,
        fechaInicio,
        fechaFinal
      );
      if (!data) {
        return {
          success: false,
          message: 'Pgp',
        };
      } else {
        return {
          success: true,
          message: 'Pgp Servicios Pacientes',
          data,
        };
      }
    } catch (error) {
      return {
        success: false,
        message: 'Pgp',
      };
    }
  }

  /**
   *
   * @param fechaInicio Fecha Inicial
   * @param fechaFin Fecha Final
   * @param contrato Contrato para saber el total facturado
   * @returns Total facturado por dia del contrato seleccionado
   */
  async totalEjecutadoDiario(fechaInicio: string, fechaFin: string, contrato: string) {
    try {
      const data = await this.pgpFacturado.TotalEjecutadoDiario(fechaInicio, fechaFin, contrato);
      if (!data) {
        return {
          success: false,
          message: 'Pgp',
        };
      } else {
        return {
          success: true,
          message: 'TotalEjecutado por dia',
          data,
        };
      }
    } catch (error) {
      return {
        success: false,
        message: 'Pgp',
      };
    }
  }

  /**
   *
   * @param fechaInicio Fecha Inicial
   * @param fechaFin Fecha Final
   * @param contrato No es necesario por que se eligen los dos contratos de asmet
   * @returns Total Facturado por dia de los contratos de asmet 8005 - 8006
   */
  async totalEjecutadoDiarioAsmet(fechaInicio: string, fechaFin: string, contrato: string) {
    try {
      const data = await this.pgpFacturado.TotalEjecutadoDiarioAsmet(
        fechaInicio,
        fechaFin,
        contrato
      );
      if (!data) {
        return {
          success: false,
          message: 'Pgp',
        };
      } else {
        return {
          success: true,
          message: 'TotalEjecutado por dia Asmet',
          data,
        };
      }
    } catch (error) {
      return {
        success: false,
        message: 'Pgp',
      };
    }
  }

  /**
   *
   * @returns Consumido por cada contrato de pacientes que estan acostados
   */
  async consumidoPgpAcostadoActual(centro1: number, centro2: number) {
    try {
      const data = await this.pgpAcostado.ConsumidoActual(centro1, centro2);
      if (!data) {
        return {
          success: false,
          message: 'Pgp',
        };
      } else {
        return {
          success: true,
          message: 'Consumido Pgp Acostado',
          data,
        };
      }
    } catch (error) {
      return {
        success: false,
        message: 'Pgp',
      };
    }
  }

  /**
   *
   * @param contrato Contrato para obtener pacientes
   * @returns Lista de pacientes que pertenecen a un contrato
   */
  async getPacientesAcostadosActual(contrato: string, centro1: number, centro2: number) {
    try {
      const data = await this.pgpAcostado.PacientesActual(contrato, centro1, centro2);
      for (const el in data) {
        const Estancia = await this.pgpAcostado.EstanciaPaciente(data[el].Ingreso);
        const newPaciente = {
          Ingreso: data[el].Ingreso,
          Identificacion: data[el].Identificacion,
          Paciente: data[el].Paciente,
          AINFECING: data[el].AINFECING,
          DiasEstancia: data[el].DiasEstancia,
          TipoIngreso: data[el].TipoIngreso,
          CodCama: data[el].CodCama,
          Cama: data[el].Cama,
          TotalEjecutado: data[el].TotalEjecutado,
          Estancia,
        };
        this.datos.push(newPaciente);
      }
      if (!data) {
        return {
          success: false,
          message: 'Pgp',
        };
      } else {
        return {
          success: true,
          message: 'Consumido Pgp Acostado',
          data: this.datos,
        };
      }
    } catch (error) {
      return {
        success: false,
        message: 'Pgp',
      };
    }
  }

  async consumidoPgpAcostadoAntiguo(centro1: number, centro2: number) {
    try {
      const data = await this.pgpAcostado.ConsumidoAntiguo(centro1, centro2);
      if (!data) {
        return {
          success: false,
          message: 'Pgp',
        };
      } else {
        return {
          success: true,
          message: 'Consumido Pgp Acostado',
          data,
        };
      }
    } catch (error) {
      return {
        success: false,
        message: 'Pgp',
      };
    }
  }

  /**
   *
   * @param contrato Contrato para obtener pacientes
   * @returns Lista de pacientes que pertenecen a un contrato
   */
  async getPacientesAcostadosAntiguo(contrato: string, centro1: number, centro2: number) {
    try {
      const data = await this.pgpAcostado.PacientesAntiguos(contrato, centro1, centro2);

      for (const el in data) {
        const Estancia = await this.pgpAcostado.EstanciaPaciente(data[el].Ingreso);
        const newPaciente = {
          Ingreso: data[el].Ingreso,
          Identificacion: data[el].Identificacion,
          Paciente: data[el].Paciente,
          AINFECING: data[el].AINFECING,
          DiasEstancia: data[el].DiasEstancia,
          TipoIngreso: data[el].TipoIngreso,
          CodCama: data[el].CodCama,
          Cama: data[el].Cama,
          TotalEjecutado: data[el].TotalEjecutado,
          Estancia,
        };
        this.datos.push(newPaciente);
      }
      if (!data) {
        return {
          success: false,
          message: 'Pgp',
        };
      } else {
        return {
          success: true,
          message: 'Consumido Pgp Acostado',
          data: this.datos,
        };
      }
    } catch (error) {
      return {
        success: false,
        message: 'Pgp',
      };
    }
  }
  /**
   *
   * @param contrato Contrato del paciente
   * @param ingreso Ingreos del paciente
   * @returns Agrupadores por donde paso el paciente acostado
   */
  async getAgrupadoresPacientesAcostados(contrato: string, ingreso: string) {
    try {
      const data = await this.pgpAcostado.Agrupadores(contrato, ingreso);
      if (!data) {
        return {
          success: false,
          message: 'Pgp',
        };
      } else {
        return {
          success: true,
          message: 'Agrupadores Pgp Acostado',
          data,
        };
      }
    } catch (error) {
      return {
        success: false,
        message: 'Pgp',
      };
    }
  }

  /**
   *
   * @param contrato Contrato del paciente
   * @param ingreso Ingreso del paciente
   * @returns Servicios que se le prestaron a un paciente
   */
  async getServiciosPacientesAcostados(contrato: string, ingreso: string) {
    try {
      const data = await this.pgpAcostado.Servicios(contrato, ingreso);
      if (!data) {
        return {
          success: false,
          message: 'Pgp',
        };
      } else {
        return {
          success: true,
          message: 'Servicios Pgp Acostado',
          data,
        };
      }
    } catch (error) {
      return {
        success: false,
        message: 'Pgp',
      };
    }
  }

  /**
   *
   * @returns Cargado por cada contrato para los pacientes acostados
   */
  async totalEjecutadoAcostado() {
    try {
      const nuevaeps = await this.pgpAcostado.TotalEjecutadoAcostadoDiarionueva();
      const asmet8006 = await this.pgpAcostado.TotalEjecutadoAcostadoDiario8006();
      const asmet8010 = await this.pgpAcostado.TotalEjecutadoAcostadoDiario8010();
      const data = { nuevaeps, asmet8006, asmet8010 };
      if (!data) {
        return {
          success: false,
          message: 'Pgp',
        };
      } else {
        return {
          success: true,
          message: 'TotalEjecutado por dia',
          data,
        };
      }
    } catch (error) {
      return {
        success: false,
        message: 'Pgp',
      };
    }
  }

  async getConsolidadoContratos(fechaInicio: string, fechaFin: string) {
    try {
      const data = await this.pgpConsolidado.Contratos(fechaInicio, fechaFin);
      if (!data) {
        return {
          success: false,
          message: 'Pgp',
        };
      } else {
        return {
          success: true,
          message: 'Contratos Consolidaos',
          data,
        };
      }
    } catch (error) {
      return {
        success: false,
        message: 'Pgp',
      };
    }
  }

  async getConsolidadoPacientes(contrato: string, fechaInicio: string, fechaFin: string) {
    try {
      const data = await this.pgpConsolidado.Pacientes(contrato, fechaInicio, fechaFin);
      if (!data) {
        return {
          success: false,
          message: 'Pgp',
        };
      } else {
        return {
          success: true,
          message: 'Pacientes Consolidaos',
          data,
        };
      }
    } catch (error) {
      return {
        success: false,
        message: 'Pgp',
      };
    }
  }

  async getAgrupadoresConsolidado(contrato1: string, fechaInicio: string, fechaFin: string) {
    try {
      const data = await this.pgpConsolidado.Agrupadores(contrato1, fechaInicio, fechaFin);
      if (!data) {
        return {
          success: false,
          message: 'No se pudo obtener informacion',
        };
      } else {
        return {
          success: true,
          message: 'Pgp Agrupadores Consolidados',
          data,
        };
      }
    } catch (error) {
      return {
        success: false,
        message: 'No se pudo obtener informacion',
      };
    }
  }

  async getConsolidadoDiferencia(fechaInicio: string, fechaFin: string) {
    try {
      const data = await this.pgpConsolidado.diferencia(fechaInicio, fechaFin, 1, 2);
      if (!data) {
        return {
          success: false,
          message: 'Pgp',
        };
      } else {
        return {
          success: true,
          message: 'Pgp Agrupadores Consolidados',
          data,
        };
      }
    } catch (error) {
      return {
        success: false,
        message: 'Pgp',
      };
    }
  }

  async getLargasEstancia(
    fechaInicio: string,
    fechaFin: string,
    contrato1: number,
    contrato2: number
  ) {
    try {
      const data = await this.pgpFacturado.largasEstancias(
        fechaInicio,
        fechaFin,
        contrato1,
        contrato2
      );

      if (!data) {
        return {
          success: false,
          message: 'Pgp',
        };
      } else {
        return {
          success: true,
          message: 'Pgp Largas Estancia',
          data,
        };
      }
    } catch (error) {
      return {
        success: false,
        message: 'Pgp',
      };
    }
  }
}
