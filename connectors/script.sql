-- Active: 1684932602990@@127.0.0.1@5432@postgres@public
-- DROP TABLE IF EXISTS se_project.users;

-- DROP TABLE IF EXISTS roles;

-- DROP TABLE IF EXISTS faculties;

-- DROP TABLE IF EXISTS courses;

-- DROP TABLE IF EXISTS sessions;

-- DROP TABLE IF EXISTS enrollments;

--- NOTE in pgadmin columns name will be lowerCase

--so either change them from pgadmin or change in the code to lower

CREATE TABLE
    IF NOT EXISTS se_project.user (
        id SERIAL NOT NULL,
        first_name TEXT NOT NULL,
        last_name TEXT NOT NULL,
        email TEXT NOT NULL,
        password TEXT NOT NULL,
        role_id INTEGER NOT NULL,
        CONSTRAINT user_pkey PRIMARY KEY (id)
    );

CREATE TABLE
    IF NOT EXISTS se_project.session (
        id SERIAL NOT NULL,
        user_id INTEGER NOT NULL,
        token TEXT NOT NULL,
        expires_at TIMESTAMP NOT NULL,
        CONSTRAINT session_pkey PRIMARY KEY (id)
    );

CREATE TABLE
    IF NOT EXISTS se_project.role (
        id SERIAL NOT NULL,
        role TEXT NOT NULL,
        CONSTRAINT role_pkey PRIMARY KEY (id)
    );

CREATE TABLE
    IF NOT EXISTS se_project.zone (
        id SERIAL NOT NULL,
        zone_type TEXT NOT NULL,
        -- 9 stations/ 10-16/16
        price INTEGER NOT NULL,
        CONSTRAINT zone_pkey PRIMARY KEY (id)
    );

CREATE TABLE
    IF NOT EXISTS se_project.subscription (
        id SERIAL NOT NULL,
        sub_type TEXT NOT NULL,
        --annual --month -- quarterly
        zone_id INTEGER NOT NULL,
        user_id INTEGER NOT NULL,
        no_of_tickets INTEGER NOT NULL,
        CONSTRAINT subscription_pkey PRIMARY KEY (id),
        FOREIGN KEY(user_id) REFERENCES se_project.user,
        FOREIGN KEY(zone_id) REFERENCES se_project.zone
    );

CREATE TABLE
    IF NOT EXISTS se_project.ticket (
        id SERIAL NOT NULL,
        origin TEXT NOT NULL,
        destination TEXT NOT NULL,
        user_id INTEGER NOT NULL,
        sub_id INTEGER,
        trip_date TIMESTAMP NOT NULL,
        FOREIGN KEY(user_id) REFERENCES se_project.user,
        FOREIGN KEY(sub_id) REFERENCES se_project.subscription,
        CONSTRAINT ticket_pkey PRIMARY KEY (id)
    );

CREATE TABLE
    IF NOT EXISTS se_project.ride (
        id SERIAL NOT NULL,
        status TEXT NOT NULL,
        origin TEXT NOT NULL,
        destination TEXT NOT NULL,
        user_id INTEGER NOT NULL,
        ticket_id INTEGER NOT NULL,
        trip_date TIMESTAMP NOT NULL,
        FOREIGN KEY(user_id) REFERENCES se_project.user,
        FOREIGN KEY(ticket_id) REFERENCES se_project.ticket,
        CONSTRAINT ride_pkey PRIMARY KEY (id)
    );

CREATE TABLE
    IF NOT EXISTS se_project.transaction (
        id SERIAL NOT NULL,
        amount FLOAT NOT NULL,
        user_id INTEGER NOT NULL,
        purchase_id TEXT NOT NULL,
        purchase_type TEXT NOT NULL,
        -- either ticket or subscription
        FOREIGN KEY(user_id) REFERENCES se_project.user,
        CONSTRAINT transaction_pkey PRIMARY KEY (id)
    );

CREATE TABLE
    IF NOT EXISTS se_project.refund_request (
        id SERIAL NOT NULL,
        status TEXT NOT NULL,
        user_id INTEGER NOT NULL,
        refund_amount INTEGER NOT NULL,
        ticket_id INTEGER NOT NULL,
        FOREIGN KEY(user_id) REFERENCES se_project.user,
        FOREIGN KEY(ticket_id) REFERENCES se_project.ticket,
        CONSTRAINT refund_request_pkey PRIMARY KEY (id)
    );

CREATE TABLE
    IF NOT EXISTS se_project.senior_request (
        id SERIAL NOT NULL,
        status TEXT NOT NULL,
        user_id INTEGER NOT NULL,
        national_id TEXT NOT NULL,
        FOREIGN KEY(user_id) REFERENCES se_project.user,
        CONSTRAINT senior_request_pkey PRIMARY KEY (id)
    );

CREATE TABLE
    IF NOT EXISTS se_project.station (
        id SERIAL NOT NULL,
        station_name TEXT NOT NULL,
        station_type TEXT NOT NULL,
        -- normal or transfer
        station_position TEXT,
        -- start middle end
        station_status TEXT NOT NULL,
        -- new created or NOT
        CONSTRAINT station_pkey PRIMARY KEY (id)
    );

CREATE TABLE
    IF NOT EXISTS se_project.route (
        id SERIAL NOT NULL,
        route_name TEXT NOT NULL,
        from_station_id INTEGER NOT NULL,
        to_station_id INTEGER NOT NULL,
        CONSTRAINT route_pkey PRIMARY KEY (id),
        FOREIGN KEY(from_station_id) REFERENCES se_project.station ON DELETE CASCADE ON UPDATE CASCADE,
        FOREIGN KEY(to_station_id) REFERENCES se_project.station ON DELETE CASCADE ON UPDATE CASCADE
    );

CREATE TABLE
    IF NOT EXISTS se_project.station_route (
        id SERIAL NOT NULL,
        station_id INTEGER NOT NULL,
        route_id INTEGER NOT NULL,
        CONSTRAINT station_route_pkey PRIMARY KEY (id),
        FOREIGN KEY(station_id) REFERENCES se_project.station ON DELETE CASCADE ON UPDATE CASCADE,
        FOREIGN KEY(route_id) REFERENCES se_project.route ON DELETE CASCADE ON UPDATE CASCADE
    );