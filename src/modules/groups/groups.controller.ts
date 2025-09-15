import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
  ParseIntPipe,
  HttpStatus,
  ValidationPipe,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiParam,
  ApiQuery,
  ApiBody,
} from '@nestjs/swagger';
import { GroupsService } from './groups.service';
import { CreateGroupDto } from './dto/create-group.dto';
import { UpdateGroupDto } from './dto/update-group.dto';
import { QueryGroupDto } from './dto/query-group.dto';
import { UpdateAlertSettingsDto } from './dto/update-alert-settings.dto';
import { UpdateLastMessageDto } from './dto/update-last-message.dto';
import { Public } from '../auth/decorators/public.decorator';

/**
 * 群组管理控制器
 * 提供群组的增删查改API接口
 * 注意：所有接口均为公开访问，无需认证
 */
@ApiTags('群组管理')
@Public()
@Controller('groups')
export class GroupsController {
  constructor(private readonly groupsService: GroupsService) {}

  /**
   * 创建群组
   */
  @Post()
  @ApiOperation({
    summary: '创建群组',
    description: '创建一个新的群组，需要提供聊天ID、群组名称、所有者等信息',
  })
  @ApiResponse({
    status: HttpStatus.CREATED,
    description: '群组创建成功',
    schema: {
      example: {
        id: 1,
        chatId: 'chat_123456789',
        name: '项目讨论群',
        owner: 'user_admin',
        members: ['user1', 'user2', 'user3'],
        lastMessage: null,
        lastEmployeeMessage: null,
        lastCustomerMessage: null,
        needAlert: false,
        alertLevel: 0,
        createdAt: '2025-01-17T10:00:00.000Z',
        updatedAt: '2025-01-17T10:00:00.000Z',
      },
    },
  })
  @ApiResponse({
    status: HttpStatus.CONFLICT,
    description: '聊天ID已存在',
    schema: {
      example: {
        statusCode: 409,
        message: '聊天ID "chat_123456789" 已存在',
        error: 'Conflict',
      },
    },
  })
  async create(@Body(ValidationPipe) createGroupDto: CreateGroupDto) {
    return await this.groupsService.create(createGroupDto);
  }

  /**
   * 查询群组列表
   */
  @Get()
  @ApiOperation({
    summary: '查询群组列表',
    description: '支持分页查询和多条件筛选群组列表。如需根据聊天ID查询特定群组，请使用 GET /api/groups/chat/{chatId} 接口',
  })
  @ApiQuery({ name: 'page', required: false, description: '页码，默认为1' })
  @ApiQuery({ name: 'pageSize', required: false, description: '每页数量，默认为10' })
  @ApiQuery({ name: 'name', required: false, description: '群组名称筛选（支持模糊查询）' })
  @ApiQuery({ name: 'owner', required: false, description: '群组所有者筛选' })
  @ApiQuery({ name: 'needAlert', required: false, description: '是否需要提醒筛选' })
  @ApiQuery({ name: 'alertLevel', required: false, description: '提醒级别筛选' })
  @ApiQuery({ name: 'sortField', required: false, description: '排序字段' })
  @ApiQuery({ name: 'sortOrder', required: false, description: '排序方式（ASC/DESC）' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: '查询成功',
    schema: {
      example: {
        data: [
          {
            id: 1,
            chatId: 'chat_123456789',
            name: '项目讨论群',
            owner: 'user_admin',
            members: ['user1', 'user2', 'user3'],
            lastMessage: { content: '欢迎加入群组', sender: 'user_admin', timestamp: '2025-01-17T10:00:00Z' },
            lastEmployeeMessage: null,
            lastCustomerMessage: null,
            needAlert: false,
            alertLevel: 0,
            createdAt: '2025-01-17T10:00:00.000Z',
            updatedAt: '2025-01-17T10:00:00.000Z',
          },
        ],
        total: 1,
        page: 1,
        pageSize: 10,
        totalPages: 1,
      },
    },
  })
  async findAll(@Query(ValidationPipe) queryDto: QueryGroupDto) {
    return await this.groupsService.findAll(queryDto);
  }

