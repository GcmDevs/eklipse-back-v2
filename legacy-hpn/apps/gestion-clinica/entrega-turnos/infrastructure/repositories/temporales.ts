import { BadRequestException, Injectable } from '@nestjs/common';
import { BaseSource } from '@common/infrastructure/services';
import { EntregaTurnoOrm, PacienteEvolucionOrm, PacienteTemporalOrm } from '@orm/gcn';
import { EstanciaOrm, SubgrupoOrm } from '@orm/temp';
import { In, IsNull, Like } from 'typeorm';
import { newDataToPacientesHopitalizados } from '../factories';

@Injectable()
export class TemporalesImpl extends BaseSource {
  private condicionesTemporales(centroId: number, ingresoId?: number) {
    const estancia = { fechaEgreso: IsNull(), ...(ingresoId ? { ingresoId } : {}) };
    const cama = { centroId: String(centroId) };
    return [
      { ...estancia, cama: { ...cama, grupo: { nombre: Like('%TEMPORAL%') } } },
      { ...estancia, cama: { ...cama, subgrupo: { nombre: Like('%TEMPORAL%') } } },
    ];
  }

  private async asegurarMedicoAutorizado(centroId: number, subgrupoId: number): Promise<void> {
    const turno = await this.conn.getRepository(EntregaTurnoOrm).findOne({
      where: { centroAtencionId: centroId, subgrupoId, isActivo: true },
      relations: ['cambiosTurno'],
      order: { id: 'DESC' },
    });

    if (!turno) throw new BadRequestException('El subgrupo aún no ha sido iniciado.');

    const autorizados = [turno.medicoEntregaTurnoId, ...turno.cambiosTurno.map(c => c.medicoId)];
    if (!autorizados.includes(this.auth.id)) {
      throw new BadRequestException(
        'Solo el médico autorizado del turno puede administrar temporales.'
      );
    }
  }

  private async estanciaTemporalActiva(centroId: number, ingresoId: number): Promise<EstanciaOrm> {
    const estancia = await this.conn.getRepository(EstanciaOrm).findOne({
      where: this.condicionesTemporales(centroId, ingresoId),
      relations: ['ingreso', 'ingreso.paciente', 'cama', 'cama.grupo', 'cama.subgrupo'],
      order: { id: 'DESC' },
    });

    if (!estancia) {
      throw new BadRequestException(
        'El paciente ya no está en una cama temporal activa del centro seleccionado.'
      );
    }

    return estancia;
  }

  public async disponibles(centroId: number) {
    const estancias = await this.conn.getRepository(EstanciaOrm).find({
      where: this.condicionesTemporales(centroId),
      relations: [
        'ingreso',
        'ingreso.paciente',
        'ingreso.detalleContrato.contrato',
        'cama.centro',
        'cama.grupo',
        'cama.subgrupo',
      ],
      order: { cama: { id: 'ASC' } },
    });

    const asignados = estancias.length
      ? await this.conn
          .getRepository(PacienteTemporalOrm)
          .find({ where: { estanciaId: In(estancias.map(e => e.id)) } })
      : [];
    const subgruposDestino = asignados.length
      ? await this.conn
          .getRepository(SubgrupoOrm)
          .find({ where: { id: In(asignados.map(a => a.subgrupoDestinoId)) } })
      : [];
    const evoluciones = estancias.length
      ? await this.conn
          .getRepository(PacienteEvolucionOrm)
          .find({ where: { ingresoId: In(estancias.map(e => e.ingreso.id)) } })
      : [];
    const result = newDataToPacientesHopitalizados(estancias, null, evoluciones, this.auth);
    const estanciaPorIngreso = new Map(estancias.map(e => [e.ingreso.id, e]));
    const asignacionPorEstancia = new Map(asignados.map(a => [a.estanciaId, a]));
    const subgrupoPorId = new Map(subgruposDestino.map(s => [s.id, s]));
    result.pacientes.forEach(paciente => {
      const estancia = estanciaPorIngreso.get(paciente.ingreso.id);
      if (!estancia) return;
      paciente.esTemporal = true;
      paciente.subgrupoTemporal = {
        id: String(estancia.cama.subgrupo.id),
        codigo: estancia.cama.subgrupo.codigo,
        nombre: estancia.cama.subgrupo.nombre,
      };
      const asignacion = asignacionPorEstancia.get(estancia.id);
      const subgrupoDestino = asignacion && subgrupoPorId.get(asignacion.subgrupoDestinoId);
      if (subgrupoDestino) {
        paciente.subgrupoAsignado = {
          id: String(subgrupoDestino.id),
          codigo: subgrupoDestino.codigo,
          nombre: subgrupoDestino.nombre,
        };
      }
    });
    result.temporalesConfigurados = true;
    return result;
  }

  public async asignar(
    centroId: number,
    subgrupoDestinoId: number,
    ingresoId: number
  ): Promise<number> {
    await this.asegurarMedicoAutorizado(centroId, subgrupoDestinoId);
    const estancia = await this.estanciaTemporalActiva(centroId, ingresoId);
    const rp = this.conn.getRepository(PacienteTemporalOrm);
    const asignacionExistente = await rp.findOne({ where: { estanciaId: estancia.id } });

    if (asignacionExistente) {
      if (asignacionExistente.subgrupoDestinoId === subgrupoDestinoId)
        return asignacionExistente.id;
      throw new BadRequestException('El paciente temporal ya fue asignado a otro subgrupo.');
    }

    const asignacion = rp.create({
      estanciaId: estancia.id,
      ingresoId: estancia.ingreso.id,
      pacienteId: estancia.ingreso.paciente.id,
      centroId,
      subgrupoDestinoId,
      usuarioAsignoId: this.auth.id,
      fechaAsignacion: new Date(),
    });
    return (await rp.save(asignacion)).id;
  }

  public async retirar(
    centroId: number,
    subgrupoDestinoId: number,
    asignacionId: number
  ): Promise<boolean> {
    await this.asegurarMedicoAutorizado(centroId, subgrupoDestinoId);
    const rp = this.conn.getRepository(PacienteTemporalOrm);
    const asignacion = await rp.findOne({
      where: { id: asignacionId, centroId, subgrupoDestinoId },
    });
    if (!asignacion)
      throw new BadRequestException('La asignación temporal no existe o ya fue retirada.');
    await rp.remove(asignacion);
    return true;
  }

  public async esAsignacionTemporalVigente(
    ingresoId: number,
    subgrupoDestinoId: number
  ): Promise<boolean> {
    const asignacion = await this.conn.getRepository(PacienteTemporalOrm).findOne({
      where: { ingresoId, subgrupoDestinoId },
      order: { id: 'DESC' },
    });
    if (!asignacion) return false;

    const estancia = await this.conn.getRepository(EstanciaOrm).findOne({
      where: this.condicionesTemporales(asignacion.centroId, ingresoId).map(condicion => ({
        ...condicion,
        id: asignacion.estanciaId,
      })),
    });
    return !!estancia;
  }
}
