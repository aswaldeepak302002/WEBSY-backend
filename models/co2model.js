const mongoose = require('mongoose');

const CO2EmissionSchema = new mongoose.Schema({
  url: {
    type: String,
    required: true
  },
  estimatedCO2: {
    type: Number,
    required: true
  },
  treesToPlant: {
    type: Number,
    required: true,
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

const CO2Emission = mongoose.model('CO2Emission', CO2EmissionSchema);

module.exports = CO2Emission;
