import {
  Controller,
  Get,
  Post,
  Put,
  Patch,
  Delete,
  Body,
  Param,
  Query,
} from '@nestjs/common';
import { BannersService } from './banners.service';

@Controller('banners')
export class BannersController {
  constructor(private readonly bannersService: BannersService) {}

  @Get()
  findAll(
    @Query('bannerType') bannerType?: string,
    @Query('activeOnly') activeOnly?: string,
  ) {
    return this.bannersService.findAll({ bannerType, activeOnly });
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.bannersService.findOne(id);
  }

  @Post()
  create(@Body() body: any) {
    return this.bannersService.create(body);
  }

  @Put('reorder/batch')
  reorder(@Body() body: { items: { id: string; order: number }[] }) {
    return this.bannersService.reorder(body.items || []);
  }

  @Put(':id')
  updatePut(@Param('id') id: string, @Body() body: any) {
    return this.bannersService.update(id, body);
  }

  @Patch(':id')
  updatePatch(@Param('id') id: string, @Body() body: any) {
    return this.bannersService.update(id, body);
  }

  @Delete(':id')
  delete(@Param('id') id: string) {
    return this.bannersService.delete(id);
  }
}