  /**
   * 根据ID查询群组详情
   */
  @Get(':id')
  @ApiOperation({
    summary: '查询群组详情',
    description: '根据群组ID查询单个群组的详细信息',
  })
  @ApiParam({ name: 'id', description: '群组ID' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: '查询成功',
    schema: {
      example: {
        id: 1,
        chatId: 'chat_123456789',
        name: '项目讨论群',
        owner: 'user_admin',
        members: ['user1', 'user2', 'user3'],
        lastMessage: { content: '欢迎加入群组', sender: 'user_admin', timestamp: '2025-01-17T10:00:00Z' },
        lastEmployeeMessage: null,
        lastCustomerMessage: null,
        needAlert: false,
        alertLevel: 0,
        createdAt: '2025-01-17T10:00:00.000Z',
        updatedAt: '2025-01-17T10:00:00.000Z',
      },
    },
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: '群组不存在',
    schema: {
      example: {
        statusCode: 404,
        message: 'ID为 1 的群组不存在',
        error: 'Not Found',
      },
    },
  })
  async findOne(@Param('id', ParseIntPipe) id: number) {
    return await this.groupsService.findOne(id);
  }

  /**
   * 根据聊天ID查询群组
   */
  @Get('chat/:chatId')
  @ApiOperation({
    summary: '根据聊天ID查询群组',
    description: '根据聊天ID查询群组信息',
  })
  @ApiParam({ name: 'chatId', description: '聊天ID' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: '查询成功',
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: '群组不存在',
  })
  async findByChatId(@Param('chatId') chatId: string) {
    return await this.groupsService.findByChatId(chatId);
  }

