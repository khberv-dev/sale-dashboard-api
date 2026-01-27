import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CrmProfile } from '@shared/entities/crm-profiles.entity';
import { SynchronizeService } from '@modules/integration/synchronize.service';
import { AmocrmService } from '@modules/integration/amocrm.service';

@Module({
  imports: [TypeOrmModule.forFeature([CrmProfile])],
  providers: [SynchronizeService, AmocrmService],
})
export class IntegrationModule {}
