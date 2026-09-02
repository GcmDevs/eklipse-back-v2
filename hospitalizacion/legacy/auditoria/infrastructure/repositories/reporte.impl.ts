import { uniq } from 'lodash';
import { Between, In } from 'typeorm';
import { BadRequestException, Injectable } from '@nestjs/common';
import { BaseSource } from '@common/infrastructure/services';
import { AuditoriaOrm } from '@hpn/lgc/aud/orm/hpn/auditoria';

export interface UsuarioRes {
  id: number;
  cedula: string;
  nombreCompleto: string;
}

export interface PacienteRes {
  id: number;
  numeroDoc: string;
  nombreCompleto: string;
}

export interface AuditoriaRes {
  id: number;
  fechaCreacion: string;
  usuario: UsuarioRes;
  paciente: PacienteRes;
  resumenClinico: string;
}

@Injectable()
export class AuditoriaReporteImpl extends BaseSource {
  public async execute(start: Date, end: Date): Promise<AuditoriaRes[]> {
    try {
      if (start && end) {
        start = new Date(`${start}:00:00:00`);
        end = new Date(`${end}:23:59:59`);
      }
      const auditoriaRp = this.conn.getRepository(AuditoriaOrm);

      const auditorias = await auditoriaRp.find({
        where: { fechaCreacion: start && end ? Between(start, end) : undefined },
      });

      const usuariosIds = uniq(auditorias.map(a => a.usuarioId));
      const pacientesIds = uniq(auditorias.map(a => a.pacienteId));

      const usuarios: UsuarioRes[] = await this.conn.query(
        `SELECT OID id, USUNOMBRE cedula, USUDESCRI nombreCompleto FROM GENUSUARIO WHERE OID IN(${usuariosIds})`
      );

      const pacientes: PacienteRes[] = await this.conn.query(
        `SELECT OID id, PACNUMDOC numeroDoc, GPANOMCOM nombreCompleto FROM GENPACIEN WHERE OID IN(${pacientesIds})`
      );

      auditorias.map(au => {
        au.usuario = usuarios.filter(usu => usu.id === au.usuarioId)[0] as any;
        au.paciente = pacientes.filter(pac => pac.id === au.pacienteId)[0] as any;
      });

      return auditorias.map(au => {
        const res: AuditoriaRes = {
          id: au.id,
          fechaCreacion: au.fechaCreacion.toISOString(),
          usuario: au.usuario,
          paciente: au.paciente,
          resumenClinico: au.resumenClinicoGestionIntervencion,
        };
        return res;
      });
    } catch (error: any) {
      throw new BadRequestException(error.message);
    }
  }
}
