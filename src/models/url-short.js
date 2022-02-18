const mongoose = require("mongoose");
const urlSchema = new mongoose.Schema({
    urlCode: {
        type: String, unique: true, lowercase: true, trim: true
    },
    longUrl: {
        type: String, required: "Long URL is required", trim: true
    },
    shortUrl: {
        type: String, required: "Short URL required", unique: true
    },
    },
    {timestamps: true}
);

module.exports = mongoose.model("Url", urlSchema);