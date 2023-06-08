const db = require('../../connectors/db.js');

module.exports = function (app) {
  //Register HTTP endpoint to render /index page
  app.get('/', function (req, res) {
    return res.render('index');
  });
  // example of passing variables with a page
  app.get('/register', async function (req, res) {
    return res.render('register');
  });
};
