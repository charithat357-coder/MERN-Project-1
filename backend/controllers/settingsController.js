const Settings = require('../models/Settings');

// @desc    Get settings
// @route   GET /api/settings
// @access  Private
const getSettings = async (req, res) => {
  try {
    let settings = await Settings.findOne();
    if (!settings) {
      settings = await Settings.create({});
    }
    res.json(settings);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// @desc    Update settings
// @route   PUT /api/settings
// @access  Private/Admin
const updateSettings = async (req, res) => {
  try {
    let settings = await Settings.findOne();
    if (!settings) {
      settings = await Settings.create({});
    }

    settings.mid1Max = req.body.mid1Max ?? settings.mid1Max;
    settings.mid2Max = req.body.mid2Max ?? settings.mid2Max;
    settings.assignment1Max = req.body.assignment1Max ?? settings.assignment1Max;
    settings.assignment2Max = req.body.assignment2Max ?? settings.assignment2Max;
    settings.higherMidWeight = req.body.higherMidWeight ?? settings.higherMidWeight;
    settings.lowerMidWeight = req.body.lowerMidWeight ?? settings.lowerMidWeight;

    await settings.save();
    res.json(settings);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

module.exports = {
  getSettings,
  updateSettings
};
