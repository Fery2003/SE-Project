// import the knex library that will allow us to
// construct SQL statements
const knex = require('knex');


// define the configuration settings to connect
// to our local postgres server
const config = {
  client: 'pg',
  connection: {
    host: 'localhost',
    port: 5432,
    user: 'postgres',
    password: 'YahiaEhab10',
    database: 'postgres',
  }
};

// create the connection with postgres
const db = knex(config);
async function uploadSR() {
  let SR = [
    { station_id: 1, route_id: 1 },
    { station_id: 1, route_id: 2 },
    { station_id: 2, route_id: 1 },
    { station_id: 2, route_id: 2 },
    { station_id: 2, route_id: 3 },
    { station_id: 2, route_id: 4 },
    { station_id: 3, route_id: 3 },
    { station_id: 3, route_id: 4 },
    { station_id: 3, route_id: 5 },
    { station_id: 3, route_id: 6 },
    { station_id: 3, route_id: 7 },
    { station_id: 3, route_id: 8 },
    { station_id: 4, route_id: 5 },
    { station_id: 4, route_id: 6 },
    { station_id: 4, route_id: 9 },
    { station_id: 4, route_id: 10 },
    { station_id: 5, route_id: 9 },
    { station_id: 5, route_id: 10 },
    { station_id: 6, route_id: 7 },
    { station_id: 6, route_id: 8 },
    { station_id: 6, route_id: 11 },
    { station_id: 6, route_id: 12 },
    { station_id: 7, route_id: 11 },
    { station_id: 7, route_id: 12 }
  ];
  for (let i = 0; i < SR.length; i++) {
    const element = SR[i];
    await db('se_project.station_route').insert(element).returning('*');
  }
}
async function uploadS() {
  let stations = [
    {
      station_name: 's1',
      station_type: 'normal',
      station_position: 'start',
      station_status: 'old'
    },
    {
      station_name: 's2',
      station_type: 'normal',
      station_position: 'middle',
      station_status: 'old'
    },
    {
      station_name: 's3',
      station_type: 'transfer',
      station_position: 'middle',
      station_status: 'old'
    },
    {
      station_name: 's4',
      station_type: 'normal',
      station_position: 'middle',
      station_status: 'old'
    },
    {
      station_name: 's5',
      station_type: 'normal',
      station_position: 'end',
      station_status: 'old'
    },
    {
      station_name: 's6',
      station_type: 'normal',
      station_position: 'middle',
      station_status: 'old'
    },
    {
      station_name: 's7',
      station_type: 'normal',
      station_position: 'end',
      station_status: 'old'
    }
  ];

  for (let i = 0; i < stations.length; i++) {
    const element = stations[i];
    await db('se_project.station').insert(element).returning('*');
  }
}
async function uploadR() {
  let routes = [
    { route_name: 'hi12', from_station_id: 1, to_station_id: 2 },
    { route_name: 'hi21', from_station_id: 2, to_station_id: 1 },
    { route_name: 'hi23', from_station_id: 2, to_station_id: 3 },
    { route_name: 'hi32', from_station_id: 3, to_station_id: 2 },
    { route_name: 'hi34', from_station_id: 3, to_station_id: 4 },
    { route_name: 'hi43', from_station_id: 4, to_station_id: 3 },
    { route_name: 'hi36', from_station_id: 3, to_station_id: 6 },
    { route_name: 'hi63', from_station_id: 6, to_station_id: 3 },
    { route_name: 'hi45', from_station_id: 4, to_station_id: 5 },
    { route_name: 'hi54', from_station_id: 5, to_station_id: 4 },
    { route_name: 'hi76', from_station_id: 7, to_station_id: 6 },
    { route_name: 'hi67', from_station_id: 6, to_station_id: 7 }
  ];

  for (let i = 0; i < routes.length; i++) {
    const element = routes[i];
    await db('se_project.route').insert(element).returning('*');
  }
}
// uploadS(); // first to run
// uploadR(); // second
// uploadSR(); // third
