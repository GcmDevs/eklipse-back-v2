import { ClasificacionBiomedica } from '@equipos/domain/value-objects';
import { ClasificacionBiomedicaEmbeddable } from '@orm/inn/equipos/supports';

export class ClasificacionBiomedicaMapper {
  static toOrm(domain: ClasificacionBiomedica): ClasificacionBiomedicaEmbeddable {
    const orm = new ClasificacionBiomedicaEmbeddable();

    orm.aplicaRegSanitario = domain.getAplicaRegSanitario;
    orm.numeroRegSanitario = domain?.getNumeroRegSanitario ?? undefined;
    orm.expedienteRegSanitario = domain?.getExpedienteRegistroSanitario ?? undefined;
    orm.prevencion = domain.getPrevencion;
    orm.diagnostico = domain.getDiagnostico;
    orm.rehabilitacion = domain.getRehabilitacion;
    orm.analisisLaboratorio = domain.getAnalisisLaboratorio;
    orm.tratamientoMantenimientoDeVida = domain.getTratamientoMantenimientoDeVida;
    orm.riesgo = domain.getRiesgo;

    return orm;
  }

  static toDomain(orm: ClasificacionBiomedicaEmbeddable): ClasificacionBiomedica {
    return ClasificacionBiomedica.create(
      orm.aplicaRegSanitario,
      orm.diagnostico,
      orm.prevencion,
      orm.rehabilitacion,
      orm.analisisLaboratorio,
      orm.tratamientoMantenimientoDeVida,
      orm.riesgo,
      orm?.numeroRegSanitario,
      orm?.expedienteRegSanitario
    );
  }
}
