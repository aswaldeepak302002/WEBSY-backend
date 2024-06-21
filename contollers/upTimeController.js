const WebsiteSchema = require("../models/upTimeSchema");
const { exec } = require("child_process");
const EventEmitter = require("events");
const eventEmitter = new EventEmitter();
const moment = require("moment");

module.exports.createWebsite = async (req, res) => {
  const { url, user_id } = req.body;

  if (!url) {
    return res.status(400).json({ error: "Website URL is required" });
  }

  const existingMonitor = await WebsiteSchema.findOneAndUpdate(
    { url, user_id },
    { monitoring: true, $set: { responseTimes: [] } },
    { upsert: true, new: true }
  );

  let interval;
  let isMonitoredAsUp = false;
  let isMonitoredAsDown = false;

  let uptimeDuration = 0;
  let downtimeDuration = 0;
  let lastStatusChangeTime = Date.now();

  eventEmitter.setMaxListeners(Infinity);


  const pingAndUpdate = () => {
    exec(`ping -n 1 ${url}`, async (error, stdout, stderr) => {
      const currentTime = Date.now();
      let isUp = false;
      let responseTime = null;

      if (!error && stdout.includes("Reply from")) {
        isUp = true;
        const match = stdout.match(/time=(\d+)ms/);
        responseTime = match ? parseInt(match[1], 10) : null;
      }

      try {
        const currentMonitorStatus = await WebsiteSchema.findOne({
          url,
          user_id,
        });
  
        let update;
        if (isUp) {
          if (
            !isMonitoredAsUp &&
            (!currentMonitorStatus || currentMonitorStatus.status !== "Up")
          ) {
            isMonitoredAsUp = true;
            isMonitoredAsDown = false;
            update = {
              $inc: { upCount: 1 },
              status: "Up",
              $push: { responseTimes: responseTime },
            };
          } else {
            update = { $push: { responseTimes: responseTime } };
          }
        } else {
          if (!isMonitoredAsDown || currentMonitorStatus.status !== "Down") {
            isMonitoredAsDown = true;
            isMonitoredAsUp = false;
            update = { $inc: { downCount: 1 }, status: "Down" };
          }
        }
  
        const updatedWebsite = await WebsiteSchema.findOneAndUpdate(
          { url, user_id },
          update,
          { new: true }
        );
  
        // Check if this is the first successful database update
        if (!interval) {
          interval = setInterval(pingAndUpdate, 5000); // Check every 5 seconds
          // Only send response if it hasn't been sent yet
          if (!res.headersSent) {
            // Send the response with the updated website data
            res.status(200).json({
              message: "Monitoring started",
              data: updatedWebsite,
            });
          }
        }
      } catch (error) {
        console.error("Error updating website status:", error);
        if (interval) {
          clearInterval(interval);
          interval = null;
        }
      }
    });
  };

  pingAndUpdate();

  // Listen to "aborted" event
  eventEmitter.on("aborted", () => {
    if (interval) {
      clearInterval(interval);
      console.log("Monitoring stopped");
      interval = null;
      WebsiteSchema.findOneAndUpdate(
        { url, user_id },
        { monitoring: false }
      ).catch(console.error);
    }
  });

  // Listen to "deleteWebsite" event
  eventEmitter.on("deleteWebsite", () => {
    if (interval) {
      clearInterval(interval);
      console.log("Monitoring stopped after website deletion");
      interval = null;
      WebsiteSchema.findOneAndUpdate(
        { url, user_id },
        { monitoring: false }
      ).catch(console.error);
    }
  });
};

module.exports.deleteWebsite = async (req, res) => {
  const { urlId } = req.params;

  if (!urlId) {
    return res.status(400).json({ error: "URL ID is required" });
  }

  try {
    const website = await WebsiteSchema.findById(urlId);

    if (!website) {
      return res.status(404).json({ error: "Website not found" });
    }

    clearInterval(website.interval);

    await WebsiteSchema.findByIdAndDelete(urlId);

    eventEmitter.emit("deleteWebsite");

    res.status(200).json({ message: "Website deleted successfully" });
  } catch (error) {
    console.error("Error deleting website:", error);
    res.status(500).json({ error: "Failed to delete website" });
  }
};

module.exports.getAllUrls = async (req, res) => {
  const { id } = req.params;
  console.log(id);

  const result = await WebsiteSchema.find({ user_id: id }).populate({
    path: "user_id",
    select: ["email"],
  });
  const totalUpCount = result.reduce((acc, url) => acc + url.upCount, 0);
  const totalDownCount = result.reduce((acc, url) => acc + url.downCount, 0);

  res.status(201).json({
    status: true,
    data: result,
    totalUpCount,
    totalDownCount,
  });
};

module.exports.findUpDownById = async (req, res) => {
  const { websiteId } = req.params;

  try {
    const data = await WebsiteSchema.findById(websiteId);
    console.log("data", data);
    const status = data ? (data.status ? "Up" : "Down") : "Unknown";
    res.status(200).json({ data });
  } catch (error) {
    console.log(error);
    res.status(400).json({ error });
  }
};
