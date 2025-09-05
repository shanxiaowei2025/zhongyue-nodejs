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
  Req,
  Res,
  HttpStatus,
  HttpException,
  ParseIntPipe,
} from '@nestjs/common';
import { Response } from 'express';
import { SalaryService } from './salary.service';
import { CreateSalaryDto } from './dto/create-salary.dto';
import { UpdateSalaryDto } from './dto/update-salary.dto';
import { QuerySalaryDto } from './dto/query-salary.dto';
import { ConfirmSalaryDto } from './dto/confirm-salary.dto';
import { ExportSalaryDto } from './dto/export-salary.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { SalaryPermissionService } from './services/salary-permission.service';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiParam,
  ApiBody,
  ApiQuery,
  ApiProperty,
  ApiBearerAuth,
  ApiHeader,
} from '@nestjs/swagger';
import { safeIdParam } from 'src/common/utils';
import { SalaryAutoUpdateService } from './services/salary-auto-update.service';
import { SalaryCombinedGuard } from '../auth/guards/salary-combined.guard';

// 扩展Request类型以包含用户信息
interface RequestWithUser extends Request {
  user: {
    id: number;
    username: string;
    [key: string]: any;
  };
  salaryAccess?: {
    userId: number;
    username: string;
    grantedAt: number;
    tokenType: string;
  };
}

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

  @ApiProperty({ example: 300, description: '部门负责人补贴' })
  departmentHeadSubsidy: number;

  @ApiProperty({ example: 300, description: '岗位津贴' })
  positionAllowance: number;

  @ApiProperty({ example: 200, description: '油补' })
  oilSubsidy: number;

  @ApiProperty({ example: 200, description: '餐补' })
  mealSubsidy: number;

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

// 删除旧的示例类，直接使用完整的DTO

@ApiTags('薪资管理')
@Controller('salary')
@UseGuards(JwtAuthGuard, RolesGuard)
export class SalaryController {
  constructor(
    private readonly salaryService: SalaryService,
    private readonly salaryPermissionService: SalaryPermissionService,
    private readonly salaryAutoUpdateService: SalaryAutoUpdateService,
  ) {}

