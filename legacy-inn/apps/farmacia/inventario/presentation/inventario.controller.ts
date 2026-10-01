import {
  BadRequestException,
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  Query,
  ParseIntPipe,
} from '@nestjs/common';

import {
  AsignacionConteoImpl,
  EstanteInventarioImpl,
  ProductoEstanteImpl,
  UsuarioConteoImpl,
  ConteoInventarioService,
  ConsultaInventarioService,
  AgregarProductosImpl,
  CerrarConteoImpl,
} from '../infraestructure/services';

import {
  CrearAsignacionConteoDto,
  EstanteInventarioDto,
  ProductoEstanteDto,
  UsuarioConteoDto,
  RegistrarConteoConDetalleDto,
  CambioEstanteDto,
  AdminUpdateConteosDto,
  BuscarExistenciaProductoEstanteDto,
  EditarProductoEstanteDto,
} from '../dto/inventarios.dto';
import { Authorities } from '@common/presentation/decorators';
import { INN_AUTHORITIES } from '@authorities/inventario';
import { ApiBody, ApiOkResponse, ApiOperation, ApiParam, ApiQuery, ApiTags } from '@nestjs/swagger';

@ApiTags('V4 - Inventario farmacia')
@Controller('v4/inventario')
export class InventarioController {
  constructor(
    private readonly asignacionConteoService: AsignacionConteoImpl,
    private readonly estanteService: EstanteInventarioImpl,
    private readonly productoEstanteService: ProductoEstanteImpl,
    private readonly usuarioConteoService: UsuarioConteoImpl,
    private readonly conteoInventarioService: ConteoInventarioService,
    private readonly consultaInventarioService: ConsultaInventarioService,
    private readonly agregarProductosService: AgregarProductosImpl,
    private readonly cerrarConteoService: CerrarConteoImpl
  ) {}

  @Authorities([INN_AUTHORITIES.FARMACIA.INVENTARIO_ADMIN])
  @ApiOperation({ summary: 'Carga productos base al inventario' })
  @ApiOkResponse({ description: 'Productos agregados al inventario.' })
  @Post('agregar-productos')
  agregarProductos() {
    return this.agregarProductosService.agregar();
  }

  // ========================================================================
  //  USUARIOS DE CONTEO
  // ========================================================================
  @Authorities([INN_AUTHORITIES.FARMACIA.INVENTARIO_ADMIN])
  @ApiOperation({ summary: 'Crea un usuario habilitado para conteo' })
  @ApiBody({ type: UsuarioConteoDto })
  @ApiOkResponse({ description: 'Usuario de conteo creado.' })
  @Post('usuarios-conteo')
  crearUsuarioConteo(@Body() dto: UsuarioConteoDto) {
    return this.usuarioConteoService.crearUsuarioConteo(dto);
  }

  @Authorities([
    INN_AUTHORITIES.FARMACIA.INVENTARIO_ADMIN,
    INN_AUTHORITIES.FARMACIA.INVENTARIO_CONTEO,
  ])
  @ApiOperation({ summary: 'Lista mis asignaciones de conteo activas' })
  @ApiOkResponse({ description: 'Asignaciones asociadas al usuario autenticado.' })
  @Get('mis-asignaciones-conteo')
  misAsignaciones() {
    return this.asignacionConteoService.misAsignaciones();
  }

  @Authorities([INN_AUTHORITIES.FARMACIA.INVENTARIO_ADMIN])
  @ApiOperation({ summary: 'Lista usuarios habilitados para conteo' })
  @ApiOkResponse({ description: 'Listado de usuarios de conteo.' })
  @Get('usuarios-conteo')
  listarUsuariosConteo() {
    return this.usuarioConteoService.execute();
  }

  // ========================================================================
  //  ASIGNACIONES DE CONTEO
  // ========================================================================
  @Authorities([INN_AUTHORITIES.FARMACIA.INVENTARIO_ADMIN])
  @ApiOperation({ summary: 'Crea una asignacion de conteo para un estante' })
  @ApiBody({ type: CrearAsignacionConteoDto })
  @ApiOkResponse({ description: 'Asignacion de conteo creada.' })
  @Post('asignacion-conteo')
  crearAsignacion(@Body() dto: CrearAsignacionConteoDto) {
    return this.asignacionConteoService.asignarConteo(dto);
  }

