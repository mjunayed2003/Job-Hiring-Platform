import { Controller, Post, Delete, Body, UseGuards, Request } from '@nestjs/common';
import { FirebaseService } from './firebase.service';
import { SaveTokenDto } from './dto/save-token.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@Controller('firebase')
@UseGuards(JwtAuthGuard)
export class FirebaseController {
  constructor(private firebaseService: FirebaseService) {}

  // Save token during login/app open.
  @Post('token')
  async saveToken(
    @Request() req,
    @Body() dto: SaveTokenDto,
  ) {
    return await this.firebaseService.saveToken(req.user.id, dto.fcmToken);
  }
  
  // Remove token during logout.
  @Delete('token')
  async removeToken(
    @Request() req,
    @Body() dto: SaveTokenDto,
  ) {
    return await this.firebaseService.removeToken(req.user.id, dto.fcmToken);
  }

  // Remove all tokens for logout from all devices.
  @Delete('token/all')
  async removeAllTokens(@Request() req) {
    return await this.firebaseService.removeAllTokens(req.user.id);
  }
}