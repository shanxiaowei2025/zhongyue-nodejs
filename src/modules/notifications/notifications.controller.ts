import { Controller, Get, Post, Body, Delete, Param, Query, Request, UseGuards, Put } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags, ApiParam } from '@nestjs/swagger';
import { NotificationsService } from './notifications.service';
import { CreateNotificationDto } from './dto/create-notification.dto';
import { QueryNotificationDto } from './dto/query-notification.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@ApiTags('通知')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('notifications')
export class NotificationsController {
  constructor(private readonly notificationsService: NotificationsService) {}

  @Post()
  @ApiOperation({ summary: '创建通知' })
  async create(@Body() dto: CreateNotificationDto, @Request() req) {
    return this.notificationsService.create(dto, req.user.id);
  }

  @Get()
  @ApiOperation({ summary: '获取我的通知' })
  async findAll(@Query() q: QueryNotificationDto, @Request() req) {
    const page = q.page ? parseInt(q.page, 10) : 1;
    const limit = q.limit ? parseInt(q.limit, 10) : 10;
    const onlyNew = q.onlyNew === 'true';
    return this.notificationsService.findAllForUser(req.user.id, { page, limit, onlyNew });
  }

  @Get('new')
  @ApiOperation({ summary: '获取我的新通知（未读）' })
  async findNew(@Query() q: QueryNotificationDto, @Request() req) {
    const page = q.page ? parseInt(q.page, 10) : 1;
    const limit = q.limit ? parseInt(q.limit, 10) : 10;
    return this.notificationsService.findAllForUser(req.user.id, { page, limit, onlyNew: true });
  }

  @Put(':id/read')
  @ApiOperation({ 
    summary: '标记通知为已读',
    description: '将指定通知标记为已读状态，更新sys_notification_recipient表中的readStatus为1，readAt为当前时间'
  })
  @ApiParam({ 
    name: 'id', 
    description: '通知ID',
    example: 1,
    type: 'number'
  })
  async markAsRead(@Param('id') id: string, @Request() req) {
    const notificationId = Number(id);
    const result = await this.notificationsService.markAsRead(req.user.id, notificationId);
    return {
      code: 0,
      message: result.message,
      data: {
        notificationId,
        readAt: result.readAt
      },
      timestamp: Date.now()
    };
  }

  @Put('read-all')
  @ApiOperation({ 
    summary: '标记所有通知为已读',
    description: '将当前用户的所有未读通知标记为已读状态'
  })
  async markAllAsRead(@Request() req) {
    const result = await this.notificationsService.markAllAsRead(req.user.id);
    return {
      code: 0,
      message: result.message,
      data: {
        count: result.count,
        readAt: result.readAt
      },
      timestamp: Date.now()
    };
  }

  @Delete(':id')
  @ApiOperation({ summary: '删除通知记录' })
  @ApiParam({ name: 'id', description: '通知接收者记录ID' })
  async remove(@Param('id') id: string, @Request() req) {
    return this.notificationsService.removeRecipient(Number(id), req.user.id);
  }
} 