/* eslint-disable linebreak-style */
const express = require('express');
const session = require('express-session');
const path = require('path');
const CASAuthentication = require('cas-authentication');
const bodyParser = require('body-parser');
const morgan = require('morgan');

// Initialize the Express app
const app = express();

// https://dev.to/loujaybee/using-create-react-app-with-express
// https://skryvets.com/blog/2018/09/20/an-elegant-solution-of-deploying-react-app-into-a-subdirectory/
// This middleware allows the react files stored within the build directory locally to be served on a /build URL on the site
app.use('/build', express.static(path.join(__dirname, 'build')));

// Set up HTTP console logging
app.use(morgan('dev'));

// Set up body-parser to return parsed body of HTTP requests
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

// Initialize the Express session to save CAS user information
app.use(session({
  secret: 'super secret key',
  resave: false,
  saveUnitialized: true,
}));

// Set up CAS parameters for transmission to the Dartmouth CAS server
const cas = new CASAuthentication({
  cas_url: 'https://login.dartmouth.edu/cas', // Dartmouth CAS server
  service_url: 'http://localhost:8080', // Where to return to after authentication
  session_info: true, // Should the session hold user information to be accessed later?
});

// Open the app to port 8080
app.listen(8080);
console.log('listening on: 8080');

// CAS based off cas-authentication package (NPM)
// https://www.npmjs.com/package/cas-authentication
// Uses CAS as middleware (middle param of app get requests)

// URL to go to to automatically trigger a redirect to Dartmouth CAS server
app.post('/auth/cas', cas.bounce_redirect);

// Will redirect to Dartmouth CAS if not authenticated
app.get('/', cas.bounce, (req, res) => {
  res.send('Hello!');
});

// Cannot see this URL unless authenticated
app.get('/blocked', cas.block, (req, res) => {
  res.send(`Hi ${req.session.cas_user.split(" ")[0]}! You can only see this if you\'re authenticated!`); // Gets user's first name
  console.log('session user', req.session); // Holds session username ("First M. Last@DARMOUTH.EDU") and a LOT of other stuff (netid, name, and misc technical things) from express-session middleware
})

// Will log the user out of CAS and remove web token
app.get('/logout', cas.logout);

// Will display a react app based on a static interface being served from express.static middleware
app.get('/react', (req, res) => {
  res.sendFile(path.join(__dirname, 'build', 'index.html'));
});
