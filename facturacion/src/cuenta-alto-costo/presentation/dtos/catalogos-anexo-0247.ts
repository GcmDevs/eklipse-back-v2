// Fuente: ANEXO 0247.xlsx, hoja Opciones de respuesta, filas 3–43.
// Solo se agregan códigos ausentes; los códigos del catálogo base no se reemplazan.
import type { CampoCac } from './cac.dto';
import type { OpcionCampoCac } from './catalogos-cac';

type CatalogosCac = Readonly<Partial<Record<CampoCac, readonly OpcionCampoCac[]>>>;

export const OPCIONES_ANEXO_0247: CatalogosCac = {
  // Variable 21: Opciones de respuesta!V3.
  TIPESTUDIODX: [
    { codigo: '9', descripcion: 'Genética' },
    { codigo: '10', descripcion: 'Patología básica' },
    {
      codigo: '55',
      descripcion:
        'Persona con aseguramiento (régimen subsidiado o contributivo y que no son PPNA) que recibió servicios de salud por parte del ente territorial durante el periodo de reporte',
    },
  ],
  // Variable 22: Opciones de respuesta!W3.
  MOTSINHISTOPAT: [
    { codigo: '6', descripcion: 'Clínica por reporte de imágenes o laboratorios.' },
    {
      codigo: '55',
      descripcion:
        'Persona con aseguramiento (régimen subsidiado o contributivo y que no son PPNA) que recibió servicios de salud por parte del ente territorial durante el periodo de reporte.',
    },
  ],
  // Variable 27: Opciones de respuesta!AB3.
  HISTOTUMORMUESTRA: [
    { codigo: '21', descripcion: 'Célula pequeña (cáncer de pulmón) (no aplica para nuevos)' },
    { codigo: '22', descripcion: 'Célula no pequeña (cáncer de pulmón) (no aplica para nuevos)' },
    { codigo: '23', descripcion: 'Melanoma' },
    { codigo: '24', descripcion: 'Carcinoma papilar de tiroides' },
    {
      codigo: '55',
      descripcion:
        'Persona con aseguramiento (régimen subsidiado o contributivo y que no son PPNA) que recibió servicios de salud por parte del ente territorial durante el periodo de reporte.',
    },
    {
      codigo: '98',
      descripcion:
        'No se realizó estudio histopatológico (en la variable 21 registró la opción 7).',
    },
  ],
  // Variable 28: Opciones de respuesta!AC3.
  GRADIFTUMOR: [
    {
      codigo: '55',
      descripcion:
        'Persona con aseguramiento (régimen subsidiado o contributivo y que no son PPNA) que recibió servicios de salud por parte del ente territorial durante el periodo de reporte.',
    },
    {
      codigo: '94',
      descripcion:
        'Es un cáncer sólido cuyo reporte de patología no incluye la descripción de la diferenciación celular. (ejemplo: cáncer de tiroides, carcinoma basocelular, tumores in situ, melanoma, entre otros).',
    },
    { codigo: '95', descripcion: 'No es sólido (cáncer hematolinfático)' },
  ],
  // Variable 29: Opciones de respuesta!AD3.
  ESTADTUMORSOLIDO: [
    { codigo: '26', descripcion: 'Estadio IAB' },
    { codigo: '27', descripcion: 'ec IIIC1 o 3c1' },
    { codigo: '28', descripcion: 'ec IIIC2 o 3c2' },
    { codigo: '29', descripcion: 'ec IIID o 3d' },
    { codigo: '30', descripcion: 'ec IB3' },
    { codigo: '31', descripcion: 'ec IC1' },
    { codigo: '32', descripcion: 'ec IC2' },
    { codigo: '33', descripcion: 'ec IC3' },
    { codigo: '34', descripcion: 'ec IIIA1' },
    { codigo: '35', descripcion: 'ec IIIA2' },
    {
      codigo: '55',
      descripcion:
        'Persona con aseguramiento (régimen subsidiado o contributivo y que no son PPNA) que recibió servicios de salud por parte del ente territorial durante el periodo de reporte.',
    },
  ],
  // Variable 33: Opciones de respuesta!AH3.
  MAMARESHER2: [
    { codigo: '3', descripcion: '+ (negativo)' },
    { codigo: '4', descripcion: 'cero ó (negativo)' },
    { codigo: '97', descripcion: 'No Aplica porque es cáncer de mama in situ.' },
    {
      codigo: '55',
      descripcion:
        'Persona con aseguramiento (régimen subsidiado o contributivo y que no son PPNA) que recibió servicios de salud por parte del ente territorial durante el periodo de reporte.',
    },
  ],
  // Variable 34: Opciones de respuesta!AI3.
  COLESTADDUKES: [
    {
      codigo: '55',
      descripcion:
        'Persona con aseguramiento (régimen subsidiado o contributivo y que no son PPNA) que recibió servicios de salud por parte del ente territorial durante el periodo de reporte.',
    },
  ],
  // Variable 36: Opciones de respuesta!AK3.
  LINFESTADIFICACION: [
    { codigo: '5', descripcion: 'Estadio IA' },
    { codigo: '6', descripcion: 'Estadio IB' },
    { codigo: '7', descripcion: 'Estadio IIA' },
    { codigo: '8', descripcion: 'Estadio IIB' },
    { codigo: '9', descripcion: 'Estadio IIIA' },
    { codigo: '10', descripcion: 'Estadio IIIB' },
    { codigo: '11', descripcion: 'Estadio IVA' },
    { codigo: '12', descripcion: 'Estadio IVB' },
    { codigo: '13', descripcion: 'Extranodal cualquier estadio' },
    { codigo: '14', descripcion: 'Primario SNC' },
    { codigo: '15', descripcion: 'Primario Mediastinal' },
    { codigo: '16', descripcion: 'Primario de otros organos' },
    {
      codigo: '55',
      descripcion:
        'Persona con aseguramiento (régimen subsidiado o contributivo y que no son PPNA) que recibió servicios de salud por parte del ente territorial durante el periodo de reporte.',
    },
  ],
  // Variable 37: Opciones de respuesta!AL3.
  PROSTESCALAGLEASON: [
    { codigo: '11', descripcion: 'Gleason <= 6: <= 3 + 3' },
    { codigo: '12', descripcion: 'Gleason 7: 3 + 4' },
    { codigo: '13', descripcion: 'Gleason 7: 4 + 3' },
    { codigo: '14', descripcion: 'Gleason 8 : 4+4 o 3 +5 o 5+3' },
    { codigo: '15', descripcion: 'Gleason 9 o 10 : 4+5 o 5+4 o 5+5' },
    {
      codigo: '97',
      descripcion:
        'Es cáncer de próstata, pero no hay información acerca de esta estadificación porque el diagnóstico fue clínico.',
    },
    {
      codigo: '55',
      descripcion:
        'Persona con aseguramiento (régimen subsidiado o contributivo y que no son PPNA) que recibió servicios de salud por parte del ente territorial durante el periodo de reporte.',
    },
  ],
  // Variable 38: Opciones de respuesta!AM3.
  PEDCLASIFRIESGO: [
    {
      codigo: '55',
      descripcion:
        'Persona con aseguramiento (régimen subsidiado o contributivo y que no son PPNA) que recibió servicios de salud por parte del ente territorial durante el periodo de reporte.',
    },
  ],
  // Variable 40: Opciones de respuesta!AO3.
  OBJTRATINICIAL: [
    {
      codigo: '55',
      descripcion:
        'Persona con aseguramiento (régimen subsidiado o contributivo y que no son PPNA) que recibió servicios de salud por parte del ente territorial durante el periodo de reporte.',
    },
  ],
  // Variable 41: Opciones de respuesta!AP3.
  OBJINTERVPERIODO: [
    {
      codigo: '55',
      descripcion:
        'Persona con aseguramiento (régimen subsidiado o contributivo y que no son PPNA) que recibió servicios de salud por parte del ente territorial durante el periodo de reporte.',
    },
  ],
  // Variable 42: Opciones de respuesta!AQ3.
  ANTOTROCANCER: [
    {
      codigo: '55',
      descripcion:
        'Persona con aseguramiento (régimen subsidiado o contributivo y que no son PPNA) que recibió servicios de salud por parte del ente territorial durante el periodo de reporte',
    },
  ],
  // Variable 45: Opciones de respuesta!AT3.
  QUIRECIBIOCORTE: [
    {
      codigo: '55',
      descripcion:
        'Persona con aseguramiento (régimen subsidiado o contributivo y que no son PPNA) que recibió servicios de salud por parte del ente territorial durante el periodo de reporte.',
    },
  ],
  // Variable 46.1: Opciones de respuesta!AV3.
  QUIFASPREFASE: [
    {
      codigo: '55',
      descripcion:
        'Persona con aseguramiento (régimen subsidiado o contributivo y que no son PPNA) que recibió servicios de salud por parte del ente territorial durante el periodo de reporte.',
    },
  ],
  // Variable 46.2: Opciones de respuesta!AW3.
  QUIFASINDUCCION: [
    {
      codigo: '55',
      descripcion:
        'Persona con aseguramiento (régimen subsidiado o contributivo y que no son PPNA) que recibió servicios de salud por parte del ente territorial durante el periodo de reporte.',
    },
  ],
  // Variable 46.3: Opciones de respuesta!AX3.
  QUIFASINTENSIF: [
    {
      codigo: '55',
      descripcion:
        'Persona con aseguramiento (régimen subsidiado o contributivo y que no son PPNA) que recibió servicios de salud por parte del ente territorial durante el periodo de reporte.',
    },
  ],
  // Variable 46.4: Opciones de respuesta!AY3.
  QUIFASCONSOLID: [
    {
      codigo: '55',
      descripcion:
        'Persona con aseguramiento (régimen subsidiado o contributivo y que no son PPNA) que recibió servicios de salud por parte del ente territorial durante el periodo de reporte.',
    },
  ],
  // Variable 46.5: Opciones de respuesta!AZ3.
  QUIFASREINDUCC: [
    {
      codigo: '55',
      descripcion:
        'Persona con aseguramiento (régimen subsidiado o contributivo y que no son PPNA) que recibió servicios de salud por parte del ente territorial durante el periodo de reporte.',
    },
  ],
  // Variable 46.6: Opciones de respuesta!BA3.
  QUIFASMANTENIM: [
    {
      codigo: '55',
      descripcion:
        'Persona con aseguramiento (régimen subsidiado o contributivo y que no son PPNA) que recibió servicios de salud por parte del ente territorial durante el periodo de reporte.',
    },
  ],
  // Variable 46.7: Opciones de respuesta!BB3.
  QUIFASMANTLARGO: [
    {
      codigo: '55',
      descripcion:
        'Persona con aseguramiento (régimen subsidiado o contributivo y que no son PPNA) que recibió servicios de salud por parte del ente territorial durante el periodo de reporte.',
    },
  ],
  // Variable 46.8: Opciones de respuesta!BC3.
  QUIFASOTRA: [
    {
      codigo: '55',
      descripcion:
        'Persona con aseguramiento (régimen subsidiado o contributivo y que no son PPNA) que recibió servicios de salud por parte del ente territorial durante el periodo de reporte.',
    },
  ],
  // Variable 48: Opciones de respuesta!BE3.
  QUIUBITEMP1CICLO: [
    { codigo: '11', descripcion: 'Manejo de recaida' },
    { codigo: '12', descripcion: 'Manejo de enfermedad metastásica' },
    {
      codigo: '13',
      descripcion: 'Manejo paliativo (sin manejo de recaída ni enfermedad metastásica)',
    },
    {
      codigo: '55',
      descripcion:
        'Persona con aseguramiento (régimen subsidiado o contributivo y que no son PPNA) que recibió servicios de salud por parte del ente territorial durante el periodo de reporte.',
    },
  ],
  // Variable 59: Opciones de respuesta!BY3.
  QUICARACACTUAL1CICLO: [
    {
      codigo: '55',
      descripcion:
        'Persona con aseguramiento (régimen subsidiado o contributivo y que no son PPNA) que recibió servicios de salud por parte del ente territorial durante el periodo de reporte',
    },
  ],
  // Variable 60: Opciones de respuesta!BZ3.
  QUIMOTFINPREM1CICLO: [
    {
      codigo: '55',
      descripcion:
        'Persona con aseguramiento (régimen subsidiado o contributivo y que no son PPNA) que recibió servicios de salud por parte del ente territorial durante el periodo de reporte.',
    },
  ],
  // Variable 61: Opciones de respuesta!CA3.
  QUIUBITEMPULTCICLO: [
    { codigo: '11', descripcion: 'Manejo de progresion o recaída' },
    { codigo: '12', descripcion: 'Manejo de enfermedad metastásica' },
    { codigo: '13', descripcion: 'Cambio por toxicidad' },
    {
      codigo: '14',
      descripcion: 'Manejo paliativo (sin manejo de recaída ni enfermedad metastásica)',
    },
    {
      codigo: '55',
      descripcion:
        'Persona con aseguramiento (régimen subsidiado o contributivo y que no son PPNA) que recibió servicios de salud por parte del ente territorial durante el periodo de reporte.',
    },
  ],
  // Variable 72: Opciones de respuesta!CU3.
  QUICARACACTUALULTCICLO: [
    {
      codigo: '55',
      descripcion:
        'Persona con aseguramiento (régimen subsidiado o contributivo y que no son PPNA) que recibió servicios de salud por parte del ente territorial durante el periodo de reporte.',
    },
  ],
  // Variable 73: Opciones de respuesta!CV3.
  QUIMOTFINPREMULTCICLO: [
    {
      codigo: '55',
      descripcion:
        'Persona con aseguramiento (régimen subsidiado o contributivo y que no son PPNA) que recibió servicios de salud por parte del ente territorial durante el periodo de reporte.',
    },
  ],
  // Variable 74: Opciones de respuesta!CW3.
  CIRSOMETIDOCORTE: [
    {
      codigo: '55',
      descripcion:
        'Persona con aseguramiento (régimen subsidiado o contributivo y que no son PPNA) que recibió servicios de salud por parte del ente territorial durante el periodo de reporte.',
    },
  ],
  // Variable 79: Opciones de respuesta!DB3.
  CIRUBITEMP1RA: [
    { codigo: '5', descripcion: 'Manejo de recaída' },
    { codigo: '6', descripcion: 'Manejo de enfermedad metastásica' },
    {
      codigo: '55',
      descripcion:
        'Persona con aseguramiento (régimen subsidiado o contributivo y que no son PPNA) que recibió servicios de salud por parte del ente territorial durante el periodo de reporte.',
    },
  ],
  // Variable 81: Opciones de respuesta!DD3.
  CIRMOTULTCIRUGIA: [
    {
      codigo: '55',
      descripcion:
        'Persona con aseguramiento (régimen subsidiado o contributivo y que no son PPNA) que recibió servicios de salud por parte del ente territorial durante el periodo de reporte.',
    },
  ],
  // Variable 84: Opciones de respuesta!DG3.
  CIRUBITEMPULT: [
    { codigo: '5', descripcion: 'Manejo de recaída' },
    { codigo: '6', descripcion: 'Manejo de enfermedad metastásica' },
    {
      codigo: '55',
      descripcion:
        'Persona con aseguramiento (régimen subsidiado o contributivo y que no son PPNA) que recibió servicios de salud por parte del ente territorial durante el periodo de reporte.',
    },
  ],
  // Variable 85: Opciones de respuesta!DH3.
  CIRESTADOVITALULT: [
    { codigo: '98', descripcion: 'No Aplica (seleccionó la opción 2 en la variable 74)' },
    {
      codigo: '55',
      descripcion:
        'Persona con aseguramiento (régimen subsidiado o contributivo y que no son PPNA) que recibió servicios de salud por parte del ente territorial durante el periodo de reporte.',
    },
  ],
  // Variable 86: Opciones de respuesta!DI3.
  RADRECIBIOCORTE: [
    {
      codigo: '55',
      descripcion:
        'Persona con aseguramiento (régimen subsidiado o contributivo y que no son PPNA) que recibió servicios de salud por parte del ente territorial durante el periodo de reporte.',
    },
  ],
  // Variable 89: Opciones de respuesta!DL3.
  RADUBITEMP1ESQ: [
    { codigo: '11', descripcion: 'Manejo de recaída' },
    { codigo: '12', descripcion: 'Manejo de enfermedad metastásica' },
    {
      codigo: '13',
      descripcion: 'Manejo paliativo (sin manejo de recaída ni enfermedad metastásica)',
    },
    {
      codigo: '55',
      descripcion:
        'Persona con aseguramiento (régimen subsidiado o contributivo y que no son PPNA) que recibió servicios de salud por parte del ente territorial durante el periodo de reporte.',
    },
  ],
  // Variable 90: Opciones de respuesta!DM3.
  RADTIPRADIO1ESQ: [
    {
      codigo: '55',
      descripcion:
        'Persona con aseguramiento (régimen subsidiado o contributivo y que no son PPNA) que recibió servicios de salud por parte del ente territorial durante el periodo de reporte.',
    },
  ],
  // Variable 95: Opciones de respuesta!DR3.
  RADCARACACTUAL1ESQ: [
    {
      codigo: '55',
      descripcion:
        'Persona con aseguramiento (régimen subsidiado o contributivo y que no son PPNA) que recibió servicios de salud por parte del ente territorial durante el periodo de reporte.',
    },
  ],
  // Variable 96: Opciones de respuesta!DS3.
  RADMOTFIN1ESQ: [
    {
      codigo: '55',
      descripcion:
        'Persona con aseguramiento (régimen subsidiado o contributivo y que no son PPNA) que recibió servicios de salud por parte del ente territorial durante el periodo de reporte.',
    },
  ],
  // Variable 98: Opciones de respuesta!DU3.
  RADUBITEMPULTESQ: [
    { codigo: '11', descripcion: 'Manejo de recaida' },
    { codigo: '12', descripcion: 'Manejo de enfermedad metastásica' },
    {
      codigo: '13',
      descripcion: 'Manejo paliativo (sin manejo de recaída ni enfermedad metastásica)',
    },
    { codigo: '98', descripcion: 'No aplica' },
    {
      codigo: '55',
      descripcion:
        'Persona con aseguramiento (régimen subsidiado o contributivo y que no son PPNA) que recibió servicios de salud por parte del ente territorial durante el periodo de reporte.',
    },
  ],
  // Variable 99: Opciones de respuesta!DV3.
  RADTIPRADIOULTESQ: [
    {
      codigo: '55',
      descripcion:
        'Persona con aseguramiento (régimen subsidiado o contributivo y que no son PPNA) que recibió servicios de salud por parte del ente territorial durante el periodo de reporte.',
    },
  ],
  // Variable 105: Opciones de respuesta!EB3.
  RADMOTFINULTESQ: [
    {
      codigo: '55',
      descripcion:
        'Persona con aseguramiento (régimen subsidiado o contributivo y que no son PPNA) que recibió servicios de salud por parte del ente territorial durante el periodo de reporte.',
    },
  ],
  // Variable 106: Opciones de respuesta!EC3.
  TRARECIBIOCORTE: [
    {
      codigo: '55',
      descripcion:
        'Persona con aseguramiento (régimen subsidiado o contributivo y que no son PPNA) que recibió servicios de salud por parte del ente territorial durante el periodo de reporte.',
    },
  ],
  // Variable 107: Opciones de respuesta!ED3.
  TRATIPO: [
    {
      codigo: '55',
      descripcion:
        'Persona con aseguramiento (régimen subsidiado o contributivo y que no son PPNA) que recibió servicios de salud por parte del ente territorial durante el periodo de reporte.',
    },
  ],
  // Variable 108: Opciones de respuesta!EE3.
  TRAUBITEMPORAL: [
    { codigo: '95', descripcion: 'Recaida' },
    { codigo: '96', descripcion: 'Refractariedad' },
    { codigo: '97', descripcion: 'Esquema de consolidacion' },
    {
      codigo: '55',
      descripcion:
        'Persona con aseguramiento (régimen subsidiado o contributivo y que no son PPNA) que recibió servicios de salud por parte del ente territorial durante el periodo de reporte.',
    },
  ],
  // Variable 111: Opciones de respuesta!EH3.
  TRCRECIBIOCIRRECONS: [
    {
      codigo: '55',
      descripcion:
        'Persona con aseguramiento (régimen subsidiado o contributivo y que no son PPNA) que recibió',
    },
  ],
  // Variable 114: Opciones de respuesta!EK3.
  TRCVALCUIDADOPALIATIVO: [
    {
      codigo: '55',
      descripcion:
        'Persona con aseguramiento (régimen subsidiado o contributivo y que no son PPNA) que recibió servicios de salud por parte del ente territorial durante el periodo de reporte.',
    },
  ],
  // Variable 117: Opciones de respuesta!ET3.
  TRCVALPSIQUIATRIA: [
    {
      codigo: '55',
      descripcion:
        'Persona con aseguramiento (régimen subsidiado o contributivo y que no son PPNA) que recibió servicios de salud por parte del ente territorial durante el periodo de reporte.',
    },
  ],
  // Variable 120: Opciones de respuesta!EW3.
  TRCVALNUTRICION: [
    {
      codigo: '55',
      descripcion:
        'Persona con aseguramiento (régimen subsidiado o contributivo y que no son PPNA) que recibió servicios de salud por parte del ente territorial durante el periodo de reporte.',
    },
  ],
  // Variable 123: Opciones de respuesta!EZ3.
  TRCRECIBIOSOPORTENUTRI: [
    {
      codigo: '55',
      descripcion:
        'Persona con aseguramiento (régimen subsidiado o contributivo y que no son PPNA) que recibió servicios de salud por parte del ente territorial durante el periodo de reporte..',
    },
  ],
  // Variable 124: Opciones de respuesta!FA3.
  TRCRECIBIOTERAPIASREHAB: [
    {
      codigo: '55',
      descripcion:
        'Persona con aseguramiento (régimen subsidiado o contributivo y que no son PPNA) que recibió servicios de salud por parte del ente territorial durante el periodo de reporte.',
    },
  ],
  // Variable 125: Opciones de respuesta!FB3.
  IDETIPOTRATAMIENTO: [
    { codigo: '10', descripcion: '1, 2 y 3' },
    { codigo: '11', descripcion: 'Manejo de cuidado paliativo o terapia complementaria.' },
    {
      codigo: '55',
      descripcion:
        'Persona con aseguramiento (régimen subsidiado o contributivo y que no son PPNA) que recibió servicios de salud por parte del ente territorial durante el periodo de reporte.',
    },
  ],
  // Variable 126: Opciones de respuesta!FC3.
  RMORESMANEJOONCO: [
    { codigo: '7', descripcion: 'Paciente en seguimiento por antecedente de cáncer' },
    {
      codigo: '8',
      descripcion:
        'Pendiente iniciar el tratamiento luego del diagnóstico (fue definido por especialista o aún estar pendiente por valoración oncológica inicial, en la cual se defina el tratamiento)',
    },
    {
      codigo: '55',
      descripcion:
        'Persona con aseguramiento (régimen subsidiado o contributivo y que no son PPNA) que recibió servicios de salud por parte del ente territorial durante el periodo de reporte.',
    },
  ],
  // Variable 127: Opciones de respuesta!FD3.
  RMOESTADOVITAL: [
    {
      codigo: '55',
      descripcion:
        'Persona con aseguramiento (régimen subsidiado o contributivo y que no son PPNA) que recibió servicios de salud por parte del ente territorial durante el periodo de reporte.',
    },
  ],
  // Variable 128: Opciones de respuesta!FE3.
  RMONOVADMINISTRATIVA: [
    {
      codigo: '13',
      descripcion:
        'usuario no incluido en reporte anterior y está desafiliado en el momento del reporte actual',
    },
    {
      codigo: '14',
      descripcion:
        'Persona con aseguramiento (régimen subsidiado o contributivo y que no son PPNA) que recibió servicios de salud por parte del ente territorial durante el periodo de reporte.',
    },
    { codigo: '15', descripcion: 'Comunidad migrante de la República de Venezuela' },
    {
      codigo: '16',
      descripcion:
        'Usuario de cambió de CIE-10: aplica para casos con cánceres secundarios o no especificados en los que se define el primario o se especifica el tipo de cáncer',
    },
    {
      codigo: '17',
      descripcion:
        'Usuario identificado por cruce con fuentes externas, con diagnóstico de cáncer, no confirmado o no gestionado por la EAPB',
    },
    {
      codigo: '18',
      descripcion:
        'Usuario identificado por cruce con fuentes externas, con diagnóstico descartado por la EAPB',
    },
    {
      codigo: '19',
      descripcion:
        'Paciente trasladado que fue glosado en periodo anterior, que no fue gestionado por la entidad en el periodo actual',
    },
  ],
  // Variable 129: Opciones de respuesta!FF3.
  RMONOVCLINICA: [
    { codigo: '8', descripcion: 'Abandono de tratamiento' },
    { codigo: '9', descripcion: 'Usuario firmó alta voluntaria' },
    { codigo: '10', descripcion: 'Usuario en manejo expectante antes de tratamiento' },
    { codigo: '11', descripcion: 'usuario que esta en manejo de metastasis' },
    { codigo: '12', descripcion: 'usuario fallecido o desafiliado' },
    {
      codigo: '55',
      descripcion:
        'Persona con aseguramiento (régimen subsidiado o contributivo y que no son PPNA) que recibió servicios de salud por parte del ente territorial durante el periodo de reporte.',
    },
  ],
};

export function completarCatalogosAnexo(base: CatalogosCac): CatalogosCac {
  const resultado: Partial<Record<CampoCac, readonly OpcionCampoCac[]>> = { ...base };
  for (const campo of Object.keys(OPCIONES_ANEXO_0247) as CampoCac[]) {
    const anteriores = base[campo] ?? [];
    const adicionales = (OPCIONES_ANEXO_0247[campo] ?? []).filter(
      opcion => !anteriores.some(anterior => anterior.codigo === opcion.codigo)
    );
    resultado[campo] = [...anteriores, ...adicionales].sort(
      (a, b) => Number(a.codigo) - Number(b.codigo)
    );
  }
  return resultado;
}
