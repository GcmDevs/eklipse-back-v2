import jsPDF from 'jspdf';
import * as fs from 'fs';
import * as path from 'path';
import type { TrasladoPdfPayload } from './traslado-primario.pdf-generator';
import { getFirmaBufferFromCedula } from './traslado-primario.pdf-generator';
import { drawFirmaBlock } from './traslado-secundario.pdf-generator';
import {
  estadoCivilTypeFactory,
  generoTypeFactory,
  tipoDocumentoTypeFactory,
} from '../../@types/gen';
import {
  ACCIDENTE_TRANSITO,
  PRIMARIO,
  AREAS_RECOGIDA_VALUES,
  CLIMAS_VALUES,
  TIPOS_VEHICULO_INVOLUCRADO_VALUES,
  GRUPOS_SANGUINEOS_VALUES,
} from '../../@types/gcn/traslados-asistenciales';

/** Opciones de presentación del formato. Los datos del caso proceden exclusivamente de payload.data. */
export interface OpcionesVictimaAccidentePdf {
  codigoFormato?: string;
  vigenciaFormato?: string;
  versionFormato?: string;
  vistaPrevia?: boolean;
}

type Campo = { etiqueta: string; valor?: unknown; enlace?: string };
// Helvetica estándar no contiene subíndices Unicode. Usar dígitos equivalentes
// antes de medir e imprimir evita que el visor cambie la codificación de la línea.
const textoCompatiblePdf = (valor: string): string =>
  valor
    .replace(/[₀-₉]/g, digito => String(digito.charCodeAt(0) - 0x2080))
    .replace(/[\u00a0\u202f]/g, ' ');
const texto = (valor: unknown): string =>
  valor == null || valor === ''
    ? 'Sin registrar'
    : typeof valor === 'boolean'
      ? valor
        ? 'SÍ'
        : 'NO'
      : textoCompatiblePdf(String(valor));
const fecha = (valor: unknown, soloHora = false): string => {
  if (!valor || Number.isNaN(new Date(String(valor)).getTime())) return 'Sin registrar';
  return new Intl.DateTimeFormat('es-CO', {
    timeZone: 'America/Bogota',
    ...(soloHora ? {} : { year: 'numeric', month: '2-digit', day: '2-digit' }),
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  }).format(new Date(String(valor)));
};
const catalogo = (opciones: { getCode(): number; getForHumans(): string }[], codigo: unknown) =>
  opciones.find(opcion => opcion.getCode() === Number(codigo))?.getForHumans() ?? 'Sin registrar';

