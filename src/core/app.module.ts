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
    AuthModule,
    UserModule,
    SaleModule,
    NotifyModule,
  ],
  controllers: [AppController],
})
export class AppModule {}
