const express = require("express");
const authController = require("../contollers/userController");
const routes = express.Router();

routes.post("/signup", authController.signup);
// routes.post('/signup',(req,res)=>res.send("Hello"))
routes.post("/login", authController.login);

routes.get("/logout", authController.logout);

routes.post("/forget-password", authController.forgetPassword);

routes.post("/reset-password/:id", authController.resetPassword);

routes.put("/updateUser", authController.updateUser);

routes.put("/updatepass", authController.updatePass);

routes.post("/updateProfilePicture", authController.updateProfilePicture);

routes.post("/oauth", authController.oauth);

module.exports = routes;

//mtlb css sikha aur udhar implement kiya types
