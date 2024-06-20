const express = require("express");
const sslController = require("../contollers/sslController");
const routes = express.Router();

routes.post("/ssl", sslController.createSsl);
routes.delete("/ssl/:webId", sslController.deleteSsl);
routes.get("/ssl/:id", sslController.getAllSsl);

module.exports = routes;
