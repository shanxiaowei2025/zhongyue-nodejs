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
  HttpException,
  HttpStatus,
  ParseIntPipe,
  UseInterceptors,
  UploadedFile,
  ParseFilePipe
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiParam, ApiBody, ApiConsumes } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../auth/guards/roles.guard';
import { Roles } from '../../auth/decorators/roles.decorator';
import { DepositService } from './deposit.service';
import { CreateDepositDto, UpdateDepositDto, QueryDepositDto } from './dto';
import { FileInterceptor } from '@nestjs/platform-express';
import { memoryStorage } from 'multer';

@ApiTags('薪资-保证金管理')
@Controller('deposit')
@UseGuards(JwtAuthGuard, RolesGuard)
export class DepositController {
  constructor(private readonly depositService: DepositService) {}

  @Post()
  @Roles('salary_admin', 'super_admin')
  @ApiOperation({ summary: '创建保证金记录' })
  @ApiBody({ type: CreateDepositDto })
  @ApiResponse({ status: 201, description: '创建成功' })
  @ApiResponse({ status: 400, description: '参数错误' })
  @ApiResponse({ status: 401, description: '未授权' })
  async create(@Body() createDepositDto: CreateDepositDto) {
    try {
      console.log('收到创建保证金请求:', JSON.stringify(createDepositDto));
      return await this.depositService.create(createDepositDto);
    } catch (error) {
      throw new HttpException(
        error.message || '创建保证金记录失败',
        error.status || HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Post('upload')
  @Roles('salary_admin', 'super_admin')
  @ApiOperation({ summary: '通过Excel文件导入保证金记录' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        file: {
          type: 'string',
          format: 'binary',
          description: 'CSV或Excel文件，包含以下列：姓名、保证金扣除、扣除日期、备注（可选）'
        }
      }
    }
  })
  @ApiResponse({ status: 201, description: '导入成功' })
  @ApiResponse({ status: 400, description: '参数错误' })
  @ApiResponse({ status: 401, description: '未授权' })
  @UseInterceptors(
    FileInterceptor('file', {
      storage: memoryStorage(),
      fileFilter: (req, file, cb) => {
        // 只允许上传CSV和XLSX文件
        const allowedTypes = [
          'text/csv', 
          'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
          'application/vnd.ms-excel',
          'application/octet-stream' // 有些浏览器可能会用这个MIME类型
        ];
        
        // 检查MIME类型
        const mimeTypeValid = allowedTypes.includes(file.mimetype);
        
        // 检查文件扩展名
        const originalName = file.originalname.toLowerCase();
        const extValid = originalName.endsWith('.csv') || 
                       originalName.endsWith('.xlsx') || 
                       originalName.endsWith('.xls');
        
        if (mimeTypeValid && extValid) {
          cb(null, true);
        } else {
          cb(new Error(`只允许上传 CSV 或 Excel (XLSX/XLS) 文件! 当前文件: ${file.originalname}, MIME类型: ${file.mimetype}`), false);
        }
      },
    }),
  )
  async uploadFile(
    @UploadedFile(
      new ParseFilePipe({
        validators: [],  // 移除这里的验证器，因为我们已经在fileFilter中处理了
        fileIsRequired: true,
      }),
    )
    file: Express.Multer.File,
  ) {
    try {
      return await this.depositService.importDataFromFile(file);
    } catch (error) {
      throw new HttpException(
        error.message || '文件导入失败',
        error.status || HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Get()
  @Roles('salary_admin', 'super_admin')
  @ApiOperation({ summary: '获取保证金列表' })
  @ApiResponse({ status: 200, description: '查询成功' })
  @ApiResponse({ status: 401, description: '未授权' })
  async findAll(@Query() query: QueryDepositDto) {
    try {
      return await this.depositService.findAll(query);
    } catch (error) {
      throw new HttpException(
        error.message || '获取保证金列表失败',
        error.status || HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Get(':id')
  @Roles('salary_admin', 'super_admin')
  @ApiOperation({ summary: '获取保证金详情' })
  @ApiParam({ name: 'id', description: '保证金记录ID' })
  @ApiResponse({ status: 200, description: '查询成功' })
  @ApiResponse({ status: 404, description: '记录不存在' })
  @ApiResponse({ status: 401, description: '未授权' })
  async findOne(@Param('id', ParseIntPipe) id: number) {
    try {
      return await this.depositService.findOne(id);
    } catch (error) {
      throw new HttpException(
        error.message || '获取保证金详情失败',
        error.status || HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Patch(':id')
  @Roles('salary_admin', 'super_admin')
  @ApiOperation({ summary: '更新保证金记录' })
  @ApiParam({ name: 'id', description: '保证金记录ID' })
  @ApiBody({ type: UpdateDepositDto })
  @ApiResponse({ status: 200, description: '更新成功' })
  @ApiResponse({ status: 404, description: '记录不存在' })
  @ApiResponse({ status: 400, description: '参数错误' })
  @ApiResponse({ status: 401, description: '未授权' })
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateDepositDto: UpdateDepositDto,
  ) {
    try {
      return await this.depositService.update(id, updateDepositDto);
    } catch (error) {
      throw new HttpException(
        error.message || '更新保证金记录失败',
        error.status || HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Delete(':id')
  @Roles('salary_admin', 'super_admin')
  @ApiOperation({ summary: '删除保证金记录' })
  @ApiParam({ name: 'id', description: '保证金记录ID' })
  @ApiResponse({ status: 200, description: '删除成功' })
  @ApiResponse({ status: 404, description: '记录不存在' })
  @ApiResponse({ status: 401, description: '未授权' })
  async remove(@Param('id', ParseIntPipe) id: number) {
    try {
      await this.depositService.remove(id);
      return { message: '删除成功' };
    } catch (error) {
      throw new HttpException(
        error.message || '删除保证金记录失败',
        error.status || HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }
} 