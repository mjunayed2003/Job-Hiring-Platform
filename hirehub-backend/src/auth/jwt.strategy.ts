import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { PrismaService } from 'src/prisma/prisma.service';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(private readonly prisma: PrismaService) {
    const cookieExtractor = (req: any) => {
      const cookieHeader = req?.headers?.cookie;
      if (!cookieHeader) return null;

      const match = cookieHeader.match(/(?:^|;\s*)access_token=([^;]+)/);
      return match ? decodeURIComponent(match[1]) : null;
    };

    // Keep bearer header and access_token cookie support.
    super({
      jwtFromRequest: ExtractJwt.fromExtractors([
        ExtractJwt.fromAuthHeaderAsBearerToken(),
        cookieExtractor,
      ]),
      ignoreExpiration: false,
      secretOrKey: process.env.JWT_SECRET || 'secretKey',
    });
  }

  async validate(payload: any) {
    if (!payload) {
      throw new UnauthorizedException('Invalid token');
    }

    const user = await this.prisma.user.findUnique({
      where: { id: payload.sub },
      select: { id: true, email: true, role: true, tokenVersion: true },
    });

    if (!user) {
      throw new UnauthorizedException('Invalid token');
    }

    if (
      payload.tokenVersion !== undefined &&
      payload.tokenVersion !== user.tokenVersion
    ) {
      throw new UnauthorizedException('Token expired. Please login again.');
    }

    return { id: user.id, email: user.email, role: user.role };
  }
}
