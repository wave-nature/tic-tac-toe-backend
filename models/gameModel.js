const mongoose = require("mongoose");

const gameSchema = new mongoose.Schema(
  {
    initialUser: {
      user: {
        type: mongoose.Types.ObjectId,
        ref: "User",
        required: [true, "Game must be initiated by user"],
      },
      moves: [Number],
      status: {
        type: String,
        enum: ["win", "draw"],
      },
      turn: {
        type: Boolean,
        default: true,
      },
      piece: Number,
    },
    otherUser: {
      user: {
        type: mongoose.Types.ObjectId,
        ref: "User",
        required: [true, "Game must have other user"],
      },
      moves: [Number],
      status: {
        type: String,
        enum: ["win", "draw"],
      },
      turn: {
        type: Boolean,
        default: false,
      },
      piece: Number,
    },
    inProgress: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  }
);

const Game = mongoose.model("Game", gameSchema);

module.exports = Game;
