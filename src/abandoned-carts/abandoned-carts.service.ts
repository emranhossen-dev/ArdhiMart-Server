import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateAbandonedCartDto } from './dto/create-abandoned-cart.dto';

@Injectable()
export class AbandonedCartsService {
  constructor(private readonly prisma: PrismaService) {}

  async upsert(dto: CreateAbandonedCartDto) {
    if (!dto.customerPhone || dto.customerPhone.trim().length < 8) {
      throw new BadRequestException('A valid customer phone number is required');
    }

    const cleanPhone = dto.customerPhone.replace(/[^0-9+]/g, '').trim();
    const cleanName = dto.customerName?.trim() || 'Guest Customer';
    const serializedItems = typeof dto.cartItems === 'string'
      ? dto.cartItems
      : JSON.stringify(dto.cartItems || []);
    const amount = Number(dto.totalAmount) || 0;

    // Check if an unrecovered abandoned cart exists for this phone
    const existing = await this.prisma.abandoned_carts.findFirst({
      where: {
        customerPhone: cleanPhone,
        recovered: false,
      },
      orderBy: { updatedAt: 'desc' },
    });

    if (existing) {
      return this.prisma.abandoned_carts.update({
        where: { id: existing.id },
        data: {
          customerName: cleanName,
          cartItems: serializedItems,
          totalAmount: amount,
          updatedAt: new Date(),
        },
      });
    }

    return this.prisma.abandoned_carts.create({
      data: {
        customerName: cleanName,
        customerPhone: cleanPhone,
        cartItems: serializedItems,
        totalAmount: amount,
        recovered: false,
      },
    });
  }

  async findAll() {
    const carts = await this.prisma.abandoned_carts.findMany({
      where: { recovered: false },
      orderBy: { updatedAt: 'desc' },
      take: 200,
    });

    return carts.map((c) => {
      let parsedItems = [];
      try {
        parsedItems = JSON.parse(c.cartItems);
      } catch (e) {
        parsedItems = [];
      }
      return {
        ...c,
        cartItems: parsedItems,
        totalAmount: Number(c.totalAmount),
      };
    });
  }

  async markRecovered(id: string) {
    const cart = await this.prisma.abandoned_carts.findUnique({ where: { id } });
    if (!cart) throw new NotFoundException('Abandoned cart record not found');

    return this.prisma.abandoned_carts.update({
      where: { id },
      data: { recovered: true },
    });
  }

  async markRecoveredByPhone(phone: string) {
    const cleanPhone = phone.replace(/[^0-9+]/g, '').trim();
    if (!cleanPhone) return;

    return this.prisma.abandoned_carts.updateMany({
      where: {
        customerPhone: cleanPhone,
        recovered: false,
      },
      data: { recovered: true },
    });
  }

  async remove(id: string) {
    return this.prisma.abandoned_carts.delete({ where: { id } });
  }
}
