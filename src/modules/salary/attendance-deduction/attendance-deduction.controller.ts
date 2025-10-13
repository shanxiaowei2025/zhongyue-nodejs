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
  BadRequestException,
} from '@nestjs/common';
import { AttendanceDeductionService } from './attendance-deduction.service';
import { CreateAttendanceDeductionDto } from './dto/create-attendance-deduction.dto';
import { UpdateAttendanceDeductionDto } from './dto/update-attendance-deduction.dto';
import { QueryAttendanceDeductionDto } from './dto/query-attendance-deduction.dto';
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

@ApiTags('薪资管理考勤扣款')
@ApiBearerAuth()
@Controller('attendance-deduction')
@UseGuards(JwtAuthGuard, RolesGuard)
export class AttendanceDeductionController {
  constructor(
    private readonly attendanceDeductionService: AttendanceDeductionService,
  ) {}

  @Post()
  @Roles('salary_admin', 'super_admin')
  @ApiOperation({ summary: '创建考勤扣款记录' })
  @ApiResponse({ status: 201, description: '创建成功' })
  @ApiResponse({ status: 403, description: '没有权限' })
  @ApiBody({ type: CreateAttendanceDeductionDto, description: '考勤扣款信息' })
  create(@Body() createAttendanceDeductionDto: CreateAttendanceDeductionDto) {
    return this.attendanceDeductionService.create(createAttendanceDeductionDto);
  }

