const User = require("../models/userSchema");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");
const nodemailer = require("nodemailer");
const secret = process.env.SECRET;
const maxAge = 3 * 24 * 60 * 60;
const createToken = (id) => {
  return jwt.sign({ id }, secret, { expiresIn: maxAge });
};

const handleErrors = (err) => {
  let error = { email: "", password: "", all: "" };

  if (err.code === 11000) {
    error.email = "this email already registered";
    return error;
  }

  if (err.message === "Invalid credentials") {
    error.all = "Invalid credentials";
    return error;
  }

  if (err.message.includes("user validation failed")) {
    Object.values(err.errors).forEach((properties) => {
      error[properties.path] = properties.message;
    });
  }

  return error;
};

module.exports.signup = async (req, res) => {
  const { username, email, password } = req.body;
  try {
    const checkuser = await User.findOne({ email });
    if (checkuser) {
      res.status(400).json({ message: "Email already exist" });
    }
    const user = await User.create({ username, email, password });

    const Token = createToken(user._id);
    res.cookie("jwt", Token, {
      httpOnly: true,
      maxAge: 15 * 60 * 1000,
      sameSite: process.env.NODE_ENV === "Development" ? "lax" : "none",
      secure: process.env.NODE_ENV === "Development" ? false : true,
    });
    res.status(201).json({ user, Token });
  } catch (err) {
    console.log(err);
    const error = handleErrors(err);
    res.status(400).json({ error });
  }
};

module.exports.login = async (req, res) => {
  const { email, password } = req.body;

  try {
    const user = await User.login(email, password);
    const token = createToken(user._id);
    res.cookie("jwt", token, {
      httpOnly: true,
      maxAge: 15 * 60 * 1000,
      sameSite: process.env.NODE_ENV === "Development" ? "lax" : "none",
      secure: process.env.NODE_ENV === "Development" ? false : true,
    });
    res.status(200).json({ user, token });
  } catch (err) {
    const error = handleErrors(err);
    res.status(400).json({ error });
  }
};

module.exports.logout = (req, res) => {
  res.clearCookie("jwt");
  res.status(200).send("Cookie cleared");
};

module.exports.forgetPassword = async (req, res) => {
  const { email } = req.body;
  try {
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({ message: "No such email" });
    }
    const token = createToken(user._id);
    const transporter = nodemailer.createTransport({
      service: "gmail",
      host: "smtp.gmail.com",
      port: 465,
      secure: true,
      auth: {
        user: process.env.MYEMAIL,
        pass: process.env.APPPASS,
      },
      tls: {
        // Disable SSL verification
        rejectUnauthorized: false
      }
    });
    const mailOptions = {
      from: {
        name: "WebSpy",
        address: process.env.MYEMAIL,
      }, // sender address
      to: user.email, // list of receivers
      subject: "Reset Password", // Subject line
      html: `<a href="http://localhost:5173/reset-password/${user._id}">Reset Password</a>`,
    };

    const sendMail = async (transporter, mailOptions) => {
      try {
        await transporter.sendMail(mailOptions);
        console.log("email sent");
        res.status(200).json({ message: "Reset email sent" });
      } catch (error) {
        console.log(error);
      }
    };

    sendMail(transporter, mailOptions);
  } catch (error) {
    console.log(error);
    res.status(400).json({ error });
  }
};

module.exports.resetPassword = async (req, res) => {
  const { id } = req.params;
  const { password } = req.body;
  // const token = req.cookies.jwt;
  const token = createToken(id);
  jwt.verify(token, process.env.SECRET, async (err, decode) => {
    if (err) {
      return res.status(400).json({ message: "Invalid token" });
    } else {
      try {
        const salt = await bcrypt.genSalt(10);
        const hashedPass = await bcrypt.hash(password, salt);
        const user = await User.findByIdAndUpdate(
          { _id: id },
          { password: hashedPass }
        );
        if (user) {
          return res.status(200).json({ message: "Password Updated" });
        }
      } catch (error) {
        console.log(error);
        res.status(400).json({ message: "Error occured" });
      }
    }
  });
};

module.exports.updateUser = async (req, res) => {
  const { username, email, _id } = req.body;
  try {
    const updateUser = await User.findByIdAndUpdate(
      { _id },
      { username, email }
    );
    if (!updateUser) {
      res.status(400).json({ message: "Internal server error" });
    }
    res.status(200).json({ message: "Profile Updated" });
  } catch (error) {
    console.log(error);
    res.status(400).json({ error });
  }
};

module.exports.updatePass = (req, res) => {
  const { currentPassword, newPassword, _id } = req.body;
  const token = req.cookies.jwt;
  jwt.verify(token, process.env.SECRET, async (err, decode) => {
    const user = await User.findById({ _id });
    if (err) {
      return res.status(400).json({ message: "Invalid token" });
    } else {
      try {
        const auth = await bcrypt.compare(currentPassword, user.password);
        if (auth) {
          const salt = await bcrypt.genSalt(10);
          const hashedPass = await bcrypt.hash(newPassword, salt);
          const updateUserPass = await User.findByIdAndUpdate(
            { _id },
            { password: hashedPass }
          );
          if (updateUserPass) {
            return res.status(200).json({ message: "Password Updated" });
          }
        }
      } catch (error) {
        console.log(error);
        res.status(400).json({ message: "Error occured" });
      }
    }
  });
  try {
  } catch (error) {
    console.log(error);
    res.status(400).json({ error });
  }
};

module.exports.updateProfilePicture = async (req, res) => {
  const { profilePicture, _id } = req.body;
  try {
    const uploadProfilePicture = await User.findByIdAndUpdate(
      { _id },
      { profilePicture }
    );
    if (!uploadProfilePicture) {
      res.status(400).json({ message: "The picture was not uploaded." });
    }
    res.status(200).json({ message: "The ProfilePicture updated." });
  } catch (err) {
    console.log(err);
  }
};



module.exports.oauth = async (req, res, next) => {
  const { email, username, profilePicture } = req.body;
  try {
    const user = await User.findOne({ email });
    if (user) {
      const token = jwt.sign(
        { id: user._id, isAdmin: user.isAdmin },
        process.env.SECRET
      );
      const { password, ...rest } = user._doc;
      res
        .status(200)
        .cookie("access_token", token, {
          httpOnly: true,
          sameSite: 'none',
          secure: true
        })
        .json(rest);
    } else {
      const generatedPassword =
        Math.random().toString(36).slice(-8) +
        Math.random().toString(36).slice(-8);
      const hashedPassword = bcrypt.hashSync(generatedPassword, 10);
      const newUser = new User({
        username:
          username.toLowerCase().split(" ").join("") +
          Math.random().toString(9).slice(-4),
        email,
        password: hashedPassword,
        profilePicture: profilePicture,
      });
      await newUser.save();
      const token = jwt.sign(
        { id: newUser._id, isAdmin: newUser.isAdmin },
        process.env.SECRET
      );
      const { password, ...rest } = newUser._doc;
      res
        .status(200)
        .cookie("access_token", token, {
          httpOnly: true,
        })
        .json(rest);
    }
  } catch (error) {
    next(error);
  }
};

//send otp verififcation email
