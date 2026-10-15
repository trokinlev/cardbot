import { Module } from '@nestjs/common';
import { MongoDbModule } from './mongodb';
import { CardBotModule } from './card-bot/card-bot.module';
import { HealthController } from './health.controller';

@Module({
  imports: [MongoDbModule.forRoot(), CardBotModule],
  controllers: [HealthController],
})
export class AppModule {}
