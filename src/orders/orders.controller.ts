import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import { OrdersService } from './orders.service';
import { CreateOrderDto, UpdateOrderStatusDto } from './dto/create-order.dto';
import { AdminAuthGuard } from '../auth/admin-auth.guard';

@Controller('orders')
export class OrdersController {
  constructor(private readonly ordersService: OrdersService) {}

  // Public: Order Placement
  @Post()
  create(@Body() dto: CreateOrderDto, @Req() req: any) {
    const rawIp =
      req?.headers?.['x-forwarded-for'] ||
      req?.socket?.remoteAddress ||
      req?.ip;
    const clientIp =
      typeof rawIp === 'string' ? rawIp.split(',')[0].trim() : undefined;
    const userAgent = req?.headers?.['user-agent'];

    return this.ordersService.create(dto, { clientIp, userAgent });
  }

  // Public: Secure Single Order Tracking (by Order Number, ID, or Phone)
  @Get('track/:query')
  trackOrder(@Param('query') query: string) {
    return this.ordersService.trackOrder(query);
  }

  // Admin Only: Get all orders with search & status filters
  @Get()
  @UseGuards(AdminAuthGuard)
  findAll(
    @Query('status') status?: string,
    @Query('search') search?: string,
  ) {
    return this.ordersService.findAll(status, search);
  }

  // Admin Only: Single Order details for dashboard
  @Get(':id')
  @UseGuards(AdminAuthGuard)
  findOne(@Param('id') id: string) {
    return this.ordersService.findOne(id);
  }

  // Admin Only: Update order status
  @Patch(':id/status')
  @UseGuards(AdminAuthGuard)
  updateStatus(
    @Param('id') id: string,
    @Body() dto: UpdateOrderStatusDto,
  ) {
    return this.ordersService.updateStatus(id, dto);
  }

  // Admin Only: Update order payload
  @Patch(':id')
  @UseGuards(AdminAuthGuard)
  update(
    @Param('id') id: string,
    @Body() updates: any,
  ) {
    return this.ordersService.update(id, updates);
  }

  // Admin Only: Delete order
  @Delete(':id')
  @UseGuards(AdminAuthGuard)
  remove(@Param('id') id: string) {
    return this.ordersService.remove(id);
  }
}

