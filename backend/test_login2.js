const axios = require('axios');

axios.post('http://localhost:5000/api/auth/login', {
  email: 'admin@college.edu',
  password: 'password123'
})
.then(res => console.log('SUCCESS:', res.data))
.catch(err => {
  if (err.response) {
    console.error('SERVER ERROR:', err.response.status, err.response.data);
  } else {
    console.error('NETWORK ERROR:', err.message);
  }
});
