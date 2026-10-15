import { Injectable } from "@nestjs/common";
import type { Collection, OptionalId } from "mongodb";
import { InjectCollection } from "../mongodb";
import { Card, NewCard, topic } from "./card.entities";

const REVIEW_INTERVAL_MS = 24 * 60 * 60 * 1000;

@Injectable()
export class CardService {
  constructor(
    @InjectCollection("cards") private readonly cards: Collection<Card>,
    @InjectCollection("topics") private readonly topics: Collection<topic>,
  ) {}

  async getNextCard(): Promise<Card | null> {
    const overdueBefore = new Date(Date.now() - REVIEW_INTERVAL_MS);

    const [card] = await this.cards
      .aggregate<Card>([
        { $match: { lastShow: { $lte: overdueBefore } } },
        { $sample: { size: 1 } },
      ])
      .toArray();

    const next = card ?? (await this.cards.findOne({}, { sort: { lastShow: 1 } }));
    if (!next) {
      return null;
    }

    const lastShow = new Date();
    await this.cards.updateOne({ _id: next._id }, { $set: { lastShow } });

    return { ...next, lastShow };
  }

  async addCards(cards: NewCard[]): Promise<void> {
    if (cards.length === 0) {
      return;
    }

    const titles = [...new Set(cards.map((card) => card.topic))];

    await this.topics.bulkWrite(
      titles.map((title) => ({
        updateOne: {
          filter: { title },
          update: { $setOnInsert: { title } },
          upsert: true,
        },
      })),
    );

    const existingTopics = await this.topics
      .find({ title: { $in: titles } })
      .toArray();
    const topicIds = new Map(existingTopics.map((t) => [t.title, t._id]));

    const documents: OptionalId<Card>[] = cards.map(({ topic, ...card }) => {
      const topicId = topicIds.get(topic);
      if (!topicId) {
        throw new Error(`Topic "${topic}" was not found after upsert`);
      }

      return { ...card, topicId };
    });

    await this.cards.insertMany(documents as any);
  }
}