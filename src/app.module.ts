import { Module } from '@nestjs/common';
import { MongoDbModule } from './mongodb';
import { CardBotModule } from './card-bot/card-bot.module';
import { HealthController } from './health.controller';
import { KeepAliveService } from './keep-alive.service';

@Module({
  imports: [MongoDbModule.forRoot(), CardBotModule],
  controllers: [HealthController],
  providers: [KeepAliveService],
})
export class AppModule {}
