const express = require("express");
const routes = express.Router();

const pageLoad = require("../contollers/pageLoadController");
  
routes.post("/pageLoad", pageLoad.pageLoadDetail);
routes.delete("/pageLoad/:webId", pageLoad.deleteUrl);
routes.get("/pageLoad/:id", pageLoad.getAllPageLoad);
routes.get("/pageLoad/one/:websiteId", pageLoad.pageLoadId);
// pageLoadId

module.exports = routes;
