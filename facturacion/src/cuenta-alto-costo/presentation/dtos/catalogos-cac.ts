// Fuente: Estructura Cuenta Alto Costo - Objetivo (1).xlsx, hoja CAC, fila 6.
// Los códigos se conservan como texto numérico para mantener el contrato de persistencia.
import type { CampoCac } from './cac.dto';
export interface OpcionCampoCac {
  readonly codigo: string;
  readonly descripcion: string;
}
export const CATALOGOS_CAC: Readonly<Partial<Record<CampoCac, readonly OpcionCampoCac[]>>> = {
  CANPRIORIZADO: [
    {
      codigo: '1',
      descripcion: 'Cáncer de mama',
    },
    {
      codigo: '2',
      descripcion: 'Cáncer de cuello uterino',
    },
    {
      codigo: '3',
      descripcion: 'Cáncer de colon y recto',
    },
    {
      codigo: '4',
      descripcion: 'Cáncer de estómago',
    },
    {
      codigo: '5',
      descripcion: 'Cáncer de próstata',
    },
    {
      codigo: '6',
      descripcion: 'Cáncer de tráquea, bronquios y pulmón',
    },
    {
      codigo: '7',
      descripcion: 'Leucemia linfoide aguda en niños',
    },
    {
      codigo: '8',
      descripcion: 'Leucemia linfoide aguda en adultos',
    },
    {
      codigo: '9',
      descripcion: 'Leucemia mieloide aguda en niños',
    },
    {
      codigo: '10',
      descripcion: 'Leucemia mieloide aguda en adultos',
    },
    {
      codigo: '11',
      descripcion: 'Linfoma no Hodgkin en adultos',
    },
    {
      codigo: '12',
      descripcion: 'No priorizados',
    },
  ],
  INDINCIDENCIA: [
    {
      codigo: '1',
      descripcion: 'Epidemiologica',
    },
    {
      codigo: '2',
      descripcion: 'Administrativa',
    },
    {
      codigo: '3',
      descripcion: 'Prevalente',
    },
  ],
  TIPESTUDIODX: [
    {
      codigo: '1',
      descripcion: 'Mielograma o aspirado de médula ósea',
    },
    {
      codigo: '2',
      descripcion: 'Biopsia de médula ósea',
    },
    {
      codigo: '3',
      descripcion: 'Biopsia de ganglios',
    },
    {
      codigo: '4',
      descripcion: 'Biopsia de masa',
    },
    {
      codigo: '5',
      descripcion: 'Inmunohistoquímica',
    },
    {
      codigo: '6',
      descripcion: 'Citometría de flujo',
    },
    {
      codigo: '7',
      descripcion: 'Exclusivamente clínica (estudios imagenológicos/bioquímicos)',
    },
    {
      codigo: '8',
      descripcion: 'Otros',
    },
    {
      codigo: '99',
      descripcion: 'Desconocido',
    },
  ],
  MOTSINHISTOPAT: [
    {
      codigo: '1',
      descripcion: 'Clínica (coagulopatía)',
    },
    {
      codigo: '2',
      descripcion: 'Clínica (localización del tumor)',
    },
    {
      codigo: '3',
      descripcion: 'Clínica (deterioro estado funcional)',
    },
    {
      codigo: '4',
      descripcion: 'Negativa del usuario/acudiente con soporte',
    },
    {
      codigo: '5',
      descripcion: 'Administrativa',
    },
    {
      codigo: '98',
      descripcion: 'No Aplica (tiene confirmación por histopatología)',
    },
    {
      codigo: '99',
      descripcion: 'Desconocido',
    },
  ],
  HISTOTUMORMUESTRA: [
    {
      codigo: '1',
      descripcion: 'Adenocarcinoma',
    },
    {
      codigo: '2',
      descripcion: 'Carcinoma escamocelular',
    },
    {
      codigo: '3',
      descripcion: 'Carcinoma basocelular',
    },
    {
      codigo: '4',
      descripcion: 'Carcinoma otros',
    },
    {
      codigo: '5',
      descripcion: 'Oligodendroglioma',
    },
    {
      codigo: '6',
      descripcion: 'Astrocitoma',
    },
    {
      codigo: '7',
      descripcion: 'Ependimoma',
    },
    {
      codigo: '8',
      descripcion: 'Neuroblastoma',
    },
    {
      codigo: '9',
      descripcion: 'Meduloblastoma',
    },
    {
      codigo: '10',
      descripcion: 'Hepatoblastoma',
    },
    {
      codigo: '11',
      descripcion: 'Rabdomiosarcoma',
    },
    {
      codigo: '12',
      descripcion: 'Leiomiosarcoma',
    },
    {
      codigo: '13',
      descripcion: 'Osteosarcoma',
    },
    {
      codigo: '14',
      descripcion: 'Fibrosarcoma',
    },
    {
      codigo: '15',
      descripcion: 'Angiosarcoma',
    },
    {
      codigo: '16',
      descripcion: 'Condrosarcoma',
    },
    {
      codigo: '17',
      descripcion: 'Otros sarcomas',
    },
    {
      codigo: '18',
      descripcion: 'Pancreatoblastoma',
    },
    {
      codigo: '19',
      descripcion: 'Blastoma pleuropulmonar',
    },
    {
      codigo: '20',
      descripcion: 'Otros tipos histológicos',
    },
    {
      codigo: '99',
      descripcion: 'Sin información',
    },
  ],
  GRADIFTUMOR: [
    {
      codigo: '1',
      descripcion: 'Bien diferenciado',
    },
    {
      codigo: '2',
      descripcion: 'Moderadamente diferenciado',
    },
    {
      codigo: '3',
      descripcion: 'Mal diferenciado',
    },
    {
      codigo: '4',
      descripcion: 'Anaplásico / indiferenciado',
    },
    {
      codigo: '98',
      descripcion: 'No Aplica (no es tumor sólido)',
    },
    {
      codigo: '99',
      descripcion: 'Sin información',
    },
  ],
  ESTADTUMORSOLIDO: [
    {
      codigo: '0',
      descripcion: 'estadio clínico (ec) 0 (tumor in situ)',
    },
    {
      codigo: '1',
      descripcion: 'ec I o 1',
    },
    {
      codigo: '2',
      descripcion: 'ec IA o 1A',
    },
    {
      codigo: '3',
      descripcion: 'ec IA1',
    },
    {
      codigo: '4',
      descripcion: 'ec IA2',
    },
    {
      codigo: '5',
      descripcion: 'ec IB o 1b',
    },
    {
      codigo: '6',
      descripcion: 'ec IB1',
    },
    {
      codigo: '7',
      descripcion: 'ec IB2',
    },
    {
      codigo: '8',
      descripcion: 'ec IC o 1c',
    },
    {
      codigo: '9',
      descripcion: 'ec IS o 1s',
    },
    {
      codigo: '10',
      descripcion: 'ec II o 2',
    },
    {
      codigo: '11',
      descripcion: 'ec IIA o 2a',
    },
    {
      codigo: '12',
      descripcion: 'ec IIA1',
    },
    {
      codigo: '13',
      descripcion: 'ecIIA2',
    },
    {
      codigo: '14',
      descripcion: 'ec IIB',
    },
    {
      codigo: '15',
      descripcion: 'ec: IIC o 2c',
    },
    {
      codigo: '16',
      descripcion: 'ec III o 3',
    },
    {
      codigo: '17',
      descripcion: 'ec IIIA o 3a',
    },
    {
      codigo: '18',
      descripcion: 'ec: IIIB o 3b',
    },
    {
      codigo: '19',
      descripcion: 'ec: IIIC o3c',
    },
    {
      codigo: '20',
      descripcion: 'ec IV o 4',
    },
    {
      codigo: '21',
      descripcion: 'ec IVA o 4a',
    },
    {
      codigo: '22',
      descripcion: 'ec IVB o 4b',
    },
    {
      codigo: '23',
      descripcion: 'ec IVC o 4c',
    },
    {
      codigo: '24',
      descripcion: 'ec4S (para neuroblastoma)',
    },
    {
      codigo: '25',
      descripcion: 'ec V o 5',
    },
    {
      codigo: '98',
      descripcion: 'No Aplica (no es sólido)',
    },
    {
      codigo: '99',
      descripcion:
        'no hay información en la historia clínica de estadificación prequirúrgica. Para cánceres ginecológicos se permite usar la clasificación FIGO.',
    },
  ],
  MAMAHER2PRETRAT: [
    {
      codigo: '1',
      descripcion: 'Sí se le realizó',
    },
    {
      codigo: '2',
      descripcion: 'No se le realizó',
    },
    {
      codigo: '98',
      descripcion: 'No aplica (no es cáncer de mama)',
    },
    {
      codigo: '99',
      descripcion: 'Sin información',
    },
  ],
  MAMARESHER2: [
    {
      codigo: '1',
      descripcion: 'Positiva (3+)',
    },
    {
      codigo: '2',
      descripcion: 'Negativa (0, 1+, 2+)',
    },
    {
      codigo: '98',
      descripcion: 'No aplica',
    },
    {
      codigo: '99',
      descripcion: 'Solicitada sin información',
    },
  ],
  COLESTADDUKES: [
    {
      codigo: '1',
      descripcion: 'A',
    },
    {
      codigo: '2',
      descripcion: 'B',
    },
    {
      codigo: '3',
      descripcion: 'C',
    },
    {
      codigo: '4',
      descripcion: 'D',
    },
    {
      codigo: '98',
      descripcion: 'No aplica',
    },
    {
      codigo: '99',
      descripcion: 'Sin información',
    },
  ],
  LINFESTADIFICACION: [
    {
      codigo: '1',
      descripcion: 'Etapa I',
    },
    {
      codigo: '2',
      descripcion: 'Etapa II',
    },
    {
      codigo: '3',
      descripcion: 'Etapa III',
    },
    {
      codigo: '4',
      descripcion: 'Etapa IV',
    },
    {
      codigo: '98',
      descripcion: 'No aplica',
    },
    {
      codigo: '99',
      descripcion: 'Sin información',
    },
  ],
  PROSTESCALAGLEASON: [
    {
      codigo: '2',
      descripcion: 'Gleason 2',
    },
    {
      codigo: '3',
      descripcion: 'Gleason 3',
    },
    {
      codigo: '4',
      descripcion: 'Gleason 4',
    },
    {
      codigo: '5',
      descripcion: 'Gleason 5',
    },
    {
      codigo: '6',
      descripcion: 'Gleason 6',
    },
    {
      codigo: '7',
      descripcion: 'Gleason 7',
    },
    {
      codigo: '8',
      descripcion: 'Gleason 8',
    },
    {
      codigo: '9',
      descripcion: 'Gleason 9',
    },
    {
      codigo: '10',
      descripcion: 'Gleason 10',
    },
    {
      codigo: '98',
      descripcion: 'No aplica',
    },
    {
      codigo: '99',
      descripcion: 'Sin información',
    },
  ],
  PEDCLASIFRIESGO: [
    {
      codigo: '1',
      descripcion: 'Estándar/bajo/favorable',
    },
    {
      codigo: '2',
      descripcion: 'Bajo intermedio',
    },
    {
      codigo: '3',
      descripcion: 'Intermedio',
    },
    {
      codigo: '4',
      descripcion: 'Alto intermedio',
    },
    {
      codigo: '5',
      descripcion: 'Alto/desfavorable',
    },
    {
      codigo: '6',
      descripcion: 'Favorable temprano',
    },
    {
      codigo: '7',
      descripcion: 'Desfavorable temprano',
    },
    {
      codigo: '8',
      descripcion: 'Favorable avanzado',
    },
    {
      codigo: '9',
      descripcion: 'Desfavorable avanzado',
    },
    {
      codigo: '10',
      descripcion: 'R1',
    },
    {
      codigo: '11',
      descripcion: 'R2',
    },
    {
      codigo: '12',
      descripcion: 'R3',
    },
    {
      codigo: '13',
      descripcion: 'R4',
    },
    {
      codigo: '97',
      descripcion: 'Otro',
    },
    {
      codigo: '98',
      descripcion: 'No aplica',
    },
    {
      codigo: '99',
      descripcion: 'Desconocido',
    },
  ],
  OBJTRATINICIAL: [
    {
      codigo: '1',
      descripcion: 'Curación',
    },
    {
      codigo: '2',
      descripcion: 'Paliación exclusivamente',
    },
    {
      codigo: '99',
      descripcion: 'Sin información',
    },
  ],
  OBJINTERVPERIODO: [
    {
      codigo: '1',
      descripcion: 'Observación previa a tratamiento',
    },
    {
      codigo: '2',
      descripcion: 'Ofrecer tratamiento curativo o paliativo',
    },
    {
      codigo: '3',
      descripcion: 'Observación/seguimiento posterior',
    },
    {
      codigo: '4',
      descripcion: 'Combinación 1 y 2',
    },
    {
      codigo: '5',
      descripcion: 'Combinación 2 y 3',
    },
    {
      codigo: '6',
      descripcion: 'Combinación 1, 2 y 3',
    },
    {
      codigo: '99',
      descripcion: 'Desconocido',
    },
  ],
  ANTOTROCANCER: [
    {
      codigo: '1',
      descripcion: 'Sí',
    },
    {
      codigo: '2',
      descripcion: 'No',
    },
    {
      codigo: '99',
      descripcion: 'Desconocido',
    },
  ],
  QUIRECIBIOCORTE: [
    {
      codigo: '1',
      descripcion: 'Sí recibió',
    },
    {
      codigo: '2',
      descripcion: 'No recibió',
    },
    {
      codigo: '98',
      descripcion: 'No aplica',
    },
    {
      codigo: '99',
      descripcion: 'Desconocido',
    },
  ],
  QUIFASPREFASE: [
    {
      codigo: '1',
      descripcion: 'Sí recibió',
    },
    {
      codigo: '2',
      descripcion: 'No recibió',
    },
    {
      codigo: '97',
      descripcion: 'No aplica',
    },
    {
      codigo: '99',
      descripcion: 'Desconocido',
    },
  ],
  QUIFASINDUCCION: [
    {
      codigo: '1',
      descripcion: 'Sí recibió',
    },
    {
      codigo: '2',
      descripcion: 'No recibió',
    },
    {
      codigo: '97',
      descripcion: 'No aplica',
    },
    {
      codigo: '99',
      descripcion: 'Desconocido',
    },
  ],
  QUIFASINTENSIF: [
    {
      codigo: '1',
      descripcion: 'Sí recibió',
    },
    {
      codigo: '2',
      descripcion: 'No recibió',
    },
    {
      codigo: '97',
      descripcion: 'No aplica',
    },
    {
      codigo: '99',
      descripcion: 'Desconocido',
    },
  ],
  QUIFASCONSOLID: [
    {
      codigo: '1',
      descripcion: 'Sí recibió',
    },
    {
      codigo: '2',
      descripcion: 'No recibió',
    },
    {
      codigo: '97',
      descripcion: 'No aplica',
    },
    {
      codigo: '99',
      descripcion: 'Desconocido',
    },
  ],
  QUIFASREINDUCC: [
    {
      codigo: '1',
      descripcion: 'Sí recibió',
    },
    {
      codigo: '2',
      descripcion: 'No recibió',
    },
    {
      codigo: '97',
      descripcion: 'No aplica',
    },
    {
      codigo: '99',
      descripcion: 'Desconocido',
    },
  ],
  QUIFASMANTENIM: [
    {
      codigo: '1',
      descripcion: 'Sí recibió',
    },
    {
      codigo: '2',
      descripcion: 'No recibió',
    },
    {
      codigo: '97',
      descripcion: 'No aplica',
    },
    {
      codigo: '99',
      descripcion: 'Desconocido',
    },
  ],
  QUIFASMANTLARGO: [
    {
      codigo: '1',
      descripcion: 'Sí recibió',
    },
    {
      codigo: '2',
      descripcion: 'No recibió',
    },
    {
      codigo: '97',
      descripcion: 'No aplica',
    },
    {
      codigo: '99',
      descripcion: 'Desconocido',
    },
  ],
  QUIFASOTRA: [
    {
      codigo: '1',
      descripcion: 'Sí recibió',
    },
    {
      codigo: '2',
      descripcion: 'No recibió',
    },
    {
      codigo: '97',
      descripcion: 'No aplica',
    },
    {
      codigo: '99',
      descripcion: 'Desconocido',
    },
  ],
  QUIUBITEMP1CICLO: [
    {
      codigo: '1',
      descripcion: 'Neoadyuvancia',
    },
    {
      codigo: '2',
      descripcion: 'Tratamiento inicial curativo sin cirugía',
    },
    {
      codigo: '3',
      descripcion: 'Adyuvancia',
    },
    {
      codigo: '4',
      descripcion: 'Paliativo inicial',
    },
    {
      codigo: '5',
      descripcion: 'Curativo 1a recaída',
    },
    {
      codigo: '6',
      descripcion: 'Paliativo 1a recaída',
    },
    {
      codigo: '7',
      descripcion: 'Curativo 2a recaída',
    },
    {
      codigo: '8',
      descripcion: 'Paliativo 2a recaída',
    },
    {
      codigo: '9',
      descripcion: 'Curativo 3a+ recaída',
    },
    {
      codigo: '10',
      descripcion: 'Paliativo 3a+ recaída',
    },
    {
      codigo: '98',
      descripcion: 'No aplica',
    },
    {
      codigo: '99',
      descripcion: 'Sin información',
    },
  ],
  QUIRECIBIOINTRATECAL: [
    {
      codigo: '1',
      descripcion: 'Sí recibió',
    },
    {
      codigo: '2',
      descripcion: 'No recibió',
    },
    {
      codigo: '98',
      descripcion: 'No aplica',
    },
    {
      codigo: '99',
      descripcion: 'Desconocido',
    },
  ],
  QUICARACACTUAL1CICLO: [
    {
      codigo: '1',
      descripcion: 'Finalizado completo',
    },
    {
      codigo: '2',
      descripcion: 'Finalizado incompleto',
    },
    {
      codigo: '3',
      descripcion: 'No finalizado (en tratamiento)',
    },
    {
      codigo: '98',
      descripcion: 'No aplica',
    },
    {
      codigo: '99',
      descripcion: 'Desconocido',
    },
  ],
  QUIMOTFINPREM1CICLO: [
    {
      codigo: '1',
      descripcion: 'Toxicidad',
    },
    {
      codigo: '2',
      descripcion: 'Otros motivos médicos',
    },
    {
      codigo: '3',
      descripcion: 'Muerte',
    },
    {
      codigo: '4',
      descripcion: 'Cambio EPS',
    },
    {
      codigo: '5',
      descripcion: 'Decisión usuario',
    },
    {
      codigo: '6',
      descripcion: 'Falta disponibilidad medicamentos',
    },
    {
      codigo: '7',
      descripcion: 'Otros motivos administrativos',
    },
    {
      codigo: '8',
      descripcion: 'Otras causas',
    },
    {
      codigo: '98',
      descripcion: 'No aplica',
    },
    {
      codigo: '99',
      descripcion: 'Desconocido',
    },
  ],
  QUIUBITEMPULTCICLO: [
    {
      codigo: '1',
      descripcion: 'Neoadyuvancia',
    },
    {
      codigo: '2',
      descripcion: 'Tratamiento inicial curativo sin cirugía',
    },
    {
      codigo: '3',
      descripcion: 'Adyuvancia',
    },
    {
      codigo: '4',
      descripcion: 'Paliativo inicial',
    },
    {
      codigo: '5',
      descripcion: 'Curativo 1a recaída',
    },
    {
      codigo: '6',
      descripcion: 'Paliativo 1a recaída',
    },
    {
      codigo: '7',
      descripcion: 'Curativo 2a recaída',
    },
    {
      codigo: '8',
      descripcion: 'Paliativo 2a recaída',
    },
    {
      codigo: '9',
      descripcion: 'Curativo 3a+ recaída',
    },
    {
      codigo: '10',
      descripcion: 'Paliativo 3a+ recaída',
    },
    {
      codigo: '97',
      descripcion: 'No aplica (solo 1 ciclo)',
    },
    {
      codigo: '98',
      descripcion: 'No aplica',
    },
    {
      codigo: '99',
      descripcion: 'Sin información',
    },
  ],
  QUIRECIBIOINTRATECALULT: [
    {
      codigo: '1',
      descripcion: 'Sí recibió',
    },
    {
      codigo: '2',
      descripcion: 'No recibió',
    },
    {
      codigo: '98',
      descripcion: 'No aplica',
    },
    {
      codigo: '99',
      descripcion: 'Desconocido',
    },
  ],
  QUICARACACTUALULTCICLO: [
    {
      codigo: '1',
      descripcion: 'Finalizado completo',
    },
    {
      codigo: '2',
      descripcion: 'Finalizado incompleto',
    },
    {
      codigo: '3',
      descripcion: 'No finalizado',
    },
    {
      codigo: '98',
      descripcion: 'No aplica',
    },
    {
      codigo: '99',
      descripcion: 'Desconocido',
    },
  ],
  QUIMOTFINPREMULTCICLO: [
    {
      codigo: '1',
      descripcion: 'Toxicidad',
    },
    {
      codigo: '2',
      descripcion: 'Otros médicos',
    },
    {
      codigo: '3',
      descripcion: 'Muerte',
    },
    {
      codigo: '4',
      descripcion: 'Cambio EPS',
    },
    {
      codigo: '5',
      descripcion: 'Decisión usuario',
    },
    {
      codigo: '6',
      descripcion: 'Falta disponibilidad',
    },
    {
      codigo: '7',
      descripcion: 'Administrativo',
    },
    {
      codigo: '8',
      descripcion: 'Otras causas',
    },
    {
      codigo: '98',
      descripcion: 'No aplica',
    },
    {
      codigo: '99',
      descripcion: 'Desconocido',
    },
  ],
  CIRSOMETIDOCORTE: [
    {
      codigo: '1',
      descripcion: 'Sí recibió al menos una',
    },
    {
      codigo: '2',
      descripcion: 'No recibió cirugía',
    },
    {
      codigo: '3',
      descripcion: 'No recibió pero está programada',
    },
  ],
  CIRUBITEMP1RA: [
    {
      codigo: '1',
      descripcion: 'Manejo inicial',
    },
    {
      codigo: '2',
      descripcion: 'Manejo 1a recaída',
    },
    {
      codigo: '3',
      descripcion: 'Manejo 2a recaída',
    },
    {
      codigo: '4',
      descripcion: 'Manejo 3a+ recaída',
    },
    {
      codigo: '98',
      descripcion: 'No aplica',
    },
    {
      codigo: '99',
      descripcion: 'Desconocido',
    },
  ],
  CIRMOTULTCIRUGIA: [
    {
      codigo: '1',
      descripcion: 'Complementar tratamiento',
    },
    {
      codigo: '2',
      descripcion: 'Complicaciones 1a cirugía',
    },
    {
      codigo: '3',
      descripcion: 'Otras complicaciones médicas',
    },
    {
      codigo: '4',
      descripcion: '1 y 2',
    },
    {
      codigo: '5',
      descripcion: '1 y 3',
    },
    {
      codigo: '6',
      descripcion: '2 y 3',
    },
    {
      codigo: '7',
      descripcion: '1, 2 y 3',
    },
    {
      codigo: '98',
      descripcion: 'No aplica',
    },
    {
      codigo: '99',
      descripcion: 'Desconocido',
    },
  ],
  CIRUBITEMPULT: [
    {
      codigo: '1',
      descripcion: 'Manejo inicial',
    },
    {
      codigo: '2',
      descripcion: 'Manejo 1a recaída',
    },
    {
      codigo: '3',
      descripcion: 'Manejo 2a recaída',
    },
    {
      codigo: '4',
      descripcion: 'Manejo 3a+ recaída',
    },
    {
      codigo: '98',
      descripcion: 'No aplica',
    },
    {
      codigo: '99',
      descripcion: 'Desconocido',
    },
  ],
  CIRESTADOVITALULT: [
    {
      codigo: '1',
      descripcion: 'Vivo',
    },
    {
      codigo: '2',
      descripcion: 'Fallece',
    },
  ],
  RADRECIBIOCORTE: [
    {
      codigo: '1',
      descripcion: 'Sí',
    },
    {
      codigo: '2',
      descripcion: 'No',
    },
    {
      codigo: '98',
      descripcion: 'No aplica',
    },
    {
      codigo: '99',
      descripcion: 'Desconocido',
    },
  ],
  RADUBITEMP1ESQ: [
    {
      codigo: '1',
      descripcion: 'Neoadyuvancia',
    },
    {
      codigo: '2',
      descripcion: 'Tratamiento inicial curativo sin cirugía',
    },
    {
      codigo: '3',
      descripcion: 'Adyuvancia',
    },
    {
      codigo: '4',
      descripcion: 'Paliativo inicial',
    },
    {
      codigo: '5',
      descripcion: 'Curativo 1a recaída',
    },
    {
      codigo: '6',
      descripcion: 'Paliativo 1a recaída',
    },
    {
      codigo: '7',
      descripcion: 'Curativo 2a recaída',
    },
    {
      codigo: '8',
      descripcion: 'Paliativo 2a recaída',
    },
    {
      codigo: '9',
      descripcion: 'Curativo 3a+ recaída',
    },
    {
      codigo: '10',
      descripcion: 'Paliativo 3a+ recaída',
    },
    {
      codigo: '98',
      descripcion: 'No aplica',
    },
    {
      codigo: '99',
      descripcion: 'Sin información',
    },
  ],
  RADTIPRADIO1ESQ: [
    {
      codigo: '1',
      descripcion: 'Externa',
    },
    {
      codigo: '2',
      descripcion: 'Interna (braquiterapia)',
    },
    {
      codigo: '3',
      descripcion: 'Profiláctica',
    },
    {
      codigo: '4',
      descripcion: '1 y 2',
    },
    {
      codigo: '5',
      descripcion: '1 y 3',
    },
    {
      codigo: '6',
      descripcion: '2 y 3',
    },
    {
      codigo: '7',
      descripcion: '1, 2 y 3',
    },
    {
      codigo: '98',
      descripcion: 'No aplica',
    },
  ],
  RADCARACACTUAL1ESQ: [
    {
      codigo: '1',
      descripcion: 'Finalizado completo',
    },
    {
      codigo: '2',
      descripcion: 'Finalizado incompleto',
    },
    {
      codigo: '3',
      descripcion: 'No finalizado',
    },
    {
      codigo: '98',
      descripcion: 'No aplica',
    },
    {
      codigo: '99',
      descripcion: 'Desconocido',
    },
  ],
  RADMOTFIN1ESQ: [
    {
      codigo: '1',
      descripcion: 'Toxicidad',
    },
    {
      codigo: '2',
      descripcion: 'Otros médicos',
    },
    {
      codigo: '3',
      descripcion: 'Muerte',
    },
    {
      codigo: '4',
      descripcion: 'Cambio EPS',
    },
    {
      codigo: '5',
      descripcion: 'Decisión usuario',
    },
    {
      codigo: '6',
      descripcion: 'Administrativos',
    },
    {
      codigo: '7',
      descripcion: 'Otras causas',
    },
    {
      codigo: '98',
      descripcion: 'No aplica',
    },
    {
      codigo: '99',
      descripcion: 'Desconocido',
    },
  ],
  RADUBITEMPULTESQ: [
    {
      codigo: '1',
      descripcion: 'Neoadyuvancia',
    },
    {
      codigo: '2',
      descripcion: 'Tratamiento inicial curativo sin cirugía',
    },
    {
      codigo: '3',
      descripcion: 'Adyuvancia',
    },
    {
      codigo: '4',
      descripcion: 'Paliativo inicial',
    },
    {
      codigo: '5',
      descripcion: 'Curativo 1a recaída',
    },
    {
      codigo: '6',
      descripcion: 'Paliativo 1a recaída',
    },
    {
      codigo: '7',
      descripcion: 'Curativo 2a recaída',
    },
    {
      codigo: '8',
      descripcion: 'Paliativo 2a recaída',
    },
    {
      codigo: '9',
      descripcion: 'Curativo 3a+ recaída',
    },
    {
      codigo: '10',
      descripcion: 'Paliativo 3a+ recaída',
    },
    {
      codigo: '99',
      descripcion: 'Sin información',
    },
  ],
  RADTIPRADIOULTESQ: [
    {
      codigo: '1',
      descripcion: 'Externa',
    },
    {
      codigo: '2',
      descripcion: 'Interna',
    },
    {
      codigo: '3',
      descripcion: 'Profiláctica',
    },
    {
      codigo: '4',
      descripcion: '1 y 2',
    },
    {
      codigo: '5',
      descripcion: '1 y 3',
    },
    {
      codigo: '6',
      descripcion: '2 y 3',
    },
    {
      codigo: '7',
      descripcion: '1, 2 y 3',
    },
    {
      codigo: '98',
      descripcion: 'No aplica',
    },
  ],
  RADCARACACTUALULTESQ: [
    {
      codigo: '1',
      descripcion: 'Finalizado completo',
    },
    {
      codigo: '2',
      descripcion: 'Finalizado incompleto',
    },
    {
      codigo: '3',
      descripcion: 'No finalizado',
    },
    {
      codigo: '98',
      descripcion: 'No aplica',
    },
    {
      codigo: '99',
      descripcion: 'Desconocido',
    },
  ],
  RADMOTFINULTESQ: [
    {
      codigo: '1',
      descripcion: 'Toxicidad',
    },
    {
      codigo: '2',
      descripcion: 'Otros médicos',
    },
    {
      codigo: '3',
      descripcion: 'Muerte',
    },
    {
      codigo: '4',
      descripcion: 'Cambio EPS',
    },
    {
      codigo: '5',
      descripcion: 'Decisión usuario',
    },
    {
      codigo: '6',
      descripcion: 'Administrativos',
    },
    {
      codigo: '7',
      descripcion: 'Otras causas',
    },
    {
      codigo: '98',
      descripcion: 'No aplica',
    },
    {
      codigo: '99',
      descripcion: 'Desconocido',
    },
  ],
  TRARECIBIOCORTE: [
    {
      codigo: '1',
      descripcion: 'Sí',
    },
    {
      codigo: '2',
      descripcion: 'No',
    },
    {
      codigo: '98',
      descripcion: 'No aplica',
    },
    {
      codigo: '99',
      descripcion: 'Desconocido',
    },
  ],
  TRATIPO: [
    {
      codigo: '1',
      descripcion: 'Autólogo',
    },
    {
      codigo: '2',
      descripcion: 'Alogénico donante idéntico relacionado',
    },
    {
      codigo: '3',
      descripcion: 'Alogénico donante no idéntico relacionado',
    },
    {
      codigo: '4',
      descripcion: 'Alogénico donante idéntico no relacionado',
    },
    {
      codigo: '5',
      descripcion: 'Alogénico donante no idéntico no relacionado',
    },
    {
      codigo: '6',
      descripcion: 'Alogénico cordón idéntico familiar',
    },
    {
      codigo: '7',
      descripcion: 'Alogénico cordón idéntico no familiar',
    },
    {
      codigo: '8',
      descripcion: 'Alogénico cordón no idéntico no familiar',
    },
    {
      codigo: '9',
      descripcion: 'Alogénico dos unidades cordón',
    },
    {
      codigo: '98',
      descripcion: 'No aplica',
    },
    {
      codigo: '99',
      descripcion: 'Desconocido',
    },
  ],
  TRAUBITEMPORAL: [
    {
      codigo: '1',
      descripcion: 'Manejo inicial curativo',
    },
    {
      codigo: '2',
      descripcion: 'Manejo 1a recaída',
    },
    {
      codigo: '3',
      descripcion: 'Manejo 2a+ recaída',
    },
    {
      codigo: '98',
      descripcion: 'No aplica',
    },
    {
      codigo: '99',
      descripcion: 'Desconocido',
    },
  ],
  TRCRECIBIOCIRRECONS: [
    {
      codigo: '1',
      descripcion: 'Sí recibió',
    },
    {
      codigo: '2',
      descripcion: 'No recibió',
    },
    {
      codigo: '98',
      descripcion: 'No aplica',
    },
  ],
  TRCVALCUIDADOPALIATIVO: [
    {
      codigo: '1',
      descripcion: 'Sí recibió',
    },
    {
      codigo: '2',
      descripcion: 'No recibió (no propuesto)',
    },
    {
      codigo: '3',
      descripcion: 'No recibió (propuesto no administrado)',
    },
    {
      codigo: '99',
      descripcion: 'Sin información',
    },
  ],
  TRCVALPSIQUIATRIA: [
    {
      codigo: '1',
      descripcion: 'Sí',
    },
    {
      codigo: '2',
      descripcion: 'No',
    },
    {
      codigo: '98',
      descripcion: 'No aplica (no ordenado)',
    },
    {
      codigo: '99',
      descripcion: 'Sin información',
    },
  ],
  TRCVALNUTRICION: [
    {
      codigo: '1',
      descripcion: 'Sí',
    },
    {
      codigo: '2',
      descripcion: 'No',
    },
    {
      codigo: '98',
      descripcion: 'No aplica (no ordenado)',
    },
    {
      codigo: '99',
      descripcion: 'Sin información',
    },
  ],
  TRCRECIBIOSOPORTENUTRI: [
    {
      codigo: '1',
      descripcion: 'Sí enteral',
    },
    {
      codigo: '2',
      descripcion: 'Sí parenteral',
    },
    {
      codigo: '3',
      descripcion: 'Sí enteral y parenteral',
    },
    {
      codigo: '4',
      descripcion: 'No',
    },
    {
      codigo: '99',
      descripcion: 'Sin información',
    },
  ],
  TRCRECIBIOTERAPIASREHAB: [
    {
      codigo: '1',
      descripcion: 'Terapia física',
    },
    {
      codigo: '2',
      descripcion: 'Terapia de lenguaje',
    },
    {
      codigo: '3',
      descripcion: 'Terapia ocupacional',
    },
    {
      codigo: '4',
      descripcion: 'No',
    },
    {
      codigo: '5',
      descripcion: '1 y 2',
    },
    {
      codigo: '6',
      descripcion: '1 y 3',
    },
    {
      codigo: '7',
      descripcion: '2 y 3',
    },
    {
      codigo: '8',
      descripcion: '1, 2 y 3',
    },
    {
      codigo: '98',
      descripcion: 'No aplica',
    },
    {
      codigo: '99',
      descripcion: 'Sin información',
    },
  ],
  IDETIPOTRATAMIENTO: [
    {
      codigo: '1',
      descripcion: 'Radioterapia',
    },
    {
      codigo: '2',
      descripcion: 'Terapia sistémica',
    },
    {
      codigo: '3',
      descripcion: 'Cirugía',
    },
    {
      codigo: '4',
      descripcion: '1 y 2',
    },
    {
      codigo: '5',
      descripcion: '1 y 3',
    },
    {
      codigo: '6',
      descripcion: '2 y 3',
    },
    {
      codigo: '7',
      descripcion: 'Manejo expectante',
    },
    {
      codigo: '8',
      descripcion: 'En seguimiento post-tratamiento',
    },
    {
      codigo: '9',
      descripcion: 'Alta de tratamiento',
    },
    {
      codigo: '98',
      descripcion: 'No aplica',
    },
  ],
  RMORESMANEJOONCO: [
    {
      codigo: '1',
      descripcion: 'Curación',
    },
    {
      codigo: '2',
      descripcion: 'Progresión',
    },
    {
      codigo: '3',
      descripcion: 'Remisión parcial',
    },
    {
      codigo: '4',
      descripcion: 'Remisión completa',
    },
    {
      codigo: '5',
      descripcion: 'Sin cambios (estable)',
    },
    {
      codigo: '6',
      descripcion: 'Abandono',
    },
    {
      codigo: '97',
      descripcion: 'No aplicable (aún en tratamiento inicial)',
    },
    {
      codigo: '98',
      descripcion: 'No aplicable (aún en tratamiento recaída)',
    },
    {
      codigo: '99',
      descripcion: 'Desconocido',
    },
  ],
  RMOESTADOVITAL: [
    {
      codigo: '1',
      descripcion: 'Vivo',
    },
    {
      codigo: '2',
      descripcion: 'Muerte relacionada al cáncer',
    },
    {
      codigo: '3',
      descripcion: 'Muerte por otras causas',
    },
    {
      codigo: '99',
      descripcion: 'Desconocido',
    },
  ],
  RMONOVADMINISTRATIVA: [
    {
      codigo: '0',
      descripcion: 'Sin novedad',
    },
    {
      codigo: '1',
      descripcion: 'Ingresó a EPS con cáncer',
    },
    {
      codigo: '2',
      descripcion: 'Antiguo EPS con nuevo dx cáncer',
    },
    {
      codigo: '3',
      descripcion: 'Antiguo EPS y dx no incluido previo',
    },
    {
      codigo: '4',
      descripcion: 'Falleció',
    },
    {
      codigo: '5',
      descripcion: 'Desafilió',
    },
    {
      codigo: '6',
      descripcion: 'Eliminar por auditoría',
    },
    {
      codigo: '7',
      descripcion: 'Alta voluntaria',
    },
    {
      codigo: '8',
      descripcion: 'Cambio tipo/número ID',
    },
    {
      codigo: '9',
      descripcion: 'Abandonó e imposible ubicar',
    },
    {
      codigo: '10',
      descripcion: 'Fallecido no incluido en reporte previo',
    },
    {
      codigo: '11',
      descripcion: 'Trasladado de IPS',
    },
    {
      codigo: '12',
      descripcion: 'Notificado con dos cánceres',
    },
  ],
  RMONOVCLINICA: [
    {
      codigo: '1',
      descripcion: 'Manejo inicial curativo',
    },
    {
      codigo: '2',
      descripcion: 'Manejo inicial paliativo',
    },
    {
      codigo: '3',
      descripcion: 'Finalizó tratamiento e/seguimiento remisión',
    },
    {
      codigo: '4',
      descripcion: 'Recaída en manejo curativo',
    },
    {
      codigo: '5',
      descripcion: 'Recaída en manejo paliativo',
    },
    {
      codigo: '6',
      descripcion: 'Finalizó tratamiento inicial y seguimiento remisión',
    },
    {
      codigo: '7',
      descripcion: 'Otra',
    },
  ],
};
