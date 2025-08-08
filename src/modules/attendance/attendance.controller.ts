import {
  Controller,
  Post,
  Get,
  Patch,
  Delete,
  Query,
  Body,
  Param,
  ParseIntPipe,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { AttendanceScheduleService } from './attendance-schedule.service';
import { AttendanceService } from './attendance.service';
import {
  ApiTags,
  ApiOperation,
  ApiQuery,
  ApiParam,
  ApiResponse,
} from '@nestjs/swagger';
import {
  QueryAttendanceDto,
  AttendanceExceptionType,
} from './dto/query-attendance.dto';
import { CreateAttendanceDto } from './dto/create-attendance.dto';
import { UpdateAttendanceDto } from './dto/update-attendance.dto';
import { Attendance } from './entities/attendance.entity';

@ApiTags('考勤')
@Controller('attendance')
export class AttendanceController {
  constructor(
    private readonly attendanceScheduleService: AttendanceScheduleService,
    private readonly attendanceService: AttendanceService,
  ) {}

  @Post('sync')
  @ApiOperation({ summary: '手动同步企业微信考勤数据' })
  @HttpCode(HttpStatus.OK)
  async syncAttendanceData() {
    await this.attendanceScheduleService.manualSync();
    return {
      code: 0,
      message: '考勤数据同步任务已启动',
    };
  }

  @Get()
  @ApiOperation({ summary: '查询考勤数据列表' })
  async findAll(@Query() query: QueryAttendanceDto) {
    const { items, total } = await this.attendanceService.findAll(query);

    // 构建返回数据，包含查询条件信息
    return {
      code: 0,
      data: {
        items,
        total,
        page: query.page || 1,
        pageSize: query.pageSize || 10,
        filters: {
          name: query.name || null,
          acctid: query.acctid || null,
          departs_name: query.departs_name || null,
          startDate: query.startDate || null,
          endDate: query.endDate || null,
          hasException: query.hasException || 0,
          exceptionType: query.exceptionType || 0,
          day_type: query.day_type !== undefined ? query.day_type : null,
          ot_status: query.ot_status !== undefined ? query.ot_status : null,
        },
        sort: {
          field: query.sortField || 'date',
          order: query.sortOrder || 'DESC',
        },
      },
      message: '查询成功',
    };
  }

  @Get(':id')
  @ApiOperation({ summary: '获取考勤记录详情' })
  @ApiParam({ name: 'id', description: '考勤记录ID', type: 'number' })
  @ApiResponse({ status: 200, description: '操作成功', type: Attendance })
  @ApiResponse({ status: 404, description: '记录不存在' })
  async findOne(@Param('id', ParseIntPipe) id: number) {
    const attendance = await this.attendanceService.findOne(id);
    return {
      code: 0,
      data: attendance,
      message: '查询成功',
    };
  }

  @Post()
  @ApiOperation({ summary: '创建考勤记录' })
  @ApiResponse({ status: 201, description: '创建成功', type: Attendance })
  @ApiResponse({ status: 400, description: '参数错误' })
  async create(@Body() createAttendanceDto: CreateAttendanceDto) {
    const attendance = await this.attendanceService.create(createAttendanceDto);
    return {
      code: 0,
      data: attendance,
      message: '创建成功',
    };
  }

  @Patch(':id')
  @ApiOperation({ summary: '更新考勤记录' })
  @ApiParam({ name: 'id', description: '考勤记录ID', type: 'number' })
  @ApiResponse({ status: 200, description: '更新成功', type: Attendance })
  @ApiResponse({ status: 404, description: '记录不存在' })
  @ApiResponse({ status: 400, description: '参数错误' })
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateAttendanceDto: UpdateAttendanceDto,
  ) {
    // 确保ID一致
    updateAttendanceDto.id = id;

    const attendance = await this.attendanceService.update(updateAttendanceDto);
    return {
      code: 0,
      data: attendance,
      message: '更新成功',
    };
  }

  @Delete(':id')
  @ApiOperation({ summary: '删除考勤记录' })
  @ApiParam({ name: 'id', description: '考勤记录ID', type: 'number' })
  @ApiResponse({ status: 200, description: '删除成功' })
  @ApiResponse({ status: 404, description: '记录不存在' })
  @HttpCode(HttpStatus.OK)
  async remove(@Param('id', ParseIntPipe) id: number) {
    await this.attendanceService.remove(id);
    return {
      code: 0,
      message: '删除成功',
    };
  }
}
