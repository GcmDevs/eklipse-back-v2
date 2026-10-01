import { FILE_LOCATIONS } from '@common/application/file-locations';

export const FOLDERS = {
  inn: {
    centralCompras: {
      solicitudes: {
        formatos: {
          key: 'inn-ctc-sol-create',
          url: FILE_LOCATIONS.inn.ctc.itemsSolicitud.replace('public/', ''),
        },
        comprobantesPagos: {
          key: 'inn-ctc-sol-pagar-oc',
          url: FILE_LOCATIONS.inn.ctc.comprobantesPago.replace('public/', ''),
        },
      },
    },
  },
};

export const FOLDERS_STRINGS = [
  FOLDERS.inn.centralCompras.solicitudes.formatos.url,
  FOLDERS.inn.centralCompras.solicitudes.comprobantesPagos.url,
];

export const NEW_FOLDER = (folder: string) => {
  if (folder === FOLDERS.inn.centralCompras.solicitudes.formatos.key) {
    return FOLDERS.inn.centralCompras.solicitudes.formatos.url;
  } else if (folder === FOLDERS.inn.centralCompras.solicitudes.comprobantesPagos.key) {
    return FOLDERS.inn.centralCompras.solicitudes.comprobantesPagos.url;
  } else {
    return 'default';
  }
};
