import { Module } from '@nestjs/common';
import { EventGateway } from '@shared/modules/ws/event.gateway';

@Module({
  providers: [EventGateway],
  exports: [EventGateway],
})
export class WsModule {}
