import { CommonGuards } from '@common/presentation/decorators';
import { BadRequestException, Body, Controller, Post, Put } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { RecepcionTecnicaCrudSource } from '@inn/farmacia/infrastructure/repositories';
import { CreateRTCDto } from '../dtos';

@ApiTags('V1 - Productos (Recepción tecnica)')
@CommonGuards()
@Controller('v1/pdts/rtc')
export class RecepcionTecnicaCrudController {
  constructor(private _rtcCrud: RecepcionTecnicaCrudSource) {}

  @Post()
  public create(@Body() body: CreateRTCDto) {
    try {
      return this._rtcCrud.create(body);
    } catch (error) {
      throw new BadRequestException(error.message);
    }
  }

  @Put()
  public update(@Body() body: CreateRTCDto) {
    try {
      return this._rtcCrud.update(body);
    } catch (error) {
      throw new BadRequestException(error.message);
    }
  }
}
