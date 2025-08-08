import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Patch,
  Query,
  UseGuards,
  HttpStatus,
  Logger,
  BadRequestException,
  Req,
} from '@nestjs/common';
import { EmployeeService } from './employee.service';
import { CreateEmployeeDto } from './dto/create-employee.dto';
import { UpdateEmployeeDto } from './dto/update-employee.dto';
import { QueryEmployeeDto } from './dto/query-employee.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { ApiTags, ApiOperation, ApiResponse, ApiParam } from '@nestjs/swagger';
import { Request } from 'express';

@ApiTags('员工管理')
@Controller('employee')
@UseGuards(JwtAuthGuard, RolesGuard)
export class EmployeeController {
  private readonly logger = new Logger(EmployeeController.name);

  constructor(private readonly employeeService: EmployeeService) {}

  /**
   * 检查用户是否有工资管理权限
   * super_admin 和 salary_admin 角色都有权限
   */
  private hasSalaryAdminRole(req: Request): boolean {
    const user = req.user as any;
    return (
      user?.roles?.includes('salary_admin') ||
      user?.roles?.includes('super_admin')
    );
  }

  @Post()
  @ApiOperation({ summary: '创建员工' })
  @ApiResponse({ status: HttpStatus.CREATED, description: '创建成功' })
  @ApiResponse({ status: HttpStatus.BAD_REQUEST, description: '参数错误' })
  @Roles('admin', 'super_admin', 'salary_admin')
  create(@Body() createEmployeeDto: CreateEmployeeDto, @Req() req: Request) {
    // 检查是否有工资管理权限，如果没有则过滤掉baseSalary字段
    if (!this.hasSalaryAdminRole(req) && 'baseSalary' in createEmployeeDto) {
      this.logger.warn(
        `用户 ${req.user?.['username']} 尝试设置baseSalary但没有权限，已过滤该字段`,
      );
      const { baseSalary, ...filteredDto } = createEmployeeDto;
      return this.employeeService.create(filteredDto as CreateEmployeeDto);
    }

    return this.employeeService.create(createEmployeeDto);
  }

  @Get()
  @ApiOperation({ summary: '查询员工列表' })
  @ApiResponse({ status: HttpStatus.OK, description: '查询成功' })
  @Roles('admin', 'super_admin', 'salary_admin', 'user')
  async findAll(
    @Query() queryEmployeeDto: QueryEmployeeDto,
    @Req() req: Request,
  ) {
    const result = await this.employeeService.findAll(queryEmployeeDto);

    // 如果没有工资管理权限，过滤掉baseSalary字段
    if (!this.hasSalaryAdminRole(req)) {
      if (Array.isArray(result.items)) {
        const filteredItems = result.items.map((employee: any) => {
          const { baseSalary, ...filteredEmployee } = employee;
          return filteredEmployee;
        });
        return {
          ...result,
          items: filteredItems,
        };
      }
    }

    return result;
  }

  @Get(':id')
  @ApiOperation({ summary: '查询单个员工' })
  @ApiParam({ name: 'id', description: '员工ID' })
  @ApiResponse({ status: HttpStatus.OK, description: '查询成功' })
  @ApiResponse({ status: HttpStatus.NOT_FOUND, description: '员工不存在' })
  @Roles('admin', 'super_admin', 'salary_admin', 'user')
  async findOne(@Param('id') id: string, @Req() req: Request) {
    const employee = await this.employeeService.findOne(+id);

    // 如果没有工资管理权限，过滤掉baseSalary字段
    if (!this.hasSalaryAdminRole(req)) {
      const { baseSalary, ...filteredEmployee } = employee as any;
      return filteredEmployee;
    }

    return employee;
  }

  @Patch(':id')
  @ApiOperation({ summary: '更新员工信息' })
  @ApiParam({ name: 'id', description: '员工ID' })
  @ApiResponse({ status: HttpStatus.OK, description: '更新成功' })
  @ApiResponse({ status: HttpStatus.NOT_FOUND, description: '员工不存在' })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: '参数错误，包括尝试修改身份证号',
  })
  @Roles('admin', 'super_admin', 'salary_admin')
  update(
    @Param('id') id: string,
    @Body() updateEmployeeDto: UpdateEmployeeDto,
    @Req() req: Request,
  ) {
    if ('idCardNumber' in updateEmployeeDto) {
      this.logger.warn(
        `控制器拦截到修改身份证号请求: ${JSON.stringify(updateEmployeeDto)}`,
      );
      throw new BadRequestException('身份证号码不可以修改');
    }

    // 检查是否有工资管理权限，如果没有则过滤掉baseSalary字段
    if (!this.hasSalaryAdminRole(req) && 'baseSalary' in updateEmployeeDto) {
      this.logger.warn(
        `用户 ${req.user?.['username']} 尝试修改baseSalary但没有权限，已过滤该字段`,
      );
      const { baseSalary, ...filteredDto } = updateEmployeeDto;
      return this.employeeService.update(
        +id,
        filteredDto as UpdateEmployeeDto,
        req,
      );
    }

    return this.employeeService.update(+id, updateEmployeeDto, req);
  }

  @Delete(':id')
  @ApiOperation({ summary: '删除员工' })
  @ApiParam({ name: 'id', description: '员工ID' })
  @ApiResponse({ status: HttpStatus.OK, description: '删除成功' })
  @ApiResponse({ status: HttpStatus.NOT_FOUND, description: '员工不存在' })
  @Roles('admin', 'super_admin')
  remove(@Param('id') id: string) {
    return this.employeeService.remove(+id);
  }
}

/**
 * 权限控制说明：
 *
 * 1. 创建员工 (POST /api/employee)
 *    - 允许角色：admin, super_admin, salary_admin
 *    - 权限控制：
 *      * super_admin 和 salary_admin 可以设置 baseSalary 字段
 *      * 其他角色如果尝试设置 baseSalary 字段，会被自动过滤掉
 *
 * 2. 查询员工列表 (GET /api/employee)
 *    - 允许角色：admin, super_admin, salary_admin, user
 *    - 权限控制：
 *      * super_admin 和 salary_admin 可以看到 baseSalary 字段
 *      * 其他角色返回的数据中 baseSalary 字段会被过滤掉
 *
 * 3. 查询单个员工 (GET /api/employee/{id})
 *    - 允许角色：admin, super_admin, salary_admin, user
 *    - 权限控制：
 *      * super_admin 和 salary_admin 可以看到 baseSalary 字段
 *      * 其他角色返回的数据中 baseSalary 字段会被过滤掉
 *
 * 4. 更新员工信息 (PATCH /api/employee/{id})
 *    - 允许角色：admin, super_admin, salary_admin
 *    - 权限控制：
 *      * super_admin 和 salary_admin 可以修改 baseSalary 字段
 *      * 其他角色如果尝试修改 baseSalary 字段，会被自动过滤掉
 *      * 所有角色都不能修改 idCardNumber 字段（额外的安全控制）
 *
 * 5. 删除员工 (DELETE /api/employee/{id})
 *    - 允许角色：admin, super_admin
 *    - 权限控制：只有最高权限的管理员才能删除员工
 */
