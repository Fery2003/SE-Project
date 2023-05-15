const express = require('express');
const app = express();
// OR
const axios = require('axios');

// / is the root path
app.get('/', async (req, res) => {
    // const results = await axios.get('https://goweather.herokuapp.com/weather/cairo');
    // console.log(results.data); // to get data part of the response
    // OR
    const { data } = await axios.get('https://goweather.herokuapp.com/weather/cairo'); // destructuring the response
    // res.send('Hello World!');
    res.json(data); // res.send(data) works too but json is better
    // res.status(200).json(data); // status code 200 is the default (optional)
});

app.get('/greetings', (req, res) => {
  res.send('Hello Internet!');
});

app.get('/json-test', (req, res) => {
  res.json({ message: 'Hello World!' });
});

app.get('/hjs-render-test', (req, res) => {
  res.render('home');
});

app.listen(2000); // port number
