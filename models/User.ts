import mongoose, { Schema, Document } from "mongoose";

export interface IUser extends Document {
  _id: mongoose.Types.ObjectId;
  email: string;
  password?: string; // Optional for OAuth users
  name: string;
  image?: string;
  bio?: string;
  linkedinUrl?: string;
  githubId?: string;
  githubUsername?: string;
  apiKeys?: {
    openai?: string;
    deepseek?: string;
    mistral?: string;
    google?: string;
  };
  createdAt: Date;
  updatedAt: Date;
}

const UserSchema = new Schema<IUser>(
  {
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    password: {
      type: String,
      required: false, // Not required for GitHub OAuth users
    },
    name: {
      type: String,
      required: true,
      trim: true,
    },
    image: {
      type: String,
      default: "",
    },
    bio: {
      type: String,
      default: "",
      maxlength: 500,
    },
    linkedinUrl: {
      type: String,
      default: "",
      validate: {
        validator: function (v: string) {
          if (!v) return true;
          return /^https?:\/\/(www\.)?linkedin\.com\/.*$/.test(v);
        },
        message: "Invalid LinkedIn URL",
      },
    },
    githubId: {
      type: String,
      unique: true,
      sparse: true, // Allow null values while maintaining uniqueness
    },
    githubUsername: {
      type: String,
    },
    apiKeys: {
      openai: { type: String, default: "" },
      deepseek: { type: String, default: "" },
      mistral: { type: String, default: "" },
      google: { type: String, default: "" },
    },
  },
  {
    timestamps: true,
  }
);

// Index for faster lookups
UserSchema.index({ email: 1 });
UserSchema.index({ githubId: 1 });

export const User =
  mongoose.models.User || mongoose.model<IUser>("User", UserSchema);

export default User;
