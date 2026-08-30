import mongoose, { Schema, Document, Model } from "mongoose";

export interface ISavedBankDetails extends Document {
  userId: string;
  accountHolderName: string;
  accountNumber: string;
  ifscCode: string;
  bankName: string;
  upiId?: string;
  createdAt: Date;
  updatedAt: Date;
}

const SavedBankDetailsSchema = new Schema<ISavedBankDetails>(
  {
    userId: { type: String, required: true, index: true },
    accountHolderName: { type: String, required: true },
    accountNumber: { type: String, required: true },
    ifscCode: { type: String, required: true, uppercase: true, trim: true },
    bankName: { type: String, required: true },
    upiId: { type: String, default: "" },
  },
  { timestamps: true }
);

SavedBankDetailsSchema.index({ userId: 1 }, { unique: true });

let SavedBankDetails: Model<ISavedBankDetails>;

try {
  SavedBankDetails = mongoose.model<ISavedBankDetails>("SavedBankDetails");
} catch {
  SavedBankDetails = mongoose.model<ISavedBankDetails>("SavedBankDetails", SavedBankDetailsSchema);
}

export default SavedBankDetails;
