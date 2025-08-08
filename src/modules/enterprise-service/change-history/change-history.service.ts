import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ChangeHistory } from './entities/change-history.entity';

@Injectable()
export class ChangeHistoryService {
  constructor(
    @InjectRepository(ChangeHistory)
    private changeHistoryRepository: Repository<ChangeHistory>,
  ) {}
}
