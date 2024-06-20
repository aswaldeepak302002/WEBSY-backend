const mongoose = require("mongoose");

const urlSchema = new mongoose.Schema(
    {
        _userId:{
            type:mongoose.Schema.Types.ObjectId
        },
        url: {
            type: [String],
        }
    }
)

const Url = mongoose.model("url", urlSchema);

module.exports = Url
