const router = require("express").Router();
const User = require("../models/userModel");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const authMiddleware = require("../middlewares/authMiddleware");
//  register user account

router.post("/register", async (req, res) => {
  try {
    // check if user already exists

    const user = await User.findOne({ email: req.body.email });
    if (user) {
      return res.send({
        success: false,
        message: "User Already Exists",
      });
    }

    // hash password
    const password = req.body.password;
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);
    req.body.password = hashedPassword;
    const newUser = new User(req.body);
    await newUser.save();
    res.send({
      message: "User creates Successfully",
      success: true,
      data: null,
    });
  } catch (error) {
    console.log(error);
    res.send({
      message: "Error Creating in register",
      success: false,
    });
  }
});

// login user account

router.post("/login", async (req, res) => {
  try {
    //  check if user exists
    let user = await User.findOne({ email: req.body.email });

    if (!user) {
      return res.send({
        success: false,
        message: "user does not exists",
      });
    }

    //  check if password is correct
    const validPassword = await bcrypt.compare(
      req.body.password,
      user.password
    );

    if (!validPassword) {
      return res.send({
        success: false,
        message: " Password is incorrect",
      });
    }

    // check if user is verified
    if (!user.isVerified) {
      return res.send({
        success: false,
        message: "User is not Verified Yet by the Admin",
      });
    }

    // genrate token
    const token = jwt.sign({ userId: user._id }, process.env.jwt_secret, {
      expiresIn: "1d",
    });

    res.send({
      message: "Login successfully",
      data: token,
      success: true,
    });
  } catch (error) {
    console.log(error);
    res.send({
      message: "User Login Failed",
      success: false,
    });
  }
});

//  get user info

router.post("/get-user-info", authMiddleware, async (req, res) => {
  try {
    const user = await User.findById(req.body.userId);
    user.password = undefined;

    if (!user) {
      return res.status(200).send({
        message: "user does not exists",
        success: false,
      });
    } else {
      res.status(200).send({
        success: true,
        data: user,
        message: "User info fetched successfully",
      });
    }
  } catch (error) {
    res.status(500).send({
      message: "Error getting user info",
      success: false,
      error,
    });
  }
});

// get all users to the admin

router.get("/get-all-users", authMiddleware, async (req, res) => {
  try {
    const users = await User.find();
    res.send({
      message: "Users fetched Successfully",
      data: users,
      success: true,
    });
  } catch (error) {
    res.send({
      message: "Users data not fetched ",
      success: false,
    });
  }
});

//  update user verified status

router.post(
  "/update-user-verified-status",
  authMiddleware,
  async (req, res) => {
    try {
      await User.findByIdAndUpdate(req.body.selectedUser, {
        isVerified: req.body.isVerified,
      });

      res.send({
        message: "Users verified status  updated successfully ",
        success: true,
        data: null,
      });
    } catch (error) {
      res.send({
        message: "Users verified status not updated ",
        success: false,
        data: error,
      });
    }
  }
);

module.exports = router;
