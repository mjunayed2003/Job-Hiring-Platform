import {
  Controller, Post, Get, Delete,
  Body, Request, UseGuards, Query, Param,
  UploadedFile, UseInterceptors
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { extname } from 'path';
import { JwtAuthGuard } from 'src/auth/jwt-auth.guard';
import { MessagesService } from './messages.service';

@UseGuards(JwtAuthGuard)
@Controller('messages')
export class MessagesController {
  constructor(private readonly messagesService: MessagesService) { }

  // ==================================================
  // GET ALL MESSAGES OF A CONVERSATION
  // ==================================================
  @Get('conversation/:conversationId')
  async getConversationMessages(
    @Param('conversationId') conversationId: string,
    @Query('page') page: string = '1',
    @Query('limit') limit: string = '20',
    @Request() req,
  ) {
    return this.messagesService.getMessages(conversationId, req.user.id, {
      page: parseInt(page, 1),
      limit: parseInt(limit, 10),
    });
  }

  @Get('conversations')
  async getConversations(@Request() req) {
    return this.messagesService.getConversations(req.user.id);
  }

  @Post('conversation')
  async getOrCreateConversation(
    @Body() body: { targetUserId: string },
    @Request() req,
  ) {
    return this.messagesService.getOrCreateConversation(
      req.user.id,
      body.targetUserId,
    );
  }

  @Get('users/search')
  async searchUsers(
    @Query('q') q: string = '',
    @Query('page') page: string = '1',
    @Query('limit') limit: string = '20',
    @Request() req,
  ) {
    return this.messagesService.searchUsers(req.user.id, q, {
      page: parseInt(page, 10),
      limit: parseInt(limit, 10),
    });
  }

  @Delete('conversation/:conversationId')
  async deleteConversation(
    @Param('conversationId') conversationId: string,
    @Request() req,
  ) {
    return this.messagesService.deleteConversation(conversationId, req.user.id);
  }


  @Post('upload')
  @UseInterceptors(
    FileInterceptor('file', {
      storage: diskStorage({
        destination: './uploads',
        filename: (req, file, cb) => {
          const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
          cb(null, `attachment-${uniqueSuffix}${extname(file.originalname)}`);
        },
      }),
      limits: { fileSize: 10 * 1024 * 1024 },
    }),
  )
  async uploadAttachment(@UploadedFile() file: Express.Multer.File) {
    return { url: `/uploads/${file.filename}` };
  }
}

