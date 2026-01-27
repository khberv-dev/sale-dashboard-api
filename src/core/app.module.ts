import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import dataSource from '../config/data-source.config';
import { AuthModule } from '@modules/auth/auth.module';
import { UserModule } from '@modules/user/user.module';
import { SaleModule } from '@modules/sale/sale.module';
import { ServeStaticModule } from '@nestjs/serve-static';
import { NotifyModule } from '@shared/modules/notify/notify.module';
import { CacheModule } from '@nestjs/cache-manager';
import { ContractModule } from '@modules/contract/contract.module';
import { ScheduleModule } from '@nestjs/schedule';
import { IntegrationModule } from '@modules/integration/integration.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    TypeOrmModule.forRoot(dataSource.options),
    ServeStaticModule.forRoot({
      rootPath: 'uploads',
      serveRoot: '/public',
    }),
    CacheModule.register({
      isGlobal: true,
      ttl: 360000,
    }),
    ScheduleModule.forRoot(),
    AuthModule,
    UserModule,
    SaleModule,
    NotifyModule,
    ContractModule,
    IntegrationModule,
  ],
  controllers: [AppController],
})
export class AppModule {}