  @Authorities([INN_AUTHORITIES.FARMACIA.INVENTARIO_ADMIN])
  @ApiOperation({ summary: 'Restablece los registros realizados para una asignacion de conteo' })
  @ApiParam({ name: 'asignacionId', type: Number, description: 'Id de la asignacion de conteo.' })
  @ApiOkResponse({ description: 'Conteo restablecido y asignacion reactivada.' })
  @Post('asignacion-conteo/:asignacionId/restablecer')
  restablecerConteo(@Param('asignacionId', ParseIntPipe) asignacionId: number) {
    return this.asignacionConteoService.restablecerConteo(asignacionId);
  }

  @Authorities([
    INN_AUTHORITIES.FARMACIA.INVENTARIO_ADMIN,
    INN_AUTHORITIES.FARMACIA.INVENTARIO_CONTEO,
  ])
  @ApiOperation({ summary: 'Lista asignaciones de conteo' })
  @ApiOkResponse({ description: 'Listado de asignaciones de conteo.' })
  @Get('asignacion-conteo')
  listarAsignaciones() {
    return this.asignacionConteoService.excute();
  }

  @Authorities([INN_AUTHORITIES.FARMACIA.INVENTARIO_ADMIN])
  @ApiOperation({ summary: 'Lista usuarios con asignacion activa' })
  @ApiOkResponse({ description: 'Usuarios que tienen asignaciones activas.' })
  @Get('usuarios-con-asignacion-activa')
  listarUsuariosConAsignacionActiva() {
    return this.asignacionConteoService.listarUsuariosConAsignacionActiva();
  }

  @Authorities([INN_AUTHORITIES.FARMACIA.INVENTARIO_ADMIN])
  @ApiOperation({ summary: 'Busca un usuario por documento' })
  @ApiQuery({
    name: 'documento',
    type: String,
    required: true,
    description: 'Documento del usuario.',
  })
  @ApiOkResponse({ description: 'Usuario encontrado para asignacion.' })
  @Get('asignacion-conteo/buscar-usuario')
  buscarUsuario(@Query('documento') documento: string) {
    return this.asignacionConteoService.buscarUsuario(documento);
  }

  @Authorities([INN_AUTHORITIES.FARMACIA.INVENTARIO_ADMIN])
  @ApiOperation({ summary: 'Busca usuarios por nombre para asignacion' })
  @ApiQuery({
    name: 'nombre',
    type: String,
    required: true,
    description: 'Nombre o patron de busqueda.',
  })
  @ApiOkResponse({ description: 'Usuarios coincidentes con el nombre.' })
  @Get('asignacion-conteo/buscar-usuario-asignacion')
  buscarUsuarioAsignacion(@Query('nombre') nombre: string) {
    return this.asignacionConteoService.buscarUsuarioAsignacion(nombre);
  }

  // ========================================================================
  //  ESTANTES
  // ========================================================================
  @Authorities([INN_AUTHORITIES.FARMACIA.INVENTARIO_ADMIN])
  @ApiOperation({ summary: 'Crea un estante de inventario' })
  @ApiBody({ type: EstanteInventarioDto })
  @ApiOkResponse({ description: 'Estante creado.' })
  @Post('estantes')
  crearEstante(@Body() dto: EstanteInventarioDto) {
    return this.estanteService.crearEstante(dto);
  }
  @Authorities([INN_AUTHORITIES.FARMACIA.INVENTARIO_ADMIN])
  @ApiOperation({ summary: 'Busca la existencia de un producto en un estante' })
  @ApiQuery({
    name: 'estanteId',
    type: Number,
    required: true,
    description: 'Identificador del estante.',
  })
  @ApiQuery({
    name: 'productoId',
    type: Number,
    required: true,
    description: 'Identificador del producto.',
  })
  @ApiOkResponse({ description: 'Existencia del producto en el estante.' })
  @Get('estantes/buscar-existencia-producto')
  buscarExistenciaProductoEstante(
    @Query('estanteId') estanteId: number,
    @Query('productoId') productoId: number
  ) {
    return this.estanteService.buscarExistenciaProductoEstante({ estanteId, productoId });
  }

