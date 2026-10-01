import mongoose, { Schema, Document, Model } from "mongoose";

/** Newest entries kept per query — enough to show who searched, bounded forever. */
export const MAX_SEARCHERS = 50;

/** Users already pushed a "we found a match" notice for one query. */
export const MAX_NOTIFIED = 200;

export interface ISearcherEntry {
  userId: string | null;
  name: string;
  at: Date;
}

export interface ISearchLog extends Document {
  /** Normalised (lowercase, whitespace collapsed) key the row is aggregated on. */
  query: string;
  /** What the shopper actually typed, for display. */
  display: string;
  count: number;
  firstAt: Date;
  lastAt: Date;
  searchers: ISearcherEntry[];
  notified: string[];
}

const SearchLogSchema = new Schema<ISearchLog>(
  {
    query: { type: String, required: true, unique: true },
    display: { type: String, required: true },
    count: { type: Number, default: 0 },
    firstAt: { type: Date, default: Date.now },
    lastAt: { type: Date, default: Date.now },
    searchers: [
      {
        _id: false,
        userId: { type: String, default: null },
        name: { type: String, default: "" },
        at: { type: Date, default: Date.now },
      },
    ],
    notified: { type: [String], default: [] },
  },
  { timestamps: true }
);

SearchLogSchema.index({ count: -1, lastAt: -1 });
SearchLogSchema.index({ lastAt: -1 });

let SearchLog: Model<ISearchLog>;

try {
  SearchLog = mongoose.model<ISearchLog>("SearchLog");
} catch {
  SearchLog = mongoose.model<ISearchLog>("SearchLog", SearchLogSchema);
}

export default SearchLog;
