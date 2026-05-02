fetch('http://localhost:5000/api/auth/login', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    email: 'admin@college.edu',
    password: 'password123'
  })
})
.then(res => res.json().then(data => ({ status: res.status, data })))
.then(({ status, data }) => {
  if (status >= 400) {
    console.error('ERROR:', data);
  } else {
    console.log('SUCCESS:', data.email, data.role);
  }
})
.catch(err => console.error('NETWORK ERROR:', err));