  @Authorities([
    INN_AUTHORITIES.FARMACIA.INVENTARIO_ADMIN,
    INN_AUTHORITIES.FARMACIA.INVENTARIO_CONTEO,
  ])
  @ApiOperation({ summary: 'Lista estantes de inventario' })
  @ApiOkResponse({ description: 'Listado de estantes.' })
  @Get('estantes')
  listarEstantes() {
    return this.estanteService.excute();
  }

  @Authorities([INN_AUTHORITIES.FARMACIA.INVENTARIO_ADMIN])
  @ApiOperation({ summary: 'Crea estantes desde la carga interna del modulo' })
  @ApiOkResponse({ description: 'Estantes creados desde arreglo interno.' })
  @Post('estantes-array')
  crearEstanteArray() {
    return this.estanteService.crearEstanteArray();
  }

  @Authorities([
    INN_AUTHORITIES.FARMACIA.INVENTARIO_ADMIN,
    INN_AUTHORITIES.FARMACIA.INVENTARIO_CONTEO,
  ])
  @ApiOperation({ summary: 'Obtiene un estante por identificador' })
  @ApiParam({ name: 'id', type: Number, description: 'Identificador del estante.' })
  @ApiOkResponse({ description: 'Detalle del estante.' })
  @Get('estante/:id')
  getEstante(@Param('id', ParseIntPipe) id: number) {
    return this.estanteService.getEstantePorId(id);
  }

  @Authorities([INN_AUTHORITIES.FARMACIA.INVENTARIO_ADMIN])
  @ApiOperation({ summary: 'Busca almacenes por patron' })
  @ApiQuery({ name: 'pattern', type: String, required: false, description: 'Patron de busqueda.' })
  @ApiOkResponse({ description: 'Listado de almacenes coincidentes.' })
  @Get('almacenes')
  buscarAlmacenes(@Query('pattern') pattern = '') {
    return this.estanteService.fetchAlmacenes(pattern ?? '');
  }

  // ========================================================================
  //  PRODUCTO-ESTANTE
  // ========================================================================

  @Authorities([INN_AUTHORITIES.FARMACIA.INVENTARIO_ADMIN])
  @ApiOperation({ summary: 'Asocia un producto a un estante' })
  @ApiBody({ type: ProductoEstanteDto })
  @ApiOkResponse({ description: 'Producto asociado al estante.' })
  @Post('producto-estante')
  crearProductoEstante(@Body() dto: ProductoEstanteDto) {
    return this.productoEstanteService.crearProductoEstante(dto);
  }
  @Authorities([INN_AUTHORITIES.FARMACIA.INVENTARIO_ADMIN])
  @ApiOperation({ summary: 'Edita la informacion de un producto en estante' })
  @ApiBody({ type: EditarProductoEstanteDto })
  @ApiOkResponse({ description: 'Producto-estante actualizado.' })
  @Patch('editar-producto-estante')
  editarProductoEstante(@Body() dto: EditarProductoEstanteDto) {
    return this.productoEstanteService.editarProductoEstante(dto);
  }

  @Authorities([INN_AUTHORITIES.FARMACIA.INVENTARIO_ADMIN])
  @ApiOperation({ summary: 'Desactiva un producto asociado a un estante' })
  @ApiParam({
    name: 'id',
    type: Number,
    description: 'Identificador del registro producto-estante.',
  })
  @ApiOkResponse({ description: 'Producto-estante desactivado.' })
  @Post('delete-producto-estante/:id')
  deleteProducto(@Param('id', ParseIntPipe) id: number) {
    return this.productoEstanteService.desactivarProductoEstante(id);
  }

  @Authorities([INN_AUTHORITIES.FARMACIA.INVENTARIO_ADMIN])
  @ApiOperation({ summary: 'Busca productos por codigo' })
  @ApiQuery({ name: 'codigo', type: String, required: true, description: 'Codigo del producto.' })
  @ApiOkResponse({ description: 'Productos encontrados por codigo.' })
  @Get('buscar-producto')
  buscarProductos(@Query('codigo') codigo: string) {
    return this.productoEstanteService.buscarProductos(codigo);
  }

