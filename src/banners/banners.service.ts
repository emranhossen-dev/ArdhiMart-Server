import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

const INITIAL_HERO_BANNERS = [
  {
    title: 'Smart LED Digital Pen Holder',
    subtitle: 'Premium desk organizer with digital clock, alarm & ambient LED light. Elevate your workspace with a modern touch!',
    imageUrl: '/images/ardhimart-smart-pen-holder.webp',
    linkUrl: '/products',
    btn1Text: 'Order Now',
    btn1Link: '/products',
    btn2Text: 'Explore Gadgets',
    btn2Link: '/products?category=Smart%20Gadgets',
    badge: 'Smart Tech Collection ⚡',
    bannerType: 'hero',
    order: 1,
    isActive: true,
  },
  {
    title: 'Surprise Gift Box for Your Loved Ones',
    subtitle: 'Make birthdays, anniversaries & special moments unforgettable with our curated luxury gift combos.',
    imageUrl: '/images/ardhimart-giftbox-valentine-set.webp',
    linkUrl: '/products',
    btn1Text: 'Shop Gift Combos',
    btn1Link: '/products',
    btn2Text: 'Explore Collection',
    btn2Link: '/products',
    badge: 'Mega Gift Hampers 🎁',
    bannerType: 'hero',
    order: 2,
    isActive: true,
  },
  {
    title: 'Unique Gifts & Trending Decor Items',
    subtitle: 'Discover exclusive home accessories, smart tech & personalized present ideas across Bangladesh.',
    imageUrl: '/images/ardhimart-giftbox-set.webp',
    linkUrl: '/products',
    btn1Text: 'Browse All Items',
    btn1Link: '/products',
    btn2Text: 'View Flash Deals',
    btn2Link: '/products?category=Flash%20Deals',
    badge: 'Exclusive Gift Deals 🌟',
    bannerType: 'hero',
    order: 3,
    isActive: true,
  },
];

@Injectable()
export class BannersService {
  constructor(private prisma: PrismaService) {}

  async findAll(query?: { bannerType?: string; activeOnly?: string | boolean }) {
    const where: any = {};
    if (query?.bannerType) {
      where.bannerType = query.bannerType;
    }
    if (query?.activeOnly === 'true' || query?.activeOnly === true) {
      where.isActive = true;
    }

    let items = await this.prisma.banner_cms.findMany({
      where,
      orderBy: [{ order: 'asc' }, { createdAt: 'asc' }],
    });

    // If database has 0 banners, seed default hero banners automatically
    if (items.length === 0 && (!query?.bannerType || query?.bannerType === 'hero')) {
      const totalCount = await this.prisma.banner_cms.count();
      if (totalCount === 0) {
        for (const item of INITIAL_HERO_BANNERS) {
          await this.prisma.banner_cms.create({ data: item });
        }
        items = await this.prisma.banner_cms.findMany({
          where,
          orderBy: [{ order: 'asc' }, { createdAt: 'asc' }],
        });
      }
    }

    return items;
  }

  async findOne(id: string) {
    const banner = await this.prisma.banner_cms.findUnique({ where: { id } });
    if (!banner) {
      throw new NotFoundException(`Banner with ID "${id}" not found`);
    }
    return banner;
  }

  async create(data: any) {
    const currentCount = await this.prisma.banner_cms.count();
    return this.prisma.banner_cms.create({
      data: {
        title: data.title || 'Untitled Banner',
        subtitle: data.subtitle ?? null,
        imageUrl: data.imageUrl || data.image || '/logo.png',
        linkUrl: data.linkUrl || data.btn1Link || '/products',
        btn1Text: data.btn1Text || 'Order Now',
        btn1Link: data.btn1Link || '/products',
        btn2Text: data.btn2Text ?? 'Explore Gadgets',
        btn2Link: data.btn2Link ?? '/products',
        badge: data.badge ?? 'Exclusive Deal',
        bannerType: data.bannerType || 'hero',
        order: data.order !== undefined ? Number(data.order) : currentCount + 1,
        isActive: data.isActive !== undefined ? Boolean(data.isActive) : true,
      },
    });
  }

  async update(id: string, data: any) {
    await this.findOne(id); // throws if not found
    return this.prisma.banner_cms.update({
      where: { id },
      data: {
        title: data.title !== undefined ? data.title : undefined,
        subtitle: data.subtitle !== undefined ? data.subtitle : undefined,
        imageUrl: (data.imageUrl || data.image) !== undefined ? (data.imageUrl || data.image) : undefined,
        linkUrl: (data.linkUrl || data.btn1Link) !== undefined ? (data.linkUrl || data.btn1Link) : undefined,
        btn1Text: data.btn1Text !== undefined ? data.btn1Text : undefined,
        btn1Link: data.btn1Link !== undefined ? data.btn1Link : undefined,
        btn2Text: data.btn2Text !== undefined ? data.btn2Text : undefined,
        btn2Link: data.btn2Link !== undefined ? data.btn2Link : undefined,
        badge: data.badge !== undefined ? data.badge : undefined,
        bannerType: data.bannerType !== undefined ? data.bannerType : undefined,
        order: data.order !== undefined ? Number(data.order) : undefined,
        isActive: data.isActive !== undefined ? Boolean(data.isActive) : undefined,
      },
    });
  }

  async delete(id: string) {
    await this.findOne(id);
    return this.prisma.banner_cms.delete({ where: { id } });
  }

  async reorder(items: { id: string; order: number }[]) {
    const updates = items.map((item) =>
      this.prisma.banner_cms.update({
        where: { id: item.id },
        data: { order: item.order },
      }),
    );
    await Promise.all(updates);
    return { success: true, message: 'Banners reordered successfully' };
  }
}
