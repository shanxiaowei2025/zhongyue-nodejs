import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { GroupsService } from './groups.service';
import { GroupsController } from './groups.controller';
import { Group } from './entities/group.entity';

/**
 * 群组管理模块
 * 提供群组相关的功能和服务
 */
@Module({
  imports: [
    TypeOrmModule.forFeature([Group]),
  ],
  controllers: [GroupsController],
  providers: [GroupsService],
  exports: [GroupsService, TypeOrmModule],
})
export class GroupsModule {} 