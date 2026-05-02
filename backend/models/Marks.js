const mongoose = require('mongoose');

const marksSchema = new mongoose.Schema({
  student: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  subject: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Subject',
    required: true,
  },
  faculty: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  mid1: {
    type: Number,
    min: 0,
    max: 30, // Assuming max marks for mid is 30, adjust as needed
    default: 0
  },
  mid2: {
    type: Number,
    min: 0,
    max: 30,
    default: 0
  },
  assignment1: {
    type: Number,
    default: 0
  },
  assignment2: {
    type: Number,
    default: 0
  },
  total: {
    type: Number,
    default: 0
  },
  status: {
    type: String,
    enum: ['Draft', 'Submitted', 'Approved', 'Rejected'],
    default: 'Draft'
  },
  seenByHOD: {
    type: Boolean,
    default: false
  }
}, { timestamps: true });

// Pre-save hook to calculate total marks dynamically
marksSchema.pre('save', async function(next) {
  const m1 = this.mid1 || 0;
  const m2 = this.mid2 || 0;
  const a1 = this.assignment1 || 0;
  const a2 = this.assignment2 || 0;

  try {
    const Settings = mongoose.model('Settings');
    let settings = await Settings.findOne();
    if (!settings) {
      settings = { higherMidWeight: 0.8, lowerMidWeight: 0.2 };
    }

    const higherMid = Math.max(m1, m2);
    const lowerMid = Math.min(m1, m2);

    this.total = Math.round((settings.higherMidWeight * higherMid) + (settings.lowerMidWeight * lowerMid) + a1 + a2);
    next();
  } catch (err) {
    next(err);
  }
});

const Marks = mongoose.model('Marks', marksSchema);
module.exports = Marks;
