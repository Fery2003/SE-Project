const express = require('express');
const app = express();
const axios = require('axios');
const pool = require('./db.js');

app.use(express.json());

// Root path
app.get('/', async (req, res) => {
    try {
        const { rows } = await pool.query('SELECT * FROM se_project.stations');
        res.json(rows);
    } catch (error) {
        console.error(error.message);
        res.status(500).send('Server Error!');
    }
});

const getUser = async function (req) {
    const sessionToken = getSessionToken(req);
    if (!sessionToken) {
        return res.status(301).redirect('/');
    }

    const user = await db.select('*')
        .from('se_project.sessions')
        .where('token', sessionToken)
        .innerJoin('se_project.users', 'se_project.sessions.userid', 'se_project.users.id')
        .innerJoin('se_project.roles', 'se_project.users.roleid', 'se_project.roles.id')
        .first();

    console.log('user =>', user)
    user.isStudent = user.roleid === roles.student;
    user.isAdmin = user.roleid === roles.admin;
    user.isSenior = user.roleid === roles.senior;

    return user;
}
app.get('/dashboard', async (req, res) => {
    try {
        const user = await pool.query('SELECT * FROM se_project.users WHERE id = $1', [req.user]);
        res.json(user.rows[0]);
    } catch (error) {
        console.error(error.message);
        res.status(500).send('Server Error!');
    }
});

// Reset password endpoint
app.put('/api/v1/password/reset', async (req, res) => {
    try {
        const { email, password } = req.body;
        const user = await pool.query('UPDATE se_project.users SET password = $1 WHERE email = $2 RETURNING *', [password, email]);
        res.json(user.rows[0]);
    } catch (error) {
        console.error(error.message);
        res.status(500).send('Server Error!');
    }
});

// Subscriptions endpoint(running but not testing)
app.get('/subscriptions/api/v1/zones', async (req, res) => {
    try {
        const zones = await pool.query('SELECT * FROM se_project.zones');
        res.json(zones.rows);
    } catch (error) {
        console.error(error.message);
        res.status(500).send('Server Error!');
    }
});

// Create subscription endpoint, same logic of reg
app.post('/subscriptions/api/payment/subscription', async (req, res) => {
    try {

    } catch (error) {

    }
});

// Create ticket endpoint, same logic as reg
app.post('/tickets/api/payment/tickets', async (req, res) => {

});

// Purchase ticket with subscription endpoint
app.post('/tickets/api/v1/tickets/purchase/subscription', async (req, res) => {
    try {
        const { status, origin, destination, userid, ticketid, tripdate } = req.body;
        const ticket = await pool.query('INSERT INTO se_project.tickets (status, origin, destination, userid, ticketid, tripdate) VALUES ($1, $2, $3, $4, $5, $6) RETURNING *', [status, origin, destination, userid, ticketid, tripdate]);
        res.json(ticket.rows[0]);
    } catch (error) {
        console.error(error.message);
        res.status(500).send('Server Error!');
    }
});

// Get ticket price endpoint
app.post('/prices/api/v1/tickets/price/:originId', async (req, res) => {

});

// Get all rides endpoint
app.get('/rides', async (req, res) => {
    try {
        const rides = await pool.query('SELECT * FROM se_project.rides');
        res.json(rides.rows);
    } catch (error) {
        console.error(error.message);
        res.status(500).send('Server Error!');
    }
});

// Request ticket refund endpoint
app.post('/request/refund/api/v1/refund/:ticketId', async (req, res) => {

});

// Request senior ticket endpoint
app.post('/request/senior/api/v1/senior/request', async (req, res) => {

});

// Simulate ride endpoint
app.put('/rides/simulate/api/v1/ride/simulate', async (req, res) => {

});

// Create new station endpoint
app.post('/stations', async (req, res) => {
    try {
        const { stationname, stationtype, stationposition, stationstatus } = req.body;
        const newStation = await pool.query('INSERT INTO se_project.stations (stationname, stationtype, stationposition, stationstatus) VALUES ($1, $2, $3, $4) RETURNING *', [stationname, stationtype, stationposition, stationstatus]);
        res.json(newStation.rows[0]);
    } catch (error) {
        console.error(error.message);
        res.status(500).send('Server Error!');
    }
});

// Update station endpoint
app.put('/stations/:id', async (req, res) => {

});

// Delete station endpoint
app.delete('/stations/:id', async (req, res) => {

});

// Create new route endpoint
app.post('/routes', async (req, res) => {
    try {
        const { routename, fromStationid, toStationid } = req.body;
        const newRoute = await pool.query('INSERT INTO se_project.routes (routename, fromStationid, toStationid) VALUES ($1, $2, $3) RETURNING *', [routename, fromStationid, toStationid]);
        res.json(newRoute.rows[0]);
    } catch (error) {
        console.error(error.message);
        res.status(500).send('Server Error!');
    }
});

// Update route endpoint
app.put('/routes/:id', async (req, res) => {

});

// Delete route endpoint
app.delete('/routes/:id', async (req, res) => {

});
