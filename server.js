const path = require('path');
const express = require('express');
const authMiddleware = require('./middleware/auth.js');
const privateApiRoutes = require('./routes/private/api.js');
const publicApiRoutes = require('./routes/public/api.js');
const publicViewRoutes = require('./routes/public/view.js');
const privateViewRoutes = require('./routes/private/view.js');

// Create Express App
const app = express();

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'hjs');
// Config setup to allow our HTTP server to serve static files from our public directory
app.use(express.static('public'));
// Config setup to parse JSON payloads from HTTP POST request body
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// All public routes can be accessible without authentication

// uncomment to view frontend
publicViewRoutes(app);
publicApiRoutes(app);// uncomment

// If the request is not for a public view/api, then it must pass
// through our authentication middleware first
app.use(authMiddleware); // uncomment

// The routes/views below can only be accessed if the user is authenticated

// uncomment to view frontend
privateViewRoutes(app);
privateApiRoutes(app);

// If request doesn't match any of the above routes then render the 404 page
app.use(function (req, res, next) {
    return res.status(404).render('404');
});

// Create HTTP Server and Listen for Requests
app.listen(3000);