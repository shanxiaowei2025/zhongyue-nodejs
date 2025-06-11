import { Controller } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { EnterpriseServiceService } from './enterprise-service.service';
 
@ApiTags('企业服务')
@Controller('enterprise-service')
export class EnterpriseServiceController {
  constructor(private readonly enterpriseServiceService: EnterpriseServiceService) {}
} 