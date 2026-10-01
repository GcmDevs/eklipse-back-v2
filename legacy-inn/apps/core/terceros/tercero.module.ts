import { Module } from '@nestjs/common';
import { PAIS_REPOSITORY, TERCERO_REPOSITORY } from './application/repositories';
import { COR_TERCEROS_PROVIDERS } from './application';
import { COR_TERCEROS_CONTROLLERS } from './presentation/controllers';
import { TypeOrmPaisRepository, TypeOrmProveedorRepository, TypeOrmResponsableRepository, TypeOrmTerceroRepository } from './infrastructure/persistence';

@Module({
    controllers: [...COR_TERCEROS_CONTROLLERS],
    providers: [...COR_TERCEROS_PROVIDERS,
        TypeOrmProveedorRepository,
        TypeOrmResponsableRepository,
    {
        provide: PAIS_REPOSITORY,
        useClass: TypeOrmPaisRepository,
    },
    {
        provide: TERCERO_REPOSITORY,
        useClass: TypeOrmTerceroRepository,
    }
    ],
    exports: [...COR_TERCEROS_PROVIDERS]
})
export class TercerosModule { }