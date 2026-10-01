import { processEnv } from '@env';
import { ResponsableView } from '@orm/cor';
import { ProveedorOrm, TerceroOrm } from '@orm/gen';
import { ResponsableOrm } from '@orm/inn/activos-fijos';
import { ORM_EQPS_ENTITIES } from '@orm/inn/equipos';
import { ORM_MOTOR_FMTS_ENTITIES } from 'apps/motor-formatos/infrastructure';
import { join } from 'path';
import { DataSource, DataSourceOptions } from 'typeorm';

const dataSourceConfig: DataSourceOptions = {
  type: 'mssql',
  host: processEnv.DEV_HOST_DB,
  port: Number(processEnv.DEV_PORT_DB),
  username: processEnv.DEV_USERNAME_DB,
  password: processEnv.DEV_PASS_DB,
  database: processEnv.DEV_NAME_DB,
  options: {
    encrypt: false,
    cryptoCredentialsDetails: {
      minVersion: 'TLSv1',
    },
  },
  extra: {
    trustServerCertificate: true,
  },
  synchronize: false,
  logging: false,
  entities: [
    join(__dirname, '../apps/motor-formatos/infrastructure/persistence/orm/**/*.{ts,js}'),

    // ENTIDADES NECESARIAS PARA MIGRACIONES DE EL MODULO DE MOTOR DE FORMATOS
    ProveedorOrm,
    ResponsableView,
    TerceroOrm,
    ResponsableOrm,
    ...ORM_EQPS_ENTITIES,
    ...ORM_MOTOR_FMTS_ENTITIES,

  ],
  migrations: [join(__dirname, '../database/migrations/*.{ts,js}')],
};

export const appDataSource = new DataSource(dataSourceConfig);
