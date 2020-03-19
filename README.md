# demoNodeExpressReactServer

A template NodeJS and ExpressJS app that supports serving both ReactJS and default HTML/CSS/JS sites, integrated with Dartmouth College's Duo Central Authentication Service (CAS) servers. This ensures that site pages will only be shown to users if they are students at Dartmouth College and pass a Duo Authentication check.

## Architecture

The project is built on a [NodeJS](https://nodejs.org/) engine running an [ExpressJS](https://expressjs.com/) server. This server can serve both built (static) ReactJS and standard HTML/CSS/JS, depending on the needs of the user.

The project contains a demo [React](https://reactjs.org/) app, using the [Yarn](https://yarnpkg.com/) package manager. It also utilizes web development tools such as [Webpack](http://webpack.github.io/), [Babel](https://babeljs.io/), and [ESLint](https://eslint.org/).

## Setup

Before beginning setup, make sure you have the following installed:

1. [Yarn](https://yarnpkg.com/)
2. [NodeJS](https://nodejs.org/)

### 1. Fork the Repository

```shell
git clone https://github.com/ajmcquilkin/demoNodeExpressReactServer
cd demoNodeExpressReactServer/api
```

### 2. Start the Demo Server

Now that you have selected the `/api` route, run the following command in a terminal window.

```shell
yarn
```

This will install the following packages:

1. [eslint](https://www.npmjs.com/package/eslint) - An ES6 linter package
2. [nodemon](https://www.npmjs.com/package/nodemon) - A tool that auto-restarts NodeJS servers on file changes
3. [express](https://www.npmjs.com/package/express) - A lightweight NodeJS server framework
4. [express-session](https://www.npmjs.com/package/express-session) - A session manager for ExpressJS
5. [body-parser](https://www.npmjs.com/package/body-parser) - A package to parse req.body for all incoming HTTP requests
6. [morgan](https://www.npmjs.com/package/morgan) - An HTTP request logger middleware for NodeJS
7. [cas-authentication](https://www.npmjs.com/package/cas-authentication) - The package used to manage CAS authentication and authentication state as `ExpressJS` middleware

You can then start the server by running the following command:

```shell
nodemon server.js
```

You will now be able to navigate the site on [http://localhost:8080](http://localhost:8080)

## Site URL Breakdown

```
Express Server
├── /
│   └── GET - A route that will redirect an unauthenticated user to the Dartmouth CAS system for authentication
│
├── /blocked
│   └── GET - A route that cannot be accessed until a user has been authenticated through the Dartmouth CAS system
│
├── /logout
│   └── GET - A route that will redirect the user to the Dartmouth CAS system to be logged out
│
├── /react
│   └── GET - A route not protected by the Dartmouth CAS system serving a static ReactJS app
│
└── /auth/cas
    └── POST - A route that cannot be accessed by a browser but that is redirected to within the app before making any request to the Dartmouth CAS system (e.g. [GET - '/'] -> [POST - '/auth/cas'] -> [https://login.dartmouth.edu/cas])
```

## System Overview

This CAS implementation is based heavily on [request middleware functions](https://expressjs.com/en/guide/using-middleware.html), specifically from the `Express-Session` and `CAS-Authentication` packages. An express session allows the storage of information on a site user regardless of their location on the site, and the `CAS-Authentication` package takes advantage of this to store information about the current authentication status of the user. This is initilized in the following code.

### Set up the express session to record information on the user from the Dartmouth CAS system

```javascript
// Initialize the Express session to save CAS user information
app.use(session({
  secret: 'super secret key',
  resave: false,
  saveUnitialized: true,
}));
```

### Set up the CAS Authentication manager middleware

```javascript
// Set up CAS parameters for transmission to the Dartmouth CAS server
const cas = new CASAuthentication({
  cas_url: 'https://login.dartmouth.edu/cas', // Dartmouth CAS server
  service_url: 'http://localhost:8080', // Where to return to after authentication
  session_info: true, // Should the session hold user information to be accessed later?
});
```

The Dartmouth CAS server is in charge of determining whether or not a user is authenticated based on their student NetID and password database, and the express server can make requests to Dartmouth to ask it to verify if a user is in fact a student. If the user is a student the Dartmouth server will return information about the student, and if not it will return that the user is not a student. Below is an example of data returned on a user from the Dartmouth CAS system.

### Sample Session User Information

```javascript
{
  cookie: { path: '/', _expires: null, originalMaxAge: null, httpOnly: true },
  cas_return_to: '/',
  cas_user: 'First M. Last@DARTMOUTH.EDU',
  true: {
    affil: 'DART',
    isfromnewlogin: 'true',
    bypassmultifactorauthentication: 'false',
    authenticationdate: '2020-03-18T21:19:05.357843Z[UTC]',
    netid: 'f###---',
    authncontextclass: 'mfa-duo',
    successfulauthenticationhandlers: [ 'LdapAuthenticationHandler', 'mfa-duo' ],
    credentialtype: [ 'RememberMeUsernamePasswordCredential', 'DuoSecurityCredential' ],
    samlauthenticationstatementauthmethod: 'urn:oasis:names:tc:SAML:1.0:am:unspecified',
    uid: '##########',
    authenticationmethod: [ 'LdapAuthenticationHandler', 'mfa-duo' ],
    name: 'First M. Last',
    longtermauthenticationrequesttokenused: 'false',
    did: 'HDF###---'
  }
}
```

### Getting User Information from Session

This information can be accessed within an express route (e.g. `app.get()`) in the `req.session` object created by the `express-session` middleware.

```javascript
app.get('/url', (req, res) => {
  res.send(`Hi ${req.session.cas_user.split(" ")[0]}!`); // Displays "Hi [FIRST NAME]!" on route "/url"
  console.log('session user', req.session); // Gets entire session from middleware
})
```

### CAS Route Access Options

The `cas-authentication` package gives a number of different middleware options that can be applied to server routes to modify access based on the CAS authentication status of a user. Below is a comprehensive list of these middleware functions. More information on these methods can be found on the package's [NPM registry](https://www.npmjs.com/package/cas-authentication).

* `cas.bounce` - CAS middleware that redirects the user to the specified (in this case Dartmouth's) CAS server to get authenticated
* `cas.block` - CAS middleware that blocks any unauthenticated users from accessing the given route
* `cas.bounce_redirect` - Directs the user to get authenticated and on authentication will be redirected to the provided `redirectTo` URL
* `cas.logout` - CAS middleware that directs the CAS server to remove authentication (log out) the current user and clears their current CAS session. This can be configured to clear the user's entire session with the `destroy_session` boolean (default: `false`) in the CAS initialization object.

Below is an example of how to use these middleware functions with `Express` within an app route.

```javascript
// Will redirect to Dartmouth CAS if user is not authenticated and will return to '/' once authenticated
app.get('/', cas.bounce, (req, res) => {
  res.send('Hello!');
});
```

## Connecting a React App

This configuration of `Express` allows the serving of static `ReactJS` files on specific routes within the app. To do this, first navigate to the `app` directory.

```shell
cd ..
cd app
```

Here is where you can develop and run the app the same way you would with any other React app. To do this:

```shell
yarn start
```

The app development server will serve the React app at `http://localhost:3000` and will live-update with any code changes.

### Serving the React App

To serve the React app on the Express server, the app must first be built. Before building, the `package.json` file of the app must be modified to support being placed within a `/build` folder within the express app. To do this, add the following to the `package.json` file:

```json
{
    ...
    "homepage": "/static",
    ...
}
```

This URL must match the site URL that the files are being deployed to, which is dependent on the `express.static` middleware (shown below).

```javascript
app.use('/static', express.static(path.join(__dirname, 'build')));
```

This middleware tells the app to deploy all files within the `__dirname/build` subdirectory (`__dirname` refers to the `api` directory and is a NodeJS builtin) to `http://localhost:8080/static/`. This middleware maintains file structure, so if you had a file located at `api/build/subfolder/sample.js` this file would be available at `http://localhost:8080/static/subfolder/sample.js`.

With this middleware set up, you can now build the app with the following command:

```shell
yarn build
```

This will compile the app to production-ready HTML, CSS, and Javascript and will put these compiled files in a new `build` folder under the `app` directory. To deploy this to the Express server, copy the entire `build` folder to the top level of the `api` folder. This will allow the Express server to locate and serve the required files to the user.

This process can be expanded to any other static files, and is not ReactJS specific.

## Author

Built by [Adam McQuilkin](https://github.com/ajmcquilkin), March 18, 2020.
