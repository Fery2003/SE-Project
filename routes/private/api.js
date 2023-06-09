const { isEmpty, get } = require('lodash');
const { v4 } = require('uuid');
const db = require('../../connectors/db.js');
const roles = require('../../constants/roles.js');
const { getSessionToken } = require('../../utils/session.js');
const { compileFunction } = require('vm');
const e = require('express');
const { type } = require('os');
const { subtle } = require('crypto');
const { stat } = require('fs');
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
  user.isNormal = user.role_id === roles.user;
  user.isAdmin = user.role_id === roles.admin;
  user.isSenior = user.role_id === roles.senior;
  console.log('user =>', user);
  return user;
};

module.exports = function (app) {
  // Example
  // app.get('/test', async function (req, res) {
  //   try {
  //     const user = await getUser(req);
  //     const users = await db.from('se_project.user').returning('*');

  //     return res.status(200).json(users[0]);
  //   } catch (e) {
  //     console.log(e.message);
  //     return res.status(400).send('Could not get users');
  //   }
  // });

  // User stuff
  // MOVE TO VIEW.JS
  app.get('/dashboard', async (req, res) => {
    try {
      const user = await getUser(req);
      // check role of user here and redirect to corresponding dashboard
      if (user.isAdmin) {
        const userInfo = await db.select('*').from('se_project.user');
      } else if (user.isNormal || user.isSenior) {
        const userInfo = await db.select('*').from('se_project.user').where('id', user.user_id);
      }
      // const userInfo = await db.select('*').from('se_project.user').where('id', user.id);
      res.status(200).send('Dashboard Accessed');
    } catch (error) {
      console.error(error.message);
      res.status(500).send('Server Error!');
    }
  });

  // Reset password endpoint
  app.put('/api/v1/password/reset', async (req, res) => {
    try {
      const { user_id } = await getUser(req);
      const { newPassword } = req.body;
      await db.from('se_project.user').where('id', user_id).update({ password: newPassword });
      // res.json(ret);
      res.status(200).json({ message: 'Password reset successfully' });
    } catch (error) {
      console.error(error.message);
      res.status(500).send('Server Error!');
    }
  });

  // get all zones
  app.get('/api/v1/zones', async (req, res) => {
    try {
      const zones = await db.select('*').from('se_project.zone');
      res.json(zones);
    } catch (error) {
      console.error(error.message);
      res.status(500).send('Server Error!');
    }
  });

  // Pay for subscription endpoint
  // these next 2 require a purchase id from the query so use req.query.purchaseid
  // go through logic again before implementing
  app.post('/api/v1/payment/subscription', async (req, res) => {
    try {
      const { first_name, last_name, user_id, isSenior } = await getUser(req);
      const { creditCardNumber, holderName, paidAmount, subType, zoneId } = req.body;

      // input into transaction table (amount, user_id, purchase_id, purchase_type)
      // purchase_type is subscription

      // check first if he has a subscription
      const checkIfSubbed = await db.select('*').from('se_project.subscription').where('user_id', user_id);

      if (checkIfSubbed.length > 0) {
        return res.status(400).json({ msg: 'You already have a subscription' });
      }

      if (!creditCardNumber || !holderName || !paidAmount || !subType || !zoneId) {
        return res.status(400).json({ msg: 'Please enter all fields' });
      }

      if (`${first_name} ${last_name}` == holderName) {
        console.log('name matches');
        const { price } = await db.select('price').from('se_project.zone').where('id', zoneId).first();
        const numOfTickets = subType == 'annual' ? 100 : subType == 'quarterly' ? 25 : subType == 'monthly' ? 10 : -1;
        const total = price * numOfTickets;
        isSenior ? (total *= 0.5) : total;

        if (paidAmount < total) {
          return res.status(400).json({ msg: 'Not enough credit!' });
        } else {
          // input into subscription table (sub_type, zone_id, user_id, no_of_tickets)
          const ret = await db
            .from('se_project.subscription')
            .insert({ sub_type: subType, zone_id: zoneId, user_id: user_id, no_of_tickets: numOfTickets })
            .returning('*');

          const { id } = ret[0];

          await db.from('se_project.transaction').insert({ amount: total, user_id: user_id, purchase_id: id, purchase_type: 'subscription' });
          res.status(200).json({ msg: `successfully subbed ${subType}` });
        }
      } else {
        console.log("Name does not match credit card holder's name!");
        res.status(500).send('Name does not match!');
      }
    } catch (error) {
      console.error(error.message);
      res.status(500).send('Server Error!');
    }
  });

  // pay for ticket endpoint
  app.post('/api/v1/payment/ticket', async (req, res) => {
    try {
      const user = await getUser(req);
      const { creditCardNumber, holderName, paidAmount, origin, destination, tripDate } = req.body;

      if (!creditCardNumber || !holderName || !paidAmount || !origin || !destination || !tripDate) {
        return res.status(400).json({ msg: 'Please enter all fields' });
      }

      if (`${user.first_name} ${user.last_name}` == holderName) {
        console.log('name matches');
        let price = getPrice(origin, destination, user);
        price = parseFloat(price);

        if (paidAmount < price) {
          return res.status(400).json({ msg: 'Not enough credit!' });
        } else {
          // input into ticket table (origin, destination, user_id, sub_id, trip_date)
          const ret = await db
            .from('se_project.ticket')
            .insert({ origin: origin, destination: destination, user_id: user.user_id, sub_id: null, trip_date: tripDate })
            .returning('*');

          const { id } = ret[0];

          await db.from('se_project.transaction').insert({ amount: price, user_id: user.user_id, purchase_id: id, purchase_type: 'ticket' });
          res.status(200).json({ msg: `Successfully bought ticket` });
        }
      } else {
        console.log("Name does not match credit card holder's name!");
        res.status(500).send('Name does not match!');
      }
    } catch (error) {
      console.error(error.message);
      res.status(500).send('Server Error!');
    }
  });

  // Purchase ticket with subscription endpoint
  app.post('/api/v1/tickets/purchase/subscription', async (req, res) => {
    const { userRemainingTickets } = getUser(req);
    try {
      const { id } = await getUser(req);

      const ticket = {
        origin: req.body.origin,
        destination: req.body.destination,
        user_id: id,
        sub_id: req.body.sub_id,
        trip_date: req.body.trip_date
      };

      if (userRemainingTickets <= 0) {
        return res.status(400).json({ msg: 'You have no remaining tickets' });
      }

      if (!ticket.origin || !ticket.destination || !ticket.sub_id || !ticket.trip_date) {
        return res.status(400).json({ msg: 'Please enter all fields' });
      }

      if (ticket.trip_date < Date.now()) {
        return res.status(400).json({ msg: 'Please enter a valid date' });
      }

      const newTicket = await db.from('se_project.ticket').insert(ticket).returning('*');
      userRemainingTickets--;

      res.json(newTicket);
    } catch (err) {
      console.error(err.message);
      res.status(500).send('Server Error!');
    }
  });

  function transferTree(transferStation, destination) {
    const root = transferStation; // root of tree
    if (!root) return null; // check if root is null "an extra unnecessary check :)"
    const rootNode = { nodes: [] }; // store children of root node
    let curr = rootNode; // store root as current node
    do {
      const nextStationId = transferStation + 1; // fetch following station

      // check if next station is destination
      if (nextStationId == destination) {
        console.log('You have reached your destination!');
      }

      db.select('id')
        .from('route')
        .where('route_name')
        .equals('hi' + transferStation + '%');
      const stationType = db.select('station_type').from('se_project.station').where('id', transferStation);
      if (stationType == 'transfer') {
        root = transferStation;
        transferTree(nextStationId, destination);
      }
      //store the very next stations to the transfer (all of them) into the nodes stack
      curr.nodes.push(nextStationId);
    } while (nextStationId.station_position != 'end');
    if (nextStationId != destination) {
      //empty the stack
      nodes = [];
      transferTree(nextStationId, destination);
    }

    return nodes.length;
  }
  async function getPrice(fromStation, toStation, user) {
    let fromStationId = await db.select('*').from('se_project.station').where('station_name', fromStation).first();
    let fromStationObj = await db.select('*').from('se_project.station').where('id', fromStationId.id).first();
    let toStationId = await db.select('*').from('se_project.station').where('station_name', toStation).first();
    let toStationObj = await db.select('*').from('se_project.station').where('id', toStationId.id).first();

    const stationStack = [];
    const routeNames = 'hi' + fromStationObj.id + toStationObj.id;
    do {
      const ifDirect = await db
        .select('route_name')
        .from('se_project.route')
        .where('from_station_id', fromStationObj.id)
        .andWhere('to_station_id', toStationObj.id);

      if (ifDirect == routeNames) {
        console.log('Your route is a direct one!');
        stationStack.push(fromStationObj);
        stationStack.push(toStationObj);
      } else {
        stationStack.push(fromStationObj); // pushing current station to stack
        fromStationObj = toStationObj; // traversing to next node/station
        toStationObj.id += 1;
        toStationObj = await db.select('*').from('se_project.route').where('route_name', routeNames);
      }
    } while (fromStationObj.station_type == 'normal' && toStationObj.station_type == 'normal');

    noOfStations = stationStack.length;

    if (fromStationObj.station_type == 'transfer') {
      x = transferTree(fromStationObj.id, toStationObj.id);
      noOfStations += x;
    }

    let getPrice = null;
    if (noOfStations <= 9) {
      getPrice = await db.select('price').from('se_project.zone').where('zone_type', '9').first();
    } else if (noOfStations <= 16 && noOfStations > 9) {
      getPrice = await db.select('price').from('se_project.zone').where('zone_type', '10').first();
    } else {
      getPrice = await db.select('price').from('se_project.zone').where('zone_type', '16').first();
    }
    //Now we check if the user is a senior or not:
    if (user.isSenior == true) getPrice = getPrice * 0.5; // 50% discount

    return getPrice;
  }
  // Get ticket price endpoint
  app.get('/api/v1/tickets/price/:originId/:destinationId', async (req, res) => {
    try {
      const { originId, destinationId } = req.params;
      const user = await getUser(req);
      const price = await getPrice(originId, destinationId, user);
      console.log('price is: ', price);
      res.json(price.price);
    } catch (err) {
      console.error(err.message);
      res.status(500).send('Server Error!');
    }
  });

  // Request ticket refund endpoint
  app.post('/api/v1/refund/:ticketId', async (req, res) => {
    try {
      const { ticket_id } = req.params;
      if (!ticket_id) {
        return res.status(400).json({ msg: 'Please enter all fields' });
      }
      const user_id = await getUser(req).id;
      //const refund = await pool.query('INSERT INTO se_project.refund (ticket_id) VALUES ($1) RETURNING *', [ticket_id]);
      const purchaseType = await db
        .select('purchase_type')
        .from('se_project.transaction')
        .innerJoin('se_project.user', 'se_project.transaction.user_id', 'se_project.user.id')
        .innerJoin('se_project.ticket', 'se_project.transaction.user_id', 'se_project.ticket.user_id')
        .where('se_project.ticket.id', ticket_id)
        .andWhere('se_project.user.id', user_id);
      const refundAmount = 0;
      if (purchaseType == 'ticket') {
        refundAmount = await db
          .select('amount')
          .from('se_project.transaction')
          .innerJoin('se_project.user', 'se_project.transaction.user_id', 'se_project.user.id')
          .innerJoin('se_project.ticket', 'se_project.transaction.user_id', 'se_project.ticket.user_id')
          .where('se_project.ticket.id', ticket_id)
          .andWhere('se_project.user.id', user_id);
      }
      const refund = await db
        .insert([{ status: 'pending' }, { user_id: user_id }, { refunded_amount: refundAmount }, { ticket_id: ticket_id }])
        .into('se_project.refund_request')
        .returning('*');
      res.json(refund[0]);
      res.send('Refund request has been made');
    } catch (error) {
      console.error(error.message);
      res.status(500).send('Server Error!');
    }
  });

  // Request senior ticket endpoint
  app.post('/api/v1/senior/request', async (req, res) => {
    try {
      const { nationalId } = req.body;
      const uid = (await getUser(req)).user_id;
      if (!nationalId) {
        return res.status(400).json({ msg: 'Please enter all fields' });
      } else if (nationalId.length < 14) {
        return res.status(400).json({ msg: 'Please enter 14 digits' });
      }
      //const senior = await pool.query('INSERT INTO se_project.senior (ticket_id) VALUES ($1) RETURNING *', [ticket_id]);
      let yob = nationalId.substring(0, 2); //get the first 2 no.s
      if (yob < 99) {
        yob = '19' + yob;
      } else {
        yob = '20' + yob;
      }
      const year = new Date().getFullYear(); //this year
      const age = year - parseInt(yob); //age of the user
      const senior = {};
      if (age < 60) {
        senior = {
          status: 'rejected',
          user_id: uid,
          national_id: nationalId
        };
      } else {
        senior = {
          status: 'pending',
          user_id: uid,
          national_id: nationalId
        };
      }
      const requestS = await db.insert(senior).into('se_project.senior_request').returning('*');
      res.json(requestS);
      //res.send('Senior request has been made.');
    } catch (error) {
      console.error(error.message);
      res.status(500).send('Server Error!');
    }
  });

  // Simulate ride endpoint
  app.put('/api/v1/ride/simulate', async (req, res) => {
    try {
      const { source, dest, date } = req.body;
      const user = await getUser(req);
      const uid = user.user_id;
      if (!source || !dest || !date) {
        return res.status(400).json({ msg: 'Please enter all fields' });
      }
      const checkRide = await db.from('se_project.ride').where('user_id', uid);
      const found = false;
      for (let i = 0; i < checkRide.length; i++) {
        if (checkRide[i].origin == source && checkRide[i].destination == dest && checkRide[i].trip_date == date) {
          found = true;
        }
      }
      if (found == true) {
        await db
          .from('se_project.ride')
          .where('origin', source)
          .andWhere('destination', dest)
          .andWhere('trip_date', date)
          .andWhere('user_id', uid)
          .update('status', 'complete');

        res.send('Ride is now completed!');
      } else {
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
  app.post('/api/v1/station', async (req, res) => {
    try {
      const { stationName } = req.body;
      if (!stationName) {
        return res.status(400).json({ msg: `Please enter the station's name!` });
      } else {
        const newStation = {
          station_name: stationName,
          station_type: 'normal',
          station_status: 'new'
        };
        await db.insert(newStation).into('se_project.station');
        res.json(newStation);
        //res.send('Station created.');
      }
    } catch (error) {
      console.error(error.message);
      res.status(500).send('Server Error!');
    }
  });

  // Update station endpoint
  app.put('/api/v1/station/:stationId', async (req, res) => {
    try {
      const stationId = req.params;
      const { stationName } = req.body;
      if (!stationName) {
        return res.status(400).json({ msg: 'Please enter all fields' });
      } else {
        //const updateStation = await pool.query('UPDATE stations SET stationname = $1 WHERE id = $2 RETURNING *', [stationName, stationId]);
        const updateStation = await db('se_project.station')
          .where('id', Number.parseInt(stationId.stationId))
          .update('station_name', stationName)
          .returning('*');
        res.json(updateStation);
      }
      //redirect('/');
    } catch (error) {
      console.error(error.message);
      res.status(500).send('Server Error!');
    }
  });

  // Delete station endpoint
  app.delete('/api/v1/station/:stationId', async (req, res) => {
    try {
      let { stationId } = req.params;
      // stationId = Number.parseInt(stationId);

      const station = await db.select('*').from('se_project.station').where('id', stationId).first();
      const user = await getUser(req);

      if (user.isAdmin == false) {
        return res.status(401).json({ msg: 'You are not authorized to delete a station' });
      }

      console.log(station);

      if (station) {
        if (station.station_type == 'normal') {
          if (station.station_position == 'start') {
            let affectedRoute = await db.select('*').from('se_project.route').where('from_station_id', stationId).first();
            console.log(affectedRoute);

            //update the to station to become a start
            await db('se_project.station').where('id', affectedRoute.to_station_id).update('station_position', 'start');
            await db('se_project.station').where('id', stationId).del();
          } else if (station.station_position == 'end') {
            let affectedRoute = await db.select('*').from('se_project.route').where('from_station_id', stationId).first();

            //update the to station to become an end
            await db('se_project.station').where('id', affectedRoute.to_station_id).update('station_position', 'end');
            await db('se_project.station').where('id', stationId).del();
          } else if (station.station_position == 'middle') {
            let middleIsTo = await db.select('*').from('se_project.route').where('to_station_id', stationId).first();
            let myFromStation = middleIsTo.from_station_id;
            let middleIsFrom = await db.select('*').from('se_project.route').where('from_station_id', stationId).first();
            let myToStation = middleIsFrom.to_station_id;

            await db('se_project.station').where('id', stationId).del();

            //update routes table with new entries
            let newStationFromTo = await db
              .insert([{ route_name: '' + myFromStation + myToStation }, { from_station_id: myFromStation }, { to_station_id: myToStation }])
              .into('se_project.route');

            let newStationToFrom = await db
              .insert([{ route_name: '' + myToStation + myFromStation }, { from_station_id: myToStation }, { to_station_id: myFromStation }])
              .into('se_project.route');

            //add to SR table the new routes with their correspoding stations
            let idNewStationFromTo = await db.select('id').from('se_project.route').where('from_station_id', myFromStation);
            let idNewStationToFrom = await db.select('id').from('se_project.route').where('from_station_id', myToStation);

            let newSR1 = await db
              .insert([{ station_id: myFromStation }, { route_id: parseInt(idNewStationFromTo) }])
              .into('se_project.station_route');

            let newSR2 = await db.insert([{ station_id: myToStation }, { route_id: parseInt(idNewStationToFrom) }]).into('se_project.station_route');
          } else {
            await db('se_project.station').where('id', stationId).del();
          }
        } else if (station.station_type == 'transfer') {
          let transferRoutes = await db.select('*').from('se_project.route').where('from_station_id', stationId).first();
          let myNewTransfer = await db.select('from_station_id').from('se_project.route').where('to_station_id', stationId);
          for (let i = 0; i < transferRoutes.length; i++) {
            let toStation = transferRoutes[i].to_station_id;

            await db
              .insert([{ route_name: '' + myNewTransfer + toStation }, { from_station_id: myNewTransfer }, { to_station_id: toStation }])
              .into('se_project.route');

            await db
              .insert([{ route_name: '' + toStation + myNewTransfer }, { from_station_id: toStation }, { to_station_id: myNewTransfer }])
              .into('se_project.route');

            let newRouteIdTransferToStation = await db
              .select('id')
              .from('se_project.route')
              .where('from_station_id', myNewTransfer)
              .andWhere('to_station_id', toStation);

            let newRouteIdToStationToTransfer = await db
              .select('id')
              .from('se_project.route')
              .where('from_station_id', toStation)
              .andWhere('to_station_id', myNewTransfer);

            let newSR5 = await db
              .insert([{ station_id: toStation }, { route_id: parseInt(newRouteIdTransferToStation) }])
              .into('se_project.station_route');

            let newSR6 = await db
              .insert([{ station_id: toStation }, { route_id: parseInt(newRouteIdToStationToTransfer) }])
              .into('se_project.station_route');

            let newSR7 = await db
              .insert([{ station_id: myNewTransfer }, { route_id: parseInt(newRouteIdToStationToTransfer) }])
              .into('se_project.station_route');

            let newSR8 = await db
              .insert([{ station_id: myNewTransfer }, { route_id: parseInt(newRouteIdTransferToStation) }])
              .into('se_project.station_route');
          }

          await db('se_project.station').where('id', myNewTransfer).update('station_type', 'transfer');
          await db('se_project.station').where('id', stationId).del();

          res.status(200).send('Station deleted and necessary updates created');
        }
      }
    } catch (error) {
      console.log(error.message);
      res.status(500).send('Server Error!');
    }
  });

  // Create new route endpoint
  app.post('/api/v1/route', async (req, res) => {
    const newRoute = {
      route_name: req.body.routeName,
      from_station_id: req.body.fromId,
      to_station_id: req.body.toId
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
      const newRouteId = await db
        .select('id')
        .from('se_project.route')
        .where('from_station_id', newRoute.from_station_id)
        .andWhere('to_station_id', newRoute.to_station_id);
      const SR1 = await db.insert([{ station_id: newRoute.from_station_id }, { route_id: newRouteId }]);
      const SR2 = await db.insert([{ station_id: newRoute.to_station_id }, { route_id: newRouteId }]);
      res.json(new_Route);
      res.send('New Route Created!');
    } catch (error) {
      console.error(error.message);
      res.status(500).send('Server Error!');
    }
  });

  // Update route endpoint
  app.put('/api/v1/route/:routeId', async (req, res) => {
    try {
      const fromStationid = req.params;
      const { routename } = req.body;
      if (routename.length === 0) {
        return res.status(400).json({ msg: 'Route cannot be updated with empty name!' });
      }
      //const updatedRoute = await pool.query('UPDATE routes SET routename = $1 WHERE id = $2 RETURNING *', [routename, fromStationid]);
      const updatedRoute = await db('se_project.route').where('id', fromStationid.routeId).update('route_name', routename).returning('*');
      res.json(updatedRoute[0]);
      res.send('Route was updated!');
    } catch (error) {
      console.error(error.message);
      res.status(500).send('Server Error!');
    }
  });

  // Delete route
  app.delete('/api/v1/route/:routeId', async (req, res) => {
    try {
      const routeId = req.params;
      const user = await getUser(req);
      if (user.isAdmin == false) {
        return res.status(401).json({ msg: 'User not authorized!' });
      } else {
        //const deleteRoute = await pool.query('DELETE FROM routes WHERE id = $1', [routeId]);
        const deleteRoute = await db('se_project.route').where('id', routeId.routeId).del();
        res.json('Route was deleted!');
      }
    } catch (error) {
      console.error(error.message);
      res.status(500).send('Server Error!');
    }
  });

  // Accept/Reject Refund
  //Complete it after subscription and online payment are done.
  app.put('/api/v1/requests/refunds/:requestID', async (req, res) => {
    //refund status either is accepted or rejected
    try {
      const tripdate = getUser(req).tripdate;
      const { refundstatus } = req.body;
      const requestId = req.params;
      if (refundstatus.length === 0) {
        return res.status(400).json({ msg: 'Refund cannot be updated with empty status!' });
      }
      if (tripdate < Date.now()) {
        return res.status(400).json({ msg: 'Refund cannot be updated with empty status!' });
      } else {
        //future dated == yes
        //const updatedRefund = await pool.query('UPDATE refundrequests SET refundstatus = $1 WHERE id = $2 RETURNING *', [refundstatus, requestId]);
        const updatedRefund = await db('se_project.refund_request').where('id', requestId).update('status', refundstatus).returning('*');
        res.json(updatedRefund[0]);
        res.send('Refund request checked!');
      }
    } catch (error) {
      console.error(error.message);
      res.status(500).send('Server Error!');
    }
  });
  // Accept/Reject Senior
  app.put('/api/v1/requests/senior/:requestId', async (req, res) => {
    try {
      const requestId = req.params.requestId;
      const { seniorstatus } = req.body;
      const updatedSenior = await db.from('se_project.senior_request').where('id', requestId).update({ status: seniorstatus }).returning('*');
      if (seniorstatus == 'accepted') {
        const uid = await db.from('se_project.senior_request').where('id', requestId).select('user_id');
        const updateUser = await db.from('se_project.user').where('id', uid[0].user_id).update('role_id', 3).returning('*');
      }
      res.json(updatedSenior);
    } catch (error) {
      console.error(error.message);
      res.status(500).send('Server Error!');
    }
  });

  //Update zone price
  app.put('/api/v1/zones/:zoneId', async (req, res) => {
    try {
      const { newPrice } = req.body;
      const user = await getUser(req);
      const zoneId = req.params;
      if (user.isAdmin == false) {
        return res.status(401).json({ msg: 'User not authorized!' });
      }
      if (newPrice.length === 0) {
        return res.status(400).json({ msg: 'Zone cannot be updated with empty price!' });
      }
      //const updatedPrice = await pool.query('UPDATE zones SET price = $1 WHERE id = $2 RETURNING *', [newPrice, zoneId]);
      const updatedPrice = await db('se_project.zone').where('id', zoneId.zoneId).update('price', newPrice).returning('*');
      res.json(updatedPrice[0]);
      res.send('Zone price updated!');
    } catch (error) {
      console.error(error.message);
      res.status(500).send('Server Error!');
    }
  });

  //extra something for me
  app.get('/api/v1/zonePrice'),
    async (req, res) => {
      try {
        const { zoneType } = req.body;
        const price = await db.select('price').from('se_project.zone').where('zone_type', zoneType);
        res.status(200).send(price);
      } catch (error) {
        console.log(error.message);
        res.status(500).send('Server Error!');
      }
    };

  app.get('api/ZoneId/:zoneType'),
    async (req, res) => {
      try {
        const { zoneType } = req.params;
        const zid = await db.select('id').from('se_project.zone').where('zone_type', zoneType);
        res.json(zid);
      } catch (error) {
        console.log(error.message);
        res.status(500).send('Server Error!');
      }
    };
};
