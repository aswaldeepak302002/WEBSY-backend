const axios = require('axios');
const { co2 } = require('@tgwf/co2');

async function estimateUrlCO2Emission(url) {
    try {
        const response = await axios.get(url, { responseType: 'stream' });
        let totalBytes = 0;

        response.data.on('data', (chunk) => {
            totalBytes += chunk.length;
        });

        return new Promise((resolve, reject) => {
            response.data.on('end', () => {
                const co2Emission = new co2();
                const estimatedCO2 = co2Emission.perByte(totalBytes);
                resolve(estimatedCO2.toFixed(3)); // Returns grams of CO2
            });

            response.data.on('error', (err) => {
                reject(err);
            });
        });
    } catch (error) {
        console.error("Failed to fetch URL for CO2 estimation:", error);
        throw error;
    }
}

function calculateTreesToPlant(co2EmissionInGrams) {
    const co2EmissionInKilograms = co2EmissionInGrams / 1000;
    const co2AbsorptionPerTreePerYear = 21; // 21 kg per year
    return co2EmissionInKilograms / co2AbsorptionPerTreePerYear;
}

module.exports.createUrl = async (req, res) => {
    const { url } = req.body;
    if (!url) {
        return res.status(400).send({ message: "Please provide a URL." });
    }

    try {
        const estimatedCO2 = await estimateUrlCO2Emission(upackarl);
        const treesToPlant = calculateTreesToPlant(estimatedCO2);
        // Assuming you have a benchmark value for CO2 emissions from other websites
        const globalAverageCO2 = 0.1; // grams per byte

        // Calculate the percentage difference
        const percentageDifference = ((globalAverageCO2 - estimatedCO2) / globalAverageCO2) * 100;

        res.send({
            message: `Transferring data from the provided URL had a carbon footprint of ${estimatedCO2} grams of CO2.`,
            estimatedCO2: estimatedCO2,
            treesToPlant: Math.ceil(treesToPlant),
            percentageDifference: Math.round(percentageDifference),
            advice: `Planting approximately ${Math.ceil(treesToPlant)} trees could offset this carbon footprint over the course of their lifetimes.`
        });
    } catch (error) {
        console.error("Error in CO2 estimation:", error);
        res.status(500).send({ message: "Failed to estimate CO2 emissions." });
    }
};
