const mongoose = require("mongoose");

const categorySchema = new mongoose.Schema({
  name: { type: String, required: true },
  merchantId: { type: mongoose.Schema.Types.ObjectId, required: true },
});

module.exports = mongoose.model("Category", categorySchema);