import { Injectable, BadRequestException } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';

@Injectable()
export class AdminSettingsService {
  constructor(private readonly prisma: PrismaService) { }

  private readonly KEY = 'platform_fee_percent';

  async getPlatformFee() {
    const setting = await this.prisma.platformSetting.findUnique({ where: { key: this.KEY } });
    const percent = setting ? parseFloat(setting.value) : 3;
    return { success: true, data: { percent } };
  }

  async setPlatformFee(percent: number) {
    if (typeof percent !== 'number' || isNaN(percent) || percent < 0 || percent > 100) {
      throw new BadRequestException('Percent must be a number between 0 and 100');
    }

    const updated = await this.prisma.platformSetting.upsert({
      where: { key: this.KEY },
      create: { key: this.KEY, value: String(percent) },
      update: { value: String(percent) },
    });

    return { success: true, data: { percent: Number(updated.value) } };
  }
}
