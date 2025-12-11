import mongoose from "mongoose";

const ProjectSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    trim: true,
  },
  description: {
    type: String,
    default: "",
  },
  projectType: {
    type: String,
    enum: ["html", "react", "nextjs"],
    default: "html",
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  authorName: {
    type: String,
    required: true,
  },
  authorImage: {
    type: String,
    default: "",
  },
  // For HTML projects (backward compatible)
  pages: [{
    path: { type: String, required: true },
    html: { type: String, required: true },
  }],
  // For React/Next.js projects
  files: [{
    path: { type: String },
    content: { type: String },
    language: { type: String },
  }],
  prompts: {
    type: [String],
    default: [],
  },
  thumbnail: {
    type: String,
    default: "",
  },
  isPublic: {
    type: Boolean,
    default: false,
  },
  likes: {
    type: Number,
    default: 0,
  },
  likedBy: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
  }],
  forks: {
    type: Number,
    default: 0,
  },
  forkedFrom: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Project",
    default: null,
  },
  tags: {
    type: [String],
    default: [],
  },
  model: {
    type: String,
    default: "llama-3.3-70b-versatile",
  },
  provider: {
    type: String,
    default: "groq",
  },
}, {
  timestamps: true,
});

// Indexes for efficient queries
ProjectSchema.index({ userId: 1, createdAt: -1 });
ProjectSchema.index({ isPublic: 1, likes: -1 });
ProjectSchema.index({ isPublic: 1, createdAt: -1 });
ProjectSchema.index({ tags: 1 });

export default mongoose.models.Project ||
  mongoose.model("Project", ProjectSchema);
