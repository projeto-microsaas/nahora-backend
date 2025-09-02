const mongoose = require("mongoose");

const notificationSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  emailNewDelivery: { type: Boolean, default: true },
  emailStatusChanges: { type: Boolean, default: true },
  emailDelivered: { type: Boolean, default: true },
  emailPayment: { type: Boolean, default: true },
  smsNewDelivery: { type: Boolean, default: false },
  smsStatusChanges: { type: Boolean, default: true },
  smsDelivered: { type: Boolean, default: true },
});

module.exports = mongoose.model("NotificationPreference", notificationSchema);