import mongoose from "mongoose";
import bcrypt from "bcryptjs";

const userSchema = new mongoose.Schema(
  {
    username: {
      type: String,
      required: true,
      unique: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
    },
    password: {
      type: String,
      required: true,
      minlength: 6,
    },
    profileImage: {
      type: String,
      default: "",
    },
    level: {
      type: String,
      enum: ['A0','A1', 'A2', 'B1', 'B2', 'C1', 'C2'],
      default: 'A0'
    },
    score: {
      type: Number,
      default: 0
    },
    streak: {
      type: Number,
      default: 0
    },
    badges: [{
      type: String
    }],
    vocabularyTestTaken: {
      type: Boolean,
      default: false
    },
    learnedWords: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Word'
    }],
    preferences: {
      nativeLanguage: {
        type: String,
        default: 'en'
      },
      receiveReminders: {
        type: Boolean,
        default: true
      },
      reminderTime: {
        type: String,
        default: '08:00'
      },
      darkMode: {
        type: Boolean,
        default: false
      },
      soundEnabled: {
        type: Boolean,
        default: true
      }
    }
  },
  { timestamps: true }
);

// hash password before saving user to db
userSchema.pre("save", async function (next) {
  if (!this.isModified("password")) return next();

  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);

  next();
});

// compare password func
userSchema.methods.comparePassword = async function (userPassword) {
  return await bcrypt.compare(userPassword, this.password);
};

const User = mongoose.model("User", userSchema);

export default User;
