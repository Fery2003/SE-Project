CREATE TABLE
    "user" (
        user_id SERIAL NOT NULL,
        full_name TEXT NOT NULL,
        email TEXT UNIQUE NOT NULL,
        "password" TEXT NOT NULL,
        "role" TEXT NOT NULL,
        -- role should be one of: admin, normal, senior
        wallet FLOAT NOT NULL,
        PRIMARY KEY (user_id)
    );

CREATE TABLE
    phone_nums (
        phone_num VARCHAR(13) NOT NULL,
        user_id INT NOT NULL,
        PRIMARY KEY (phone_num, user_id),
        FOREIGN KEY (user_id) REFERENCES "user"(user_id)
    );

CREATE TABLE
    station (
        station_name TEXT NOT NULL,
        waiting_time INT NOT NULL,
        PRIMARY KEY (station_name)
    );

CREATE TABLE
    from_to (
        start_station TEXT NOT NULL,
        end_station TEXT NOT NULL,
        num_of_station INT NOT NULL,
        PRIMARY KEY (start_station, end_station),
        FOREIGN KEY (start_station) REFERENCES station(station_name),
        FOREIGN KEY (end_station) REFERENCES station(station_name)
    );

CREATE TABLE
    ticket (
        ticket_num SERIAL NOT NULL,
        price FLOAT NOT NULL,
        ticket_type TEXT NOT NULL,
        -- set types of tickets maybe?
        PRIMARY KEY (ticket_num)
    );

CREATE TABLE
    "subscription" (
        sub_type TEXT NOT NULL,
        -- it can be one of: monthly, yearly, weekly
        num_of_stations INT NOT NULL,
        price FLOAT NOT NULL,
        PRIMARY KEY (sub_type, num_of_stations)
    );

CREATE TABLE
    user_subbed_to (
        transaction_id SERIAL NOT NULL,
        sub_type TEXT NOT NULL,
        user_id INT NOT NULL,
        price FLOAT NOT NULL,
        "start_date" DATE NOT NULL,
        end_date DATE NOT NULL,
        PRIMARY KEY (user_id),
        FOREIGN KEY (user_id) REFERENCES "user"(user_id),
        FOREIGN KEY (sub_type) REFERENCES "subscription"(sub_type)
    );

CREATE TABLE
    senior_request (
        user_id INT NOT NULL,
        status TEXT NOT NULL,
        -- status should be one of: pending, approved, rejected
        ssn_image TEXT NOT NULL,
        PRIMARY KEY (user_id),
        FOREIGN KEY (user_id) REFERENCES "user"(user_id)
    );

CREATE TABLE
    refund_request (
        request_id SERIAL NOT NULL,
        user_id INT NOT NULL,
        "status" TEXT NOT NULL,
        -- status should be one of: pending, approved, rejected
        PRIMARY KEY (request_id, user_id),
        FOREIGN KEY (user_id) REFERENCES "user"(user_id),
    );

CREATE TABLE
    user_buys_ticket (
        user_id INT NOT NULL,
        ticket_num INT NOT NULL,
        transaction_id SERIAL NOT NULL,
        ride_date DATE NOT NULL,
        PRIMARY KEY (user_id, ticket_num),
        FOREIGN KEY (user_id) REFERENCES "user"(user_id),
        FOREIGN KEY (ticket_num) REFERENCES ticket(ticket_num)
    );

CREATE TABLE
    user_refund_request(
        user_id INT NOT NULL,
        request_id INT NOT NULL,
        ticket_num INT NOT NULL,
        PRIMARY KEY (user_id, request_id),
        FOREIGN KEY (user_id) REFERENCES "user"(user_id),
        FOREIGN KEY (ticket_num) REFERENCES ticket(ticket_num),
        FOREIGN KEY (request_id) REFERENCES refund_request(request_id)
    );