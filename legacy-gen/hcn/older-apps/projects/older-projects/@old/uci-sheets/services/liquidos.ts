import { groupByKey, GcmGrouped } from '@hcn/old/common/presentation/helpers';

interface LiquidoI {
  hora: number;
  LIQUIDO: string;
  CANTIDAD: number;
  SUBGRUPO: string;
}

export const organizarLiquidos = (data: LiquidoI[]) => {
  const liquidosAgrupados = groupByKey(data, 'LIQUIDO', 'LIQUIDO');

  const resultado: any = [];

  liquidosAgrupados.map((group: GcmGrouped<LiquidoI>) => {
    const liquidosSumados: LiquidoI[] = [];

    group.rows.map((liquido, i) => {
      if (!i) {
        liquidosSumados.push(liquido);
      } else {
        liquidosSumados.map(liquidoSumado => {
          if (liquido.hora === liquidoSumado.hora) {
            liquidoSumado.CANTIDAD = liquidoSumado.CANTIDAD + liquido.CANTIDAD;
          }
          if (!liquidosSumados.filter(i => i.hora === liquido.hora).length) {
            liquidosSumados.push(liquido);
          }
        });
      }
    });

    resultado.push({ liquido: group.name, resultado: liquidosSumados });
  });
  return resultado;
};
