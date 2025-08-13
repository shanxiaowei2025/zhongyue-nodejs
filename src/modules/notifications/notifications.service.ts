import { Injectable, BadRequestException, NotFoundException, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In, LessThan } from 'typeorm';
import { Cron } from '@nestjs/schedule';
import { Notification } from './entities/notification.entity';
import { NotificationRecipient } from './entities/notification-recipient.entity';
import { CreateNotificationDto } from './dto/create-notification.dto';
import { User } from '../users/entities/user.entity';
import { NotificationsGateway } from './notifications.gateway';

@Injectable()
export class NotificationsService {
  private readonly logger = new Logger(NotificationsService.name);

  constructor(
    @InjectRepository(Notification)
    private readonly notificationRepo: Repository<Notification>,
    @InjectRepository(NotificationRecipient)
    private readonly recipientRepo: Repository<NotificationRecipient>,
    @InjectRepository(User)
    private readonly userRepo: Repository<User>,
    private readonly notificationsGateway: NotificationsGateway,
  ) {}

  async create(dto: CreateNotificationDto, creatorUserId: number) {
    const userIds = await this.resolveTargetUserIds(
      dto.targetUsers || [],
      dto.targetRoles || [],
      dto.targetDepts || [],
    );

    if (userIds.length === 0) {
      throw new BadRequestException('未找到任何目标用户');
    }

    const notification = await this.notificationRepo.save({
      title: dto.title,
      content: dto.content,
      type: dto.type,
      createdBy: creatorUserId,
    });

    const recipients = userIds.map((uid) => ({
      notificationId: notification.id,
      userId: uid,
      readStatus: 0,
      readAt: null,
    }));

    await this.recipientRepo.save(recipients);

    this.notificationsGateway.pushToUsers(userIds, 'new-notification', notification);

    return notification;
  }

  async findAllForUser(userId: number, options?: { onlyNew?: boolean; page?: number; limit?: number }) {
    const page = options?.page || 1;
    const limit = options?.limit || 10;

    const qb = this.recipientRepo
      .createQueryBuilder('rec')
      .leftJoinAndMapOne('rec.notification', Notification, 'n', 'n.id = rec.notificationId')
      .where('rec.userId = :userId', { userId })
      .orderBy('n.createdAt', 'DESC')
      .skip((page - 1) * limit)
      .take(limit);

    if (options?.onlyNew) {
      qb.andWhere('rec.readStatus = 0');
    }

    const [items, total] = await qb.getManyAndCount();

    return {
      items: items.map((r: any) => ({ 
        id: r.id, // 接收者记录的ID
        notificationId: r.notification.id, // 通知ID
        title: r.notification.title,
        content: r.notification.content,
        type: r.notification.type,
        createdBy: r.notification.createdBy,
        createdAt: r.notification.createdAt,
        readStatus: r.readStatus, 
        readAt: r.readAt 
      })),
      meta: { total, page, limit },
    };
  }

  async markAsRead(userId: number, notificationId: number) {
    // 首先检查该用户是否有这个通知
    const recipient = await this.recipientRepo.findOne({
      where: { userId, notificationId }
    });

    if (!recipient) {
      throw new NotFoundException('通知不存在或您无权访问该通知');
    }

    // 如果已经是已读状态，直接返回
    if (recipient.readStatus === 1) {
      return {
        message: '通知已经是已读状态',
        readAt: recipient.readAt
      };
    }

    // 更新为已读状态
    const updateResult = await this.recipientRepo.update(
      { userId, notificationId }, 
      { readStatus: 1, readAt: new Date() }
    );

    if (updateResult.affected === 0) {
      throw new BadRequestException('标记已读失败');
    }

    return {
      message: '通知已标记为已读',
      readAt: new Date()
    };
  }

  async markAllAsRead(userId: number) {
    // 更新用户所有未读通知为已读状态
    const updateResult = await this.recipientRepo.update(
      { userId, readStatus: 0 },
      { readStatus: 1, readAt: new Date() }
    );

    return {
      message: `已标记 ${updateResult.affected || 0} 条通知为已读`,
      count: updateResult.affected || 0,
      readAt: new Date()
    };
  }

  async remove(notificationId: number) {
    await this.recipientRepo.delete({ notificationId });
    await this.notificationRepo.delete(notificationId);
  }

  async removeRecipient(recipientId: number, currentUserId: number) {
    // 查找要删除的通知接收者记录
    const recipient = await this.recipientRepo.findOne({
      where: { id: recipientId }
    });

    if (!recipient) {
      throw new NotFoundException('通知记录不存在');
    }

    // 检查是否为当前用户的记录
    if (recipient.userId !== currentUserId) {
      throw new BadRequestException('无权删除其他用户的通知记录');
    }

    // 删除接收者记录
    await this.recipientRepo.delete(recipientId);

    return {
      success: true,
      message: '通知记录已删除'
    };
  }

  private async resolveTargetUserIds(targetUsers: number[], targetRoles: string[], targetDepts: number[]) {
    const userIds = new Set<number>();

    for (const uid of targetUsers || []) {
      if (uid) userIds.add(Number(uid));
    }

    if (targetRoles && targetRoles.length > 0) {
      const usersByRoles = await this.userRepo
        .createQueryBuilder('u')
        .where(
          targetRoles
            .map((_, idx) => `JSON_CONTAINS(u.roles, :role${idx}, '$')`)
            .join(' OR '),
          Object.fromEntries(targetRoles.map((r, idx) => [`role${idx}`, JSON.stringify(r)])),
        )
        .getMany();
      usersByRoles.forEach((u) => userIds.add(u.id));
    }

    if (targetDepts && targetDepts.length > 0) {
      const usersByDept = await this.userRepo.find({ where: { dept_id: In(targetDepts) } });
      usersByDept.forEach((u) => userIds.add(u.id));
    }

    return Array.from(userIds);
  }

  /**
   * 定时清理半年前的通知数据（每天凌晨3点执行）
   * 清理sys_notification和sys_notification_recipient表中超过6个月的数据
   */
  @Cron('0 3 * * *')
  async cleanupOldNotifications() {
    this.logger.log('开始执行定时任务：清理半年前的通知数据');
    
    try {
      // 计算6个月前的日期
      const sixMonthsAgo = new Date();
      sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);
      
      this.logger.log(`将清理 ${sixMonthsAgo.toISOString()} 之前的通知数据`);

      // 先查询要删除的通知数量（用于统计）
      const notificationsToDelete = await this.notificationRepo.count({
        where: { createdAt: LessThan(sixMonthsAgo) }
      });

      const recipientsToDelete = await this.recipientRepo
        .createQueryBuilder('recipient')
        .leftJoin('recipient.notification', 'notification')
        .where('notification.createdAt < :date', { date: sixMonthsAgo })
        .getCount();

      // 删除通知记录（由于CASCADE设置，接收者记录会自动删除）
      const notificationResult = await this.notificationRepo.delete({
        createdAt: LessThan(sixMonthsAgo),
      });

      const totalCleaned = notificationsToDelete + recipientsToDelete;
      if (totalCleaned > 0) {
        this.logger.log(`定时清理任务完成，共清理 ${notificationsToDelete} 条通知记录和 ${recipientsToDelete} 条接收者记录`);
      } else {
        this.logger.log('定时清理任务完成，没有需要清理的数据');
      }
    } catch (error) {
      this.logger.error('清理半年前通知数据失败', error);
    }
  }
} 