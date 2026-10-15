import { Injectable, Logger } from '@nestjs/common';
import { GrammyError, InlineKeyboard } from 'grammy';
import { CardService } from '../card/card.service';
import { MyContext } from './card-bot.provider';

export const SHOW_ANSWER_CALLBACK = 'card:answer';
export const NEXT_CARD_CALLBACK = 'card:next';

const NO_CARDS_MESSAGE = 'Карточек пока нет. Пришли JSON-файл с картами.';
const NO_CARD_IN_SESSION_MESSAGE = 'Карточка не найдена. Начни заново: /start';

@Injectable()
export class ShowCardHandler {
  private readonly logger = new Logger(ShowCardHandler.name);

  constructor(private readonly cardService: CardService) {}

  async handle(ctx: MyContext): Promise<void> {
    const card = await this.cardService.getNextCard();
    if (!card) {
      await ctx.reply(NO_CARDS_MESSAGE);
      return;
    }

    ctx.session.card = { question: card.question, answer: card.answer };

    await ctx.reply(card.question, {
      parse_mode: 'Markdown',
      reply_markup: this.questionKeyboard(),
    });
  }

  async handleShowAnswer(ctx: MyContext): Promise<void> {
    const card = ctx.session.card;
    if (!card) {
      await ctx.answerCallbackQuery({ text: NO_CARD_IN_SESSION_MESSAGE });
      return;
    }

    await ctx.answerCallbackQuery();
    await this.editMessage(
      ctx,
      `${card.question}\n\n${card.answer}`,
      this.answerKeyboard(),
    );
  }

  async handleNext(ctx: MyContext): Promise<void> {
    const card = await this.cardService.getNextCard();
    if (!card) {
      await ctx.answerCallbackQuery({ text: NO_CARDS_MESSAGE });
      return;
    }

    ctx.session.card = { question: card.question, answer: card.answer };

    await ctx.answerCallbackQuery();
    await this.editMessage(ctx, card.question, this.questionKeyboard());
  }

  private async editMessage(
    ctx: MyContext,
    text: string,
    keyboard: InlineKeyboard,
  ): Promise<void> {
    try {
      await ctx.editMessageText(text, {
        parse_mode: 'Markdown',
        reply_markup: keyboard,
      });
    } catch (error) {
      if (this.isNotModified(error)) {
        return;
      }

      this.logger.warn(`Failed to edit card message: ${String(error)}`);
    }
  }

  private isNotModified(error: unknown): boolean {
    return (
      error instanceof GrammyError &&
      error.description.includes('message is not modified')
    );
  }

  private questionKeyboard(): InlineKeyboard {
    return new InlineKeyboard()
      .text('Смотреть ответ', SHOW_ANSWER_CALLBACK)
      .text('Следующая', NEXT_CARD_CALLBACK);
  }

  private answerKeyboard(): InlineKeyboard {
    return new InlineKeyboard().text('Следующая', NEXT_CARD_CALLBACK);
  }
}