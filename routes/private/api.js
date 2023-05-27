const { isEmpty, get } = require('lodash');
const { v4 } = require('uuid');
const db = require('../../connectors/knexdb');
const pool = require('../../connectors/poolDB.js');
const roles = require('../../constants/roles');
const { getSessionToken } = require('../../utils/session.js');
const { compileFunction } = require('vm');
const e = require('express');
const { type } = require('os');
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
        // const userInfo = await pool.query('SELECT * FROM se_project.user');
        const userInfo = await db.select('*').from('se_project.user');
      } else if (user.isNormal || user.isSenior) {
        // const userInfo = await pool.query('SELECT * FROM se_project.user WHERE id = $1', [user.id]);
        const userInfo = await db.select('*').from('se_project.user').where('id', user.id);
      }
      res.json(userInfo);
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
      if (!password) {
        return res.status(400).json({ msg: "Please enter a password" });
      }
      if (password.length < 0) {
        return res.status(400).json({ msg: "Password must be at empty" });
      }
      const ret = await db.from('se_project.user').where('id', id).update({ password: password });
      // res.json(ret);
      res.json({ message: 'Password reset successfully' });
    } catch (error) {
      console.error(error.message);
      res.status(500).send('Server Error!');
    }
  });

  // Subscriptions endpoint(running but not testing)
  app.get('/api/v1/zones', async (req, res) => {
    try {
      // const zones = await pool.query('SELECT * FROM se_project.zone');
      const zones = await db.select('*').from('se_project.zone');
      res.json(zones);
    } catch (error) {
      console.error(error.message);
      res.status(500).send('Server Error!');
    }
  });

  // pay for subscription endpoint
  // these next 2 require a purchase id from the query so use req.query.purchaseid
  // go through logic again before implementing
  app.post('subscriptions/api/v1/payment/subscription', async (req, res) => {
    try {
      const { creditCardNumber, holderName, payedAmount, subType, zoneId } = req.body;
      const { purchaseid } = req.query;
      const { first_name, last_name } = await getUser(req);
      if (!creditCardNumber || !holderName || !payedAmount || !subType || !zoneId) {
        return res.status(400).json({ msg: "Please enter all fields" });
      }
      if (first_name + last_name == req.body.holderName) {
        const ret = await db.from('se_project.transaction').insert({ user_id: user_id });
        console.log("name matches");
      }
      else {
        console.log("name does not match");
      }
      res.json(ret.rows[0]);
    } catch (error) {
      console.error(error.message);
      res.status(500).send('Server Error!');
    }
  });

  // pay for ticket endpoint
  app.post('/tickets/api/v1/payment/ticket', async (req, res) => {

  });

  // Purchase ticket with subscription endpoint
  app.post('/tickets/api/v1/tickets/purchase/subscription', async (req, res) => {
    try {
      const { id } = await getUser(req);
      const ticket = {
        origin: req.body.origin,
        destination: req.body.destination,
        user_id: id,
        sub_id: req.body.sub_id,
        trip_date: req.body.trip_date
      }
      if (!ticket.origin || !ticket.destination || !ticket.sub_id || !ticket.trip_date) {
        return res.status(400).json({ msg: "Please enter all fields" });
      }
      if (ticket.trip_date < Date.now()) {
        return res.status(400).json({ msg: "Please enter a valid date" });
      }
      const newTicket = await db.from('se_project.ticket').insert(ticket).returning('*');
      res.json(newTicket);
    } catch (err) {
      console.error(err.message);
      res.status(500).send('Server Error!');

    }
  });

  // Get ticket price endpoint
  app.get('/prices/api/v1/tickets/price/:originId', async (req, res) => {

  });

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
      if (!refund) {
        return res.status(400).json({ msg: "Please enter all fields" });
      }
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
      if (!senior) {
        return res.status(400).json({ msg: "Please enter all fields" });
      }
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
      const uid = user.user_id;
      if (!source || !dest || !date) {
        return res.status(400).json({ msg: "Please enter all fields" });
      }
      const checkRide = await db.from('se_project.ride').where('user_id', uid)
      const found = false;
      for (let i = 0; i < checkRide.length; i++) {
        if (checkRide[i].origin == source && checkRide[i].destination == dest && checkRide[i].trip_date == date) {
          found = true
        }
      }
      if (found == true) {
        await db.from('se_project.ride').where('origin', source)
          .andWhere('destination', dest).andWhere('trip_date', date)
          .andWhere('user_id', uid).update('status', 'complete');

        res.send('Ride is now completed!');
      }
      else {
        res.send('No such ride exists.');
      }
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
      if (!stationname || !stationtype || !stationposition || !stationstatus) {
        return res.status(400).json({ msg: "Please enter all fields" });
      }
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
      if (!stationName) {
        return res.status(400).json({ msg: "Please enter all fields" });
      }
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
      const { id } = getUser(req).roleid;
      if (id != 2) {
        return res.status(401).json({ msg: "You are not authorized to delete a station" });
      }
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
    } catch (error) { }
  });

  // Create new route endpoint
  app.post('/manage/routes/api/v1/route', async (req, res) => {
    const newRoute = {
      route_name: req.body.route_name,
      from_station_id: req.body.from_station_id,
      to_station_id: req.body.to_station_id
    };
    if (newRoute.from_station_id === newRoute.to_station_id) {
      return res.status(400).json({ msg: 'Route cannot be created with the same station!' });
    }
    if (newRoute.from_station_id === undefined || newRoute.to_station_id === undefined) {
      return res.status(400).json({ msg: 'Route cannot be created with undefined stations!' });
    }
    if (newRoute.route_name.length === 0) {
      return res.status(400).json({ msg: 'Route cannot be created with empty name!' });
    }
    try {
      const new_Route = await db.from('se_project.route').insert(newRoute).returning('*');
      res.json(new_Route);
    } catch (error) {
      console.error(error.message);
      res.status(500).send('Server Error!');
    }

  });

  // Update route endpoint
  app.put('/manage/routes/api/v1/route/:routeId', async (req, res) => {
    try {
      const fromStationid = req.params;
      const { routename } = req.body;
      if (routename.length === 0) {
        return res.status(400).json({ msg: 'Route cannot be updated with empty name!' });
      }
      const updatedRoute = await pool.query('UPDATE routes SET routename = $1 WHERE id = $2 RETURNING *', [routename, fromStationid]);
      res.json(updatedRoute.rows[0]);
      redirect('/');

    } catch (error) {
      console.error(error.message);
      res.status(500).send('Server Error!');
    }
  });

  // Delete route 
  app.delete('/manage/routes/api/v1/route/:routeId', async (req, res) => {
    try {
      const routeId = req.params;
      const { roleid } = getUser(req).roleid;
      if (roleid !== 2) {
        return res.status(401).json({ msg: 'User not authorized!' });
      }
      const deleteRoute = await pool.query('DELETE FROM routes WHERE id = $1', [routeId]);
      res.json('Route was deleted!');
    } catch (error) {
      console.error(error.message);
      res.status(500).send('Server Error!');
    }
  });

  // Accept/Reject Refund
  //Complete it after subscription and online payment are done.
  app.put('/manage/requests/refunds/api/v1/requests/refunds/:requestID', async (req, res) => {
    //refund status either is accepted or rejected
    try {
      const tripdate = getUser(req).tripdate;
      const { refundstatus } = req.body;
      const requestId = req.params;
      if (refundstatus.length === 0) {
        return res.status(400).json({ msg: 'Refund cannot be updated with empty status!' });
      }
      if (tripdate < Date.now()) {
        res.status(400).send('Cannot refund a trip that has already happened!');
      }
      else { //future dated == yes
        const updatedRefund = await pool.query('UPDATE refundrequests SET refundstatus = $1 WHERE id = $2 RETURNING *', [refundstatus, requestId]);
        res.json(updatedRefund.rows[0]);
      }
    } catch (error) {
      console.error(error.message);
      res.status(500).send('Server Error!');
    }

  });
  // Accept/Reject Senior
  app.put('/manage/requests/seniors/api/v1/requests/senior/:requestId', async (req, res) => {

  });

  //Update zone price
  app.post('/manage/zones/api/v1/zones/:zoneId', async (req, res) => {
    try {
      const { newPrice } = req.body;
      const { roleid } = getUser(req).roleid;
      const zoneId = req.params;
      if (roleid !== 2) {
        return res.status(401).json({ msg: 'User not authorized!' });
      }
      if (newPrice.length === 0) {
        return res.status(400).json({ msg: 'Zone cannot be updated with empty price!' });
      }
      const updatedPrice = await pool.query('UPDATE zones SET price = $1 WHERE id = $2 RETURNING *', [newPrice, zoneId]);
      res.json(updatedPrice.rows[0]);
    } catch (error) {
      console.error(error.message);
      res.status(500).send('Server Error!');
    }
  });
};
