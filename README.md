Cairo Metro System Project
This is a software engineering project that implements the Cairo metro system using the PERN stack (PostgreSQL, Express.js, React.js, Node.js). The project aims to provide a functional web application for managing and visualizing the Cairo metro system.

Table of Contents
Milestone 1
Connectors
Constraints
Middleware
Public Folder
Routes
Utils
Views
Files
Milestone 1
The Milestone 1 folder contains the following files:

EERD: Entity-Relationship Diagram representing the database structure.
Sequence Diagram: Diagram illustrating the sequence of interactions in the system using draw.io.
Use Case Diagram: PDF file displaying the use case diagram for the project.
Project Database: SQL script for creating the project's database using PostgreSQL.
Connectors
The Connectors folder includes the following files:

db.js: Connects the database with the JavaScript part of the project.
script.sql: SQL script containing the necessary queries for the project.
seed.sql: SQL script providing inputs for the tables to validate the process.
uploadstations.sql: SQL script to upload the stations for the user.
Constraints
The Constraints folder contains one file:

role.js: JavaScript file specifying the role numbers for adding users (1 for user, 2 for admin, 3 for senior).
Middleware
The Middleware folder contains one file:

auth.js: Provides authentication to the user through the session token.
Public Folder
The Public folder includes the following subfolders and files:

Images: Folder containing images used in the project frontend.
js: Folder containing jquery.js and main.js files.
lib: Folder (description missing).
scss: Folder (description missing).
styles: Folder (description missing).
Routes
The Routes folder contains two subfolders:

Private: Contains api.js and view.js files for private routes.
Public: Contains api.js and view.js files for public routes.
Utils
The Utils folder contains one file:

session.js: JavaScript file providing session management.
Views
The Views folder contains HJS files representing the frontend of the project. These files are used to create the frontend using HTML, CSS, and JavaScript to connect with the backend using AJAX.

Files
The root folder contains the following files:

.gitignore: File specifying which files and folders should be ignored by Git.
Milestone 2 and 3 PDF: PDF files for Milestone 2 and 3 (description missing).
server.js: Server-side JavaScript file for the project.
