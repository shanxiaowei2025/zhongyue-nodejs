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
  FileTypeValidator,
} from '@nestjs/common';
import { SubsidySummaryService } from './subsidy-summary.service';
import { CreateSubsidySummaryDto } from './dto/create-subsidy-summary.dto';
import { UpdateSubsidySummaryDto } from './dto/update-subsidy-summary.dto';
import { QuerySubsidySummaryDto } from './dto/query-subsidy-summary.dto';
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
import { FileInterceptor } from '@nestjs/platform-express';
import { memoryStorage } from 'multer';

@ApiTags('薪资管理补贴合计')
@ApiBearerAuth()
@Controller('subsidy-summary')
@UseGuards(JwtAuthGuard, RolesGuard)
export class SubsidySummaryController {
  constructor(private readonly subsidySummaryService: SubsidySummaryService) {}

  @Post()
  @Roles('salary_admin', 'super_admin')
  @ApiOperation({ summary: '创建补贴合计记录' })
  @ApiResponse({ status: 201, description: '创建成功' })
  @ApiResponse({ status: 403, description: '没有权限' })
  @ApiBody({ type: CreateSubsidySummaryDto, description: '补贴合计信息' })
  create(@Body() createSubsidySummaryDto: CreateSubsidySummaryDto) {
    return this.subsidySummaryService.create(createSubsidySummaryDto);
  }

  @Post('import')
  @Roles('salary_admin', 'super_admin')
  @ApiOperation({ summary: '导入补贴合计数据(CSV/XLSX)' })
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
                example: ['年月格式错误'],
              },
              reason: { type: 'string', example: '数据验证失败: 年月格式错误' },
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
            'CSV或Excel文件，包含以下列：姓名、部门、职位、部门负责人补贴、岗位津贴、油补、餐补8元/天、补贴合计(可选)、年月',
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
        validators: [], // 移除这里的验证器，因为我们已经在fileFilter中处理了
        fileIsRequired: true,
      }),
    )
    file: Express.Multer.File,
  ) {
    return this.subsidySummaryService.importData(file);
  }

  @Get()
  @Roles('salary_admin', 'super_admin')
  @ApiOperation({ summary: '获取补贴合计列表' })
  @ApiResponse({ status: 200, description: '获取成功' })
  findAll(@Query() query: QuerySubsidySummaryDto) {
    return this.subsidySummaryService.findAll(query);
  }

  @Get(':id')
  @Roles('salary_admin', 'super_admin')
  @ApiOperation({ summary: '获取补贴合计详情' })
  @ApiResponse({ status: 200, description: '获取成功' })
  @ApiResponse({ status: 404, description: '记录不存在' })
  @ApiParam({ name: 'id', description: '补贴合计ID' })
  findOne(@Param('id') id: string) {
    const safeId = safeIdParam(id);
    if (safeId === null) {
      return { success: false, message: '无效的ID参数' };
    }
    return this.subsidySummaryService.findOne(safeId);
  }

  @Patch(':id')
  @Roles('salary_admin', 'super_admin')
  @ApiOperation({ summary: '更新补贴合计记录' })
  @ApiResponse({ status: 200, description: '更新成功' })
  @ApiResponse({ status: 404, description: '记录不存在' })
  @ApiParam({ name: 'id', description: '补贴合计ID' })
  @ApiBody({ type: UpdateSubsidySummaryDto, description: '补贴合计更新信息' })
  update(
    @Param('id') id: string,
    @Body() updateSubsidySummaryDto: UpdateSubsidySummaryDto,
  ) {
    const safeId = safeIdParam(id);
    if (safeId === null) {
      return { success: false, message: '无效的ID参数' };
    }
    return this.subsidySummaryService.update(safeId, updateSubsidySummaryDto);
  }

  @Delete(':id')
  @Roles('salary_admin', 'super_admin')
  @ApiOperation({ summary: '删除补贴合计记录' })
  @ApiResponse({ status: 200, description: '删除成功' })
  @ApiResponse({ status: 404, description: '记录不存在' })
  @ApiParam({ name: 'id', description: '补贴合计ID' })
  remove(@Param('id') id: string) {
    const safeId = safeIdParam(id);
    if (safeId === null) {
      return { success: false, message: '无效的ID参数' };
    }
    return this.subsidySummaryService.remove(safeId);
  }
}
