const express = require('express');
const app = express();
// OR
const axios = require('axios');
const pool = require('./db.js');

// / is the root path
app.get('/', async (req, res) => {
  try {
    const { rows } = await pool.query('SELECT * FROM se_project.stations');
    res.json(rows);
  } catch (error) {
    console.error(error.message);
  }
});

//Yahia's Region
{
  app.post('/api/v1/users/login', async (req, res) => {
    res.render('login');
    try {
      const { email, password } = req.body;
      const user = await pool.query('SELECT * FROM users WHERE email = $1', [email]);
      if (user.rows.length === 0) {
        res.status(401).json('Invalid Credentials!');
      } else {
        const validPassword = await bcrypt.compare(password, user.rows[0].password);
        if (!validPassword) {
          res.status(401).json('Invalid Credentials!');
        } else {
          const token = jwtGenerator(user.rows[0].user_id);
          res.json({ token });
        }
      }
    } catch (error) {
      console.error(error.message);
    }
  });

  app.post('/register/api/v1/users', async (req, res) => {
    try {
      const { firstname, lastname, email, roleid, password } = req.body;
      const user = await pool.query('SELECT * FROM users WHERE email = $1', [email]);
      if (user.rows.length !== 0) {
        res.status(401).json('User already exists!');
      }
      else {
        const newUser = await pool.query('INSERT INTO se_project.users (firstname, lastname, email, roleid, password) VALUES ($1, $2, $3, $4, $5) RETURNING *', [firstname, lastname, email, roleid, password]);
        const token = jwtGenerator(newUser.rows[0].user_id);
        res.json({ token });
      }
    } catch (error) {
      console.error(error.message);
    }
  });

  app.get('/dashboard', async (req, res) => {
    try {
      const user = await pool.query('SELECT name FROM se_project.users WHERE userid = $1', [req.user]);
      res.json(user.rows[0]);
    } catch (error) {
      console.error(error.message);
      res.status(500).send('Server Error!');
    }
  });

  app.put('/resetPassword/api/v1/password/reset', async (req, res) => {
    try {
      const { email, password } = req.body;
      const user = await pool.query('SELECT * FROM se_project.users WHERE email = $1', [email]);
      if (user.rows.length === 0) {
        res.status(401).json('Invalid Credentials!');
      } else {
        const resetPassword = await pool.query('UPDATE se_project.users SET password = $1 WHERE email = $2 RETURNING *', [password, email]);
        res.json(resetPassword.rows[0]);
      }
    } catch (error) {
      console.error(error.message);
    }
  });

  app.get('/subscriptions/api/v1/zones', async (req, res) => {
    try {
      const zones = await pool.query('SELECT * FROM se_project.zones');
      res.json(zones.rows);
    } catch (error) {
      console.error(error.message);
    }
  });

  app.post('/subscriptions/api/payment/subscription', async (req, res) => {
    try {
      const { subtype, zoneid, user_id, nooftickets, } = req.body;
      const subscription = await pool.query('INSERT INTO se_project.subsription (subtype, zoneid, user_id,nooftickets) VALUES ($1, $2, $3, $4) RETURNING *', [subtype, zoneid, userid, nooftickets]);
      res.json(subscription.rows[0]);
    } catch (error) {
      console.error(error.message);
    }
  });

  app.post('/tickets/api/payment/tickets', async (req, res) => {
    try {
      const { status, origin, destination, userid, ticketid, tripdate } = req.body;
      const ticket = await pool.query('INSERT INTO se_project.tickets (status , origin,destination , userid , ticketid , tripdate) VALUES ($1, $2, $3, $4, $5, $6) RETURNING *', [status, origin, destination, userid, ticketid, tripdate]);
    } catch (error) {
      console.error(error.message);
    }
  });

  app.post('/tickets/api/v1/tickets/purchase/subscription', async (req, res) => {
    try {
      const { status, origin, destination, userid, ticketid, tripdate } = req.body;
      const ticket = await pool.query('INSERT INTO se_project.tickets (status , origin,destination , userid , ticketid , tripdate) VALUES ($1, $2, $3, $4, $5, $6) RETURNING *', [status, origin, destination, userid, ticketid, tripdate]);
      res.json(ticket.rows[0]);
    } catch (error) {
      console.error(error.message);
    }
  });

  app.post('/prices/api/v1/tickets/price/:originId', async (req, res) => {
    try {
      const { zonetype } = req.body;
      const price = await pool.query('SELECT * FROM se_project.zones WHERE zonetype = $1', [zonetype]);
      res.json(price.rows[0]);
    } catch (error) {
      console.error(error.message);
    }
  });

  app.get('/rides', async (req, res) => {
    try {
      const rides = await pool.query('SELECT * FROM se_project.rides');
      res.json(rides.rows);
    } catch (error) {
      console.error(error.message);
    }
  });

  app.post('/request/refund/api/v1/refund/:ticketId', async (req, res) => {
    try {
      const { ticketId } = req.body;
      const ticket = await pool.query('SELECT * FROM tickets WHERE ticket_id = $1', [ticketId]);
      if (ticket.rows.length === 0) {
        res.status(401).json('Invalid Credentials!');
      } else {
        res.json(ticket.rows[0]);
      }
    } catch (error) {
      console.error(error.message);
    }
  });

  app.post('/request/senior/api/v1/senior/request', async (req, res) => {
    try {
      const { status, userid, nationalid } = req.body;
      const senior = await pool.query('INSERT INTO se_project.senior_request (status,userid,nationalid) VALUES ($1, $2, $3) RETURNING *', [status, userid, nationalid]);
      res.json(senior.rows[0]);
    } catch (error) {
      console.error(error.message);
    }
  });

  app.put('/rises/simulate/api/v1/ride/simulate', async (req, res) => {
    try {
      const { id } = req.body;
      const ride = await pool.query('UPDATE se_project.rides SET status = $1 WHERE ride_id = $2 RETURNING *', [status, id]);
      res.json(ride.rows[0]);
    } catch (error) {
      console.error(error.message);
    }
  });
  app.post('/stations', async (req, res) => {
    try {
      const { stationname, stationtype, stationposition, stationstatus } = req.body;
      const newStation = await pool.query('INSERT INTO se_project.stations (stationname,stationtype,stationposition,stationstatus) VALUES ($1, $2, $3, $4) RETURNING *', [stationname, stationtype, stationposition, stationstatus]);
    } catch (error) {
      console.error(error.message);
    }
  }
  );

  app.put('/stations/:id', async (req, res) => {
    try {
      const { id } = req.params;
      const { stationname, stationtype, stationposition, stationstatus } = req.body;
      const updateStation = await pool.query('UPDATE stations SET stationname = $1, stationtype = $2, stationposition = $3, stationstatus = $4 WHERE station_id = $5 RETURNING *', [stationname, stationtype, stationposition, stationstatus, id]);
      res.json(updateStation.rows[0]);
    } catch (error) {
      console.error(error.message);
    }
  }
  );

  app.delete('/stations/:id', async (req, res) => {
    try {
      const { id } = req.params;
      const deleteStation = await pool.query('DELETE FROM stations WHERE station_id = $1', [id]);
      res.json('Station was deleted!');
    } catch (error) {
      console.error(error.message);
    }
  }
  );

  app.post('/routes', async (req, res) => {
    try {
      const { routename, fromStationid, toStationid } = req.body;
      const newRoute = await pool.query('INSERT INTO se_project.routes (routename.fromStationid,toStationid) VALUES ($1, $2) RETURNING *', [routename.fromStationid, toStationid]);
      res.json(newRoute.rows[0]);
    } catch (error) {
      console.error(error.message);
    }
  }

  );

  app.put('/routes/:id', async (req, res) => {
    try {
      const { id } = req.params;
      const { routename, fromStationid, toStationid } = req.body;
      const updateRoute = await pool.query('UPDATE routes SET routename = $1, fromStationid = $2, toStationid = $3 WHERE route_id = $4 RETURNING *', [routename, fromStationid, toStationid, id]);
      res.json(updateRoute.rows[0]);
    } catch (error) {
      console.error(error.message);
    }
  }

  );

  app.delete('/routes/:id', async (req, res) => {
    try {
      const { id } = req.params;
      const deleteRoute = await pool.query('DELETE FROM routes WHERE route_id = $1', [id]);
      res.json('Route was deleted!');
    } catch (error) {
      console.error(error.message);
    }
  }
  );
}

app.listen(2000); // port number
