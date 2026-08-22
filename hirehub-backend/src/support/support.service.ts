// src/support/support.service.ts

import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { CreateSupportDto } from './dto/create-support.dto';

@Injectable()
export class SupportService {
  constructor(private readonly prisma: PrismaService) {}

  async create(dto: CreateSupportDto) {
    const support = await this.prisma.support.create({
      data: {
        title: dto.title || '',
        email: dto.email || '',
        phone: dto.phone || '' ,
        message: dto.message || '',
      },
    });

    return {
      success: true,
      message: 'Support request submitted successfully',
      data: support,
    };
  }

  async findAll(page: number = 1, limit: number = 10) {
    const pageNum = Number(page) || 1;
    const limitNum = Number(limit) || 10;
    const skip = (pageNum - 1) * limitNum;

    const [data, total] = await Promise.all([
      this.prisma.support.findMany({
        orderBy: { createdAt: 'desc' },
        skip,
        take: limitNum,
      }),
      this.prisma.support.count(),
    ]);

    return {
      success: true,
      message: 'Support requests fetched successfully',
      data,
      meta: {
        page: pageNum,
        limit: limitNum,
        total,
        totalPages: Math.ceil(total / limitNum),
      },
    };
  }

  // Admin — Contact Info set/update
async upsertContactInfo(dto: { email?: string; phone?: string }) {
  const existing = await this.prisma.contactInfo.findFirst();

  if (existing) {
    const updated = await this.prisma.contactInfo.update({
      where: { id: existing.id },
      data: {
        ...(dto.email && { email: dto.email }),
        ...(dto.phone && { phone: dto.phone }),
      },
    });
    return { success: true, message: 'Contact info updated', data: updated };
  }

  const created = await this.prisma.contactInfo.create({
    data: { email: dto.email || '', phone: dto.phone || '' },
  });
  return { success: true, message: 'Contact info created', data: created };
}

// Public — User get
async getContactInfo() {
  const info = await this.prisma.contactInfo.findFirst();
  return { success: true, data: info || null };
}
}