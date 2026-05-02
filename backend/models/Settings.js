const mongoose = require('mongoose');

const settingsSchema = new mongoose.Schema({
  mid1Max: { type: Number, default: 30 },
  mid2Max: { type: Number, default: 30 },
  assignment1Max: { type: Number, default: 5 },
  assignment2Max: { type: Number, default: 5 },
  higherMidWeight: { type: Number, default: 0.8 }, // 80%
  lowerMidWeight: { type: Number, default: 0.2 }, // 20%
}, { timestamps: true });

const Settings = mongoose.model('Settings', settingsSchema);
module.exports = Settings;
