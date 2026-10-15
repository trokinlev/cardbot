import { ObjectId } from "mongodb";

export interface topic {
  _id: ObjectId;
  title: string;
}

export interface Card {
  _id: ObjectId;
  topicId: ObjectId;
  question: string;
  answer: string;
  lastShow: Date;
}

export type NewCard = Omit<Card, "_id" | "topicId"> & { topic: string };