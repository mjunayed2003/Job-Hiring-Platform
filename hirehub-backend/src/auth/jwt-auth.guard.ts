import {
    Injectable,
    ExecutionContext,
    UnauthorizedException,
    ForbiddenException,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { Reflector } from '@nestjs/core';

@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {
    constructor(private reflector: Reflector) {
        super();
    }

    canActivate(context: ExecutionContext) {
        return super.canActivate(context);
    }

    handleRequest(err: any, user: any, info: any, context: ExecutionContext) {
        //  Token expire
        if (info?.name === 'TokenExpiredError') {
            throw new UnauthorizedException('Token expired. Please login again.');
        }

        //  Token invalid
        if (info?.name === 'JsonWebTokenError') {
            throw new UnauthorizedException('Invalid token.');
        }

        //  error
        if (err || !user) {
            throw new UnauthorizedException('Unauthorized');
        }

        // Role check
        const requiredRoles =
            this.reflector.get<string[]>('roles', context.getHandler()) ??
            this.reflector.get<string[]>('roles', context.getClass());

        if (requiredRoles && !requiredRoles.includes(user.role)) {
            throw new ForbiddenException('Access denied');
        }

        return user;
    }
}