const mongoose = require('mongoose');

const NEWS_CATEGORY = [
  "ANNOUNCEMENT",
  "EVENT",
  "EXAM",
  "HOLIDAY",
  "GENERAL",
];

const AUDIENCE = ["ALL", "TEACHER", "STUDENT", "PARENT"];

const STATUS = ["DRAFT", "PUBLISHED", "ARCHIVED"];

const newsSchema = new mongoose.Schema(
  {
    tenantId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Tenant",
      required: true,
      index: true,
    },

    title: {
      type: String,
      required: true,
      trim: true,
      maxlength: 200,
      index: "text", 
    },

    content: {
      type: String,
      default: "",
    },

    category: {
      type: String,
      enum: NEWS_CATEGORY,
      default: "GENERAL",
      index: true,
    },

    audience: [
      {
        type: String,
        enum: AUDIENCE,
        required: true,
      },
    ],

    status: {
      type: String,
      enum: STATUS,
      default: "DRAFT",
      index: true,
    },

    isPinned: {
      type: Boolean,
      default: false,
      index: true,
    },

    coverImage: {
      type: String,
      default: null,
    },

    publishedAt: {
      type: Date,
      default: null,
      index: true,
    },

    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
  },
  {
    timestamps: true, 
  }
);


module.exports = mongoose.model('News', newsSchema);