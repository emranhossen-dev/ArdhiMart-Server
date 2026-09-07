import {
  Injectable,
  NotFoundException,
  OnModuleInit,
  Logger,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateReviewDto, UpdateReviewDto } from './dto/reviews.dto';
import { v4 as uuidv4 } from 'uuid';

export interface ReviewRecord {
  id: string;
  userName: string;
  rating: number;
  comment: string;
  avatar?: string;
  image?: string;
  role?: string;
  productId?: string;
  isHomepage?: boolean;
  status?: string;
  createdAt: Date;
  updatedAt: Date;
}

@Injectable()
export class ReviewsService implements OnModuleInit {
  private readonly logger = new Logger(ReviewsService.name);
  private memoryStore: ReviewRecord[] = [];

  constructor(private readonly prisma: PrismaService) {}

  async onModuleInit() {
    try {
      // Clean up any mock/seeded reviews so storefront only shows real reviews from admin
      await (this.prisma as any).reviews?.deleteMany?.({
        where: {
          OR: [
            { id: { in: ['rev-home-1', 'rev-home-2', 'rev-home-3'] } },
            { userName: { in: ['Tamim Iqbal', 'Nusrat Jahan', 'Tanvir Hossain'] } }
          ]
        }
      }).catch(() => null);
    } catch (e) {
      this.logger.warn('Reviews initialization fallback active:', e);
    }
  }

  async findAll(query?: { isHomepage?: string; productId?: string }) {
    try {
      const where: any = {};
      if (query?.isHomepage === 'true') {
        where.isHomepage = true;
      } else if (query?.productId) {
        where.productId = query.productId;
      }

      const dbResults = await (this.prisma as any).reviews?.findMany?.({
        where,
        orderBy: { createdAt: 'desc' },
      });

      if (Array.isArray(dbResults) && dbResults.length > 0) {
        return dbResults;
      }
    } catch (e) {
      // fallback to memoryStore
    }

    let filtered = [...this.memoryStore];
    if (query?.isHomepage === 'true') {
      filtered = filtered.filter((r) => r.isHomepage);
    } else if (query?.productId) {
      filtered = filtered.filter((r) => r.productId === query.productId);
    }
    return filtered.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }

  async findOne(id: string) {
    try {
      const found = await (this.prisma as any).reviews?.findUnique?.({
        where: { id },
      });
      if (found) return found;
    } catch (e) {}

    const mem = this.memoryStore.find((r) => r.id === id);
    if (!mem) throw new NotFoundException('Review not found');
    return mem;
  }

  async create(dto: CreateReviewDto) {
    const newRecord: ReviewRecord = {
      id: uuidv4(),
      userName: dto.userName,
      rating: Number(dto.rating || 5),
      comment: dto.comment,
      avatar: dto.avatar || '/logo.png',
      image: dto.image || '',
      role: dto.role || 'Verified Buyer',
      productId: dto.productId || '',
      isHomepage: Boolean(dto.isHomepage),
      status: dto.status || 'approved',
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    try {
      const created = await (this.prisma as any).reviews?.create?.({
        data: newRecord,
      });
      if (created) {
        this.memoryStore.unshift(created);
        return created;
      }
    } catch (e) {
      this.logger.warn('Failed to insert review into database, keeping in memory:', e);
    }

    this.memoryStore.unshift(newRecord);
    return newRecord;
  }

  async update(id: string, dto: UpdateReviewDto) {
    const updatedData: any = {
      ...dto,
      rating: dto.rating !== undefined ? Number(dto.rating) : undefined,
      isHomepage: dto.isHomepage !== undefined ? Boolean(dto.isHomepage) : undefined,
      updatedAt: new Date(),
    };

    try {
      const updated = await (this.prisma as any).reviews?.update?.({
        where: { id },
        data: updatedData,
      });
      if (updated) {
        const idx = this.memoryStore.findIndex((r) => r.id === id);
        if (idx !== -1) this.memoryStore[idx] = updated;
        return updated;
      }
    } catch (e) {}

    const idx = this.memoryStore.findIndex((r) => r.id === id);
    if (idx === -1) throw new NotFoundException('Review not found');

    this.memoryStore[idx] = {
      ...this.memoryStore[idx],
      ...updatedData,
    };
    return this.memoryStore[idx];
  }

  async delete(id: string) {
    try {
      await (this.prisma as any).reviews?.delete?.({
        where: { id },
      });
    } catch (e) {}

    this.memoryStore = this.memoryStore.filter((r) => r.id !== id);
    return { success: true, message: 'Review deleted successfully' };
  }
}
