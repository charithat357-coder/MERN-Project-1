const mongoose = require('mongoose');
const Subject = require('./models/Subject');

mongoose.connect('mongodb://localhost:27017/marks_management')
  .then(async () => {
    const result = await Subject.updateMany(
      {}, 
      { $set: { semester: 1 } }
    );
    console.log(`Updated ${result.modifiedCount} subjects`);
    process.exit();
  })
  .catch(err => {
    console.error(err);
    process.exit(1);
  });
