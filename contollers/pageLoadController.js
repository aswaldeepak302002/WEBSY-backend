  const axios = require("axios");
  const PageLoad = require("../models/pageLoad");
  const puppeteer = require ("puppeteer")
  const fs = require('fs');

  const apiKey = process.env.APIKEY

  function buildApiUrl(url, apiKey) {
    return `https://www.googleapis.com/pagespeedonline/v5/runPagespeed?url=${encodeURIComponent(
      url
    )}&key=${apiKey}`;
  }

  function processAnalysisResult(json) {
    const analysisResult = {
      url: json.id,
      cruxMetrics: {
        "First Input Delay":
          json.loadingExperience.metrics.FIRST_INPUT_DELAY_MS.percentile ,
      },
      lighthouseMetrics: {},
      performance:
        json["lighthouseResult"]["categories"]["performance"]["score"] * 100,
      // image: json["lighthouseResult"]["fullPageScreenshot"]["screenshot"],
    };

    const auditNames = [
      "largest-contentful-paint",   
      "cumulative-layout-shift",
      "first-contentful-paint",
      "speed-index",
      "interactive",
      "first-meaningful-paint",
      "network-server-latency",
      "total-byte-weight"
    ];

    for (let i = 0; i < auditNames.length; i++) {
      const auditName = auditNames[i];
      if (
        json.lighthouseResult &&
        json.lighthouseResult.audits &&
        json.lighthouseResult.audits[auditName]
      ) {
        analysisResult.lighthouseMetrics[auditName] =
          json.lighthouseResult.audits[auditName].displayValue;
      } else {
        analysisResult.lighthouseMetrics[auditName] = "NA";
      }
    }

    return analysisResult;
  }

  module.exports.pageLoadDetail = async (req, res) => {
    try {
      const { url, user_id } = req.body;

      // Check if URL is provided
      if (!url) {
        return res.status(400).json({ error: "Missing required field: url" });
      }

      // Check if API key is configured
      if (!apiKey) {
        return res.status(500).json({ error: "API key not configured" });
      }

      // Construct API URL
      const apiUrl = buildApiUrl(url, apiKey);

      // Fetch data from PageSpeed Insights API
      const response = await axios.get(apiUrl);
      const json = response.data;

      // Process analysis result
      const analysisResult = processAnalysisResult(json);

      // Add user_id to the analysis result
      analysisResult.user_id = user_id;

      const browser = await puppeteer.launch();
      const page = await browser.newPage();
      await page.goto(url, { timeout: 60000 }); 
      const screenshotPath = `screenshot_${Date.now()}.png`;
      await page.screenshot({ path: screenshotPath });
      await browser.close();

      const screenshotBase64 = fs.readFileSync(screenshotPath, { encoding: 'base64' });
      analysisResult.screenshotBase64 = `data:image/png;base64,${screenshotBase64}`;

      // Optionally, clean up the screenshot file if you don't need to keep it on the server
      fs.unlinkSync(screenshotPath);

      // Save analysis result to the database
      const pageLoad = new PageLoad(analysisResult);
      await pageLoad.save();

      // Send the analysis result as response
      res.json(analysisResult);
    } catch (error) {
      console.error("Error:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  };

  module.exports.deleteUrl = async (req, res) => {
    const id = req.params.webId;
    if (!id) {
      res.status(400).json({
        status: false,
        message: "Id required",
      });
      return;
    }

    PageLoad.deleteOne({ _id: id })
      .then((web) => {
        res.status(201).json({
          status: true,
          message: "website delete successfully",
        });
      })
      .catch((err) => {
        res.status(500).json({
          status: false,
          message: "Error deleting website",
          error: err,
        });
      });
  };

  module.exports.getAllPageLoad = async (req, res) => {

    const { id } = req.params;
    // console.log("deddd",id);
    const result = await PageLoad.find({ user_id: id }).populate({
      path: "user_id",
      select: ["email"],

    });
    // console.log("dekht heee",result);

    res.status(201).json({
      status: true,
      data: result,
    });
  };

  module.exports.pageLoadId = async (req, res) => {
    const { websiteId } = req.params;
    console.log(websiteId);
    
    try {
      const data = await PageLoad.findById(websiteId);
      console.log("data", data);
      res.status(200).json({ data });
    } catch (error) {
      console.log(error);
      res.status(400).json({ error });
    }
  };