/** Formato adicional de víctimas de accidentes. No sustituye los PDF asistenciales existentes. */
export async function generateVictimaAccidentePdf(
  payload: TrasladoPdfPayload,
  opciones: OpcionesVictimaAccidentePdf = {}
): Promise<Buffer | null> {
  if (!payload?.data) return null;
  const data = payload.data;
  if (
    data.tipoCode !== PRIMARIO.getCode() ||
    data.tipoRemisionCode !== ACCIDENTE_TRANSITO.getCode()
  ) {
    throw new Error(
      'El formato de víctimas aplica a traslados primarios por accidente de tránsito'
    );
  }
  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'letter' });
  const W = doc.internal.pageSize.getWidth(),
    H = doc.internal.pageSize.getHeight();
  const M = 12,
    CW = W - 2 * M,
    bottom = H - 15;
  const raiz =
    path.basename(process.cwd()).toLowerCase() === 'hospitalizacion'
      ? path.resolve(process.cwd(), '..')
      : process.cwd();
  const fechaDescarga = fecha(new Date());
  const paginaY = 21;
  const inicioContenido = 43;
  let y = inicioContenido;
  const fuente = (bold = false, size = 9) => {
    doc.setFont('helvetica', bold ? 'bold' : 'normal');
    doc.setFontSize(size);
    doc.setTextColor(0);
  };
  const imagen = (
    archivo: string,
    x: number,
    top: number,
    width: number,
    height: number
  ): boolean => {
    if (!fs.existsSync(archivo)) return false;
    try {
      const bytes = fs.readFileSync(archivo);
      const props = doc.getImageProperties(bytes);
      const scale = Math.min(width / props.width, height / props.height);
      doc.addImage(
        bytes,
        props.fileType,
        x + (width - props.width * scale) / 2,
        top,
        props.width * scale,
        props.height * scale
      );
      return true;
    } catch {
      return false;
    }
  };
  const encabezado = () => {
    const logo = 'medicos.jpeg';
    if (!logo || !imagen(path.join(raiz, 'private', 'clinicas', logo), M, 15, 35, 18)) {
      fuente(true, 9);
      doc.text(payload.clinica.nombre || 'Institución', M, 23, { maxWidth: 35 });
    }
    fuente(true, 11);
    doc.text(['FORMATO DATOS VÍCTIMAS DE', 'ACCIDENTES'], W / 2, 23, { align: 'center' });
    doc.setDrawColor(130);
    doc.setLineWidth(0.2);
    fuente(false, 7.5);
    doc.text(fechaDescarga, W - M - 2, 16, { align: 'right' });
    doc.setDrawColor(0);
    doc.setLineWidth(0.25);
    doc.line(M, inicioContenido - 4, W - M, inicioContenido - 4);
  };
  const pagina = () => {
    doc.addPage();
    y = inicioContenido;
    encabezado();
  };
  const espacio = (height: number) => {
    if (y + height > bottom) pagina();
  };
  encabezado();

  const tabla = (filas: Campo[][], titulo?: string) => {
    let inicio = y;
    let paginaBloque = doc.getNumberOfPages();
    let primera = true;
    const cerrar = () => {
      if (y > inicio) {
        doc.setPage(paginaBloque);
        doc.rect(M, inicio, CW, y - inicio);
      }
    };
    for (const fila of filas) {
      const cellW = CW / fila.length,
        labelW = fila.length === 1 ? 51 : 50;
      const partes = fila.map(campo => {
        fuente(true);
        const label = doc.splitTextToSize(campo.etiqueta, labelW - 3) as string[];
        fuente();
        const value = doc.splitTextToSize(texto(campo.valor), cellW - labelW - 5) as string[];
        return { campo, label, value };
      });
      const alto = Math.max(...partes.map(p => Math.max(p.label.length, p.value.length))) * 3.8 + 3;
      if (y + alto + (primera && titulo ? 8 : 0) > bottom) {
        cerrar();
        pagina();
        inicio = y;
        paginaBloque = doc.getNumberOfPages();
        primera = true;
      }
      if (primera && titulo) {
        fuente(true, 10);
        doc.text(titulo, W / 2, y + 5.2, { align: 'center' });
        y += 8;
      }
      partes.forEach(({ campo, label, value }, i) => {
        const x = M + i * cellW;
        fuente(true);
        doc.text(label, x + 2, y + 4.4);
        fuente();
        if (campo.enlace) {
          doc.setTextColor(0, 65, 190);
          value.forEach((linea, line) =>
            doc.textWithLink(linea, x + labelW, y + 4.4 + line * 3.8, { url: campo.enlace! })
          );
          doc.setTextColor(0);
        } else doc.text(value, x + labelW, y + 4.4);
      });
      y += alto;
      primera = false;
    }
    cerrar();
    y += 3;
  };
  const bloqueTexto = (titulo: string, contenido: string) => {
    fuente();
    const lines = doc.splitTextToSize(
      textoCompatiblePdf(contenido || 'Sin registrar'),
      CW - 5
    ) as string[];
    while (lines.length) {
      espacio(18);
      const capacity = Math.max(1, Math.floor((bottom - y - 9) / 3.8));
      const batch = lines.splice(0, capacity),
        height = 9 + batch.length * 3.8;
      doc.rect(M, y, CW, height);
      fuente(true);
      doc.text(titulo, M + 2, y + 4.5);
      fuente();
      batch.forEach((linea, indice) => {
        doc.text(linea, M + 2, y + 8.5 + indice * 3.8, {
          align: 'left',
          charSpace: 0,
          maxWidth: CW - 5,
        });
      });
      y += height + 3;
      if (lines.length) pagina();
    }
  };
  const p = data.paciente;
  const a = data.accidente;
  const tramos = [...(data.tramos ?? [])].sort((x, z) => x.orden - z.orden || x.id - z.id);
  const inicial = tramos[0];
  const camposPersonales = p?.datosPersonales;
  const civil = camposPersonales?.estadoCivilCode;
  const sexo = p?.generoCode;
  const documento = p?.documento;
  const civilTexto =
    civil == null ? 'Sin registrar' : estadoCivilTypeFactory(civil as any)?.getForHumans();
  const sexoTexto = sexo == null ? 'Sin registrar' : generoTypeFactory(sexo as any)?.getForHumans();
  const docTexto =
    documento?.tipoCode == null ? '' : tipoDocumentoTypeFactory(documento.tipoCode)?.getForHumans();
  tabla([
    [
      { etiqueta: 'Consecutivo:', valor: data.codigo },
      { etiqueta: 'Fecha/hora siniestro:', valor: fecha(inicial?.horaSolicitud) },
    ],
    [
      { etiqueta: 'Nombre víctima:', valor: [p?.nombres, p?.apellidos].filter(Boolean).join(' ') },
      { etiqueta: 'ID:', valor: [docTexto, documento?.numero].filter(Boolean).join(' ') },
    ],
    [
      { etiqueta: 'Estado civil:', valor: civilTexto },
      { etiqueta: 'EPS:', valor: p?.afiliacionContrato?.nombre },
    ],
    [
      { etiqueta: 'Sexo:', valor: sexoTexto },
      {
        etiqueta: 'RH:',
        valor: catalogo(GRUPOS_SANGUINEOS_VALUES, data.ekPaciente?.grupoSanguineoCode),
      },
    ],
    [
      {
        etiqueta: 'Fecha de nacimiento:',
        valor: p?.fechaNacimiento
          ? new Intl.DateTimeFormat('es-CO', {
              timeZone: 'UTC',
              year: 'numeric',
              month: '2-digit',
              day: '2-digit',
            }).format(new Date(p.fechaNacimiento))
          : null,
      },
    ],
    [
      { etiqueta: 'Dir. residencia víctima:', valor: camposPersonales?.direccion },
      { etiqueta: 'Barrio residencia víctima:', valor: camposPersonales?.barrio },
    ],
    [{ etiqueta: 'Celular víctima:', valor: camposPersonales?.celular }],
  ]);
  const lat = a?.latitudOrigen,
    lon = a?.longitudOrigen;
  const coordenadas =
    lat != null &&
    lon != null &&
    Number.isFinite(Number(lat)) &&
    Number.isFinite(Number(lon)) &&
    Math.abs(Number(lat)) <= 90 &&
    Math.abs(Number(lon)) <= 180
      ? String(lat) + ',' + String(lon)
      : null;
  const maps = coordenadas ? 'https://www.google.com/maps?q=' + coordenadas : undefined;
  tabla([
    [
      { etiqueta: 'Dirección siniestro:', valor: inicial?.origen?.direccion },
      { etiqueta: 'Barrio:', valor: a?.barrioOrigen },
    ],
    [
      { etiqueta: 'Coordenadas:', valor: coordenadas },
      {
        etiqueta: 'Google Maps:',
        valor: maps ? 'Ver ubicación en Google Maps' : null,
        enlace: maps,
      },
    ],
    [{ etiqueta: 'Condición víctima:', valor: null }],
  ]);
  const vehiculos = a?.vehiculos ?? [];
  if (!vehiculos.length)
    tabla([[{ etiqueta: 'Vehículos involucrados:', valor: 'Sin vehículos registrados' }]]);
  for (const vehiculo of vehiculos)
    tabla([
      [
        { etiqueta: 'Vehículo involucrado:', valor: true },
        { etiqueta: 'Fuga:', valor: vehiculo.fuga },
      ],
      [
        { etiqueta: 'Placa:', valor: vehiculo.placa },
        {
          etiqueta: 'Tipo vehículo:',
          valor: catalogo(TIPOS_VEHICULO_INVOLUCRADO_VALUES, vehiculo.tipoCode),
        },
      ],
      [
        { etiqueta: 'Marca:', valor: vehiculo.marca },
        { etiqueta: 'Color:', valor: vehiculo.color },
      ],
      [
        { etiqueta: 'Conductor (nombre):', valor: vehiculo.conductor },
        { etiqueta: 'Documento conductor:', valor: vehiculo.documento },
      ],
      [
        { etiqueta: 'Celular conductor:', valor: vehiculo.celular },
        { etiqueta: 'Dir. residencia conductor:', valor: vehiculo.direccion },
      ],
    ]);
  for (const tramo of tramos) {
    const asignaciones = (data.asignaciones ?? []).filter(item => item.tramoId === tramo.id);
    const filasAsignacion: Campo[][] = asignaciones.length
      ? asignaciones.flatMap(asignacion => [
          [
            { etiqueta: 'Asignación registrada:', valor: asignacion.id },
            { etiqueta: 'Fecha asignación:', valor: fecha(asignacion.fechaAsignacion) },
          ],
          [
            { etiqueta: 'Móvil ambulancia:', valor: asignacion.vehiculo?.placa },
            { etiqueta: 'Asignado por:', valor: asignacion.asignadoPor?.nombre },
          ],
          [
            { etiqueta: 'Conductor tripulación:', valor: asignacion.conductor?.nombre },
            { etiqueta: 'Documento conductor:', valor: asignacion.conductor?.documento },
          ],
        ])
      : [[{ etiqueta: 'Asignación del tramo:', valor: null }]];
    tabla(
      [
        ...filasAsignacion,
        [
          { etiqueta: 'Solicitud:', valor: fecha(tramo.horaSolicitud) },
          { etiqueta: 'Despacho:', valor: fecha(tramo.horaDespacho, true) },
        ],
        [
          { etiqueta: 'Llegada ambulancia:', valor: fecha(tramo.horaLlegadaEscena, true) },
          { etiqueta: 'Salida de escena:', valor: fecha(tramo.horaSalidaEscena, true) },
        ],
        [
          { etiqueta: 'Arribo a institución:', valor: fecha(tramo.horaLlegadaInst, true) },
          { etiqueta: 'Recepción:', valor: fecha(tramo.horaRecepcionInst, true) },
        ],
      ],
      'Resumen de tiempos - Tramo ' + tramo.orden
    );
  }

  pagina();
  const relato = [
    'Solicitud CRUE: ' +
      texto(a?.codigoCrue) +
      '. Entidad de despacho: ' +
      texto(a?.entidadDespacho) +
      '.',
    'Ubicación: ' +
      texto(inicial?.origen?.direccion) +
      '. Área: ' +
      catalogo(AREAS_RECOGIDA_VALUES, a?.areaCode) +
      '. Coordenadas: ' +
      texto(coordenadas) +
      '.',
    'Escena segura: ' +
      texto(a?.escenaSegura) +
      '. Clima: ' +
      catalogo(CLIMAS_VALUES, a?.climaCode) +
      '. Estado de vía: ' +
      texto(a?.estadoVia) +
      '. Señalización: ' +
      texto(a?.senalizacion) +
      '.',
    'Queja principal: ' + texto(a?.quejaPrincipal) + '.',
    'Hallazgos clínicos: ' + texto(data.hallazgos) + '.',
    'Diagnóstico principal: ' +
      texto(data.diagnostico?.codigo) +
      ' - ' +
      texto(data.diagnostico?.nombre) +
      '.',
    ...tramos.flatMap(tramo => [
      'Tramo ' +
        tramo.orden +
        ': ' +
        texto(tramo.origen?.nombre) +
        ' a ' +
        texto(tramo.destino?.nombre) +
        '.',
      ...(tramo.signosVitales ?? []).map(
        reg =>
          'Signos vitales (' +
          fecha(reg.fechaRegistro || reg.fechaCreacion) +
          '): ' +
          Object.values(reg.item)
            .filter(Boolean)
            .map(signo => signo.signo.forHumans + ': ' + signo.cantidad)
            .join(', ') +
          '.'
      ),
      ...(tramo.procedimientos ?? []).map(
        proc => 'Procedimiento: ' + texto(proc.codigo) + ' - ' + texto(proc.nombre) + '.'
      ),
      ...(tramo.medicamentos ?? []).map(
        med =>
          'Medicamento: ' +
          texto(med.medicamento?.nombre) +
          '. Dosis: ' +
          texto(med.dosis) +
          '. Vía: ' +
          texto(med.via) +
          '.'
      ),
      ...(tramo.notas ?? []).map(nota => 'Nota: ' + texto(nota.nota)),
    ]),
    'Entrega: ' + texto(a?.relato),
    'Pertenencias entregadas: ' +
      texto(a?.pertenenciasEntregadas) +
      '. Custodia: ' +
      texto(a?.custodia) +
      '. Consentimiento otorgado por: ' +
      texto(a?.consentimientoOtorgadoPor) +
      '.',
    ...(data.observacion ? ['Observación del traslado: ' + data.observacion] : []),
  ].join('\n');
  bloqueTexto('Relato de los hechos', relato);
  const anchoTarjeta = (CW - 4) / 2;
  let hayEvidencias = false;
  for (const tramo of tramos) {
    const archivos = (tramo.archivos ?? []).filter(archivo =>
      archivo.categoria === 'sitio' || archivo.categoria === 'vehiculo'
    );
    if (!archivos.length) continue;
    hayEvidencias = true;
    for (let inicio = 0; inicio < archivos.length; inicio += 2) {
      const tarjetas = archivos.slice(inicio, inicio + 2).map(archivo => {
        fuente(true, 7);
        const nombre = doc.splitTextToSize(
          texto(archivo.descripcion || archivo.nombre), anchoTarjeta - 36
        ) as string[];
        fuente(false, 6);
        const nombreArchivo = doc.splitTextToSize(texto(archivo.nombre), anchoTarjeta - 36) as string[];
        return { archivo, nombre, nombreArchivo };
      });
      const alto = Math.max(30, ...tarjetas.map(t =>
        16 + t.nombre.length * 3 + t.nombreArchivo.length * 2.7
      ));
      espacio(alto + 11);
      fuente(true, 9);
      doc.text('Evidencias - Tramo ' + tramo.orden, M, y + 4);
      fuente(false, 7);
      doc.text(archivos.length + ' archivos', W - M, y + 4, { align: 'right' });
      y += 8;
      tarjetas.forEach(({ archivo, nombre, nombreArchivo }, columna) => {
        const x = M + columna * (anchoTarjeta + 4);
        doc.setDrawColor(218, 228, 235);
        doc.setLineWidth(0.2);
        doc.roundedRect(x, y, anchoTarjeta, alto, 2, 2);
        doc.setFillColor(247, 250, 252);
        doc.roundedRect(x + 2, y + 2, 27, alto - 4, 1, 1, 'F');
        const local = path.join(raiz, 'public/gen/trasl/archivos', path.basename(archivo.nombre));
        if (!imagen(local, x + 3, y + 3, 25, Math.min(24, alto - 6))) {
          fuente(false, 6);
          doc.text(['Vista previa', 'no disponible'], x + 15.5, y + 12, { align: 'center' });
        }
        const textoX = x + 32;
        fuente(true, 7);
        doc.text(nombre, textoX, y + 6, { lineHeightFactor: 1.2 });
        const categoriaY = y + 8 + nombre.length * 3;
        fuente(false, 6.5);
        doc.setFillColor(228, 245, 248);
        doc.roundedRect(textoX, categoriaY - 2.6, 17, 4.7, 1, 1, 'F');
        doc.setTextColor(0, 125, 145);
        doc.text(archivo.categoria === 'sitio' ? 'sitio' : 'vehículo', textoX + 1, categoriaY + 0.5);
        fuente(false, 6);
        doc.setTextColor(112, 128, 150);
        doc.text(nombreArchivo, textoX, categoriaY + 6, { lineHeightFactor: 1.2 });
      });
      doc.setDrawColor(0);
      doc.setTextColor(0);
      y += alto + 4;
    }
  }
  if (!hayEvidencias) bloqueTexto('Evidencias - Fotos del sitio y del vehículo', 'Sin archivos');
  for (const tramo of tramos) {
    const firmas: {
      nombre: string;
      cargo: string;
      buffer: ReturnType<typeof getFirmaBufferFromCedula>;
    }[] = [];
    const asignaciones = (data.asignaciones ?? []).filter(item => item.tramoId === tramo.id);
    const vistos = new Set<string>();
    for (const asignacion of asignaciones) {
      for (const [cargo, persona] of [
        ['Conductor', asignacion.conductor],
        ['Auxiliar', asignacion.auxiliar],
        ['Médico', asignacion.medico],
      ] as const) {
        if (!persona) continue;
        const clave = cargo + ':' + (persona.documento || persona.nombre);
        if (vistos.has(clave)) continue;
        vistos.add(clave);
        firmas.push({
          nombre: texto(persona.nombre),
          cargo: 'Firma ' + cargo,
          buffer: getFirmaBufferFromCedula(persona.documento),
        });
      }
    }
    if (tramo.recibidoPorNombre || tramo.firmaImg) {
      const local = tramo.firmaImg
        ? path.join(raiz, 'public/gen/trasl/firma', path.basename(tramo.firmaImg))
        : null;
      firmas.push({
        nombre: texto(tramo.recibidoPorNombre),
        cargo: 'Firma funcionario receptor',
        buffer: local && fs.existsSync(local)
          ? { buffer: fs.readFileSync(local), ext: /\.png$/i.test(local) ? 'png' : 'jpeg' }
          : null,
      });
    }
    if (!firmas.length) {
      bloqueTexto('Firmas - Tramo ' + tramo.orden, 'Sin registrar');
      continue;
    }
    for (let inicio = 0; inicio < firmas.length;) {
      // Igual que el secundario: máximo tres columnas, equilibrando cuatro en dos filas.
      const restantes = firmas.length - inicio;
      const cantidad = restantes === 4 ? 2 : Math.min(3, restantes);
      const ancho = CW / cantidad;
      fuente(true, 6.5);
      const nombres = firmas.slice(inicio, inicio + cantidad).map(firma =>
        doc.splitTextToSize(textoCompatiblePdf(firma.nombre).toUpperCase(), ancho - 8) as string[]
      );
      const altoFila = 34 + Math.max(...nombres.map(nombre => nombre.length)) * 2.7;
      espacio(7 + altoFila);
      fuente(true, 9);
      doc.text('Firmas - Tramo ' + tramo.orden, M, y + 4);
      y += 7;
      for (let columna = 0; columna < cantidad; columna++) {
        const firma = firmas[inicio + columna];
        const x = M + columna * ancho;
        let cargada = !!firma.buffer;
        try {
          drawFirmaBlock(doc, firma.buffer, '', '', x, y, ancho, 26);
        } catch {
          cargada = false;
          drawFirmaBlock(doc, null, '', '', x, y, ancho, 26);
        }
        fuente(true, 6.5);
        doc.text(nombres[columna], x + ancho / 2, y + 26.5, {
          align: 'center', lineHeightFactor: 1.18,
        });
        fuente(false, 5.5);
        doc.text(firma.cargo.toUpperCase(), x + ancho / 2,
          y + 28 + nombres[columna].length * 2.7, { align: 'center' });
        if (!cargada) {
          fuente(false, 6.5);
          doc.text('Sin registrar', x + ancho / 2, y + 12, { align: 'center' });
        }
      }
      y += altoFila;
      inicio += cantidad;
    }
  }
  if (!tramos.length) bloqueTexto('Firmas', 'Sin registrar');
  tabla([[{ etiqueta: 'Carpeta del caso en Drive:', valor: null }]]);
  const total = doc.getNumberOfPages();
  for (let n = 1; n <= total; n++) {
    doc.setPage(n);
    fuente(false, 7.5);
    doc.text(n + ' de ' + total, W - M - 2, paginaY, { align: 'right' });
    fuente(false, 7);
    doc.setTextColor(100);
    doc.text(
      opciones.vistaPrevia
        ? 'VISTA PREVIA - DATOS FICTICIOS - FORMATO PENDIENTE DE VALIDACIÓN'
        : 'Traslado ' + texto(data.codigo || data.id),
      M,
      H - 8
    );
  }
  return Buffer.from(doc.output('arraybuffer'));
}
