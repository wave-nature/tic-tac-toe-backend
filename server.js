const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const cookieParser = require("cookie-parser");
require("dotenv").config();
const userRouter = require("./routes/userRoutes");
const gameRouter = require("./routes/gameRoutes");
const globalErrorHandler = require("./controllers/errorController");
const app = express();

const PORT = process.env.PORT || 8080;

mongoose
  .connect(process.env.DB_URL, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then(() => console.log("Connect to DB😀"));

app.use(cors());
app.use(express.json());
app.use(cookieParser());

app.use("/api/users", userRouter);
app.use("/api/games", gameRouter);
app.use(globalErrorHandler);

app.listen(PORT, () => {
  console.log(`Server is running at ${PORT}😁`);
});
