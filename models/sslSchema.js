const mongoose = require("mongoose");

const sslSchema = new mongoose.Schema(
    {
        user_id:{
            type:mongoose.Schema.Types.ObjectId,
            ref: 'user'
        },
        url: {
            type: String,
            required: true,
        },
        validFrom: {
            type: String,
        },
        validTo: {
            type: String,
        },
        daysRemaining: {
            type: Number,
        },
    },
   { timestamps: true }
)

const Ssl = mongoose.model("ssl", sslSchema);

module.exports = Ssl
