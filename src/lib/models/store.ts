import mongoose, { Schema, Document, Model } from "mongoose";

/**
 * One store per supplier. The supplier's verified account seeds the name on
 * first use; products only ever reference the store by `storeId`, so renaming
 * this record updates every linked product page without rewriting products.
 */
export interface IStore extends Document {
  name: string;
  supplierId: string;
  createdAt: Date;
  updatedAt: Date;
}

const StoreSchema = new Schema<IStore>(
  {
    name: { type: String, required: true, trim: true },
    supplierId: { type: String, required: true, unique: true },
  },
  { timestamps: true }
);

StoreSchema.index({ supplierId: 1 }, { unique: true });

let Store: Model<IStore>;

try {
  Store = mongoose.model<IStore>("Store");
} catch {
  Store = mongoose.model<IStore>("Store", StoreSchema);
}

export default Store;
