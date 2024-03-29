const { isEmpty } = require('lodash');
const { v4 } = require('uuid');
const db = require('../../connectors/db.js');
const roles = require('../../constants/roles');
module.exports = function (app) {
  app.post('/api/v1/users/register', async function (req, res) {
    // Check if user already exists in the system
    const userExists = await db('se_project')
      .select('*')
      .from('se_project.user')
      .where('email', req.body.email);

    if (!isEmpty(userExists)) {
      return res.status(400).send('user exists');
    }

    const newUser = {
      first_name: req.body.firstName,
      last_name: req.body.lastName,
      email: req.body.email,
      password: req.body.password,
      role_id: roles.user
    };

    try {
      const user = await db('se_project.user')
        .insert(newUser)
        .returning('*');

      return res.status(200).json(user);
    } catch (e) {
      console.log(e.message);
      return res.status(400).send('Could not register user');
    }
  });

  // Register HTTP endpoint to create new user
  app.post('/api/v1/users/login', async function (req, res) {
    // get users credentials from the JSON body
    const { email, password } = req.body;
    if (!email) {
      // If the email is not present, return an HTTP unauthorized code
      return res.status(400).send('Email is required');
    }
    if (!password) {
      // If the password is not present, return an HTTP unauthorized code
      return res.status(400).send('Password is required');
    }

    // validate the provided password against the password in the database
    // if invalid, send an unauthorized code
    const user = await db('se_project').select('*').from('se_project.user').where('email', email).first();
    if (isEmpty(user)) {
      return res.status(400).send('User does not exist');
    }

    if (user.password !== password) {
      return res.status(401).send('Password does not match');
    }

    // set the expiry time as 15 minutes after the current time
    const token = v4();
    const currentDateTime = new Date();
    const expires_at = new Date(+currentDateTime + 9000000); // expire in 15 minutes

    // create a session containing information about the user and expiry time
    const session = {
      user_id: user.id,
      token,
      expires_at
    };
    try {
      await db('se_project.session').insert(session);
      // In the response, set a cookie on the client with the name "session_cookie"
      // and the value as the UUID we generated. We also set the expiration time.
      return res.cookie('session_token', token, { expires: expires_at }).status(200).send('Login successful');
    } catch (e) {
      console.log(e.message);
      return res.status(400).send('Could not register user');
    }
  });
};
