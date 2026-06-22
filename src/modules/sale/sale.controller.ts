import { Body, Controller, Delete, Get, Logger, Param, ParseIntPipe, Post, Put, Query, Req } from '@nestjs/common';
import { SaleService } from '@modules/sale/sale.service';
import { CreateSaleRequest } from '@modules/sale/dto/create-sale-request.dto';
import { DefaultAuthGuard } from '@common/guards/default-auth.guard';
import { CreateSaleTypeRequest } from '@modules/sale/dto/create-sale-type-request.dto';
import { IsPublic } from '@common/decorators/is-public.decorator';
import { GetStatsFilter } from '@modules/sale/dto/get-stats-filter.dto';
import { UpdateSaleTypeRequest } from '@modules/sale/dto/update-sale-type-request.dto';

@DefaultAuthGuard
@Controller('sale')
export class SaleController {
  private readonly logger = new Logger(SaleController.name);

  constructor(private readonly saleService: SaleService) {}

  @Get('stats')
  getStats(@Req() req: any, @Query() filter: GetStatsFilter) {
    return this.saleService.getStats(filter, req.user.id);
  }

  @IsPublic()
  @Post('wh-create')
  whCreate(@Body() body: any) {
    this.logger.log('wh-create', JSON.stringify(body));
    return { ok: true };
  }

  @Post('create')
  createSale(@Req() req: any, @Body() body: CreateSaleRequest) {
    return this.saleService.createSale(req.user.id, body);
  }

  @Get('types')
  getTypes() {
    return this.saleService.getTypes();
  }

  @Get('type-options')
  getTypeOptions() {
    return this.saleService.getTypeOptions();
  }

  @Post('create-type')
  createSaleType(@Body() body: CreateSaleTypeRequest) {
    return this.saleService.createSaleType(body);
  }

  @Get('all')
  getSales(@Query('page', ParseIntPipe) page: number) {
    return this.saleService.getSales(page);
  }

  @Put('update-type/:saleTypeId')
  updateType(@Param('saleTypeId') saleTypeId: string, @Body() body: UpdateSaleTypeRequest) {
    return this.saleService.updateType(saleTypeId, body);
  }

  @Delete(':saleId')
  deleteSale(@Param('saleId') saleId: string) {
    return this.saleService.deleteSale(saleId);
  }
}
