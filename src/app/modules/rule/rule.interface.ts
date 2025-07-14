import { Model } from 'mongoose';

export type IRule = {
  content: string;
  type: 'privacy' | 'terms' | 'about';
  for: 'driver' | 'user';
};

export type RuleModel = Model<IRule, Record<string, unknown>>;
