import { BaseApiResponse } from "@common/domain/types";
import { BaseShelteredController } from "@common/presentation/controllers/base-sheltered.controller";
import { ProveedorService } from "@core/terceros/application/services";
import { ProveedorMapper } from "@core/terceros/infrastructure/mappers";
import { Controller, Get, Param, ParseIntPipe, Query } from "@nestjs/common";
import { ResponseProveedorDto } from "../dto";
import { FilterSearchLimitedDto } from "@common/presentation/dto";

@Controller('v4/inn/proveedores')
export class ProveedorController extends BaseShelteredController {
  constructor(private readonly proveedorService: ProveedorService) {
    super();
  }

  @Get('/:id')
  public async getOneById(
    @Param('id', ParseIntPipe) id: number
  ): Promise<BaseApiResponse<ResponseProveedorDto>> {
    const proveedorFound = await this.proveedorService.findById(id);
    return { data: ProveedorMapper.toResponse(proveedorFound) };
  }

  @Get()
  public async findAll(
    @Query() { search, limit }: FilterSearchLimitedDto
  ): Promise<BaseApiResponse<ResponseProveedorDto[]>> {
    const proveedoresFound = await this.proveedorService.findAll(search, limit);
    return { data: proveedoresFound.map(proveedor => ProveedorMapper.toResponse(proveedor)) };
  }
}
