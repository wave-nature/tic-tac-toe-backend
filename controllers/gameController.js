const { checkRequiredFields } = require("../helpers");
const Game = require("../models/gameModel");
const User = require("../models/userModel");
const AppError = require("../utils/AppError");
const catchAsync = require("../utils/catchAsync");

exports.createGame = catchAsync(async (req, res, next) => {
  const { email } = req.body;

  if (!email) return next(new AppError("Other player email is required"), 400);

  // check if another player exists
  const otherPlayer = await User.findOne({ email });
  if (!otherPlayer)
    return next(new AppError("No user found with this email address", 404));

  // check if logged in user can not enter his/her email
  if (otherPlayer.email === req.user.email)
    return next(new AppError("You can not enter your email", 400));

  // check if there is on going game with same user
  const gameInProgress = await Game.findOne({
    $or: [
      {
        "otherUser.user": otherPlayer._id,
        "initialUser.user": req.user._id,
        inProgress: true,
      },
      {
        "initialUser.user": otherPlayer._id,
        "otherUser.user": req.user._id,
        inProgress: true,
      },
    ],
  });
  if (gameInProgress)
    return next(
      new AppError(
        `Game in progress with user having email ${otherPlayer.email}`
      )
    );
  const randomNumber = Math.floor(Math.random());
  const startGameOptions = {
    initialUser: {
      user: req.user._id,
      piece: randomNumber,
    },
    otherUser: {
      user: otherPlayer._id,
      piece: 1 - randomNumber,
    },
  };

  const game = await Game.create(startGameOptions);

  res.status(201).json({ status: "success", game });
});

exports.getGame = catchAsync(async (req, res, next) => {
  const { gameId } = req.params;

  const game = await Game.findById(gameId)
    .populate("otherUser.user")
    .populate("initialUser.user");
  if (!game) return next(new AppError("No game found with this id", 404));

  res.status(200).json({
    status: "success",
    game,
  });
});

exports.myGames = catchAsync(async (req, res, next) => {
  const userId = req.user._id;
  const games = await Game.find({
    $or: [{ "initialUser.user": userId }, { "otherUser.user": userId }],
  })
    .populate("otherUser.user")
    .populate("initialUser.user")
    .sort("-updatedAt");

  res.status(200).json({ status: "success", games });
});

exports.updateGame = catchAsync(async (req, res, next) => {
  const { gameId } = req.params;
  const { moves, status, inProgress } = req.body;

  const game = await Game.findById(gameId);
  if (!gameId) return next(new AppError("No game found with this id", 404));
  const loggedInUser = req.user;
  // now update the moves of logged in user
  if (game.initialUser.user.equals(loggedInUser._id)) {
    if (game.otherUser.turn) {
      return next(
        new AppError("Other player chance in progress, Please wait!", 400)
      );
    }
    if (status) {
      game.initialUser.status = status;
    }
    game.initialUser.moves = moves;
    game.initialUser.turn = false;
    game.otherUser.turn = true;
  }
  if (game.otherUser.user.equals(loggedInUser._id)) {
    if (game.initialUser.turn) {
      return next(
        new AppError("Other player chance in progress, Please wait!", 400)
      );
    }

    if (status) {
      game.otherUser.status = status;
    }
    game.otherUser.moves = moves;
    game.initialUser.turn = true;
    game.otherUser.turn = false;
  }
  game.inProgress = inProgress;

  await game.save();

  res.status(200).json({
    status: "success",
    game,
  });
});
