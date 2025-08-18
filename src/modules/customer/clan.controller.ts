import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiParam } from '@nestjs/swagger';
import { ClanService } from './services/clan.service';
import { CreateClanDto, AddMemberDto } from './dto/create-clan.dto';
import { UpdateClanDto } from './dto/update-clan.dto';
import { QueryClanDto } from './dto/query-clan.dto';

@ApiTags('宗族管理')
@Controller('clan')
export class ClanController {
  constructor(private readonly clanService: ClanService) {}

  @Post()
  @ApiOperation({ summary: '创建宗族' })
  @ApiResponse({ status: 201, description: '创建成功' })
  @ApiResponse({ status: 409, description: '宗族名称已存在' })
  async create(@Body() createClanDto: CreateClanDto) {
    const result = await this.clanService.create(createClanDto);
    return {
      code: 200,
      message: '创建成功',
      data: result
    };
  }

  @Get()
  @ApiOperation({ 
    summary: '查询宗族列表',
    description: '支持分页查询和多条件筛选。当 namesOnly=true 时，只返回宗族ID和名称列表（用于下拉选择等场景）。当 exactMatch=true 时，按宗族名称进行精确匹配查询。'
  })
  @ApiResponse({ 
    status: 200, 
    description: '查询成功',
    schema: {
      type: 'object',
      properties: {
        code: { type: 'number', example: 200 },
        message: { type: 'string', example: '查询成功' },
        data: {
          type: 'object',
          properties: {
            data: {
              type: 'array',
              description: 'namesOnly=true时只包含id和clanName字段，否则返回完整宗族信息'
            },
            total: { type: 'number', description: '总记录数' },
            page: { type: 'number', description: '当前页码' },
            pageSize: { type: 'number', description: '每页数量' },
            totalPages: { type: 'number', description: '总页数' }
          }
        }
      }
    }
  })
  async findAll(@Query() queryDto: QueryClanDto) {
    const result = await this.clanService.findAll(queryDto);
    return {
      code: 200,
      message: '查询成功',
      data: result
    };
  }

  @Get(':id')
  @ApiOperation({ summary: '根据ID查询宗族详情' })
  @ApiParam({ name: 'id', description: '宗族ID' })
  @ApiResponse({ status: 200, description: '查询成功' })
  @ApiResponse({ status: 404, description: '宗族不存在' })
  async findOne(@Param('id') id: string) {
    const result = await this.clanService.findOne(+id);
    return {
      code: 200,
      message: '查询成功',
      data: result
    };
  }

  @Patch(':id')
  @ApiOperation({ summary: '更新宗族信息' })
  @ApiParam({ name: 'id', description: '宗族ID' })
  @ApiResponse({ status: 200, description: '更新成功' })
  @ApiResponse({ status: 404, description: '宗族不存在' })
  @ApiResponse({ status: 409, description: '宗族名称已存在' })
  async update(@Param('id') id: string, @Body() updateClanDto: UpdateClanDto) {
    const result = await this.clanService.update(+id, updateClanDto);
    return {
      code: 200,
      message: '更新成功',
      data: result
    };
  }

  @Delete(':id')
  @ApiOperation({ summary: '删除宗族' })
  @ApiParam({ name: 'id', description: '宗族ID' })
  @ApiResponse({ status: 200, description: '删除成功' })
  @ApiResponse({ status: 404, description: '宗族不存在' })
  @HttpCode(HttpStatus.OK)
  async remove(@Param('id') id: string) {
    await this.clanService.remove(+id);
    return {
      code: 200,
      message: '删除成功'
    };
  }

  @Post('members')
  @ApiOperation({ summary: '添加成员到宗族' })
  @ApiResponse({ 
    status: 200, 
    description: '添加成功',
    schema: {
      type: 'object',
      properties: {
        code: { type: 'number', example: 200 },
        message: { type: 'string', example: '添加成员成功' },
        data: {
          type: 'object',
          properties: {
            id: { type: 'number', description: '宗族ID' },
            memberName: { type: 'string', description: '成员姓名' }
          }
        }
      }
    }
  })
  @ApiResponse({ status: 404, description: '宗族不存在' })
  async addMember(@Body() addMemberDto: AddMemberDto) {
    await this.clanService.addMember(addMemberDto.id, addMemberDto.memberName);
    return {
      code: 200,
      message: '添加成员成功',
      data: {
        id: addMemberDto.id,
        memberName: addMemberDto.memberName
      }
    };
  }

  @Delete(':id/members/:memberName')
  @ApiOperation({ summary: '从宗族中移除成员' })
  @ApiParam({ name: 'id', description: '宗族ID' })
  @ApiParam({ name: 'memberName', description: '成员姓名' })
  @ApiResponse({ status: 200, description: '移除成功' })
  @ApiResponse({ status: 404, description: '宗族不存在' })
  @HttpCode(HttpStatus.OK)
  async removeMember(@Param('id') id: string, @Param('memberName') memberName: string) {
    const result = await this.clanService.removeMember(+id, memberName);
    return {
      code: 200,
      message: '移除成员成功',
      data: result
    };
  }
} 