  @Post()
  @Roles('salary_admin', 'super_admin')
  @ApiOperation({ summary: '创建薪资记录', description: '创建新的薪资记录' })
  @ApiBody({ type: SalaryCreateExample })
  @ApiResponse({ status: HttpStatus.CREATED, description: '创建成功' })
  @ApiResponse({ status: HttpStatus.BAD_REQUEST, description: '请求参数错误' })
  @ApiResponse({ status: HttpStatus.UNAUTHORIZED, description: '未授权' })
  @ApiResponse({ status: HttpStatus.FORBIDDEN, description: '权限不足' })
  async create(
    @Body() createSalaryDto: CreateSalaryDto,
    @Req() req: RequestWithUser,
  ) {
    try {
      return this.salaryService.create(createSalaryDto, req.user.id);
    } catch (error) {
      throw new HttpException(
        error.message || '创建薪资记录失败',
        error.status || HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Get('admin')
  @Roles('salary_admin', 'super_admin')
  @ApiOperation({
    summary: '获取薪资列表（管理员）',
    description: '管理员分页获取所有薪资列表，支持多条件筛选',
  })
  @ApiQuery({
    name: 'department',
    required: false,
    type: String,
    description: '部门（模糊查询）',
    example: '研发部',
  })
  @ApiQuery({
    name: 'name',
    required: false,
    type: String,
    description: '姓名（模糊查询）',
    example: '张',
  })
  @ApiQuery({
    name: 'idCard',
    required: false,
    type: String,
    description: '身份证号（模糊查询）',
    example: '11010119',
  })
  @ApiQuery({
    name: 'type',
    required: false,
    type: String,
    description: '类型（模糊查询）',
    example: '正式',
  })
  @ApiQuery({
    name: 'company',
    required: false,
    type: String,
    description: '公司（模糊查询）',
    example: '中岳',
  })
  @ApiQuery({
    name: 'yearMonth',
    required: false,
    type: String,
    description: '年月',
    example: '2023-06-01',
  })
  @ApiQuery({
    name: 'startDate',
    required: false,
    type: String,
    description: '开始日期',
    example: '2023-01-01',
  })
  @ApiQuery({
    name: 'endDate',
    required: false,
    type: String,
    description: '结束日期',
    example: '2023-12-31',
  })
  @ApiQuery({
    name: 'page',
    required: false,
    type: Number,
    description: '页码',
    example: 1,
  })
  @ApiQuery({
    name: 'pageSize',
    required: false,
    type: Number,
    description: '每页数量',
    example: 10,
  })
  @ApiResponse({ status: HttpStatus.OK, description: '查询成功' })
  @ApiResponse({ status: HttpStatus.UNAUTHORIZED, description: '未授权' })
  @ApiResponse({ status: HttpStatus.FORBIDDEN, description: '权限不足' })
  async findAllForAdmin(
    @Query() query: QuerySalaryDto,
    @Req() req: RequestWithUser,
  ) {
    try {
      return this.salaryService.findAll(query, req.user.id);
    } catch (error) {
      throw new HttpException(
        error.message || '获取薪资列表失败',
        error.status || HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Get('my')
  @UseGuards(SalaryCombinedGuard) // 添加薪资二级密码验证
  @ApiBearerAuth()
  @ApiOperation({
    summary: '获取我的薪资列表（员工）',
    description:
      '员工获取自己的薪资列表，支持时间筛选。需要先通过 POST /api/auth/salary/verify 验证薪资密码获取访问令牌，然后在请求头中添加 X-Salary-Token。',
  })
  @ApiHeader({
    name: 'X-Salary-Token',
    description: '薪资访问令牌（通过 POST /api/auth/salary/verify 获取）',
    required: true,
    example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
  })
  @ApiQuery({
    name: 'yearMonth',
    required: false,
    type: String,
    description: '年月',
    example: '2023-06-01',
  })
  @ApiQuery({
    name: 'startDate',
    required: false,
    type: String,
    description: '开始日期',
    example: '2023-01-01',
  })
  @ApiQuery({
    name: 'endDate',
    required: false,
    type: String,
    description: '结束日期',
    example: '2023-12-31',
  })
  @ApiQuery({
    name: 'page',
    required: false,
    type: Number,
    description: '页码',
    example: 1,
  })
  @ApiQuery({
    name: 'pageSize',
    required: false,
    type: Number,
    description: '每页数量',
    example: 10,
  })
  @ApiResponse({ status: HttpStatus.OK, description: '查询成功' })
  @ApiResponse({
    status: HttpStatus.UNAUTHORIZED,
    description: '未授权或需要薪资访问权限',
  })
  async findMyAll(@Query() query: QuerySalaryDto, @Req() req: RequestWithUser) {
    try {
      // 员工只能查看自己的薪资记录，强制设置用户ID筛选
      const myQuery = { ...query, userId: req.user.id };
      return this.salaryService.findMySalary(myQuery, req.user.id);
    } catch (error) {
      throw new HttpException(
        error.message || '获取我的薪资列表失败',
        error.status || HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Get('admin/:id')
  @Roles('salary_admin', 'super_admin')
  @ApiOperation({
    summary: '获取薪资详情（管理员）',
    description: '管理员根据ID获取任意薪资详情',
  })
  @ApiParam({ name: 'id', description: '薪资记录ID' })
  @ApiResponse({ status: HttpStatus.OK, description: '获取成功' })
  @ApiResponse({ status: HttpStatus.NOT_FOUND, description: '薪资记录不存在' })
  @ApiResponse({ status: HttpStatus.UNAUTHORIZED, description: '未授权' })
  @ApiResponse({ status: HttpStatus.FORBIDDEN, description: '权限不足' })
  async findOneForAdmin(@Param('id') id: string, @Req() req: RequestWithUser) {
    try {
      const safeId = safeIdParam(id);
      return this.salaryService.findOne(safeId, req.user.id);
    } catch (error) {
      throw new HttpException(
        error.message || '获取薪资详情失败',
        error.status || HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Get('my/:id')
  @UseGuards(SalaryCombinedGuard) // 添加薪资二级密码验证
  @ApiBearerAuth()
  @ApiOperation({
    summary: '获取我的薪资详情（员工）',
    description:
      '员工根据ID获取自己的薪资详情。需要先通过 POST /api/auth/salary/verify 验证薪资密码获取访问令牌，然后在请求头中添加 X-Salary-Token。',
  })
  @ApiHeader({
    name: 'X-Salary-Token',
    description: '薪资访问令牌（通过 POST /api/auth/salary/verify 获取）',
    required: true,
    example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
  })
  @ApiParam({ name: 'id', description: '薪资记录ID' })
  @ApiResponse({ status: HttpStatus.OK, description: '获取成功' })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: '薪资记录不存在或无权访问',
  })
  @ApiResponse({
    status: HttpStatus.UNAUTHORIZED,
    description: '未授权或需要薪资访问权限',
  })
  async findMyOne(@Param('id') id: string, @Req() req: RequestWithUser) {
    try {
      const safeId = safeIdParam(id);
      return this.salaryService.findMySalaryById(safeId, req.user.id);
    } catch (error) {
      throw new HttpException(
        error.message || '获取我的薪资详情失败',
        error.status || HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Patch(':id')
  @Roles('salary_admin', 'super_admin')
  @ApiOperation({ summary: '更新薪资记录', description: '根据ID更新薪资记录' })
  @ApiParam({ name: 'id', description: '薪资记录ID' })
  @ApiBody({ type: UpdateSalaryDto })
  @ApiResponse({ status: HttpStatus.OK, description: '更新成功' })
  @ApiResponse({ status: HttpStatus.NOT_FOUND, description: '薪资记录不存在' })
  @ApiResponse({ status: HttpStatus.UNAUTHORIZED, description: '未授权' })
  @ApiResponse({ status: HttpStatus.FORBIDDEN, description: '权限不足' })
  async update(
    @Param('id') id: string,
    @Body() updateSalaryDto: UpdateSalaryDto,
    @Req() req: RequestWithUser,
  ) {
    try {
      const safeId = safeIdParam(id);
      return this.salaryService.update(safeId, updateSalaryDto, req.user.id);
    } catch (error) {
      throw new HttpException(
        error.message || '更新薪资记录失败',
        error.status || HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Delete(':id')
  @Roles('salary_admin', 'super_admin')
  @ApiOperation({ summary: '删除薪资记录', description: '根据ID删除薪资记录' })
  @ApiParam({ name: 'id', description: '薪资记录ID' })
  @ApiResponse({ status: HttpStatus.OK, description: '删除成功' })
  @ApiResponse({ status: HttpStatus.NOT_FOUND, description: '薪资记录不存在' })
  @ApiResponse({ status: HttpStatus.UNAUTHORIZED, description: '未授权' })
  @ApiResponse({ status: HttpStatus.FORBIDDEN, description: '权限不足' })
  async remove(@Param('id') id: string, @Req() req: RequestWithUser) {
    try {
      const safeId = safeIdParam(id);
      await this.salaryService.remove(safeId, req.user.id);
      return { message: '删除成功' };
    } catch (error) {
      throw new HttpException(
        error.message || '删除薪资记录失败',
        error.status || HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Patch(':id/confirm')
  @UseGuards(SalaryCombinedGuard) // 添加薪资二级密码验证
  @ApiBearerAuth()
  @ApiOperation({
    summary: '确认薪资记录',
    description:
      '根据ID确认薪资记录。需要先通过 POST /api/auth/salary/verify 验证薪资密码获取访问令牌，然后在请求头中添加 X-Salary-Token。',
  })
  @ApiHeader({
    name: 'X-Salary-Token',
    description: '薪资访问令牌（通过 POST /api/auth/salary/verify 获取）',
    required: true,
    example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
  })
  @ApiParam({ name: 'id', description: '薪资记录ID' })
  @ApiBody({ type: ConfirmSalaryDto })
  @ApiResponse({ status: HttpStatus.OK, description: '确认成功' })
  @ApiResponse({ status: HttpStatus.NOT_FOUND, description: '薪资记录不存在' })
  @ApiResponse({
    status: HttpStatus.UNAUTHORIZED,
    description: '未授权或需要薪资访问权限',
  })
  async confirmSalary(
    @Param('id') id: string,
    @Body() confirmSalaryDto: ConfirmSalaryDto,
    @Req() req: RequestWithUser,
  ) {
    try {
      const safeId = safeIdParam(id);
      return this.salaryService.confirmSalary(
        safeId,
        confirmSalaryDto,
        req.user.id,
      );
    } catch (error) {
      throw new HttpException(
        error.message || '确认薪资记录失败',
        error.status || HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Post('auto-generate')
  @Roles('salary_admin', 'super_admin')
  @ApiOperation({
    summary: '自动生成薪资数据',
    description:
      '自动生成指定月份的薪资数据。注意：不能生成2025年6月及其之前的薪资数据。',
  })
  @ApiQuery({
    name: 'month',
    required: false,
    type: String,
    description:
      '指定月份（格式：YYYY-MM-DD），不指定则默认为上个月。注意：不能生成2025年6月及其之前的薪资数据。',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: '操作结果',
    schema: {
      example: {
        success: true,
        message: '薪资数据生成成功，共更新5条记录，新增10条记录',
        details: { updated: 5, created: 10 },
      },
    },
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: '时间限制：不能生成2025年6月及其之前的薪资数据',
  })
  @ApiResponse({ status: HttpStatus.UNAUTHORIZED, description: '未授权' })
  @ApiResponse({ status: HttpStatus.FORBIDDEN, description: '权限不足' })
  async autoGenerateSalaries(
    @Query('month') month: string,
    @Req() req: RequestWithUser,
  ) {
    try {
      await this.salaryPermissionService.checkPermission(req);
      const result =
        await this.salaryAutoUpdateService.manualGenerateSalaries(month);

      // 检查是否是时间限制错误
      if (!result.success && result.error === 'TIME_RESTRICTION') {
        throw new HttpException(result.message, HttpStatus.BAD_REQUEST);
      }

      return result;
    } catch (error) {
      throw new HttpException(
        error.message || '手动生成薪资失败',
        error.status || HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Get('export/csv')
  @Roles('salary_admin', 'super_admin')
  @ApiOperation({
    summary: '导出薪资数据为CSV',
    description:
      '导出符合筛选条件的薪资数据为CSV文件。支持按部门、姓名、身份证号、类型、发薪公司、年月范围、发放状态、确认状态等条件筛选。',
  })
  @ApiQuery({
    name: 'department',
    required: false,
    type: String,
    description: '部门（模糊查询）',
    example: '研发部',
  })
  @ApiQuery({
    name: 'name',
    required: false,
    type: String,
    description: '姓名（模糊查询）',
    example: '张',
  })
  @ApiQuery({
    name: 'idCard',
    required: false,
    type: String,
    description: '身份证号（模糊查询）',
    example: '11010119',
  })
  @ApiQuery({
    name: 'type',
    required: false,
    type: String,
    description: '类型（模糊查询）',
    example: '正式',
  })
  @ApiQuery({
    name: 'company',
    required: false,
    type: String,
    description: '发薪公司（模糊查询）',
    example: '中岳',
  })
  @ApiQuery({
    name: 'yearMonth',
    required: false,
    type: String,
    description: '年月（支持 YYYY-MM 或 YYYY-MM-DD 格式）',
    example: '2025-06',
  })
  @ApiQuery({
    name: 'startDate',
    required: false,
    type: String,
    description: '开始日期（筛选年月范围）',
    example: '2023-01-01',
  })
  @ApiQuery({
    name: 'endDate',
    required: false,
    type: String,
    description: '结束日期（筛选年月范围）',
    example: '2023-12-31',
  })
  @ApiQuery({
    name: 'isPaid',
    required: false,
    type: Boolean,
    description: '是否已发放',
    example: true,
  })
  @ApiQuery({
    name: 'isConfirmed',
    required: false,
    type: Boolean,
    description: '是否已确认',
    example: true,
  })
  @ApiResponse({ status: HttpStatus.OK, description: '导出成功' })
  @ApiResponse({ status: HttpStatus.UNAUTHORIZED, description: '未授权' })
  @ApiResponse({ status: HttpStatus.FORBIDDEN, description: '权限不足' })
  async exportToCsv(
    @Query() query: ExportSalaryDto,
    @Req() req: RequestWithUser,
    @Res() res: Response,
  ) {
    try {
      const csvData = await this.salaryService.exportToCsv(query, req.user.id);

      // 生成带日期的文件名
      const now = new Date();
      const dateStr = now.toISOString().split('T')[0]; // YYYY-MM-DD格式
      const filename = `salary_export_${dateStr}.csv`;

      // 设置响应头
      res.setHeader('Content-Type', 'application/octet-stream');
      res.setHeader(
        'Content-Disposition',
        `attachment; filename=${encodeURIComponent(filename)}`,
      );
      res.setHeader('Content-Transfer-Encoding', 'binary');
      res.setHeader('Pragma', 'no-cache');
      res.setHeader('Expires', '0');

      // 发送CSV数据并结束响应
      res.end(csvData);
    } catch (error) {
      throw new HttpException(
        error.message || '导出薪资数据失败',
        error.status || HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }
}
