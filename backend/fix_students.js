const mongoose = require('mongoose');
const User = require('./models/User');

mongoose.connect('mongodb://localhost:27017/marks_management')
  .then(async () => {
    const result = await User.updateMany(
      { role: 'Student' }, 
      { $set: { semester: 1, section: 'A' } }
    );
    console.log(`Updated ${result.modifiedCount} students`);
    process.exit();
  })
  .catch(err => {
    console.error(err);
    process.exit(1);
  });
