import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateOrderDto, UpdateOrderStatusDto } from './dto/create-order.dto';
import { NotificationsGateway } from '../notifications/notifications.gateway';
import { MetaService } from '../meta/meta.service';
import { MailService } from '../mail/mail.service';
import { AbandonedCartsService } from '../abandoned-carts/abandoned-carts.service';

@Injectable()
export class OrdersService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly notificationsGateway: NotificationsGateway,
    private readonly metaService: MetaService,
    private readonly mailService: MailService,
    private readonly abandonedCartsService: AbandonedCartsService,
  ) {}


  private async getNextOrderNumber(): Promise<number> {
    const allOrders = await this.prisma.orders.findMany({
      select: { id: true, orderNumber: true },
    });

    let maxId = 979;
    allOrders.forEach((o) => {
      const num1 = parseInt(o.id.replace(/[^0-9]/g, ''), 10);
      const num2 = parseInt(o.orderNumber.replace(/[^0-9]/g, ''), 10);
      if (!isNaN(num1) && num1 > maxId) maxId = num1;
      if (!isNaN(num2) && num2 > maxId) maxId = num2;
    });

    return maxId + 1;
  }

  async create(
    dto: CreateOrderDto,
    clientContext?: { clientIp?: string; userAgent?: string },
  ) {
    if (!dto.items || dto.items.length === 0) {
      throw new BadRequestException('Order must contain at least one item');
    }

    // 1. Calculate and verify pricing against database to prevent client price tampering
    let calculatedSubtotal = 0;
    const validatedItems = await Promise.all(
      dto.items.map(async (item) => {
        const qty = Math.max(1, Number(item.quantity) || 1);
        let unitPrice = Number(item.price) || 0;

        if (item.productId) {
          const dbProduct = await this.prisma.products.findFirst({
            where: {
              OR: [{ id: item.productId }, { urlSlug: item.productId }],
            },
            select: { price: true },
          });
          if (dbProduct && Number(dbProduct.price) > 0) {
            unitPrice = Number(dbProduct.price);
          }
        }
        calculatedSubtotal += unitPrice * qty;

        return {
          id: `item-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
          productId: item.productId,
          productName: item.productName,
          quantity: qty,
          price: unitPrice,
          image: item.image || '',
        };
      }),
    );

    const shippingFee = Number(dto.shippingFee) >= 0 ? Number(dto.shippingFee) : 120;
    const discount = Math.max(0, Number(dto.discount) || 0);
    const finalTotal = Math.max(0, calculatedSubtotal + shippingFee - discount);

    const nextOrderNum = await this.getNextOrderNumber();
    const orderId = String(nextOrderNum);
    const orderNumber = String(nextOrderNum);

    const order = await this.prisma.orders.create({
      data: {
        id: orderId,
        orderNumber,
        customerName: dto.customerName.trim(),
        customerEmail: dto.customerEmail || null,
        customerPhone: dto.customerPhone.trim(),
        shippingAddress: dto.shippingAddress.trim(),
        city: dto.city || 'Dhaka',
        postalCode: dto.postalCode || '1200',
        subtotal: calculatedSubtotal > 0 ? calculatedSubtotal : dto.subtotal,
        shippingFee: shippingFee,
        discount: discount,
        totalAmount: finalTotal > 0 ? finalTotal : dto.totalAmount,
        paymentMethod: dto.paymentMethod || 'COD',
        status: 'pending',
        paymentStatus: 'unpaid',
        order_items: {
          create: validatedItems,
        },
      },
      include: {
        order_items: true,
      },
    });

    // Mark abandoned cart as recovered for this customer
    try {
      await this.abandonedCartsService.markRecoveredByPhone(dto.customerPhone);
    } catch (e) {
      console.warn('Abandoned cart recovery sync error:', e);
    }


    // Update customer record or create new customer
    try {
      const existingCustomer = await (this.prisma as any).customers.findFirst({
        where: { phone: dto.customerPhone },
      });

      if (existingCustomer) {
        await (this.prisma as any).customers.update({
          where: { id: existingCustomer.id },
          data: {
            totalOrders: { increment: 1 },
            totalSpent: { increment: dto.totalAmount },
          },
        });
      } else {
        await (this.prisma as any).customers.create({
          data: {
            id: `cust-${Date.now()}`,
            name: dto.customerName,
            phone: dto.customerPhone,
            email: dto.customerEmail || `${dto.customerPhone}@customer.store`,
            address: dto.shippingAddress,
            totalOrders: 1,
            totalSpent: dto.totalAmount,
          },
        });
      }
    } catch (e) {
      console.warn('Customer upsert fallback:', e);
    }

    // Broadcast Real-Time Socket.io Notification to connected Admin Panel clients
    try {
      this.notificationsGateway.sendNotification({
        id: `notif_${Date.now()}`,
        title: `New Order #${order.orderNumber}`,
        message: `Customer ${order.customerName} placed an order worth ৳ ${order.totalAmount.toLocaleString()} via ${order.paymentMethod}`,
        timestamp: 'Just now',
        type: 'order',
      });
    } catch (err) {
      console.warn('Real-time socket notification broadcast fallback:', err);
    }

    // Trigger Meta Conversions API (CAPI) Server-Side Purchase Event
    try {
      this.metaService
        .sendPurchaseEvent(order, clientContext)
        .catch((err) =>
          console.warn('[OrdersService] Meta CAPI dispatch error:', err),
        );
    } catch (capiErr) {
      console.warn('[OrdersService] Failed to trigger Meta CAPI:', capiErr);
    }

    // Trigger Email Notification to Admin & Customer asynchronously
    try {
      this.mailService
        .sendNewOrderNotification(order)
        .catch((err) =>
          console.warn('[OrdersService] Order email notification error:', err),
        );
    } catch (mailErr) {
      console.warn('[OrdersService] Failed to trigger email notification:', mailErr);
    }

    return order;
  }

  async findAll(status?: string, search?: string) {
    const where: any = {};

    if (status && status !== 'All' && status !== 'all') {
      where.status = status.toLowerCase();
    }

    if (search && search.trim() !== '') {
      const s = search.trim();
      where.OR = [
        { orderNumber: { contains: s } },
        { id: { contains: s } },
        { customerName: { contains: s } },
        { customerPhone: { contains: s } },
      ];
    }

    return this.prisma.orders.findMany({
      where,
      include: { order_items: true },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOne(id: string) {
    const order = await this.prisma.orders.findFirst({
      where: {
        OR: [{ id }, { orderNumber: id }],
      },
      include: { order_items: true },
    });

    if (!order) {
      throw new NotFoundException(`Order '${id}' not found`);
    }

    return order;
  }

  async updateStatus(id: string, dto: UpdateOrderStatusDto) {
    const order = await this.findOne(id);

    return this.prisma.orders.update({
      where: { id: order.id },
      data: {
        status: dto.status.toLowerCase(),
        ...(dto.paymentStatus && { paymentStatus: dto.paymentStatus.toLowerCase() }),
        ...(dto.courierProvider && { courierProvider: dto.courierProvider }),
        ...(dto.trackingCode && { trackingCode: dto.trackingCode }),
      },
      include: { order_items: true },
    });
  }

  async update(id: string, updates: any) {
    const order = await this.findOne(id);

    return this.prisma.orders.update({
      where: { id: order.id },
      data: {
        ...(updates.customerName && { customerName: updates.customerName }),
        ...(updates.customerEmail && { customerEmail: updates.customerEmail }),
        ...(updates.customerPhone && { customerPhone: updates.customerPhone }),
        ...(updates.shippingAddress && { shippingAddress: updates.shippingAddress }),
        ...(updates.city && { city: updates.city }),
        ...(updates.status && { status: updates.status.toLowerCase() }),
        ...(updates.paymentStatus && { paymentStatus: updates.paymentStatus.toLowerCase() }),
        ...(updates.totalAmount && { totalAmount: Number(updates.totalAmount) }),
      },
      include: { order_items: true },
    });
  }

  async remove(id: string) {
    const order = await this.findOne(id);

    try {
      await this.prisma.order_items.deleteMany({
        where: { orderId: order.id },
      });
    } catch (e) {}

    return this.prisma.orders.delete({
      where: { id: order.id },
    });
  }

  async trackOrder(query: string) {
    if (!query || !query.trim()) {
      throw new BadRequestException('Order ID or Tracking number required');
    }
    const clean = query.trim();
    const order = await this.prisma.orders.findFirst({
      where: {
        OR: [
          { id: clean },
          { orderNumber: clean },
          { customerPhone: clean },
        ],
      },
      include: { order_items: true },
      orderBy: { createdAt: 'desc' },
    });

    if (!order) {
      throw new NotFoundException(`Order '${clean}' not found`);
    }

    return order;
  }
}

