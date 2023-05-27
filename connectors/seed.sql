-- Active: 1684831529052@@127.0.0.1@5432@se_project23@se_project
-- Insert Roles
-- READ THIS: CHANGE YOUR SCHEMA TO USE THE SCHEMA "se_project" FROM ABOVE BEFORE RUNNING THIS STUFF SO YOU DON'T GET ERRORS
-- PRESS ON "Active Connection" ABOVE AND SELECT "your_db_name#se_project"
INSERT INTO roles("role")
	VALUES ('user');
INSERT INTO roles("role")
	VALUES ('admin');
INSERT INTO roles("role")
	VALUES ('senior');	
-- Set user role as Admin
UPDATE users
	SET "roleid"=2
	WHERE "email"='desoukya@gmail.com';

INSERT INTO users("firstname","lastname","email","password","roleid") VALUES ('1', '1', '1', '1', 2)

 