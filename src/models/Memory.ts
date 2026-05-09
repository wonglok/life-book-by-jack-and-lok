import mongoose, { Schema, Document, Model } from "mongoose";

export interface IMemory extends Document {
  title: string;
  elderlyName: string;
  lifeMemories: string;
  moments: string[];
  imageUrls: string[];
  imageAndInspiration: Array<{
    imageUrl: string;
    description: string;
    inspiration: string;
  }>;
  createdAt: Date;
  updatedAt: Date;
}

const MemorySchema = new Schema<IMemory>(
  {
    title: {
      type: String,
      required: true,
      trim: true,
      maxlength: 200,
    },
    elderlyName: {
      type: String,
      trim: true,
      default: "",
    },
    lifeMemories: {
      type: String,
      required: true,
    },
    moments: {
      type: [String],
      default: [],
    },
    imageUrls: {
      type: [String],
      default: [],
    },
    imageAndInspiration: {
      type: [
        {
          imageUrl: { type: String },
          description: { type: String, default: "" },
          inspiration: { type: String, default: "" },
        },
      ],
      default: [],
    },
  },
  {
    timestamps: true,
    toJSON: {
      virtuals: true,
      transform: (_doc, ret) => {
        ret.id = ret._id.toString();
        delete ret.__v;
        return ret;
      },
    },
  },
);

// Prevent model re-compilation in dev (Next.js hot reload)
export const Memory: Model<IMemory> =
  (mongoose.models?.Memory as Model<IMemory>) ||
  mongoose.model<IMemory>("Memory", MemorySchema);
