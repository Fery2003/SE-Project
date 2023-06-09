-- Active: 1684932602990@@127.0.0.1@5432@postgres@public

-- Insert Roles

-- READ THIS: CHANGE YOUR SCHEMA TO USE THE SCHEMA "se_project" FROM ABOVE BEFORE RUNNING THIS STUFF SO YOU DON'T GET ERRORS

-- PRESS ON "Active Connection" ABOVE AND SELECT "your_db_name#se_project"

INSERT INTO se_project.role("role") VALUES ('user');

INSERT INTO se_project.role("role") VALUES ('admin');

INSERT INTO se_project.role("role") VALUES ('senior');

-- Set user role as Admin

UPDATE se_project.user
SET "role_id" = 2
WHERE
    "email" = 'desoukya@gmail.com';

--USERS--

INSERT INTO
    se_project.user(
        "first_name",
        "last_name",
        "email",
        "password",
        "role_id"
    )
VALUES ('yahia', 'ehab', 'ye', '1', 1);

INSERT INTO
    se_project.user(
        "first_name",
        "last_name",
        "email",
        "password",
        "role_id"
    )
VALUES ('feras', 'nizar', 'fn', '12', 1);

INSERT INTO
    se_project.user(
        "first_name",
        "last_name",
        "email",
        "password",
        "role_id"
    )
VALUES (
        'mariam',
        'eldeeb',
        'me',
        '1234',
        1
    );

--ADMINS--

INSERT INTO
    se_project.user(
        "first_name",
        "last_name",
        "email",
        "password",
        "role_id"
    )
VALUES ('rita', 'amr', 'ra', '123', 2);

--TICKET--

INSERT INTO
    se_project.user(
        "first_name",
        "last_name",
        "email",
        "password",
        "role_id"
    )
VALUES ('rita', 'amr', 'ra', '123', 2);

--ZONES--

INSERT INTO se_project.zone("zone_type","price") VALUES ('9', '9');

INSERT INTO se_project.zone("zone_type","price") VALUES ('10', '10');

INSERT INTO se_project.zone("zone_type","price") VALUES ('16', '16');

--SUBSCRIPTIONS--

--ANNUAL QUARTLERY W MONTHLY

INSERT INTO
    se_project.subscription(
        "sub_type",
        "zone_id",
        "user_id",
        "no_of_tickets"
    )
VALUES ('annual', 1, 1, 100);

INSERT INTO
    se_project.subscription(
        "sub_type",
        "zone_id",
        "user_id",
        "no_of_tickets"
    )
VALUES ('quarterly', 2, 2, 50);

INSERT INTO
    se_project.subscription(
        "sub_type",
        "zone_id",
        "user_id",
        "no_of_tickets"
    )
VALUES ('monthly', 3, 4, 10);

INSERT INTO
    subscription(
        "sub_type",
        "zone_id",
        "user_id",
        "no_of_tickets"
    )
VALUES ('monthly', 3, 4, 10);

insert into
    se_project.station(
        "station_name",
        "station_type",
        "station_position",
        "station_status"
    )
values ('station1', '9', '1', '1');

insert into
    se_project.station(
        "station_name",
        "station_type",
        "station_position",
        "station_status"
    )
values ('station2', '9', '2', '1');