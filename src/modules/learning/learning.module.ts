import { Module } from '@nestjs/common';
import { LearningController } from '@modules/learning/learning.controller';
import { EnrollmentService } from '@modules/learning/enrollment.service';
import { IntegrationModule } from '@modules/integration/integration.module';
import { SaleModule } from '@modules/sale/sale.module';

@Module({
  imports: [IntegrationModule, SaleModule],
  controllers: [LearningController],
  providers: [EnrollmentService],
})
export class LearningModule {}
