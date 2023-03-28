CREATE TABLE
    "user" (
        user_id SERIAL NOT NULL,
        name TEXT NOT NULL,
        email TEXT UNIQUE NOT NULL,
        password TEXT NOT NULL,
        phone_num VARCHAR(13) NOT NULL,
        role TEXT NOT NULL, -- role should be one of: admin, normal, senior
        wallet FLOAT NOT NULL,
        PRIMARY KEY (user_id)
    );

CREATE TABLE
    station (
        name TEXT NOT NULL,
        location TEXT NOT NULL,
        wating_time INT NOT NULL,
        PRIMARY KEY (name)
    );

CREATE TABLE
    ticket (
        ticket_num SERIAL NOT NULL,
        user_id INT NOT NULL,
        end_station TEXT NOT NULL,
        start_station TEXT NOT NULL,
        price FLOAT NOT NULL,
        PRIMARY KEY (ticket_num),
        FOREIGN KEY (user_id) REFERENCES "user"(user_id),
        FOREIGN KEY (end_station) REFERENCES station(name),
        FOREIGN KEY (start_station) REFERENCES station(name)
    );


CREATE TABLE
    subscription (
        user_id INT NOT NULL,
        sub_type TEXT NOT NULL,
        num_of_stations INT NOT NULL,
        price FLOAT NOT NULL,
        PRIMARY KEY (user_id),
        FOREIGN KEY (user_id) REFERENCES "user"(user_id)
    );

CREATE TABLE
    senior_request (
        user_id INT NOT NULL,
        status TEXT NOT NULL, -- status should be one of: pending, approved, rejected
        ssn_image TEXT NOT NULL,
        PRIMARY KEY (user_id),
        FOREIGN KEY (user_id) REFERENCES "user"(user_id)
    );

CREATE TABLE
    refund_request (
        user_id INT NOT NULL,
        ticket_id INT NOT NULL,
        status TEXT NOT NULL, -- status should be one of: pending, approved, rejected
        PRIMARY KEY (user_id, ticket_id),
        FOREIGN KEY (user_id) REFERENCES "user"(user_id),
        FOREIGN KEY (ticket_id) REFERENCES ticket(ticket_num)
    );

CREATE TABLE
    route (
        start_station TEXT NOT NULL,
        end_station TEXT NOT NULL,
        distance INT NOT NULL,
        PRIMARY KEY (start_station, end_station),
        FOREIGN KEY (start_station) REFERENCES station(name),
        FOREIGN KEY (end_station) REFERENCES station(name)
    );