  @Authorities([INN_AUTHORITIES.FARMACIA.INVENTARIO_ADMIN])
  @ApiOperation({ summary: 'Busca productos por descripcion' })
  @ApiQuery({ name: 'pattern', type: String, required: true, description: 'Texto de busqueda.' })
  @ApiOkResponse({ description: 'Productos encontrados por descripcion.' })
  @Get('buscar-producto-descripcion')
  buscarProductosXdescripcion(@Query('pattern') pattern: string) {
    return this.productoEstanteService.buscarProductosXdescripcion(pattern);
  }

  @Authorities([
    INN_AUTHORITIES.FARMACIA.INVENTARIO_ADMIN,
    INN_AUTHORITIES.FARMACIA.INVENTARIO_CONTEO,
  ])
  @ApiOperation({ summary: 'Lista productos asociados a estantes' })
  @ApiOkResponse({ description: 'Listado de productos por estante.' })
  @Get('producto-estante')
  listarProductosEstante() {
    return this.productoEstanteService.excute();
  }

  @Authorities([INN_AUTHORITIES.FARMACIA.INVENTARIO_ADMIN])
  @ApiOperation({ summary: 'Lista productos duplicados dentro del mismo estante' })
  @ApiOkResponse({ description: 'Grupos de productos duplicados por estante y codigo.' })
  @Get('producto-estante/duplicados')
  listarProductosDuplicadosPorEstante() {
    return this.productoEstanteService.listarProductosDuplicadosPorEstante();
  }

  @Authorities([INN_AUTHORITIES.FARMACIA.INVENTARIO_ADMIN])
  @ApiOperation({ summary: 'Busca un producto asociado a estante por codigo' })
  @ApiQuery({ name: 'codigo', type: String, required: true, description: 'Codigo del producto.' })
  @ApiOkResponse({ description: 'Producto-estante encontrado.' })
  @Get('producto-estante/buscar')
  buscarProducto(@Query('codigo') codigo: string) {
    return this.productoEstanteService.buscarProducto(codigo);
  }

  @Authorities([INN_AUTHORITIES.FARMACIA.INVENTARIO_ADMIN])
  @ApiOperation({ summary: 'Traslada un producto entre estantes' })
  @ApiBody({ type: CambioEstanteDto })
  @ApiOkResponse({ description: 'Cambio de estante registrado.' })
  @Post('producto-estante/cambiar-estante')
  cambiarEstante(@Body() dto: CambioEstanteDto) {
    return this.productoEstanteService.cambiarEstante(dto);
  }

  @Authorities([INN_AUTHORITIES.FARMACIA.INVENTARIO_ADMIN])
  @ApiOperation({ summary: 'Lista cambios de estante de un producto-estante' })
  @ApiParam({
    name: 'productoEstanteId',
    type: Number,
    description: 'Identificador del registro producto-estante.',
  })
  @ApiOkResponse({ description: 'Historial de cambios de estante.' })
  @Get('producto-estante/cambiar-estante/:productoEstanteId')
  obtenerCambiosEstante(@Param('productoEstanteId', ParseIntPipe) productoEstanteId: number) {
    return this.productoEstanteService.obtenerCambiosEstante(productoEstanteId);
  }

  // ========================================================================
  //  CONTEO DE INVENTARIO
  // ========================================================================

  @Authorities([
    INN_AUTHORITIES.FARMACIA.INVENTARIO_ADMIN,
    INN_AUTHORITIES.FARMACIA.INVENTARIO_CONTEO,
  ])
  @ApiOperation({ summary: 'Registra el detalle de conteo de inventario' })
  @ApiBody({ type: RegistrarConteoConDetalleDto })
  @ApiOkResponse({ description: 'Conteo registrado.' })
  @Post('detalle-conteo')
  registrarConteo(@Body() dto: RegistrarConteoConDetalleDto) {
    return this.conteoInventarioService.registrarConteo(dto);
  }

