const SSL = require("../models/sslSchema");
const sslChecker = require("ssl-checker");

function validateUrl(url) {
  var regexp =
    /(ftp|http|https):\/\/(\w+:{0,1}\w*@)?(\S+)(:[0-9]+)?(\/|\/([\w#!:.?+=&%@!\-\/]))?/;
  return regexp.test(url);
}

let interval;

module.exports.createSsl = async (req, res) => {
  const { user_id, url } = req.body;

  try {
    if (!url) {
      return res.status(400).json({ error: "URL is required" });
    }

    // Function to fetch SSL details and update the database
    const updateSslDetails = async () => {
      try {
        const sslDetails = await sslChecker(url);
        const timestamp = sslDetails.validFrom;
        const validFromTimestamp = timestamp.slice(0, -14);
        const timestamps = sslDetails.validTo;
        const validToTimestamps = timestamps.slice(0, -14);

        // Check if SSL details exist for the given URL and user_id
        const existingSSL = await SSL.findOne({ url, user_id });

        // If SSL details exist, compare daysRemaining
        if (existingSSL) {
          if (existingSSL.daysRemaining !== sslDetails.daysRemaining) {
            // Update daysRemaining if it has changed
            existingSSL.daysRemaining = sslDetails.daysRemaining;
            await existingSSL.save();
            console.log("SSL details updated:", existingSSL);
          }
        } else {
          // If SSL details do not exist, create new SSL document
          const newSSL = new SSL({
            user_id,
            url: url,
            commonName: sslDetails.commonName,
            issuer: sslDetails.issuer,
            validFrom: validFromTimestamp,
            validTo: validToTimestamps,
            daysRemaining: sslDetails.daysRemaining,
          });
          await newSSL.save();
          console.log("New SSL details saved:", newSSL);
        }
      } catch (error) {
        console.error("Error updating SSL details:", error);
      }
    };

    // Immediately call updateSslDetails when a new URL is added
    await updateSslDetails();

    res.status(200).json({ message: "SSL details update started" });

    // Call updateSslDetails every second
     interval = setInterval(updateSslDetails, 1000);

    // Stop the interval when the request ends
    req.on("end", () => clearInterval(interval));
  } catch (error) {
    console.error("Error in finding SSL details:", error);
    res.status(500).json({ error });
  }
};

module.exports.deleteSsl = async (req, res) => {
  const id = req.params.webId;
  if (!id) {
    res.status(400).json({
      status: false,
      message: "Id required",
    });
    return;
  }

  clearInterval(interval);

  SSL.deleteOne({ _id: id })
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

module.exports.getAllSsl = async (req, res) => {
  const { id } = req.params;
  const result = await SSL.find({ user_id: id }).populate({
    path: "user_id",
    select: ["email"],
  });

  res.status(201).json({
    status: true,
    data: result,
  });
};
