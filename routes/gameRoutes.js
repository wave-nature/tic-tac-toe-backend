const express = require("express");
const {
  createGame,
  getGame,
  updateGame,
  myGames,
} = require("../controllers/gameController");
const { protect } = require("../controllers/userController");

const router = express.Router();
router.route("/").post(protect, createGame).get(protect, myGames);
router.route("/:gameId").get(protect, getGame).patch(protect, updateGame);

module.exports = router;
