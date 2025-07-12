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
} from '@nestjs/common';
import { EmployeeService } from './employee.service';
import { CreateEmployeeDto } from './dto/create-employee.dto';
import { UpdateEmployeeDto } from './dto/update-employee.dto';
import { QueryEmployeeDto } from './dto/query-employee.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { ApiTags, ApiOperation, ApiResponse, ApiParam } from '@nestjs/swagger';

@ApiTags('员工管理')
@Controller('employee')
@UseGuards(JwtAuthGuard)
export class EmployeeController {
  private readonly logger = new Logger(EmployeeController.name);

  constructor(private readonly employeeService: EmployeeService) {}

  @Post()
  @ApiOperation({ summary: '创建员工' })
  @ApiResponse({ status: HttpStatus.CREATED, description: '创建成功' })
  @ApiResponse({ status: HttpStatus.BAD_REQUEST, description: '参数错误' })
  create(@Body() createEmployeeDto: CreateEmployeeDto) {
    return this.employeeService.create(createEmployeeDto);
  }

  @Get()
  @ApiOperation({ summary: '查询员工列表' })
  @ApiResponse({ status: HttpStatus.OK, description: '查询成功' })
  findAll(@Query() queryEmployeeDto: QueryEmployeeDto) {
    return this.employeeService.findAll(queryEmployeeDto);
  }

  @Get(':id')
  @ApiOperation({ summary: '查询单个员工' })
  @ApiParam({ name: 'id', description: '员工ID' })
  @ApiResponse({ status: HttpStatus.OK, description: '查询成功' })
  @ApiResponse({ status: HttpStatus.NOT_FOUND, description: '员工不存在' })
  findOne(@Param('id') id: string) {
    return this.employeeService.findOne(+id);
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
  update(
    @Param('id') id: string,
    @Body() updateEmployeeDto: UpdateEmployeeDto,
  ) {
    if ('idCardNumber' in updateEmployeeDto) {
      this.logger.warn(
        `控制器拦截到修改身份证号请求: ${JSON.stringify(updateEmployeeDto)}`,
      );
      throw new BadRequestException('身份证号码不可以修改');
    }

    return this.employeeService.update(+id, updateEmployeeDto);
  }

  @Delete(':id')
  @ApiOperation({ summary: '删除员工' })
  @ApiParam({ name: 'id', description: '员工ID' })
  @ApiResponse({ status: HttpStatus.OK, description: '删除成功' })
  @ApiResponse({ status: HttpStatus.NOT_FOUND, description: '员工不存在' })
  remove(@Param('id') id: string) {
    return this.employeeService.remove(+id);
  }
}
