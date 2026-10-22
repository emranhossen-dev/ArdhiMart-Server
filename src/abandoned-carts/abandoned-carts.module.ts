import { Module } from '@nestjs/common';
import { AbandonedCartsController } from './abandoned-carts.controller';
import { AbandonedCartsService } from './abandoned-carts.service';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [AuthModule],
  controllers: [AbandonedCartsController],
  providers: [AbandonedCartsService],
  exports: [AbandonedCartsService],
})
export class AbandonedCartsModule {}
