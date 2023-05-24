-- DROP TABLE IF EXISTS se_project.users;
-- DROP TABLE IF EXISTS roles;
-- DROP TABLE IF EXISTS faculties;
-- DROP TABLE IF EXISTS courses;
-- DROP TABLE IF EXISTS sessions;
-- DROP TABLE IF EXISTS enrollments;
--- Note in pgadmin columns name will be lowerCase 
--so either change them from pgadmin or change in the code to lower
CREATE TABLE IF NOT EXISTS users
(
    id SERIAL NOT NULL,
    firstname text NOT NULL,
    lastname text NOT NULL,
    email text NOT NULL,
    password text NOT NULL,
    roleid integer NOT NULL,
    CONSTRAINT users_pkey PRIMARY KEY (id)
);
CREATE TABLE IF NOT EXISTS sessions
(
    id SERIAL NOT NULL,
    userid integer NOT NULL,
    token text NOT NULL,
    expiresat timestamp NOT NULL,
    CONSTRAINT sessions_pkey PRIMARY KEY (id)
);
CREATE TABLE IF NOT EXISTS roles
(
    id SERIAL NOT NULL,
    role text NOT NULL,
    CONSTRAINT roles_pkey PRIMARY KEY (id)
);

CREATE TABLE IF NOT EXISTS zones
(
    id SERIAL NOT NULL,
    zonetype text NOT NULL, -- 9 stations/ 10-16/16
    price INTEGER NOT NULL,
    CONSTRAINT zones_pkey PRIMARY KEY (id)

);
CREATE TABLE IF NOT EXISTS subsription
(
    id SERIAL NOT NULL,
    subtype text NOT NULL, --annual --month -- quarterly
    zoneid Integer NOT NULL,
    userid INTEGER NOT NULL,
    nooftickets INTEGER NOT NULL,
    CONSTRAINT subsription_pkey PRIMARY KEY (id),
    FOREIGN KEY( userid ) REFERENCES users,
    FOREIGN KEY( zoneid ) REFERENCES zones

);
CREATE TABLE IF NOT EXISTS tickets
(
    id SERIAL NOT NULL,
    origin text NOT NULL,
    destination text NOT NULL,
    userid INTEGER NOT Null,
    subiD INTEGER,
    tripdate timestamp not Null,
    FOREIGN KEY( userid ) REFERENCES users,
    FOREIGN KEY( subid ) REFERENCES subsription,
    CONSTRAINT tickets_pkey PRIMARY KEY (id)
);



CREATE TABLE IF NOT EXISTS rides
(
    id SERIAL NOT NULL,
    status text NOT NULL,
    origin text NOT NULL, 
    destination text NOT NULL, 
    userid INTEGER NOT NULL,
    ticketid integer not null,
    tripdate timestamp not null,
    FOREIGN KEY( userid ) REFERENCES users,
    FOREIGN KEY( ticketid ) REFERENCES rides,
    CONSTRAINT rides_pkey PRIMARY KEY (id)
);
CREATE TABLE IF NOT EXISTS transactions
(
    id SERIAL NOT NULL,
    amount INTEGER NOT NULL,
    userid INTEGER NOT NULL,
    purchasedid text NOT NULL, 
    FOREIGN KEY( userid ) REFERENCES users,
    CONSTRAINT transactions_pkey PRIMARY KEY (id)
);
CREATE TABLE IF NOT EXISTS refund_requests
(
    id SERIAL NOT NULL,
    status text NOT NULL,
    userid Integer NOT NULL, 
    refundamount INTEGER not NULL,
    ticketid INTEGER NOT null,
    FOREIGN KEY( userid ) REFERENCES users,
    FOREIGN KEY( ticketid ) REFERENCES tickets,
    CONSTRAINT refund_requests_pkey PRIMARY KEY (id)
);
CREATE TABLE IF NOT EXISTS senior_requests
(
    id SERIAL NOT NULL,
    status text NOT NULL,
    userid Integer NOT NULL, 
    nationalid INTEGER not null,
    FOREIGN KEY( userid ) REFERENCES users,
    CONSTRAINT senior_requests_pkey PRIMARY KEY (id)
);
CREATE TABLE IF NOT EXISTS stations
(
    id SERIAL NOT NULL,
    stationname text NOT NULL,
    stationtype text NOT NULL, -- normal or transfer
    stationposition text, -- start middle end
    stationstatus text not null, -- new created or not
    CONSTRAINT stations_pkey PRIMARY KEY (id)
);
CREATE TABLE IF NOT EXISTS routes
(
    id SERIAL NOT NULL,
    routename text Not null,
    fromStationid INTEGER NOT NULL,
    toStationid INTEGER NOT NULL, 
    CONSTRAINT routes_pkey PRIMARY KEY (id),
    FOREIGN KEY( fromStationid ) REFERENCES stations on DELETE CASCADE on UPDATE CASCADE,
    FOREIGN KEY( toStationid ) REFERENCES stations  on DELETE CASCADE on UPDATE CASCADE

);

CREATE TABLE IF NOT EXISTS stationRoutes
(
    id SERIAL NOT NULL,
    stationid INTEGER NOT NULL,
    routeid INTEGER NOT NULL, 
    CONSTRAINT stationRoutes_pkey PRIMARY KEY (id),
    FOREIGN KEY( stationid ) REFERENCES stations on DELETE CASCADE on UPDATE CASCADE,
    FOREIGN KEY( routeid ) REFERENCES routes on DELETE CASCADE on UPDATE CASCADE
);
