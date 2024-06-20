const express = require("express");
const routes = express.Router();

const createWebsite = require("../contollers/upTimeController");

routes.post("/ping", createWebsite.createWebsite);
routes.delete("/ping/:urlId", createWebsite.deleteWebsite);
routes.get("/ping/:id", createWebsite.getAllUrls);
routes.get("/ping/one/:websiteId", createWebsite.findUpDownById);

module.exports = routes;
