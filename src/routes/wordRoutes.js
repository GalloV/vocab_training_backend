import express from "express";
import Word from "../models/Word.js";
import protectRoute from "../middleware/auth.middleware.js";

const router = express.Router();

// Create a new word (admin only route typically)
router.post("/", protectRoute, async (req, res) => {
  try {
    const {
      word,
      definition,
      examples,
      partOfSpeech,
      phonetic,
      origin,
      synonyms,
      antonyms,
      level,
      frequency,
      source
    } = req.body;

    // Validate required fields
    if (!word || !definition || !examples || !partOfSpeech || !phonetic || !origin || !level || !frequency || !source) {
      return res.status(400).json({ message: "Please provide all required fields" });
    }

    // Validate level
    const validLevels = ['A1', 'A2', 'B1', 'B2', 'C1', 'C2'];
    if (!validLevels.includes(level)) {
      return res.status(400).json({ message: "Invalid level. Must be one of: A1, A2, B1, B2, C1, C2" });
    }

    // Validate frequency
    if (frequency < 1 || frequency > 5) {
      return res.status(400).json({ message: "Frequency must be between 1 and 5" });
    }

    const newWord = new Word({
      word,
      definition,
      examples,
      partOfSpeech,
      phonetic,
      origin,
      synonyms: synonyms || [],
      antonyms: antonyms || [],
      level,
      frequency,
      source
    });

    await newWord.save();
    res.status(201).json(newWord);
  } catch (error) {
    console.log("Error creating word", error);
    res.status(500).json({ message: error.message });
  }
});

// Get all words with pagination and filtering
router.get("/", async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const level = req.query.level;
    const skip = (page - 1) * limit;

    let query = {};
    if (level) {
      query.level = level;
    }

    const words = await Word.find(query)
      .sort({ frequency: -1, word: 1 })
      .skip(skip)
      .limit(limit);

    const totalWords = await Word.countDocuments(query);

    res.json({
      words,
      currentPage: page,
      totalWords,
      totalPages: Math.ceil(totalWords / limit),
    });
  } catch (error) {
    console.log("Error in get words route", error);
    res.status(500).json({ message: "Internal server error" });
  }
});

// Get a single word by ID
router.get("/:id", async (req, res) => {
  try {
    const word = await Word.findById(req.params.id);
    if (!word) {
      return res.status(404).json({ message: "Word not found" });
    }
    res.json(word);
  } catch (error) {
    console.log("Error getting word", error);
    res.status(500).json({ message: "Internal server error" });
  }
});

// Get words by level
router.get("/level/:level", async (req, res) => {
  try {
    const { level } = req.params;
    const words = await Word.find({ level })
      .sort({ frequency: -1, word: 1 });
    res.json(words);
  } catch (error) {
    console.log("Error getting words by level", error);
    res.status(500).json({ message: "Internal server error" });
  }
});

// Update a word (admin only route typically)
router.put("/:id", protectRoute, async (req, res) => {
  try {
    const word = await Word.findById(req.params.id);
    if (!word) {
      return res.status(404).json({ message: "Word not found" });
    }

    const updatedWord = await Word.findByIdAndUpdate(
      req.params.id,
      { $set: req.body },
      { new: true, runValidators: true }
    );

    res.json(updatedWord);
  } catch (error) {
    console.log("Error updating word", error);
    res.status(500).json({ message: "Internal server error" });
  }
});

// Delete a word (admin only route typically)
router.delete("/:id", protectRoute, async (req, res) => {
  try {
    const word = await Word.findById(req.params.id);
    if (!word) {
      return res.status(404).json({ message: "Word not found" });
    }

    await word.deleteOne();
    res.json({ message: "Word deleted successfully" });
  } catch (error) {
    console.log("Error deleting word", error);
    res.status(500).json({ message: "Internal server error" });
  }
});

export default router; 