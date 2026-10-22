import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  UseGuards,
} from '@nestjs/common';
import { AbandonedCartsService } from './abandoned-carts.service';
import { CreateAbandonedCartDto } from './dto/create-abandoned-cart.dto';
import { AdminAuthGuard } from '../auth/admin-auth.guard';

@Controller('abandoned-carts')
export class AbandonedCartsController {
  constructor(private readonly abandonedCartsService: AbandonedCartsService) {}

  // Public: Invoked from checkout frontend when customer types phone or starts checkout
  @Post()
  upsert(@Body() dto: CreateAbandonedCartDto) {
    return this.abandonedCartsService.upsert(dto);
  }

  // Admin Only: Get all unrecovered abandoned carts for follow up
  @Get()
  @UseGuards(AdminAuthGuard)
  findAll() {
    return this.abandonedCartsService.findAll();
  }

  // Admin Only: Mark as recovered (e.g. after phone call follow up)
  @Patch(':id/recover')
  @UseGuards(AdminAuthGuard)
  markRecovered(@Param('id') id: string) {
    return this.abandonedCartsService.markRecovered(id);
  }

  // Admin Only: Delete abandoned cart record
  @Delete(':id')
  @UseGuards(AdminAuthGuard)
  remove(@Param('id') id: string) {
    return this.abandonedCartsService.remove(id);
  }
}
