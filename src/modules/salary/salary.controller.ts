import { Controller, Get, Post, Body, Patch, Param, Delete, Query, UseGuards, Req, HttpStatus, HttpException, ParseIntPipe } from '@nestjs/common';
import { SalaryService } from './salary.service';
import { CreateSalaryDto } from './dto/create-salary.dto';
import { UpdateSalaryDto } from './dto/update-salary.dto';
import { QuerySalaryDto } from './dto/query-salary.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { SalaryPermissionService } from './services/salary-permission.service';
import { Request } from 'express';
import { ApiTags, ApiOperation, ApiResponse, ApiParam, ApiBody, ApiQuery, ApiProperty } from '@nestjs/swagger';
import { safeIdParam } from 'src/common/utils';
import { SalaryAutoUpdateService } from './services/salary-auto-update.service';

// 在这里创建示例类，为Swagger提供示例
class SalaryCreateExample {
  @ApiProperty({ example: '研发部', description: '部门' })
  department: string;

  @ApiProperty({ example: '张三', description: '姓名' })
  name: string;

  @ApiProperty({ example: '110101199001011234', description: '身份证号' })
  idCard: string;

  @ApiProperty({ example: '正式员工', description: '类型' })
  type: string;

  @ApiProperty({ example: 8000, description: '工资基数' })
  baseSalary: number;

  @ApiProperty({ example: 1000, description: '底薪临时增加金额' })
  temporaryIncrease: number;

  @ApiProperty({ example: 200, description: '考勤扣款' })
  attendanceDeduction: number;

  @ApiProperty({ example: 8800, description: '应发基本工资' })
  basicSalaryPayable: number;

  @ApiProperty({ example: 500, description: '全勤' })
  fullAttendance: number;

  @ApiProperty({ example: 1000, description: '补贴合计' })
  totalSubsidy: number;

  @ApiProperty({ example: 300, description: '工龄' })
  seniority: number;

  @ApiProperty({ example: 0, description: '代理费提成' })
  agencyFeeCommission: number;

  @ApiProperty({ example: 2000, description: '绩效提成' })
  performanceCommission: number;

  @ApiProperty({ example: 1500, description: '业务提成' })
  businessCommission: number;

  @ApiProperty({ example: 100, description: '其他扣款' })
  otherDeductions: number;

  @ApiProperty({ example: 200, description: '个人医疗' })
  personalMedical: number;

  @ApiProperty({ example: 400, description: '个人养老' })
  personalPension: number;

  @ApiProperty({ example: 50, description: '个人失业' })
  personalUnemployment: number;

  @ApiProperty({ example: 650, description: '社保个人合计' })
  personalInsuranceTotal: number;

  @ApiProperty({ example: 1300, description: '公司承担合计' })
  companyInsuranceTotal: number;

  @ApiProperty({ example: 0, description: '保证金扣除' })
  depositDeduction: number;

  @ApiProperty({ example: 500, description: '个税' })
  personalIncomeTax: number;

  @ApiProperty({ example: 0, description: '其他' })
  other: number;

  @ApiProperty({ example: 12000, description: '应发合计' })
  totalPayable: number;

  @ApiProperty({ example: '6222021234567890123', description: '银行卡号' })
  bankCardNumber: string;

  @ApiProperty({ example: '中岳科技有限公司', description: '对应公司' })
  company: string;

  @ApiProperty({ example: 10000, description: '银行卡/微信' })
  bankCardOrWechat: number;

  @ApiProperty({ example: 2000, description: '已发现金' })
  cashPaid: number;

  @ApiProperty({ example: 0, description: '对公' })
  corporatePayment: number;

  @ApiProperty({ example: 500, description: '个税申报' })
  taxDeclaration: number;

  @ApiProperty({ example: '2023-06-01', description: '年月' })
  yearMonth: string;
}

// 创建更新示例类
class SalaryUpdateExample {
  @ApiProperty({ example: 8500, description: '工资基数' })
  baseSalary: number;

  @ApiProperty({ example: 1200, description: '底薪临时增加金额' })
  temporaryIncrease: number;

