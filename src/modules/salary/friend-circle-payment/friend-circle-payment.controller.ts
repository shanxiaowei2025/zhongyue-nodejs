import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
  UseGuards,
  UseInterceptors,
  UploadedFile,
  ParseFilePipe,
  Req,
  BadRequestException,
} from '@nestjs/common';
import { FriendCirclePaymentService } from './friend-circle-payment.service';
import { CreateFriendCirclePaymentDto } from './dto/create-friend-circle-payment.dto';
import { UpdateFriendCirclePaymentDto } from './dto/update-friend-circle-payment.dto';
import { QueryFriendCirclePaymentDto } from './dto/query-friend-circle-payment.dto';
import { JwtAuthGuard } from 'src/modules/auth/guards/jwt-auth.guard';
import { RolesGuard } from 'src/modules/auth/guards/roles.guard';
import { Roles } from 'src/modules/auth/decorators/roles.decorator';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiParam,
  ApiBody,
  ApiConsumes,
} from '@nestjs/swagger';
import { safeIdParam } from 'src/common/utils';
import { Request } from 'express';
import { FileInterceptor } from '@nestjs/platform-express';
import { memoryStorage } from 'multer';

@ApiTags('薪资管理朋友圈扣款')
@ApiBearerAuth()
@Controller('friend-circle-payment')
@UseGuards(JwtAuthGuard, RolesGuard)
export class FriendCirclePaymentController {
  constructor(
    private readonly friendCirclePaymentService: FriendCirclePaymentService,
  ) {}

  @Post()
  @Roles('salary_admin', 'super_admin')
  @ApiOperation({ summary: '创建朋友圈扣款记录' })
  @ApiResponse({ status: 201, description: '创建成功' })
  @ApiResponse({ status: 403, description: '没有权限' })
  @ApiBody({
    type: CreateFriendCirclePaymentDto,
    description: '朋友圈扣款信息',
  })
  create(@Body() createFriendCirclePaymentDto: CreateFriendCirclePaymentDto) {
    return this.friendCirclePaymentService.create(createFriendCirclePaymentDto);
  }

  @Post('import')
  @Roles('salary_admin', 'super_admin', 'salary_uploader')
  @ApiOperation({ summary: '导入朋友圈扣款数据(CSV/XLSX)' })
  @ApiResponse({
    status: 201,
    description: '导入成功',
    schema: {
      type: 'object',
      properties: {
        success: { type: 'boolean', example: true },
        message: { type: 'string', example: '成功导入 10 条记录' },
        importedCount: { type: 'number', example: 10 },
        failedCount: { type: 'number', example: 0 },
        failedRecords: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              row: { type: 'number', example: 3 },
              name: { type: 'string', example: '张三' },
              errors: {
                type: 'array',
                items: { type: 'string' },
                example: ['是否完成格式错误'],
              },
              reason: {
                type: 'string',
                example: '数据验证失败: 是否完成格式错误',
              },
            },
          },
          example: [],
        },
      },
    },
  })
  @ApiResponse({
    status: 400,
    description: '导入失败',
    schema: {
      type: 'object',
      properties: {
        success: { type: 'boolean', example: false },
        error: { type: 'string', example: '导入失败' },
        details: { type: 'string', example: '文件格式错误' },
      },
    },
  })
  @ApiResponse({ status: 403, description: '没有权限' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    description: '要导入的CSV或Excel文件',
    schema: {
      type: 'object',
      properties: {
        file: {
          type: 'string',
          format: 'binary',
          description:
            'CSV或Excel文件，包含以下列：姓名、第一周、第二周、第三周、第四周、总数(可选)、扣款、是否完成(1:已完成,0:未完成)、年月',
        },
      },
    },
  })
  @UseInterceptors(
    FileInterceptor('file', {
      storage: memoryStorage(),
      fileFilter: (req, file, cb) => {
        // 只允许上传CSV和XLSX文件
        const allowedTypes = [
          'text/csv',
          'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
          'application/vnd.ms-excel',
          'application/octet-stream', // 有些浏览器可能会用这个MIME类型
        ];

        // 检查MIME类型
        const mimeTypeValid = allowedTypes.includes(file.mimetype);

        // 检查文件扩展名
        const originalName = file.originalname.toLowerCase();
        const extValid =
          originalName.endsWith('.csv') ||
          originalName.endsWith('.xlsx') ||
          originalName.endsWith('.xls');

        if (mimeTypeValid && extValid) {
          cb(null, true);
        } else {
          cb(
            new Error(
              `只允许上传 CSV 或 Excel (XLSX/XLS) 文件! 当前文件: ${file.originalname}, MIME类型: ${file.mimetype}`,
            ),
            false,
          );
        }
      },
    }),
  )
  async importData(
    @UploadedFile(
      new ParseFilePipe({
        validators: [], // 在fileFilter中已处理验证
        fileIsRequired: true,
      }),
    )
    file: Express.Multer.File,
  ) {
    try {
      return await this.friendCirclePaymentService.importData(file);
    } catch (error) {
      if (error instanceof BadRequestException) {
        throw error;
      }
      throw new BadRequestException(`导入失败: ${error.message}`);
    }
  }

  @Get()
  @Roles('salary_admin', 'super_admin')
  @ApiOperation({ summary: '获取朋友圈扣款列表' })
  @ApiResponse({ status: 200, description: '获取成功' })
  findAll(@Query() query: QueryFriendCirclePaymentDto, @Req() req: Request) {
    return this.friendCirclePaymentService.findAll(query, req);
  }

  @Get(':id')
  @Roles('salary_admin', 'super_admin')
  @ApiOperation({ summary: '获取朋友圈扣款详情' })
  @ApiResponse({ status: 200, description: '获取成功' })
  @ApiResponse({ status: 404, description: '记录不存在' })
  @ApiParam({ name: 'id', description: '朋友圈扣款ID' })
  findOne(@Param('id') id: string) {
    return this.friendCirclePaymentService.findOne(safeIdParam(id, null, true));
  }

  @Patch(':id')
  @Roles('salary_admin', 'super_admin')
  @ApiOperation({ summary: '更新朋友圈扣款记录' })
  @ApiResponse({ status: 200, description: '更新成功' })
  @ApiResponse({ status: 404, description: '记录不存在' })
  @ApiParam({ name: 'id', description: '朋友圈扣款ID' })
  @ApiBody({
    type: UpdateFriendCirclePaymentDto,
    description: '朋友圈扣款更新信息',
  })
  update(
    @Param('id') id: string,
    @Body() updateFriendCirclePaymentDto: UpdateFriendCirclePaymentDto,
  ) {
    return this.friendCirclePaymentService.update(
      safeIdParam(id, null, true),
      updateFriendCirclePaymentDto,
    );
  }

  @Delete(':id')
  @Roles('salary_admin', 'super_admin')
  @ApiOperation({ summary: '删除朋友圈扣款记录' })
  @ApiResponse({ status: 200, description: '删除成功' })
  @ApiResponse({ status: 404, description: '记录不存在' })
  @ApiParam({ name: 'id', description: '朋友圈扣款ID' })
  remove(@Param('id') id: string) {
    return this.friendCirclePaymentService.remove(safeIdParam(id, null, true));
  }
}
