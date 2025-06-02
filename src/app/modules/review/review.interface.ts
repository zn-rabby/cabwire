import { Model, Types } from "mongoose";

export type IReview = {
    user: Types.ObjectId;
    driver: Types.ObjectId;
    service: Types.ObjectId;
    comment: string;
    rating: number;
}

export type ReviewModel = Model<IReview>;