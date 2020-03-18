/* eslint-disable linebreak-style */
const express = require('express');
const session = require('express-session');
const path = require('path');
const CASAuthentication = require('cas-authentication');
const bodyParser = require('body-parser');
const morgan = require('morgan');

const app = express();

// https://dev.to/loujaybee/using-create-react-app-with-express
// app.use(express.static(path.join(__dirname, 'build')));

app.use(morgan('dev'));

app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

app.use(session({
  secret: 'super secret key',
  resave: false,
  saveUnitialized: true,
}));

const cas = new CASAuthentication({
  cas_url: 'https://login.dartmouth.edu/cas',
  service_url: 'http://localhost:8080',
  // session_info: true,
});

app.listen(8080);
console.log('listening on: 8080');

// CAS based off cas-authentication package (NPM)
// https://www.npmjs.com/package/cas-authentication
app.post('/auth/cas', cas.bounce_redirect);

// Will redirect to CAS authentication if not authenticated
app.get('/', cas.bounce, (req, res) => {
  res.send('Hello!');
});

app.get('/blocked', cas.block, (req, res) => {
  res.send(`Hi ${req.session.cas_user.split(" ")[0]}! You can only see this if you\'re authenticated!`);
  console.log('session user', req.session.cas_user); // Holds session username ("First M. Last@DARMOUTH.EDU")
})

app.get('/logout', cas.logout);

// app.get('/react', (req, res) => {
//   res.sendFile(path.join(__dirname, 'build', 'index.html'));
// });