  @ApiOperation({ summary: 'Actualiza conteos desde administracion' })
  @ApiBody({ type: AdminUpdateConteosDto })
  @ApiOkResponse({ description: 'Conteos actualizados por administracion.' })
  @Authorities([INN_AUTHORITIES.FARMACIA.INVENTARIO_ADMIN])
  @Patch('admin/detalle')
  updateAdminDetalle(@Body() body: AdminUpdateConteosDto) {
    return this.conteoInventarioService.ActualizarConteoAdmin(body);
  }

  @Authorities([INN_AUTHORITIES.FARMACIA.INVENTARIO_ADMIN])
  @ApiOperation({ summary: 'Obtiene historial de conteo por producto-estante' })
  @ApiQuery({
    name: 'estanteProductoId',
    type: Number,
    required: true,
    description: 'Identificador del producto asociado al estante.',
  })
  @ApiOkResponse({ description: 'Historial de conteos del producto-estante.' })
  @Get('historial-conteo')
  historialConteo(@Query('estanteProductoId', ParseIntPipe) estanteProductoId: number) {
    return this.consultaInventarioService.obtenerHistorialPorEstanteProducto(estanteProductoId);
  }

  @Authorities([INN_AUTHORITIES.FARMACIA.INVENTARIO_ADMIN])
  @ApiOperation({ summary: 'Lista estantes pendientes de verificacion' })
  @ApiOkResponse({ description: 'Listado de estantes para verificar.' })
  @Get('lista-estantes-verificar')
  listaConteoVerificar() {
    return this.consultaInventarioService.listaConteoVerificar();
  }

  @Authorities([INN_AUTHORITIES.FARMACIA.INVENTARIO_ADMIN])
  @ApiOperation({ summary: 'Obtiene resumen de conteo por producto-estante' })
  @ApiQuery({
    name: 'estanteId',
    type: Number,
    required: true,
    description: 'Identificador del estante.',
  })
  @ApiQuery({
    name: 'estanteProductoId',
    type: Number,
    required: false,
    deprecated: true,
    description: 'Alias temporal compatible para el identificador del estante.',
  })
  @ApiOkResponse({ description: 'Resumen de conteo del producto-estante.' })
  @Get('detalle-conteo/resumen')
  obtenerResumenConteo(
    @Query('estanteId') estanteId?: string,
    @Query('estanteProductoId') estanteProductoId?: string
  ) {
    const id = Number(estanteId ?? estanteProductoId);
    if (!Number.isInteger(id) || id <= 0) {
      throw new BadRequestException('Debe proporcionar un estanteId valido');
    }
    return this.consultaInventarioService.obtenerResumenPorEstanteProducto(id);
  }

  @Authorities([INN_AUTHORITIES.FARMACIA.INVENTARIO_ADMIN])
  @ApiOperation({ summary: 'Obtiene resumen de conteo de todos los estantes' })
  @ApiOkResponse({ description: 'Resumen consolidado de conteos por estante.' })
  @Get('detalle-conteo/resumen-estantes')
  obtenerResumenConteoEstantes() {
    return this.consultaInventarioService.obtenerResumenTodosEstantes();
  }

  // ========================================================================
  //  CERRAR CONTEO
  // ========================================================================
  @Authorities([INN_AUTHORITIES.FARMACIA.INVENTARIO_ADMIN])
  @ApiOperation({ summary: 'Cierra el conteo de un estante' })
  @ApiBody({
    schema: {
      type: 'object',
      required: ['estanteId'],
      properties: {
        estanteId: { type: 'number', example: 12 },
      },
    },
  })
  @ApiOkResponse({ description: 'Conteo del estante cerrado.' })
  @Post('cerrar-conteo')
  cerrarConteo(@Body('estanteId', ParseIntPipe) estanteId: number) {
    return this.cerrarConteoService.cerrarConteo(estanteId);
  }

  @Authorities([INN_AUTHORITIES.FARMACIA.INVENTARIO_ADMIN])
  @ApiOperation({ summary: 'Reinicia conteos de inventario de forma masiva' })
  @ApiOkResponse({ description: 'Conteos reiniciados.' })
  @Post('reiniciar-conteos')
  reiniciarConteos() {
    return this.cerrarConteoService.reiniciarConteos();
  }
}