  @Post('import')
  @Roles('salary_admin', 'super_admin')
  @ApiOperation({ summary: '导入考勤扣款数据(CSV/XLSX)' })
  @ApiResponse({
    status: 201,
    description: '导入成功（可能包含部分跳过的员工）',
    schema: {
      type: 'object',
      properties: {
        success: { type: 'boolean', example: true },
        message: { type: 'string', example: '成功导入 4 条记录，跳过 1 个未录入员工' },
        warning: { type: 'string', example: '部分员工姓名不匹配已跳过' },
        importedCount: { type: 'number', example: 4 },
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
        name_mismatch_details: {
          type: 'object',
          properties: {
            employees_not_recorded: {
              type: 'array',
              items: { type: 'string' },
              example: ['梁硕'],
              description: '导入文件中存在但员工表中不存在的姓名（已跳过）'
            },
            employees_no_attendance: {
              type: 'array', 
              items: { type: 'string' },
              example: ['王五', '赵六'],
              description: '员工表中存在但导入文件中不存在的姓名（仅提醒）'
            }
          }
        }
      },
    },
  })
  @ApiResponse({
    status: 400,
    description: '导入失败',
    schema: {
      oneOf: [
        {
          type: 'object',
          properties: {
            success: { type: 'boolean', example: false },
            error: { type: 'string', example: '没有有效数据可导入' },
            details: { type: 'string', example: '导入文件中的所有员工都不存在于员工表中' },
            error_type: { type: 'string', example: 'no_valid_data' },
            message: { type: 'string', example: '导入文件中的所有员工都不存在于员工表中，请检查数据后重新导入。' },
            name_mismatch_details: {
              type: 'object',
              properties: {
                employees_not_recorded: {
                  type: 'array',
                  items: { type: 'string' },
                  example: ['张三', '李四'],
                  description: '导入文件中存在但员工表中不存在的姓名'
                },
                employees_no_attendance: {
                  type: 'array', 
                  items: { type: 'string' },
                  example: ['王五', '赵六'],
                  description: '员工表中存在但导入文件中不存在的姓名'
                }
              }
            }
          }
        },
        {
          type: 'object',
          properties: {
            success: { type: 'boolean', example: false },
            error: { type: 'string', example: '导入失败' },
            details: { type: 'string', example: '文件格式错误' },
            error_type: { type: 'string', example: 'file_processing' },
            importedCount: { type: 'number', example: 0 },
            failedCount: { type: 'number', example: 0 },
            failedRecords: { type: 'array', example: [] }
          }
        }
      ]
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
            'CSV或Excel文件，包含以下列：姓名、考勤扣款、全勤奖励、年月、备注。注意：导入的员工姓名必须与员工表中的在职员工姓名完全一致。',
        },
      },
    },
  })
  @UseInterceptors(
    FileInterceptor('file', {
      storage: memoryStorage(),
      fileFilter: (req, file, callback) => {
        const allowedTypes = [
          'text/csv',
          'application/vnd.ms-excel',
          'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        ];
        if (allowedTypes.includes(file.mimetype)) {
          callback(null, true);
        } else {
          callback(new Error('只支持CSV和Excel文件格式'), false);
        }
      },
      limits: {
        fileSize: 10 * 1024 * 1024, // 10MB
      },
    }),
  )
  async import(@UploadedFile() file: Express.Multer.File) {
    if (!file) {
      throw new BadRequestException('请选择要导入的文件');
    }

    try {
      const result = await this.attendanceDeductionService.importData(file);
      
      // 如果有姓名不匹配的情况，在成功响应中包含警告信息
      if (result && typeof result === 'object' && 'name_mismatch_details' in result && result.name_mismatch_details) {
        const typedResult = result as any;
        return {
          ...typedResult,
          warning: '部分员工姓名不匹配已跳过',
          message: `成功导入 ${typedResult.importedCount || 0} 条记录，跳过 ${typedResult.name_mismatch_details?.employees_not_recorded?.length || 0} 个未录入员工`
        };
      }
      
      return result;
    } catch (error) {
      console.error('导入考勤扣款数据失败:', error);
      
      // 检查是否是时间验证错误
      if (error.error_type === 'invalid_date_range') {
        throw new BadRequestException({
          success: false,
          error: '时间验证失败',
          details: error.details || '只能导入上个月数据，导入失败。',
          error_type: 'invalid_date_range',
          invalidRecords: error.invalidRecords || [],
          message: '只能导入上个月数据，导入失败。'
        });
      }
      
      // 检查是否是无有效数据错误
      if (error.error_type === 'no_valid_data') {
        throw new BadRequestException({
          success: false,
          error: '没有有效数据可导入',
          details: error.error_message,
          error_type: 'no_valid_data',
          name_mismatch_details: error.name_mismatch_details,
          message: '导入文件中的所有员工都不存在于员工表中，请检查数据后重新导入。'
        });
      }
      
      // 检查是否是姓名对比错误（保留兼容性）
      if (error.error_type === 'name_mismatch') {
        throw new BadRequestException({
          success: false,
          error: '员工姓名对比失败',
          details: error.details || error.error_message,
          error_type: 'name_mismatch',
          name_mismatch_details: error.name_mismatch_details,
          message: '导入的员工姓名与员工表中的在职员工不匹配，请检查数据后重新导入。'
        });
      }
      
      // 其他类型的错误
      throw new BadRequestException({
        success: false,
        error: error.error || '导入失败',
        details: error.details || error.message || '未知错误',
        importedCount: error.importedCount || 0,
        failedCount: error.failedCount || 0,
        failedRecords: error.failedRecords || [],
      });
    }
  }

  @Get()
  @Roles('salary_admin', 'super_admin')
  @ApiOperation({ summary: '获取考勤扣款列表' })
  @ApiResponse({ status: 200, description: '获取成功' })
  findAll(@Query() query: QueryAttendanceDeductionDto) {
    return this.attendanceDeductionService.findAll(query);
  }

  @Get(':id')
  @Roles('salary_admin', 'super_admin')
  @ApiOperation({ summary: '获取考勤扣款详情' })
  @ApiResponse({ status: 200, description: '获取成功' })
  @ApiResponse({ status: 404, description: '记录不存在' })
  @ApiParam({ name: 'id', description: '考勤扣款ID' })
  findOne(@Param('id') id: string) {
    const safeId = safeIdParam(id);
    if (safeId === null) {
      return { success: false, message: '无效的ID参数' };
    }
    return this.attendanceDeductionService.findOne(safeId);
  }

  @Patch(':id')
  @Roles('salary_admin', 'super_admin')
  @ApiOperation({ summary: '更新考勤扣款记录' })
  @ApiResponse({ status: 200, description: '更新成功' })
  @ApiResponse({ status: 404, description: '记录不存在' })
  @ApiParam({ name: 'id', description: '考勤扣款ID' })
  @ApiBody({
    type: UpdateAttendanceDeductionDto,
    description: '考勤扣款更新信息',
  })
  update(
    @Param('id') id: string,
    @Body() updateAttendanceDeductionDto: UpdateAttendanceDeductionDto,
  ) {
    const safeId = safeIdParam(id);
    if (safeId === null) {
      return { success: false, message: '无效的ID参数' };
    }
    return this.attendanceDeductionService.update(
      safeId,
      updateAttendanceDeductionDto,
    );
  }

  @Delete(':id')
  @Roles('salary_admin', 'super_admin')
  @ApiOperation({ summary: '删除考勤扣款记录' })
  @ApiResponse({ status: 200, description: '删除成功' })
  @ApiResponse({ status: 404, description: '记录不存在' })
  @ApiParam({ name: 'id', description: '考勤扣款ID' })
  remove(@Param('id') id: string) {
    const safeId = safeIdParam(id);
    if (safeId === null) {
      return { success: false, message: '无效的ID参数' };
    }
    return this.attendanceDeductionService.remove(safeId);
  }
}
