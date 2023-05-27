const { isEmpty } = require('lodash');
const { v4 } = require('uuid');
const db = require('../../connectors/knexdb');
const pool = require('../../connectors/poolDB.js');
const roles = require('../../constants/roles');
const { getSessionToken } = require('../../utils/session.js');
const { compileFunction } = require('vm');
const getUser = async function (req) {
  const sessionToken = getSessionToken(req);
  if (!sessionToken) {
    return res.status(301).redirect('/');
  }
  console.log('hi', sessionToken);
  const user = await db
    .from('se_project.session')
    .where('token', sessionToken)
    .innerJoin('se_project.user', 'se_project.session.user_id', 'se_project.user.id')
    .innerJoin('se_project.role', 'se_project.user.role_id', 'se_project.role.id')
    .first();

  console.log('user =>', user);
  user.isNormal = user.roleid === roles.user;
  user.isAdmin = user.roleid === roles.admin;
  user.isSenior = user.roleid === roles.senior;
  console.log('user =>', user);
  return user;
};

module.exports = function (app) {
  //example
  app.get('/test', async function (req, res) {
    try {
      const user = await getUser(req);
      const users = await db.select('*').from('se_project.user');

      return res.status(200).json(users);
    } catch (e) {
      console.log(e.message);
      return res.status(400).send('Could not get users');
    }
  });

  //User stuff

  app.get('/dashboard', async (req, res) => {
    try {
      const user = await getUser(req);
      // check role of user here and redirect to corresponding dashboard
      if (user.isAdmin) {
        const userInfo = await db.query('SELECT * FROM se_project.user');
      } else if (user.isNormal || user.isSenior) {
        const userInfo = await db.query('SELECT * FROM se_project.user WHERE id = $1', [user.id]);
      }
      res.json(userInfo.rows[0]);
    } catch (error) {
      console.error(error.message);
      res.status(500).send('Server Error!');
    }
  });

  // Reset password endpoint
  app.put('/api/v1/password/reset', async (req, res) => {
    try {
      const { id } = await getUser(req);
      const password = req.body.newPassword;
      // const ret = await pool.query('UPDATE se_project.user SET password = $1 WHERE id = $2', [password, id]);
      const ret = await db.from('se_project.user').where('id', id).update({ password: password });
      // res.json(ret);
      res.json({ message: 'Password reset successfully' });
    } catch (error) {
      console.error(error.message);
      res.status(500).send('Server Error!');
    }
  });

  // Subscriptions endpoint(running but not testing)
  app.get('/subscriptions/api/v1/zones', async (req, res) => {
    try {
      const zones = await pool.query('SELECT * FROM se_project.zone');
      res.json(zones.rows);
    } catch (error) {
      console.error(error.message);
      res.status(500).send('Server Error!');
    }
  });

  // pay for subscription endpoint
  // these next 2 require a purchase id from the query so use req.query.purchaseid
  // go through logic again before implementing
  app.post('subscriptions/api/v1/payment/subscription', async (req, res) => {});

  // pay for ticket endpoint
  app.post('/tickets/api/v1/payment/ticket', async (req, res) => {});

  // Purchase ticket with subscription endpoint
  app.post('/tickets/api/v1/tickets/purchase/subscription', async (req, res) => {
    try {
      const { origin, destination, user_id, sub_id, trip_date } = req.body;
      const ticket = await pool.query(
        'INSERT INTO se_project.ticket (origin, destination, user_id, sub_id, trip_date) VALUES ($1, $2, $3, $4, $5) RETURNING *',
        [origin, destination, user_id, sub_id, trip_date]
      );
      res.json(ticket.rows[0]);
    } catch (error) {
      console.error(error.message);
      res.status(500).send('Server Error!');
    }
  });

  // Get ticket price endpoint
  app.post('/prices/api/v1/tickets/price/:originId', async (req, res) => {});

  // Get all rides endpoint
  app.get('/rides', async (req, res) => {
    try {
      const rides = await pool.query('SELECT * FROM se_project.ride');
      res.json(rides.rows);
    } catch (error) {
      console.error(error.message);
      res.status(500).send('Server Error!');
    }
  });

  // Request ticket refund endpoint
  app.post('/request/refund/api/v1/refund/:ticketId', async (req, res) => {
    try {
      const { ticket_id } = req.body;
      const refund = await pool.query('INSERT INTO se_project.refund (ticket_id) VALUES ($1) RETURNING *', [ticket_id]);
      res.json(refund.rows[0]);
    } catch (error) {
      console.error(error.message);
      res.status(500).send('Server Error!');
    }
  });

  // Request senior ticket endpoint
  app.post('/request/senior/api/v1/senior/request', async (req, res) => {
    try {
      const { ticket_id } = req.body;
      const senior = await pool.query('INSERT INTO se_project.senior (ticket_id) VALUES ($1) RETURNING *', [ticket_id]);
      res.json(senior.rows[0]);
    } catch (error) {
      console.error(error.message);
      res.status(500).send('Server Error!');
    }
  });

  // Simulate ride endpoint
  app.put('/rides/simulate/api/v1/ride/simulate', async (req, res) => {
    try {
      const { source, dest, date } = req.body;
      const user = await getUser(req);
      const uid = user.userid;
      const updatedRide = await pool.query(
        'UPDATE ride SET status = $1 WHERE origin = $2 and destination = $3 and user_id = $4 and trip_date = $5 RETURNING *',
        ['completed', source, dest, uid, date]
      );
      console.log(updatedRide.rows[0]);
    } catch (error) {
      console.log(error.message);
      res.status(500).send('Server Error!');
    }
  });

  //Admin Stuff

  // Reset password endpoint
  // app.put('/api/v1/password/reset', async (req, res) => {
  //   try {
  //     const { email, password } = req.body;
  //     const user = await pool.query('UPDATE se_project.user SET password = $1 WHERE email = $2 RETURNING *', [password, email]);
  //     res.json(user.rows[0]);
  //   } catch (error) {
  //     console.error(error.message);
  //     res.status(500).send('Server Error!');
  //   }
  // });

  // app.get('/dashboard', async (req, res) => {
  //     try {
  //         const user = await db.query('SELECT * FROM se_project.users WHERE id = $1', [req.user]);
  //         res.json(user.rows[0]);
  //     } catch (error) {
  //         console.error(error.message);
  //         res.status(500).send('Server Error!');
  //     }
  // });

  // Create new station endpoint
  app.post('/manage/stations/api/v1/station', async (req, res) => {
    try {
      const { stationname, stationtype, stationposition, stationstatus } = req.body;
      const newStation = await pool.query(
        'INSERT INTO se_project.station (station_name, station_type, station_position, station_status) VALUES ($1, $2, $3, $4) RETURNING *',
        [stationname, stationtype, stationposition, stationstatus]
      );
      res.json(newStation.rows[0]);
      redirect('/');
    } catch (error) {
      console.error(error.message);
      res.status(500).send('Server Error!');
    }
  });

  // Update station endpoint
  app.put('/manage/stations/api/v1/station/:stationId', async (req, res) => {
    try {
      const stationId = req.params;
      const { stationName } = req.body;
      const updateStation = await pool.query('UPDATE stations SET stationname = $1 WHERE id = $2 RETURNING *', [stationName, stationId]);
      res.json(updateStation.rows[0]);
      redirect('/');
    } catch (error) {
      console.error(error.message);
      res.status(500).send('Server Error!');
    }
  });

  // Delete station endpoint
  app.delete('/manage/stations/api/v1/station/:stationId', async (req, res) => {
    try {
      const stationid = req.params;
      const station = await pool.query('SELECT * FROM stations WHERE id = $1', [stationid]);
      console.log(station.rows[0]);
      if (station.length == 1) {
        if (station.stationtype == 'normal') {
          if (station.stationposition == 'start') {
            let affectedRoute = await pool.query('select * from routes where fromstationid = $1', [stationid]);
            //update the to station to become a start
            await pool.query('update stations set stationposition = $1 where id = $2', ['start', affectedRoute.toStationid]);
            await pool.query('delete from stations where id = $1', [stationid]);
          } else if (station.stationposition == 'end') {
            let affectedRoute = await pool.query('select * from routes where fromstationid = $1', [stationid]);
            //update the to station to become an end
            await pool.query('update station set stationposition = $1 where id = $2', ['end', affectedRoute.toStationid]);

            await pool.query('delete from stations where id = $1', [stationid]);
          } else if (station.stationposition == 'middle') {
            let middleIsTo = await pool.query('select * from routes where toStationId = $1', [stationid]);
            let myFromStation = middleIsTo.fromStationid;
            let middleIsFrom = await pool.query('select * from routes where fromStationId = $1', [stationid]);
            let myToStation = middleIsFrom.toStationid;
            await pool.query('delete from stations where id = $1', [stationid]);
            //update routes table with new entries
            let newStationFromTo = await pool.query('insert into routes (routename, fromStationid, toStationid) values ($1, $2, $3)', [
              'newroute1',
              myFromStation,
              myToStation
            ]);
            let newStationToFrom = await pool.query('insert into routes (routename, fromStationid, toStationid) values ($1, $2, $3)', [
              'newroute1',
              myToStation,
              myFromStation
            ]);
            //add to SR table the new routes with their correspoding stations
            let idnewStationFromTo = await pool.query('select id from routes where fromStationid = $1', myFromStation);
            let idnewStationToFrom = await pool.query('select id from routes where fromStationid = $1', mytToStation);
            let newSR1 = await pool.query('insert into stationRoutes (stationid, routeid) values ($1,$2)', [
              myFromStation,
              parseInt(idnewStationFromTo)
            ]);
            let newSR2 = await pool.query('insert into stationRoutes (stationid, routeid) values ($1,$2)', [
              myToStation,
              parseInt(idnewStationToFrom)
            ]);
          }
        } else if (station.stationtype == 'transfer') {
          //help
        }
      }
    } catch (error) {}
  });

  // Create new route endpoint
  app.post('/manage/routes/api/v1/route', async (req, res) => {
    try {
      const { routename, fromStationid, toStationid } = req.body;
      const newRoute = await pool.query('INSERT INTO se_project.routes (routename, fromStationid, toStationid) VALUES ($1, $2, $3) RETURNING *', [
        routename,
        fromStationid,
        toStationid
      ]);
      res.json(newRoute.rows[0]);
    } catch (error) {
      console.error(error.message);
      res.status(500).send('Server Error!');
    }
  });

  // Update route endpoint
  app.put('/manage/routes/api/v1/route/:routeId', async (req, res) => {});

  // Delete route endpoint
  app.delete('/manage/routes/api/v1/route/:routeId', async (req, res) => {});

  // Accept/Reject Refund
  app.put('/manage/requests/refunds/api/v1/requests/refunds/:requestID', async (req, res) => {});

  // Accept/Reject Senior
  app.put('/manage/requests/seniors/api/v1/requests/senior/:requestId', async (req, res) => {});

  //Update zone price
  app.post('/manage/zones/api/v1/zones/:zoneId', async (req, res) => {
    try {
      const { newPrice } = req.body;
      const zoneId = req.params;
      const updatedPrice = await pool.query('UPDATE zones SET price = $1 WHERE id = $2 RETURNING *', [newPrice, zoneId]);
      res.json(updatedPrice.rows[0]);
    } catch (error) {
      console.error(error.message);
      res.status(500).send('Server Error!');
    }
  });
};
