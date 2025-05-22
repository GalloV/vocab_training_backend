import mongoose from "mongoose";

const wordSchema = new mongoose.Schema(
  {
    word: {
      type: String,
      required: true,
    },
    definition: {
      type: String,
      required: true,
    },
    examples: {
      type: [String],
      required: true,
      validate: [
        {
          validator: function(array) {
            return array.length > 0;
          },
          message: "Examples array must have at least one example"
        }
      ]
    },
    partOfSpeech: {
      type: String,
      required: true,
    },
    phonetic: {
      type: String,
      required: true,
    },
    origin: {
      type: String,
      required: true,
    },
    synonyms: {
      type: [String],
      default: [],
    },
    antonyms: {
      type: [String],
      default: [],
    },
    level: {
      type: String,
      required: true,
      enum: ['A1', 'A2', 'B1', 'B2', 'C1', 'C2'],
    },
    frequency: {
      type: Number,
      required: true,
      min: 1,
      max: 5,
    },
    source: {
      type: String,
      required: true,
    },
  },
  { timestamps: true }
);

const Word = mongoose.model("Word", wordSchema);

export default Word;
