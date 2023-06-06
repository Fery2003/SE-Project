const db = require('../../connectors/db.js');
const roles = require('../../constants/roles.js');
const { getSessionToken } = require('../../utils/session');

const getUser = async function(req) {
  const sessionToken = getSessionToken(req);
  if (!sessionToken) {
    return res.status(301).redirect('/');
  }

  const user = await db.select('*')
    .from('se_project.session')
    .where('token', sessionToken)
    .innerJoin('se_project.user', 'se_project.session.user_id', 'se_project.user.id')
    .innerJoin('se_project.role', 'se_project.user.role_id', 'se_project.role.id')
    .first();
  
  console.log('user =>', user)
  user.isStudent = user.role_id === roles.student;
  user.isAdmin = user.role_id === roles.admin;
  user.isSenior = user.role_id === roles.senior;

  return user;  
}

module.exports = function(app) {
  // Register HTTP endpoint to render /users page
  app.get('/dashboard', async function(req, res) {
    const user = await getUser(req);
    return res.render('dashboard', user);
  });

  // Register HTTP endpoint to render /users page
  app.get('/users', async function(req, res) {
    const users = await db.select('*').from('se_project.user');
    return res.render('users', { users });
  });

  // Register HTTP endpoint to render /courses page
  app.get('/manage/stations', async function(req, res) {
    const user = await getUser(req);
    const stations = await db.select('*').from('se_project.station');
    if (user.isAdmin) {
      console.log('user is admin')
    }
    return res.status(200).render('stations', { ...user, stations });
  });

  app.get('/rides', async function(req, res) {
    const user = await getUser(req);
    const rides = await db.select('*').from('se_project.ride');
    return res.status(200).render('rides', { user, rides })
  });

  app.get('/requests/refund', async function(req, res){
    const user = await getUser(req);
    if (user.isAdmin) {
      const refunds = await db.select('*').from('se_project.refund_request');
      return res.status(200).render('request_refund', { user, refunds });
    } else {
      const refunds = await db.select('*').from('se_project.refund_request').where('user_id', user.id);
      return res.status(200).render('request_refund', { user, refunds });
    }
  })
  app.get('/manage/routes', async function(req, res) {
    const user = await getUser(req);
    const routes = await db.select('*').from('se_project.route');
    return res.status(200).render('routes', { user, routes });
  });
};