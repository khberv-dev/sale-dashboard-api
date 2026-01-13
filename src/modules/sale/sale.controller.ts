import { Body, Controller, Delete, Get, Param, Post, Put, Query, Req } from '@nestjs/common';
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
  constructor(private readonly saleService: SaleService) {}

  @IsPublic()
  @Get('stats')
  getStats(@Query() filter: GetStatsFilter) {
    return this.saleService.getStats(filter);
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
  getSales() {
    return this.saleService.getSales();
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