  @ApiProperty({ example: 0, description: '考勤扣款' })
  attendanceDeduction: number;

  @ApiProperty({ example: 9700, description: '应发基本工资' })
  basicSalaryPayable: number;

  @ApiProperty({ example: 2500, description: '绩效提成' })
  performanceCommission: number;

  @ApiProperty({ example: 13000, description: '应发合计' })
  totalPayable: number;
}

@ApiTags('薪资管理')
@Controller('salary')
@UseGuards(JwtAuthGuard)
export class SalaryController {
  constructor(
    private readonly salaryService: SalaryService,
    private readonly salaryPermissionService: SalaryPermissionService,
    private readonly salaryAutoUpdateService: SalaryAutoUpdateService,
  ) {}

  @Post()
  @ApiOperation({ summary: '创建薪资记录', description: '创建新的薪资记录' })
  @ApiBody({ type: SalaryCreateExample })
  @ApiResponse({ status: HttpStatus.CREATED, description: '创建成功' })
  @ApiResponse({ status: HttpStatus.BAD_REQUEST, description: '请求参数错误' })
  @ApiResponse({ status: HttpStatus.UNAUTHORIZED, description: '未授权' })
  async create(@Body() createSalaryDto: CreateSalaryDto, @Req() req: Request) {
    try {
    await this.salaryPermissionService.checkPermission(req);
    return this.salaryService.create(createSalaryDto);
    } catch (error) {
      throw new HttpException(
        error.message || '创建薪资记录失败',
        error.status || HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Get()
  @ApiOperation({ summary: '获取薪资列表', description: '分页获取薪资列表，支持多条件筛选' })
  @ApiQuery({
    name: 'department',
    required: false,
    type: String,
    description: '部门（模糊查询）',
    example: '研发部'
  })
  @ApiQuery({
    name: 'name',
    required: false,
    type: String,
    description: '姓名（模糊查询）',
    example: '张'
  })
  @ApiQuery({
    name: 'idCard',
    required: false,
    type: String,
    description: '身份证号（模糊查询）',
    example: '11010119'
  })
  @ApiQuery({
    name: 'type',
    required: false,
    type: String,
    description: '类型（模糊查询）',
    example: '正式'
  })
  @ApiQuery({
    name: 'company',
    required: false,
    type: String,
    description: '公司（模糊查询）',
    example: '中岳'
  })
  @ApiQuery({
    name: 'yearMonth',
    required: false,
    type: String,
    description: '年月',
    example: '2023-06-01'
  })
  @ApiQuery({
    name: 'startDate',
    required: false,
    type: String,
    description: '开始日期',
    example: '2023-01-01'
  })
  @ApiQuery({
    name: 'endDate',
    required: false,
    type: String,
    description: '结束日期',
    example: '2023-12-31'
  })
  @ApiQuery({
    name: 'page',
    required: false,
    type: Number,
    description: '页码',
    example: 1
  })
  @ApiQuery({
    name: 'pageSize',
    required: false,
    type: Number,
    description: '每页数量',
    example: 10
  })
  @ApiResponse({ status: HttpStatus.OK, description: '查询成功' })
  @ApiResponse({ status: HttpStatus.UNAUTHORIZED, description: '未授权' })
  async findAll(@Query() query: QuerySalaryDto, @Req() req: Request) {
    try {
    await this.salaryPermissionService.checkPermission(req);
    return this.salaryService.findAll(query);
    } catch (error) {
      throw new HttpException(
        error.message || '获取薪资列表失败',
        error.status || HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Get(':id')
  @ApiOperation({ summary: '获取薪资详情', description: '根据ID获取薪资详情' })
  @ApiParam({ name: 'id', description: '薪资ID', example: 1 })
  @ApiResponse({ 
    status: HttpStatus.OK, 
    description: '查询成功',
    type: SalaryCreateExample
  })
  @ApiResponse({ status: HttpStatus.NOT_FOUND, description: '记录不存在' })
  @ApiResponse({ status: HttpStatus.UNAUTHORIZED, description: '未授权' })
  async findOne(@Param('id') id: string, @Req() req: Request) {
    try {
    const safeId = safeIdParam(id);
    if (safeId === null) {
        throw new HttpException('无效的ID参数', HttpStatus.BAD_REQUEST);
    }
    await this.salaryPermissionService.checkPermission(req, safeId);
      
      const salary = await this.salaryService.findOne(safeId);
      if (!salary) {
        throw new HttpException('薪资记录不存在', HttpStatus.NOT_FOUND);
      }
      
      return salary;
    } catch (error) {
      throw new HttpException(
        error.message || '获取薪资详情失败',
        error.status || HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Patch(':id')
  @ApiOperation({ summary: '更新薪资记录', description: '根据ID更新薪资记录' })
  @ApiParam({ name: 'id', description: '薪资ID', example: 1 })
  @ApiBody({ type: SalaryUpdateExample })
  @ApiResponse({ status: HttpStatus.OK, description: '更新成功' })
  @ApiResponse({ status: HttpStatus.NOT_FOUND, description: '记录不存在' })
  @ApiResponse({ status: HttpStatus.UNAUTHORIZED, description: '未授权' })
  async update(
    @Param('id') id: string,
    @Body() updateSalaryDto: UpdateSalaryDto,
    @Req() req: Request,
  ) {
    try {
    const safeId = safeIdParam(id);
    if (safeId === null) {
        throw new HttpException('无效的ID参数', HttpStatus.BAD_REQUEST);
    }
    await this.salaryPermissionService.checkPermission(req, safeId);
      
      const updatedSalary = await this.salaryService.update(safeId, updateSalaryDto);
      if (!updatedSalary) {
        throw new HttpException('薪资记录不存在', HttpStatus.NOT_FOUND);
      }
      
      return updatedSalary;
    } catch (error) {
      throw new HttpException(
        error.message || '更新薪资记录失败',
        error.status || HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Delete(':id')
  @ApiOperation({ summary: '删除薪资记录', description: '根据ID删除薪资记录' })
  @ApiParam({ name: 'id', description: '薪资ID', example: 1 })
  @ApiResponse({ 
    status: HttpStatus.OK, 
    description: '删除成功',
    schema: {
      example: {
        success: true,
        message: '薪资记录删除成功'
      }
    }
  })
  @ApiResponse({ status: HttpStatus.NOT_FOUND, description: '记录不存在' })
  @ApiResponse({ status: HttpStatus.UNAUTHORIZED, description: '未授权' })
  async remove(@Param('id') id: string, @Req() req: Request) {
    try {
    const safeId = safeIdParam(id);
    if (safeId === null) {
        throw new HttpException('无效的ID参数', HttpStatus.BAD_REQUEST);
    }
    await this.salaryPermissionService.checkPermission(req, safeId);
      
      // 先查询记录是否存在
      const salary = await this.salaryService.findOne(safeId);
      if (!salary) {
        throw new HttpException('薪资记录不存在', HttpStatus.NOT_FOUND);
      }
      
      await this.salaryService.remove(safeId);
      return { success: true, message: '薪资记录删除成功' };
    } catch (error) {
      throw new HttpException(
        error.message || '删除薪资记录失败',
        error.status || HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Post('auto-generate')
  @ApiOperation({ summary: '自动生成薪资数据', description: '测试自动生成上个月的薪资数据' })
  @ApiQuery({ name: 'month', required: false, type: String, description: '指定月份（格式：YYYY-MM-DD），不指定则默认为上个月' })
  @ApiResponse({ status: HttpStatus.OK, description: '操作结果', schema: { 
    example: { 
      success: true, 
      message: '薪资数据生成成功，共更新5条记录，新增10条记录', 
      details: { updated: 5, created: 10 } 
    } 
  } })
  @ApiResponse({ status: HttpStatus.UNAUTHORIZED, description: '未授权' })
  async autoGenerateSalaries(@Query('month') month: string, @Req() req: Request) {
    try {
      await this.salaryPermissionService.checkPermission(req);
      return this.salaryAutoUpdateService.manualGenerateSalaries(month);
    } catch (error) {
      throw new HttpException(
        error.message || '自动生成薪资数据失败',
        error.status || HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }
}
