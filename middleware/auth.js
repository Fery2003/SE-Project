const { v4 } = require('uuid');
const db = require('../connectors/db');
const roles = require('../constants/roles');
<<<<<<< HEAD
const { getSessionToken } = require('../utils/session');
=======
const { getSessionToken } = require('../utils/session.js');
>>>>>>> 651142da6274076d8357e007abe7982f354eb4db

module.exports = async function (req, res, next) {
  const sessionToken = getSessionToken(req);
  if (!sessionToken) {
    return res.status(301).redirect('/');
  }

  // We then get the session of the user from our session map
  // that we set in the signinHandler
  const userSession = await db.select('*').from('sessions').where('token', sessionToken).first();
  if (!userSession) {
    // If the session token is not present in session map, return an unauthorized error
    return res.status(301).redirect('/');
  }
  // if the session has expired, return an unauthorized error, and delete the
  // session from our map
  if (new Date() > userSession.expiresat) {
    return res.status(301).redirect('/');
  }

  // If all checks have passed, we can consider the user authenticated and
  next();
};
