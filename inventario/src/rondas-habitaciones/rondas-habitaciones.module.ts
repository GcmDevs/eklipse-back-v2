import { Module } from '@nestjs/common';
import { RondasHabitacionesController } from './presentation/controllers/rondas-habitaciones.controller';
import { RondasHabitacionesService } from './infrastructure/services/rondas-habitaciones.service';
@Module({ controllers: [RondasHabitacionesController], providers: [RondasHabitacionesService] })
export class RondasHabitacionesModule {}
