import { IngresoOrm } from '@sln/orm/adn';
import {
  AgrupadorOrm,
  AgrupadorServicioIpsBasicOrm,
  CheckPointContratoOrm,
  ServicioIpsOrm,
} from '../orm';
import { orderBy } from 'lodash';

export const GENEAutoCompleteServicios = (
  ingreso: IngresoOrm,
  fakeAgrupador: AgrupadorOrm,
  checkPoint: CheckPointContratoOrm,
  agruServs: AgrupadorServicioIpsBasicOrm[]
) => {
  ingreso.hojasProducto.map(p => {
    const fakeServices: ServicioIpsOrm[] = [];
    p.detalle.forEach(d => {
      if (d.servicio) {
        d.servicio.servicioIps.cantidad = d.cantidad;
        d.servicio.servicioIps.valorProducto = d.valorProducto;
        d.servicio.servicioIps.valorEntidad = d.valorEntidad;
        d.servicio.servicioIps.valorPaciente = d.valorPaciente;
        d.servicio.servicioIps.valorTotal = d.cantidad * (d.valorEntidad + d.valorPaciente);

        let agrupador = fakeAgrupador;

        if (checkPoint) {
          const agrupadorFiltered = agruServs.filter(
            agru =>
              agru.tipo === checkPoint.keyAgrupadorServicio &&
              agru.servicioId === d.servicio.servicioIps.id
          );

          if (!agrupadorFiltered.length) agrupador = fakeAgrupador;
          else agrupador = agrupadorFiltered[0].agrupador;
        } else {
          const agrupadorFiltered = agruServs.filter(
            agru => agru.servicioId === d.servicio.servicioIps.id
          );
          if (!agrupadorFiltered.length) agrupador = fakeAgrupador;
          else agrupador = agrupadorFiltered[0].agrupador;
        }

        if (d.servicio.servicioIps.valorTotal === 0 && agrupador.id !== fakeAgrupador.id) {
          agrupador = fakeAgrupador;
        }

        delete d.servicio.servicioIps.agrupadores;

        d.servicio.servicioIps.idAgrupador = agrupador.id;
        d.servicio.servicioIps.pesoAgrupador = agrupador.peso;
        d.servicio.servicioIps.nombreAgrupador = agrupador.nombre;
        ingreso.servicios.push(d.servicio.servicioIps);
      } else {
        const newServicio = new ServicioIpsOrm();
        newServicio.id = d.id;
        newServicio.codigo = 'MEDICAMENTOS';
        newServicio.nombre = d.descripcion;
        newServicio.cantidad = d.cantidad;
        newServicio.valorProducto = d.valorProducto;
        newServicio.valorEntidad = d.valorEntidad;
        newServicio.valorPaciente = d.valorPaciente;
        newServicio.valorTotal = d.cantidad * (d.valorEntidad + d.valorPaciente);
        newServicio.idAgrupador = fakeAgrupador.id;
        newServicio.pesoAgrupador = fakeAgrupador.peso;
        newServicio.nombreAgrupador = fakeAgrupador.nombre;
        fakeServices.push(newServicio);
      }
    });
    ingreso.servicios.push(...fakeServices);
    ingreso.servicios = orderBy(ingreso.servicios, 'pesoAgrupador', 'desc');
  });
  return ingreso;
};
