// admin-messages.controller.ts
import {
    Controller, Get, Patch, Param, Query,
    UseGuards, Request,
} from '@nestjs/common';
import { JwtAuthGuard } from 'src/auth/jwt-auth.guard';
import { MessagesService } from './messages.service';
import { ForbiddenException } from '@nestjs/common';


function requireAdmin(req: any) {
    if (req.user?.role !== 'ADMIN') {
        throw new ForbiddenException('Admin access only');
    }
}

@UseGuards(JwtAuthGuard)
@Controller('admin/messages')
export class AdminMessagesController {
    constructor(private readonly messagesService: MessagesService) { }

    // সব conversations দেখো
    // GET /admin/messages/conversations?page=1&limit=20&filter=ALL
    @Get('conversations')
    async getAllConversations(
        @Query('page') page = '1',
        @Query('limit') limit = '20',
        @Query('filter') filter: 'ALL' | 'EMPLOYER_JOBSEEKER' | 'COMPANY_JOBSEEKER' = 'ALL',
        @Request() req,
    ) {
        requireAdmin(req);
        return this.messagesService.getAllConversationsAdmin({
            page: parseInt(page, 10),
            limit: parseInt(limit, 10),
            filter,
        });
    }

    // GET /admin/messages/conversations/:id/messages
    @Get('conversations/:conversationId/messages')
    async getConversationMessages(
        @Param('conversationId') conversationId: string,
        @Query('page') page = '1',
        @Query('limit') limit = '50',
        @Request() req,
    ) {
        requireAdmin(req);
        return this.messagesService.getConversationMessagesAdmin(conversationId, {
            page: parseInt(page, 10),
            limit: parseInt(limit, 10),
        });
    }

    // Conversation detail (participants )
    // GET /admin/messages/conversations/:id
    @Get('conversations/:conversationId')
    async getConversationDetail(
        @Param('conversationId') conversationId: string,
        @Request() req,
    ) {
        requireAdmin(req);
        return this.messagesService.getConversationWithParticipants(conversationId);
    }

    // User block 
    // PATCH /admin/messages/users/:userId/block
    @Patch('users/:userId/block')
    async blockUser(@Param('userId') userId: string, @Request() req) {
        requireAdmin(req);
        return this.messagesService.blockUser(userId);
    }

    // User unblock 
    // PATCH /admin/messages/users/:userId/unblock
    @Patch('users/:userId/unblock')
    async unblockUser(@Param('userId') userId: string, @Request() req) {
        requireAdmin(req);
        return this.messagesService.unblockUser(userId);
    }
}