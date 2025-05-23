import express from "express";
import Word from "../models/Word.js";
import protectRoute from "../middleware/auth.middleware.js";

const router = express.Router();

// Create multiple words at once
router.post("/bulk", async (req, res) => {
  try {
    const { words } = req.body;

    if (!Array.isArray(words) || words.length === 0) {
      return res.status(400).json({ message: "Please provide an array of words" });
    }

    const validLevels = ['A1', 'A2', 'B1', 'B2', 'C1', 'C2'];
    const validationErrors = [];

    // Validate each word before attempting to save
    words.forEach((word, index) => {
      const {
        word: wordText,
        definition,
        examples,
        partOfSpeech,
        phonetic,
        origin,
        level,
        frequency,
        source
      } = word;

      if (!wordText || !definition || !examples || !partOfSpeech || !phonetic || !origin || !level || !frequency || !source) {
        validationErrors.push(`Word at index ${index}: Missing required fields`);
      }

      if (!validLevels.includes(level)) {
        validationErrors.push(`Word at index ${index}: Invalid level. Must be one of: A1, A2, B1, B2, C1, C2`);
      }

      if (frequency < 1 || frequency > 5) {
        validationErrors.push(`Word at index ${index}: Frequency must be between 1 and 5`);
      }

      if (!Array.isArray(examples) || examples.length === 0) {
        validationErrors.push(`Word at index ${index}: Examples must be a non-empty array`);
      }
    });

    if (validationErrors.length > 0) {
      return res.status(400).json({ 
        message: "Validation errors",
        errors: validationErrors 
      });
    }

    // Prepare words for insertion
    const wordsToInsert = words.map(word => ({
      ...word,
      synonyms: word.synonyms || [],
      antonyms: word.antonyms || []
    }));

    // Insert all words
    const savedWords = await Word.insertMany(wordsToInsert);

    res.status(201).json({
      message: `Successfully created ${savedWords.length} words`,
      words: savedWords
    });
  } catch (error) {
    console.log("Error creating multiple words", error);
    res.status(500).json({ 
      message: "Error creating words",
      error: error.message 
    });
  }
});

// Create a new word (admin only route typically)
router.post("/", async (req, res) => {
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

// Get words by level
router.get("/level/:level", async (req, res) => {
  try {
    const { level } = req.params;
    console.log("Fetching words for level:", level);
    
    const validLevels = ['A1', 'A2', 'B1', 'B2', 'C1', 'C2'];
    
    if (!validLevels.includes(level)) {
      console.log("Invalid level provided:", level);
      return res.status(400).json({ 
        message: "Invalid level. Must be one of: A1, A2, B1, B2, C1, C2" 
      });
    }

    const words = await Word.find({ level })
      .sort({ frequency: -1, word: 1 });

    console.log(`Found ${words.length} words for level ${level}`);

    if (!words || words.length === 0) {
      return res.status(404).json({ 
        message: `No words found for level ${level}` 
      });
    }

    res.json(words);
  } catch (error) {
    console.log("Error getting words by level", error);
    res.status(500).json({ message: "Internal server error" });
  }
});

// Get a random word for a specific level
router.get("/random/:level", async (req, res) => {
  try {
    const { level } = req.params;
    const validLevels = ['A1', 'A2', 'B1', 'B2', 'C1', 'C2'];
    
    if (!validLevels.includes(level)) {
      return res.status(400).json({ 
        message: "Invalid level. Must be one of: A1, A2, B1, B2, C1, C2" 
      });
    }

    // Get count of words for the level
    const count = await Word.countDocuments({ level });
    
    if (count === 0) {
      return res.status(404).json({ 
        message: `No words found for level ${level}` 
      });
    }

    // Get a random word
    const random = Math.floor(Math.random() * count);
    const word = await Word.findOne({ level }).skip(random);

    res.json(word);
  } catch (error) {
    console.log("Error getting random word", error);
    res.status(500).json({ message: "Internal server error" });
  }
});

// Get a single word by ID - This should come after other GET routes with parameters
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

// Update a word (admin only route typically)
router.put("/:id", async (req, res) => {
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