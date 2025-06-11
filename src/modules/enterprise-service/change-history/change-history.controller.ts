import { Controller } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { ChangeHistoryService } from './change-history.service';
 
@ApiTags('变更历程')
@Controller('enterprise-service/change-history')
export class ChangeHistoryController {
  constructor(private readonly changeHistoryService: ChangeHistoryService) {}
} 