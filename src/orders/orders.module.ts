import { Module } from '@nestjs/common';
import { OrdersService } from './orders.service';
import { OrdersController } from './orders.controller';
import { MetaModule } from '../meta/meta.module';
import { AuthModule } from '../auth/auth.module';
import { AbandonedCartsModule } from '../abandoned-carts/abandoned-carts.module';

@Module({
  imports: [MetaModule, AuthModule, AbandonedCartsModule],
  controllers: [OrdersController],
  providers: [OrdersService],
  exports: [OrdersService],
})
export class OrdersModule {}

