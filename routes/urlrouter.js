const express = require("express");
const urlController = require("../contollers/urlController");
const routes = express.Router();

routes.post("/url/:_userId", urlController.url);
routes.get("/url/:_userId", urlController.getAllUserUrl);

module.exports = routes;