  /**
   * 更新群组信息
   */
  @Patch(':id')
  @ApiOperation({
    summary: '更新群组信息',
    description: '根据群组ID更新群组信息',
  })
  @ApiParam({ name: 'id', description: '群组ID' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: '更新成功',
    schema: {
      example: {
        id: 1,
        chatId: 'chat_123456789',
        name: '项目讨论群（已更新）',
        owner: 'user_admin',
        members: ['user1', 'user2', 'user3', 'user4'],
        lastMessage: { content: '群组信息已更新', sender: 'user_admin', timestamp: '2025-01-17T11:00:00Z' },
        lastEmployeeMessage: null,
        lastCustomerMessage: null,
        needAlert: true,
        alertLevel: 1,
        createdAt: '2025-01-17T10:00:00.000Z',
        updatedAt: '2025-01-17T11:00:00.000Z',
      },
    },
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: '群组不存在',
  })
  @ApiResponse({
    status: HttpStatus.CONFLICT,
    description: '聊天ID已存在',
  })
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body(ValidationPipe) updateGroupDto: UpdateGroupDto,
  ) {
    return await this.groupsService.update(id, updateGroupDto);
  }

  /**
   * 删除群组
   */
  @Delete(':id')
  @ApiOperation({
    summary: '删除群组',
    description: '根据群组ID删除群组',
  })
  @ApiParam({ name: 'id', description: '群组ID' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: '删除成功',
    schema: {
      example: {
        message: '群组 "项目讨论群" 已成功删除',
      },
    },
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: '群组不存在',
  })
  async remove(@Param('id', ParseIntPipe) id: number) {
    return await this.groupsService.remove(id);
  }

  /**
   * 批量删除群组
   */
  @Delete('batch/remove')
  @ApiOperation({
    summary: '批量删除群组',
    description: '根据群组ID数组批量删除群组',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: '批量删除成功',
    schema: {
      example: {
        message: '成功删除 3 个群组',
        deletedCount: 3,
      },
    },
  })
  async removeMany(@Body('ids') ids: number[]) {
    return await this.groupsService.removeMany(ids);
  }

  /**
   * 更新群组最后消息
   */
  @Patch(':id/last-message')
  @ApiOperation({
    summary: '更新群组最后消息',
    description: '更新群组的最后一条消息信息。根据type参数决定更新哪个消息字段：general更新lastMessage，employee更新lastEmployeeMessage，customer更新lastCustomerMessage',
  })
  @ApiParam({ name: 'id', description: '群组ID' })
  @ApiQuery({ 
    name: 'type', 
    required: false, 
    description: '消息类型：general（普通消息，默认）、employee（员工消息）、customer（客户消息）',
    enum: ['general', 'employee', 'customer']
  })
  @ApiBody({
    type: UpdateLastMessageDto,
    description: '消息数据',
    examples: {
      employee_message: {
        summary: '员工消息示例',
        description: '员工发送的消息',
        value: {
          from: 'emp_123456',
          msgId: 'test123',
          content: '这是一条员工测试消息',
          fromType: 'employee',
          createTime: '2025-07-21T16:00:00Z'
        }
      },
      customer_message: {
        summary: '客户消息示例',
        description: '客户发送的消息',
        value: {
          from: 'cust_789012',
          msgId: 'test456',
          content: '这是一条客户测试消息',
          fromType: 'customer',
          createTime: '2025-07-21T16:05:00Z'
        }
      },
      general_message: {
        summary: '普通消息示例',
        description: '普通消息格式',
        value: {
          from: 'user_456789',
          msgId: 'test789',
          content: '这是一条普通测试消息',
          fromType: 'employee',
          createTime: '2025-07-21T16:10:00Z'
        }
      }
    }
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: '更新成功',
    schema: {
      example: {
        id: 1,
        chatId: 'chat_123456789',
        name: '项目讨论群',
        owner: 'user_admin',
        members: ['user1', 'user2', 'user3'],
        lastMessage: {
          content: '大家好，欢迎加入我们的讨论群！',
          sender: {
            id: 'user_123456',
            name: '张三',
            type: 'employee'
          },
          timestamp: '2025-09-15T10:30:00.000Z',
          messageId: 'msg_987654321',
          messageType: 'text'
        },
        lastEmployeeMessage: null,
        lastCustomerMessage: null,
        needAlert: false,
        alertLevel: 0,
        createdAt: '2025-01-17T10:00:00.000Z',
        updatedAt: '2025-09-15T10:30:00.000Z',
      },
    },
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: '群组不存在',
    schema: {
      example: {
        statusCode: 404,
        message: 'ID为 1 的群组不存在',
        error: 'Not Found',
      },
    },
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: '请求参数错误',
    schema: {
      example: {
        statusCode: 400,
        message: ['content should not be empty', 'sender must be an object'],
        error: 'Bad Request',
      },
    },
  })
  async updateLastMessage(
    @Param('id', ParseIntPipe) id: number,
    @Body(ValidationPipe) updateLastMessageDto: UpdateLastMessageDto,
    @Query('type') messageType?: 'general' | 'employee' | 'customer',
  ) {
    return await this.groupsService.updateLastMessage(id, updateLastMessageDto, messageType);
  }

  /**
   * 更新群组提醒设置
   */
  @Patch(':id/alert-settings')
  @ApiOperation({
    summary: '更新群组提醒设置',
    description: '更新群组的提醒开关和提醒级别',
  })
  @ApiParam({ name: 'id', description: '群组ID' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: '更新成功',
  })
  async updateAlertSettings(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateAlertSettingsDto: UpdateAlertSettingsDto,
  ) {
    return await this.groupsService.updateAlertSettings(
      id, 
      updateAlertSettingsDto.needAlert, 
      updateAlertSettingsDto.alertLevel
    );
  }

  /**
   * 获取需要提醒的群组列表
   */
  @Get('alerts/list')
  @ApiOperation({
    summary: '获取需要提醒的群组列表',
    description: '查询所有需要提醒的群组',
  })
  @ApiQuery({ name: 'alertLevel', required: false, description: '提醒级别筛选' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: '查询成功',
    schema: {
      example: [
        {
          id: 1,
          chatId: 'chat_123456789',
          name: '项目讨论群',
          owner: 'user_admin',
          needAlert: true,
          alertLevel: 1,
          createdAt: '2025-01-17T10:00:00.000Z',
          updatedAt: '2025-01-17T11:00:00.000Z',
        },
      ],
    },
  })
  async getGroupsNeedingAlert(@Query('alertLevel') alertLevel?: string) {
    const level = alertLevel ? parseInt(alertLevel) : undefined;
    return await this.groupsService.getGroupsNeedingAlert(level);
  }
} 