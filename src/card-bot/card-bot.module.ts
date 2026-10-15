import { Module } from '@nestjs/common';
import { MongoDbModule } from '../mongodb';
import { CardService } from '../card/card.service';
import { AddCardsHandler } from './add-cards.handler';
import { CardBot } from './card-bot.provider';
import { ShowCardHandler } from './show-card.handler';

@Module({
  imports: [MongoDbModule.forFeature('cards', 'topics')],
  providers: [CardBot, CardService, ShowCardHandler, AddCardsHandler],
})
export class CardBotModule {}