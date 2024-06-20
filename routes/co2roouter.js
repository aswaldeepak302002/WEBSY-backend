const express = require("express");
const routes = express.Router();

const co2Emission = require("../contollers/co2controller");

routes.post("/co", co2Emission.createUrl);

// pageLoadId

module.exports = routes;
