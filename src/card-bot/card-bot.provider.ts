import { Injectable, OnModuleInit } from '@nestjs/common';
import { Bot, Context, session, SessionFlavor } from 'grammy';
import { AddCardsHandler } from './add-cards.handler';
import {
  NEXT_CARD_CALLBACK,
  SHOW_ANSWER_CALLBACK,
  ShowCardHandler,
} from './show-card.handler';

interface SessionData {
  card?: { question: string; answer: string };
}

export type MyContext = Context & SessionFlavor<SessionData>;

@Injectable()
export class CardBot implements OnModuleInit {
  constructor(
    private readonly showCardHandler: ShowCardHandler,
    private readonly addCardsHandler: AddCardsHandler,
  ) {}

  onModuleInit() {
    const bot = new Bot<MyContext>(process.env.BOT_TOKEN as string);

    bot.use(
      session({
        initial: (): SessionData => ({}),
      }),
    );

    bot.command('start', this.showCardHandler.handle.bind(this.showCardHandler));

    bot.callbackQuery(
      SHOW_ANSWER_CALLBACK,
      this.showCardHandler.handleShowAnswer.bind(this.showCardHandler),
    );

    bot.callbackQuery(
      NEXT_CARD_CALLBACK,
      this.showCardHandler.handleNext.bind(this.showCardHandler),
    );

    bot.on('message:document', this.addCardsHandler.handle.bind(this.addCardsHandler));

    bot.start();
  }
}
