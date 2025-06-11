import { 
  Controller, 
  Get, 
  Post, 
  Body, 
  Param, 
  Query, 
  Request, 
  UseGuards 
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { TaxVerificationService } from './tax-verification.service';
import { CreateTaxVerificationDto } from './dto/create-tax-verification.dto';
import { QueryTaxVerificationDto } from './dto/query-tax-verification.dto';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../auth/guards/roles.guard';
import { Roles } from '../../auth/decorators/roles.decorator';
 
@ApiTags('税务核查')
@Controller('enterprise-service/tax-verification')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth()
export class TaxVerificationController {
  constructor(private readonly taxVerificationService: TaxVerificationService) {}

  @Post()
  @ApiOperation({ summary: '创建税务核查记录' })
  @ApiResponse({ status: 201, description: '创建成功' })
  @Roles('bookkeepingAccountant', 'consultantAccountant', 'admin', 'super_admin')
  create(@Body() createDto: CreateTaxVerificationDto, @Request() req) {
    return this.taxVerificationService.create(createDto, req.user.username);
  }

  @Get()
  @ApiOperation({ summary: '查询税务核查记录列表' })
  @ApiResponse({ status: 200, description: '查询成功' })
  @Roles('bookkeepingAccountant', 'consultantAccountant', 'admin', 'super_admin')
  findAll(@Query() queryDto: QueryTaxVerificationDto, @Request() req) {
    return this.taxVerificationService.findAll(queryDto, req.user);
  }

  @Get(':id')
  @ApiOperation({ summary: '查询单条税务核查记录' })
  @ApiResponse({ status: 200, description: '查询成功' })
  @Roles('bookkeepingAccountant', 'consultantAccountant', 'admin', 'super_admin')
  findOne(@Param('id') id: string, @Request() req) {
    return this.taxVerificationService.findOne(+id, req.user);
  }
} 