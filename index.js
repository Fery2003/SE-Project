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
      const { name, email, password } = req.body;
      const user = await pool.query('SELECT * FROM users WHERE email = $1', [email]);
      if (user.rows.length !== 0) {
        res.status(401).json('User already exists!');
      } else {
        const salt = await bcrypt.genSalt(10);
        const bcryptPassword = await bcrypt.hash(password, salt);
        const newUser = await pool.query('INSERT INTO users (name, email, password) VALUES ($1, $2, $3) RETURNING *', [name, email, bcryptPassword]);
        const token = jwtGenerator(newUser.rows[0].user_id);
        res.json({ token });
      }
    } catch (error) {
      console.error(error.message);
    }
  });

  app.get('/dashboard', async (req, res) => {
    try {
      const user = await pool.query('SELECT name FROM users WHERE user_id = $1', [req.user]);
      res.json(user.rows[0]);
    } catch (error) {
      console.error(error.message);
      res.status(500).send('Server Error!');
    }
  });

  app.put('/resetPassword/api/v1/password/reset', async (req, res) => {
    try {
      const { email, password } = req.body;
      const user = await pool.query('SELECT * FROM users WHERE email = $1', [email]);
      if (user.rows.length === 0) {
        res.status(401).json('Invalid Credentials!');
      } else {
        const salt = await bcrypt.genSalt(10);
        const bcryptPassword = await bcrypt.hash(password, salt);
        const resetPassword = await pool.query('UPDATE users SET password = $1 WHERE email = $2 RETURNING *', [bcryptPassword, email]);
        res.json(resetPassword.rows[0]);
      }
    } catch (error) {
      console.error(error.message);
    }
  });

  app.get('/subscriptions/api/v1/zones', async (req, res) => {
    try {
      const zones = await pool.query('SELECT * FROM zones');
      res.json(zones.rows);
    } catch (error) {
      console.error(error.message);
    }
  });

  app.post('/subscriptions/api/payment/subscription', async (req, res) => {
    try {
      const { subId, creditCardNumber, holderName, payedAmount, origin, destination, tripDate } = req.body;
      const subscription = await pool.query('INSERT INTO subscriptions (sub_id, credit_card_number, holder_name, payed_amount, origin, destination, trip_date) VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *', [subId, creditCardNumber, holderName, payedAmount, origin, destination, tripDate]);
      res.json(subscription.rows[0]);
    } catch (error) {
      console.error(error.message);
    }
  });

  app.post('/tickets/api/payment/tickets', async (req, res) => {
    try {
      const { ticketId, creditCardNumber, holderName, payedAmount, origin, destination, tripDate } = req.body;
      const ticket = await pool.query('INSERT INTO tickets (ticket_id, credit_card_number, holder_name, payed_amount, origin, destination, trip_date) VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *', [ticketId, creditCardNumber, holderName, payedAmount, origin, destination, tripDate]);
      res.json(ticket.rows[0]);
    } catch (error) {
      console.error(error.message);
    }
  });

  app.post('/tickets/api/v1/tickets/purchase/subscription', async (req, res) => {
    try {
      const { subId, origin, destination, tripDate } = req.body;
      const subscription = await pool.query('SELECT * FROM subscriptions WHERE sub_id = $1 AND origin = $2 AND destination = $3 AND trip_date = $4', [subId, origin, destination, tripDate]);
      if (subscription.rows.length === 0) {
        res.status(401).json('Invalid Credentials!');
      } else {
        res.json(subscription.rows[0]);
      }
    } catch (error) {
      console.error(error.message);
    }
  });

  app.post('/prices/api/v1/tickets/price/:originId', async (req, res) => {
    try {
      const { originId } = req.body;
      const price = await pool.query('SELECT price FROM prices WHERE origin_id = $1', [originId]);
      res.json(price.rows[0]);
    } catch (error) {
      console.error(error.message);
    }
  });

  app.get('/rides', async (req, res) => {
    try {
      const rides = await pool.query('SELECT * FROM rides');
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
      const { name, email, origin, destination, tripDate } = req.body;
      const senior = await pool.query('INSERT INTO seniors (name, email, origin, destination, trip_date) VALUES ($1, $2, $3, $4, $5) RETURNING *', [name, email, origin, destination, tripDate]);
      res.json(senior.rows[0]);
    } catch (error) {
      console.error(error.message);
    }
  });

  app.put('/rises/simulate/api/v1/ride/simulate', async (req, res) => {
    try {
      const { rideId, origin, destination, tripDate } = req.body;
      const ride = await pool.query('UPDATE rides SET origin = $1, destination = $2, trip_date = $3 WHERE ride_id = $4 RETURNING *', [origin, destination, tripDate, rideId]);
      res.json(ride.rows[0]);
    } catch (error) {
      console.error(error.message);
    }
  });
  app.post('/stations', async (req, res) => {
    try {
      const { name } = req.body;
      const newStation = await pool.query('INSERT INTO stations (name) VALUES ($1) RETURNING *', [name]);
      res.json(newStation.rows[0]);
    } catch (error) {
      console.error(error.message);
    }
  }
  );

  app.put('/stations/:id', async (req, res) => {
    try {
      const { id } = req.params;
      const { name } = req.body;
      const updateStation = await pool.query('UPDATE stations SET name = $1 WHERE station_id = $2 RETURNING *', [name, id]);
      res.json(updateStation.rows[0]);
    } catch (error) {
      console.error(error.message);
    }
  }
  );

  app.delete('/stations/:id', async (req, res) => {
    try {
      const { id } = req.params;
      const deleteStation = await pool.query('DELETE FROM stations WHERE station_id = $1 RETURNING *', [id]);
      res.json(deleteStation.rows[0]);
    } catch (error) {
      console.error(error.message);
    }
  }
  );

  app.post('/routes', async (req, res) => {
    try {
      const { station_id, station_id2, name } = req.body;
      const newRoute = await pool.query('INSERT INTO routes (station_id, station_id2, name) VALUES ($1, $2, $3) RETURNING *', [station_id, station_id2, name]);
      res.json(newRoute.rows[0]);
    } catch (error) {
      console.error(error.message);
    }
  }

  );

  app.put('/routes/:id', async (req, res) => {
    try {
      const { id } = req.params;
      const { name } = req.body;
      const updateRoute = await pool.query('UPDATE routes SET name = $1 WHERE route_id = $2 RETURNING *', [name, id]);
      res.json(updateRoute.rows[0]);
    } catch (error) {
      console.error(error.message);
    }
  }

  );

  app.delete('/routes/:id', async (req, res) => {
    try {
      const { id } = req.params;
      const deleteRoute = await pool.query('DELETE FROM routes WHERE route_id = $1 RETURNING *', [id]);
      res.json(deleteRoute.rows[0]);
    } catch (error) {
      console.error(error.message);
    }
  }
  );
}

app.listen(2000); // port number
