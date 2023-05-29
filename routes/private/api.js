const { isEmpty, get } = require('lodash');
const { v4 } = require('uuid');
const db = require('../../connectors/knexdb');
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
      const users = await db.from('se_project.user').returning('*');

      return res.status(200).json(users[0]);
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
      // const userInfo = await db.select('*').from('se_project.user').where('id', user.id);
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
  app.post('/api/v1/payment/subscription', async (req, res) => {
    try {
      // console.log('here')
      const { first_name, last_name, id } = await getUser(req);
      const { creditCardNumber, holderName, paidAmount, subType, zoneId } = req.body;
      const { purchaseId } = req.query;
      // input into transaction table (amount, user_id, purchase_id, purchase_type)
      // purchase_type is subscription
      // check first if he has a subscription
      const checkIfSubbed = await db.select('*').from('se_project.subscription').where('user_id', id);
      if (checkIfSubbed.length > 0) {
        return res.status(400).json({ msg: "You already have a subscription" });
      }
      if (!creditCardNumber || !holderName || !paidAmount || !subType || !zoneId) {
        return res.status(400).json({ msg: "Please enter all fields" });
      }
      if (`${first_name} ${last_name}` == holderName) {
        console.log('name matches');
        const ret = await db.from('se_project.transaction').insert({amount: paidAmount, user_id: id, purchase_id: purchaseId, purchaseType: 'subscription'});
        // input into subscription table (user_id, zone_id, sub_type)
        const sub = await db.from('se_project.subscription').insert({ user_id: id, zone_id: zoneId, sub_type: subType });
      } else {
        console.log('name does not match');
      }
      res.json(ret);
    } catch (error) {
      console.error(error.message);
      res.status(500).send('Server Error!');
    }
  });

  // pay for ticket endpoint
  app.post('/api/v1/payment/ticket', async (req, res) => { });

  // Purchase ticket with subscription endpoint
  app.post('/api/v1/tickets/purchase/subscription', async (req, res) => {
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
  app.get('/api/v1/tickets/price/:originId', async (req, res) => {

  });

  // // Get all rides endpoint
  // app.get('/rides', async (req, res) => {
  //   try {
  //     //const rides = await pool.query('SELECT * FROM se_project.ride');
  //     const rides = await db.select('*').from('se_project.ride')
  //     res.json(rides);
  //   } catch (error) {
  //     console.error(error.message);
  //     res.status(500).send('Server Error!');
  //   }
  // });

  // Request ticket refund endpoint
  app.post('/api/v1/refund/:ticketId', async (req, res) => {
    try {
      const { ticket_id } = req.params;
      if (!ticket_id) {
        return res.status(400).json({ msg: "Please enter all fields" });
      }
      const user_id = await getUser(req).id
      //const refund = await pool.query('INSERT INTO se_project.refund (ticket_id) VALUES ($1) RETURNING *', [ticket_id]);
      const purchaseType = await db.select('purchase_type').from('se_project.transaction')
      .innerJoin('se_project.user', 'se_project.transaction.user_id', 'se_project.user.id')
      .innerJoin('se_project.ticket', 'se_project.transaction.user_id', 'se_project.ticket.user_id')
      .where('se_project.ticket.id', ticket_id).andWhere('se_project.user.id', user_id)
      const refundAmount = 0;
      if(purchaseType == 'ticket')
      {
        refundAmount = await db.select('amount').from('se_project.transaction')
        .innerJoin('se_project.user', 'se_project.transaction.user_id', 'se_project.user.id')
        .innerJoin('se_project.ticket', 'se_project.transaction.user_id', 'se_project.ticket.user_id')
        .where('se_project.ticket.id', ticket_id).andWhere('se_project.user.id', user_id)
      }
      const refund = await db.insert([{status: 'pending'}, {user_id: user_id}, {refunded_amount: refundAmount}, {ticket_id: ticket_id}]).into('se_project.refund_request').returning('*');
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
      const uid = await getUser(req).id;
      if (!nationalId) {
        return res.status(400).json({ msg: "Please enter all fields" });
      }
      //const senior = await pool.query('INSERT INTO se_project.senior (ticket_id) VALUES ($1) RETURNING *', [ticket_id]);
      const requestS = await db.insert([{status : 'pending'}, {user_id: uid}, {national_id: nationalId}])
      .into('se_project.senior_request').returning('*');
      res.json(requestS);
      res.send('Senior request has been made.');
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
        return res.status(400).json({ msg: "Please enter all fields" });
      }
      const checkRide = await db.from('se_project.ride').where('user_id', uid);
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
  app.post('/api/v1/station', async (req, res) => {
    try {
      const { stationName } = req.body;
      if (!stationname) {
        return res.status(400).json({ msg: "Please enter all fields" });
      }
      //const newStation = await pool.query(
        //'INSERT INTO se_project.station (station_name, station_type, station_position, station_status) VALUES ($1, $2, $3, $4) RETURNING *',
        //[stationname, stationtype, stationposition, stationstatus]);
      const newStation = await db.insert([{'station_name': stationName},{'station_type': 'normal'}, {'station_status' : 'new'} ])
      .into('se_project.station').returning('*');
      res.json(newStation);
      res.send('Station created.');
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
        return res.status(400).json({ msg: "Please enter all fields" });
      }
      //const updateStation = await pool.query('UPDATE stations SET stationname = $1 WHERE id = $2 RETURNING *', [stationName, stationId]);
      const updateStation = await db('se_project.station').where('id', stationId).update('station_name', stationName).returning('*');
      res.json(updateStation);
      res.send('Station updated.');
      //redirect('/');
    } catch (error) {
      console.error(error.message);
      res.status(500).send('Server Error!');
    }
  });

  // Delete station endpoint
  app.delete('/api/v1/station/:stationId', async (req, res) => {
    try {
      const stationid = req.params;
      //const station = await pool.query('SELECT * FROM stations WHERE id = $1', [stationid]);
      const station = await db.select('*').from('se_project.station').where('id', stationid);
      const { id } = getUser(req).roleid;
      if (id != 2) {
        return res.status(401).json({ msg: "You are not authorized to delete a station" });
      }
      console.log(station.rows[0]);
      if (station.length == 1) {
        if (station.station_type == 'normal') {
          if (station.station_position == 'start') {
            //let affectedRoute = await pool.query('select * from routes where fromstationid = $1', [stationid]);
            let affectedRoute = await db.select('*').from('se_project.routes').where('fromstationid', stationid);
            //update the to station to become a start
            //await pool.query('update stations set stationposition = $1 where id = $2', ['start', affectedRoute.toStationid]);
            await db('se_project.station').where('id', affectedRoute.toStationid).update('station_position', 'start');
            //await pool.query('delete from stations where id = $1', [stationid]);
            await db('se_project.station').where('id', stationid).del();
          } else if (station.station_position == 'end') {
            //let affectedRoute = await pool.query('select * from routes where fromstationid = $1', [stationid]);
            let affectedRoute = await db.select('*').from('se_project.route').where('from_station_id', stationid);
            //update the to station to become an end
            //await pool.query('update station set stationposition = $1 where id = $2', ['end', affectedRoute.toStationid]);
            await db('se_project.station').where('id', affectedRoute.toStationid).update('station_position', 'end');
            
            //await pool.query('delete from stations where id = $1', [stationid]);
            await db('se_project.station').where('id', stationid).del();
          } else if (station.station_position == 'middle') {
            //let middleIsTo = await pool.query('select * from routes where toStationId = $1', [stationid]);
            let middleIsTo = await db.select('*').from('se_project.route').where('to_station_id', stationid);
            let myFromStation = middleIsTo.from_station_id;
            //let middleIsFrom = await pool.query('select * from routes where fromStationId = $1', [stationid]);
            let middleIsFrom = await db.select('*').from('se_project.route').where('from_station_id', stationid);
            let myToStation = middleIsFrom.to_station_id;
            //await pool.query('delete from stations where id = $1', [stationid]);
            await db('se_project.station').where('id', stationid).del();
            //update routes table with new entries
            //let newStationFromTo = await pool.query('insert into routes (routename, fromStationid, toStationid) values ($1, $2, $3)', [
              //'newroute1',
              //myFromStation,
              //myToStation]);
            let newStationFromTo = await db.insert([{'route_name': ''+myFromStation+myToStation},{'from_station_id': myFromStation}, {'to_station_id' : myToStation} ]).into('se_project.route');
            // let newStationToFrom = await pool.query('insert into routes (routename, fromStationid, toStationid) values ($1, $2, $3)', [
            //   'newroute1',
            //   myToStation,
            //   myFromStation
            // ]);
            let newStationToFrom = await db.insert([{'route_name': ''+myToStation+myFromStation},{'from_station_id': myToStation}, {'to_station_id' : myFromStation} ]).into('se_project.route');
            //add to SR table the new routes with their correspoding stations
            //let idnewStationFromTo = await pool.query('select id from routes where fromStationid = $1', myFromStation);
            let idnewStationFromTo = await db.select('id').from('se_project.route').where('from_station_id', myFromStation);
            //let idnewStationToFrom = await pool.query('select id from routes where fromStationid = $1', mytToStation);
            let idnewStationToFrom = await db.select('id').from('se_project.route').where('from_station_id', myToStation);
            // let newSR1 = await pool.query('insert into stationRoutes (stationid, routeid) values ($1,$2)', [
            //   myFromStation,
            //   parseInt(idnewStationFromTo)
            // ]);
            let newSR1 = await db.insert([{'station_id': myFromStation}, {'route_id': parseInt(idnewStationFromTo)}]).into('se_project.station_route');
            // let newSR2 = await pool.query('insert into stationRoutes (stationid, routeid) values ($1,$2)', [
            //   myToStation,
            //   parseInt(idnewStationToFrom)
            // ]);
            let newSR2 = await db.insert([{'station_id': myToStation}, {'route_id': parseInt(idnewStationToFrom)}]).into('se_project.station_route');
          }
        } else if (station.station_type == 'transfer') {
          //let transferRoutes = await pool.query('select * from route where from_station_id = $1', [stationid])
          let transferRoutes = await db.select('*').from('se_project.route').where('from_station_id', stationid);
          //let myNewTransfer = await pool.query('select from_station_id from route where to_station_id = $1', [stationid])
          let myNewTransfer = await db.select('from_station_id').from('se_project.route').where('to_station_id', stationid);
          for(let i = 0; i<transferRoutes.length; i++)
          {
            let toStation = transferRoutes[i].to_station_id;
            //await pool.query ('insert into route (route_name, from_station_id, to_station_id) values ($1, $2, $3)', [ myNewTransfer+' '+toStation, myNewTransfer, toStation]);
            await db.insert([{'route_name': ''+myNewTransfer+toStation},{'from_station_id': myNewTransfer}, {'to_station_id' : toStation} ]).into('se_project.route');
            //await pool.query ('insert into route (route_name, from_station_id, to_station_id) values ($1, $2, $3)', [ toStationr+' '+myNewTransfer, toStation, myNewTransfer]);
            await db.insert([{'route_name': ''+toStation+myNewTransfer},{'from_station_id': toStation}, {'to_station_id' : myNewTransfer} ]).into('se_project.route');
            
            //let newRouteIdTransferToStation = await pool.query('select id from route where from_station_id = $1 and to_station_id = $2', [myNewTransfer, toStation]);
            let newRouteIdTransferToStation = await db.select('id').from('se_project.route').where('from_station_id', myNewTransfer).andWhere('to_station_id', toStation);
            //let newRouteIdToStationToTransfer = await pool.query('select id from route where from_station_id = $1 and to_station_id = $2', [toStation, myNewTransfer]);
            let newRouteIdToStationToTransfer = await db.select('id').from('se_project.route').where('from_station_id', toStation).andWhere('to_station_id', myNewTransfer);
            
            // let newSR5 = await pool.query('insert into stationRoutes (stationid, routeid) values ($1,$2)', [
            //   toStation,
            //   parseInt(newRouteIdTransferToStation)
            // ]);
            let newSR5 = await db.insert([{'station_id': toStation}, {'route_id': parseInt(newRouteIdTransferToStation)}]).into('se_project.station_route');
            // let newSR6 = await pool.query('insert into stationRoutes (stationid, routeid) values ($1,$2)', [
            //   toStation,
            //   parseInt(newRouteIdToStationToTransfer)
            // ]);
            let newSR6 = await db.insert([{'station_id': toStation}, {'route_id': parseInt(newRouteIdToStationToTransfer)}]).into('se_project.station_route');
            // let newSR7 = await pool.query('insert into stationRoutes (stationid, routeid) values ($1,$2)', [
            //   myNewTransfer,
            //   parseInt(newRouteIdToStationToTransfer)
            // ]);
            let newSR7 = await db.insert([{'station_id': myNewTransfer}, {'route_id': parseInt(newRouteIdToStationToTransfer)}]).into('se_project.station_route');
            // let newSR8 = await pool.query('insert into stationRoutes (stationid, routeid) values ($1,$2)', [
            //   myNewTransfer,
            //   parseInt(newRouteIdTransferToStation)
            // ]);
            let newSR8 = await db.insert([{'station_id': myNewTransfer}, {'route_id': parseInt(newRouteIdTransferToStation)}]).into('se_project.station_route');
          }
          //await pool.query('update station set station_type = $1 where id = $2', ['transfer', myNewTransfer]);
          await db('se_project.station').where('id', myNewTransfer).update('station_type', 'transfer');
          //await pool.query('delete station where id = $1', [stationid]);
          await db('se_project.station').where('id', stationid).del();
          res.status(200).send('Station deleted and necessary updates created');
        }
        }
      }
     catch (error) {
      console.log(error.message);
      res.status(500).send('Server Error!');
     }
  });

  // Create new route endpoint
  app.post('/api/v1/route', async (req, res) => {
    const newRoute = {
      route_name: req.body.route_name, //not sure if namings here are correct ya yahia -Mariam
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
      // const newRoute = await pool.query('INSERT INTO se_project.routes (routename, fromStationid, toStationid) VALUES ($1, $2, $3) RETURNING *', [
      //   routename,
      //   fromStationid,
      //   toStationid
      // ]);
      const new_Route = await db.from('se_project.route').insert(newRoute).returning('*');
      res.json(new_Route);
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
      const updatedRoute = await db('se_project.route').where('id', fromStationid).update('route_name', routename).returning('*');
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
      const { roleid } = getUser(req).roleid;
      if (roleid !== 2) {
        return res.status(401).json({ msg: 'User not authorized!' });
      }
      //const deleteRoute = await pool.query('DELETE FROM routes WHERE id = $1', [routeId]);
      const deleteRoute = await db('se_project.route').where('id', routeId).del();
      res.json('Route was deleted!');
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
      }
      else{ //future dated == yes
        //const updatedRefund = await pool.query('UPDATE refundrequests SET refundstatus = $1 WHERE id = $2 RETURNING *', [refundstatus, requestId]);
       const updatedRefund = await db('se_project.refund_request').where('id', requestId).update('status', refundstatus).returning('*');
        res.json(updatedRefund[0]);
        res.send('Refund request checked!');
      }
    }catch(error){
      console.error(error.message);
      res.status(500).send('Server Error!');
    }

  });
  // Accept/Reject Senior
  app.put('/api/v1/requests/senior/:requestId', async (req, res) => {
    try {
      const nationalid = getUser(req).nationalid;
      yob = nationalid.substring(0, 2); //get the first 2 no.s
      if (yob < 99) {
        yob = '19' + yob;
      } else {
        yob = '20' + yob;
      }
      const year = new Date().getFullYear(); //this year
      const age = year - yob; //age of the user
      if (age < 60) {
        res.status(400).send('Cannot request a senior card if you are not a senior!');
      }
      else {
        const { seniorstatus } = req.body;
        const requestId = req.params;
        const updatedSenior = await db
          .from("se_project.senior_request")
          .where("id", requestId)
          .update({ seniorstatus: seniorstatus });
        res.json(updatedSenior);
      }
    } catch (error) {
      console.error(error.message);
      res.status(500).send('Server Error!');
    }
  });

  //Update zone price
  app.post('/api/v1/zones/:zoneId', async (req, res) => {
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
      //const updatedPrice = await pool.query('UPDATE zones SET price = $1 WHERE id = $2 RETURNING *', [newPrice, zoneId]);
      const updatedPrice = await db('se_project.zone').where('id', zoneId).update('price', newPrice).returning('*');
      res.json(updatedPrice[0]);
      res.send('Zone price updated!');
    } catch (error) {
      console.error(error.message);
      res.status(500).send('Server Error!');
    }
  });
};
