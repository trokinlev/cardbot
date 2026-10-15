import { Injectable, Logger } from '@nestjs/common';
import { CardService } from '../card/card.service';
import { NewCard } from '../card/card.entities';
import { MyContext } from './card-bot.provider';

const JSON_MIME_TYPES = new Set(['application/json', 'text/json']);

@Injectable()
export class AddCardsHandler {
  private readonly logger = new Logger(AddCardsHandler.name);

  constructor(private readonly cardService: CardService) {}

  async handle(ctx: MyContext): Promise<void> {
    const document = ctx.message?.document;
    if (!document) {
      return;
    }

    if (!this.isJson(document.file_name, document.mime_type)) {
      await ctx.reply('Пришли JSON-файл с картами.');
      return;
    }

    let cards: NewCard[];
    try {
      const raw = await this.download(ctx, document.file_id);
      cards = this.parseCards(raw);
    } catch (error) {
      this.logger.warn(`Failed to read cards file: ${String(error)}`);
      await ctx.reply(
        `Не удалось прочитать файл: ${error instanceof Error ? error.message : 'неизвестная ошибка'}`,
      );
      return;
    }

    try {
      await this.cardService.addCards(cards);
    } catch (error) {
      this.logger.error(`Failed to save cards: ${String(error)}`);
      await ctx.reply('Не удалось сохранить карты в базу.');
      return;
    }

    await ctx.reply(`Добавлено карт: ${cards.length}`);
  }

  private isJson(fileName?: string, mimeType?: string): boolean {
    if (mimeType && JSON_MIME_TYPES.has(mimeType)) {
      return true;
    }

    return fileName?.toLowerCase().endsWith('.json') ?? false;
  }

  private async download(ctx: MyContext, fileId: string): Promise<string> {
    const file = await ctx.api.getFile(fileId);
    if (!file.file_path) {
      throw new Error('Telegram не вернул путь к файлу');
    }

    const url = `https://api.telegram.org/file/bot${ctx.api.token}/${file.file_path}`;
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`Telegram вернул статус ${response.status}`);
    }

    return response.text();
  }

  private parseCards(raw: string): NewCard[] {
    let data: unknown;
    try {
      data = JSON.parse(raw);
    } catch {
      throw new Error('файл не является корректным JSON');
    }

    if (!Array.isArray(data)) {
      throw new Error('ожидается массив карт');
    }

    if (data.length === 0) {
      throw new Error('массив карт пуст');
    }

    return data.map((item, index) => this.parseCard(item, index));
  }

  private parseCard(item: unknown, index: number): NewCard {
    if (typeof item !== 'object' || item === null) {
      throw new Error(`карта #${index + 1} должна быть объектом`);
    }

    const { topic, question, answer, lastShow } = item as Record<string, unknown>;

    if (typeof topic !== 'string' || topic.trim() === '') {
      throw new Error(`у карты #${index + 1} не указан topic`);
    }
    if (typeof question !== 'string' || question.trim() === '') {
      throw new Error(`у карты #${index + 1} не указан question`);
    }
    if (typeof answer !== 'string' || answer.trim() === '') {
      throw new Error(`у карты #${index + 1} не указан answer`);
    }

    return {
      topic: topic.trim(),
      question,
      answer,
      lastShow: this.parseLastShow(lastShow, index),
    };
  }

  private parseLastShow(value: unknown, index: number): Date {
    if (value === undefined || value === null) {
      return new Date(0);
    }

    const date = new Date(value as string);
    if (Number.isNaN(date.getTime())) {
      throw new Error(`у карты #${index + 1} некорректный lastShow`);
    }

    return date;
  }
}
