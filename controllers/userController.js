const jwt = require("jsonwebtoken");
const { promisify } = require("util");
const { checkRequiredFields } = require("../helpers");
const User = require("../models/userModel");
const AppError = require("../utils/AppError");
const catchAsync = require("../utils/catchAsync");

const newToken = (userId) => {
  const token = jwt.sign({ id: userId }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES,
  });
  return token;
};

exports.register = catchAsync(async (req, res, next) => {
  // check if fields are present
  const allRequiredFields = checkRequiredFields(
    ["name", "username", "email", "password"],
    req.body
  );
  if (allRequiredFields.length > 0) {
    return next(
      new AppError(
        `These fields are required to register - ${allRequiredFields}`,
        400
      )
    );
  }
  // check if user already registered
  const hasUser = await User.findOne({ username: req.body.username });
  if (hasUser) {
    return next(new AppError(`User already registered`, 400));
  }

  // register user and send token
  const user = await User.create(req.body);
  const token = newToken(user._id);

  res.cookie("jwt", token, {
    expires: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
    httpOnly: true,
  });

  res.status(201).json({
    status: "success",
    user,
    token,
  });
});

exports.login = catchAsync(async (req, res, next) => {
  const { username, password } = req.body;
  const allRequiredFields = checkRequiredFields(
    ["username", "password"],
    req.body
  );
  // 1) If there is no username or password
  if (allRequiredFields.length > 0)
    return next(
      new AppError(
        `These fields are required to login - ${allRequiredFields}`,
        400
      )
    );

  // 2) Check if password is correct and user exist or not
  const user = await User.findOne({ username }).select("+password");

  if (!user || !(await user.checkPassword(password, user.password)))
    return next(new AppError("Either username or password is incorrect", 401));

  //3) if everything is ok, send the token to client
  const token = newToken(user._id);
  res.cookie("jwt", token, {
    expires: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
    httpOnly: true,
  });

  res.status(200).json({
    status: "success",
    user,
    token,
  });
});

exports.protect = catchAsync(async (req, res, next) => {
  // 1) Get the jwt token and check if its exist
  let token;
  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith("Bearer")
  ) {
    token = req.headers.authorization.split(" ")[1];
  } else if (req.cookies.jwt) {
    token = req.cookies.jwt;
  }
  // console.log(token);
  if (!token)
    return next(new AppError("You are not authorized! Please login", 401));

  // 2) Verfication of jwt
  const payload = await promisify(jwt.verify)(token, process.env.JWT_SECRET);

  // 3) check If user exist
  const currentUser = await User.findById(payload.id);
  if (!currentUser)
    return next(new AppError("The user trying to login doesnot exist", 401));

  req.user = currentUser;
  next();
});
