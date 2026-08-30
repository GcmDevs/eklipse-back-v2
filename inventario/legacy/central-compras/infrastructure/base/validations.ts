import { INN_AUTHORITIES } from '@inn/authorities';
import { CtcPermisosRes } from '../responses';

const auths = INN_AUTHORITIES.CENTRAL_COMPRAS;

export const centralComprasValidations = (userCodeAuthorities: string[]): CtcPermisosRes => {
  return {
    canSeeAllSolicitudes: _hasAnyAuthority(userCodeAuthorities, [
      auths.VER_TODAS,
      auths.VER_INCL_FORBIDDEN_VALUES,
    ]),
    canSeeSolicitudesWithValues: _hasAnyAuthority(userCodeAuthorities, [
      auths.VER_INCL_FORBIDDEN_VALUES,
      auths.APRO_RECH_GERENTE,
      auths.COTIZAR,
      auths.RECOMENDAR_ITEMS_COTI,
      auths.APRO_RECH_COTI_RECOMEN,
      auths.AGREGAR_OC,
      auths.PROGRAMAR_OC,
      auths.CONTABILIZAR_OC,
      auths.PAGAR_OC,
      auths.CONFIRMAR_OC_EN_COTI,
      auths.CAJA_MENOR_EXPRESS,
    ]),
    canAddSolicitudes: _hasAnyAuthority(userCodeAuthorities, [auths.AGREGAR]),
    canAprobarRechazarSolicitud: _hasAnyAuthority(userCodeAuthorities, [auths.APRO_RECH_GERENTE]),
    canDeleteSolicitudes: _hasAnyAuthority(userCodeAuthorities, [auths.ELIMINAR]),
    canAddCotizaciones: _hasAnyAuthority(userCodeAuthorities, [auths.COTIZAR]),
    canRecomendarItemsCotizados: _hasAnyAuthority(userCodeAuthorities, [
      auths.APRO_RECH_COTI_RECOMEN,
    ]),
    canAprobarRechazarItemsRecomendados: _hasAnyAuthority(userCodeAuthorities, [
      auths.RECOMENDAR_ITEMS_COTI,
    ]),
    canAddOrdenCompra: _hasAnyAuthority(userCodeAuthorities, [auths.AGREGAR_OC]),
    canAprobarRechazarOrdenCompra: _hasAnyAuthority(userCodeAuthorities, [
      auths.CONFIRMAR_OC_EN_COTI,
    ]),
    canProgramarOrdenCompra: _hasAnyAuthority(userCodeAuthorities, [auths.PROGRAMAR_OC]),
    canContabilizarOrdenCompra: _hasAnyAuthority(userCodeAuthorities, [auths.CONTABILIZAR_OC]),
    canPagarOrdenCompra: _hasAnyAuthority(userCodeAuthorities, [auths.PAGAR_OC]),
    canReportarEntregaLista: _hasAnyAuthority(userCodeAuthorities, [auths.REPORTAR_ENTREGA]),
    canManageCajaMenor: _hasAnyAuthority(userCodeAuthorities, [auths.CAJA_MENOR_EXPRESS]),
  };
};

const _hasAnyAuthority = (userAuthorities: string[], requiredAuthorities: string[]): boolean => {
  const hasAnyAuthority = () =>
    userAuthorities.some((authority: string) => requiredAuthorities.includes(authority));
  return hasAnyAuthority();
};
