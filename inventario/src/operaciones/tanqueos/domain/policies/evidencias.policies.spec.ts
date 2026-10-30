import { OrigenTanqueo, TipoEvidencia } from '../enums';
import {
  EVIDENCIAS_LOTE_ESTACION,
  EVIDENCIAS_TANQUEO_ESTACION,
  EVIDENCIAS_TANQUEO_REPOSITORIO,
  getEvidenciasRequeridasTanqueo,
} from './evidencias.policies';

describe('getEvidenciasRequeridasTanqueo', () => {
  it('estación simple exige TABLERO_INICIAL', () => {
    expect(getEvidenciasRequeridasTanqueo(OrigenTanqueo.ESTACION)).toEqual(
      EVIDENCIAS_TANQUEO_ESTACION
    );
  });

  it('estación en lote exige las 5 evidencias ampliadas', () => {
    const requeridas = getEvidenciasRequeridasTanqueo(OrigenTanqueo.ESTACION, {
      loteEstacion: true,
    });
    expect(requeridas).toEqual(EVIDENCIAS_LOTE_ESTACION);
    expect(requeridas).toContain(TipoEvidencia.FACTURA);
    expect(requeridas).toContain(TipoEvidencia.SURTIDOR_FINAL);
  });

  it('repositorio exige foto antes y después', () => {
    expect(getEvidenciasRequeridasTanqueo(OrigenTanqueo.REPOSITORIO)).toEqual(
      EVIDENCIAS_TANQUEO_REPOSITORIO
    );
  });
});
