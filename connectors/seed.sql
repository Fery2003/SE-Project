-- Active: 1679073997780@@127.0.0.1@5432@project@se_project
-- Insert Roles
-- READ THIS: CHANGE YOUR SCHEMA TO USE THE SCHEMA "se_project" FROM ABOVE BEFORE RUNNING THIS STUFF SO YOU DON'T GET ERRORS
-- PRESS ON "Active Connection" ABOVE AND SELECT "your_db_name#se_project"
INSERT INTO role("role")
	VALUES ('user');
INSERT INTO role("role")
	VALUES ('admin');
INSERT INTO role("role")
	VALUES ('senior');	
-- Set user role as Admin
UPDATE user
	SET "role_id"=2
	WHERE "email"='desoukya@gmail.com';

INSERT INTO user("first_name","last_name","email","password","role_id") VALUES ('1', '1', '1', '1', 2)

 