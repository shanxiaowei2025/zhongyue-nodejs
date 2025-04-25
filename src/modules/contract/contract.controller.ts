import { Controller, Get, Post, Patch, Delete, Body, Param, Query, Req } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { ContractService } from './contract.service';
import { ContractPermissionService } from './services/contract-permission.service';
import { Contract } from './entities/contract.entity';
import { CreateContractDto } from './dto/create-contract.dto';
import { UpdateContractDto } from './dto/update-contract.dto';
import { QueryContractDto } from './dto/query-contract.dto';
import { Request } from 'express';

@ApiTags('合同管理')
@Controller('contracts')
export class ContractController {
  constructor(
    private readonly contractService: ContractService,
    private readonly contractPermissionService: ContractPermissionService
  ) {}

  @Post()
  @ApiOperation({ summary: '创建合同' })
  @ApiResponse({ status: 201, description: '创建成功', type: Contract })
  async create(
    @Body() createContractDto: CreateContractDto,
    @Req() req: Request & { user: { id: number, username: string } }
  ): Promise<Contract> {
    return await this.contractService.create(createContractDto, req.user.username);
  }

  @Get()
  @ApiOperation({ summary: '查询合同列表' })
  @ApiResponse({ status: 200, description: '查询成功', type: [Contract] })
  async findAll(
    @Query() query: QueryContractDto,
    @Req() req: Request & { user: { id: number, username: string } }
  ) {
    // 获取权限过滤条件
    const permissionFilter = await this.contractPermissionService.buildContractQueryFilter(req.user.id);
    return await this.contractService.findAll(query, permissionFilter);
  }

  @Get(':id')
  @ApiOperation({ summary: '根据ID查询合同' })
  @ApiResponse({ status: 200, description: '查询成功', type: Contract })
  async findOne(@Param('id') id: number): Promise<Contract> {
    return await this.contractService.findOne(id);
  }

  @Patch(':id')
  @ApiOperation({ summary: '更新合同' })
  @ApiResponse({ status: 200, description: '更新成功', type: Contract })
  async update(
    @Param('id') id: number,
    @Body() updateContractDto: UpdateContractDto,
  ): Promise<Contract> {
    return await this.contractService.update(id, updateContractDto);
  }

  @Delete(':id')
  @ApiOperation({ summary: '删除合同' })
  @ApiResponse({ status: 200, description: '删除成功' })
  async remove(@Param('id') id: number): Promise<void> {
    return await this.contractService.remove(id);
  }
} 