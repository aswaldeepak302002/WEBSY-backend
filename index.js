const express = require("express");
const mongoose = require("mongoose");
require("dotenv").config();
const cookiePraser = require("cookie-parser");
const userAuthRoutes = require("./routes/userrouter.js");
const urlRoutes = require("./routes/urlrouter.js");
const sslRouter = require("./routes/sslrouter.js");
const webRoutes = require("./routes/upTimerouter.js");
const cron = require("node-cron");
const cors = require("cors");
const WebsiteSchema = require("./models/upTimeSchema.js");
const SslSchema = require("./models/sslSchema.js");
const nodemailer = require("nodemailer");
const pagesLoad = require("./routes/pageLoadRouter.js");
const co2js = require("./routes/co2roouter.js");

const PORT = 5000;

// connect to MongoDB
const mongoURL = `${process.env.MONGOURL}`;
mongoose.connect(mongoURL).then(() => console.log("mongodb connected"));

const app = express();
app.use(express.static("public"));
app.use(cors());
app.use(express.json()); //middleware for converting in JSON format
app.use("/api/auth", userAuthRoutes);
app.use(cookiePraser());
app.use("/api", urlRoutes);
app.use("/api", sslRouter);
app.use("/api", webRoutes);
app.use("/api", pagesLoad);
app.use("/api", co2js);

//Email When website is Down
const sendEmailToUpTimeFalse = (email, url) => {
  try {
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
        rejectUnauthorized: false,
      },
    });
    const mailOptions = {
      from: {
        name: "WebSpy",
        address: process.env.MYEMAIL,
      },
      to: email,
      subject: "Your website has gone down. Please have a look",
      html: `Your website - <b>${url}</b> is down. As we checked on`,
    };

    // console.log(mailOptions);
    // console.log("Email sent");
    transporter.sendMail(mailOptions);
  } catch (error) {
    console.log(error);
  }
};

cron.schedule("* * * * *", async () => {
  console.log("cron run");
  const allWebsites = await WebsiteSchema.find({}).populate({
    path: "user_id",
    select: ["email"],
  });

  // console.log(allWebsites);

  if (!allWebsites.length) {
    console.log("No website is found");
    return;
  }

  allWebsites.forEach((item) => {
    const { url, status, user_id } = item;
    const userEmail = user_id ? user_id.email : null;
    // console.log(url, status, userEmail);

    if (status === "Down") {
      // console.log("Website is down", url, status);
      sendEmailToUpTimeFalse(userEmail, url);
    }
  });
});

//Email When Ssl Certificate expire days is near

const sendEmailToUpdateSsl = (email, url) => {
  try {
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
        rejectUnauthorized: false,
      },
    });
    const mailOptions = {
      from: {
        name: "WebSpy",
        address: process.env.MYEMAIL,
      },
      to: email,
      subject: "Your SSL Certificate will expire soon. Please update",
      html: `Your SSL Certificate - <b>${url}</b> will expire soon. As we checked on`,
    };

    // console.log(mailOptions);
    console.log("Email sent");
    transporter.sendMail(mailOptions);
  } catch (error) {
    console.log(error);
  }
};

cron.schedule("* * * * *", async () => {
  // console.log("SSL Checking");
  const allSsl = await SslSchema.find({}).populate({
    path: "user_id",
    select: ["email"],
  });

  // console.log(allSsl);

  if (!allSsl.length) {
    console.log("No website is found");
    return;
  }

  allSsl.forEach((item) => {
    const { url, daysRemaining, user_id } = item;
    const userEmail = user_id ? user_id.email : null;
    // console.log(url, daysRemaining, userEmail);

    if (daysRemaining <= 7) {
      // console.log("Website is down", url, daysRemaining);
      sendEmailToUpdateSsl(userEmail, url);
    }
  });
});

app.listen(PORT, () =>
  console.log(`Server is listening on http://localhost:${PORT}`)
);
