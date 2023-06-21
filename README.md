# Cairo Metro System Project

This is a software engineering project that implements the Cairo metro system using the PERN stack (PostgreSQL, Express.js, React.js, Node.js). The project aims to provide a functional web application for managing and visualizing the Cairo metro system.

## Table of Contents
- [Milestone 1](#milestone-1)
- [Connectors](#connectors)
- [Constraints](#constraints)
- [Middleware](#middleware)
- [Public Folder](#public-folder)
- [Routes](#routes)
- [Utils](#utils)
- [Views](#views)
- [Files](#files)

## Milestone 1
The Milestone 1 folder contains the following files:
- `EERD`: Entity-Relationship Diagram representing the database structure.
- `Sequence Diagram`: Diagram illustrating the sequence of interactions in the system using draw.io.
- `Use Case Diagram`: PDF file displaying the use case diagram for the project.
- `Project Database`: SQL script for creating the project's database using PostgreSQL.

## Connectors
The Connectors folder includes the following files:
- `db.js`: Connects the database with the JavaScript part of the project.
- `script.sql`: SQL script containing the necessary queries for the project.
- `seed.sql`: SQL script providing inputs for the tables to validate the process.
- `uploadstations.sql`: SQL script to upload the stations for the user.

## Constraints
The Constraints folder contains one file:
- `role.js`: JavaScript file specifying the role numbers for adding users (1 for user, 2 for admin, 3 for senior).

## Middleware
The Middleware folder contains one file:
- `auth.js`: Provides authentication to the user through the session token.

## Public Folder
The Public folder includes the following subfolders and files:
- `Images`: Folder containing images used in the project frontend.
- `js`: Folder containing `jquery.js` and `main.js` files.
- `lib`: Folder (description missing).
- `scss`: Folder (description missing).
- `styles`: Folder (description missing).

## Routes
The Routes folder contains two subfolders:
- `Private`: Contains `api.js` and `view.js` files for private routes.
- `Public`: Contains `api.js` and `view.js` files for public routes.

## Utils
The Utils folder contains one file:
- `session.js`: JavaScript file providing session management.

## Views
The Views folder contains HJS files representing the frontend of the project. These files are used to create the frontend using HTML, CSS, and JavaScript to connect with the backend using AJAX.

## Files
The root folder contains the following files:
- `.gitignore`: File specifying which files and folders should be ignored by Git.
- `Milestone 2 and 3 PDF`: PDF files for Milestone 2 and 3 (description missing).
- `server.js`: Server-side JavaScript file for the project.

## Additional Information

### User Authentication and Authorization
The system implements user authentication and authorization using an email/password strategy. Users can register with their email and password, and then login to the system using the same combination. Additionally, the system provides a password reset functionality for users who need to reset their password.

### Ticket Subscriptions
Users have the ability to purchase ticket subscriptions for different durations (monthly, quarterly, or annual) and for one-to-many zones. They can view their active ticket subscriptions and upcoming rides associated with those subscriptions. Users can also view their completed rides for reference.

### Refund Requests
If a user wants to request a refund for a future-dated ticket, they have the option to do so in the system. The admin can then review and approve or reject the refund requests accordingly.

### Trip Pricing and Route Information
To assist users in planning their trips, the system allows them to check the pricing of a trip by specifying the origin and destination points. The system provides autocomplete functionality to make it easier for users to select the desired stations. When purchasing a ticket, the system displays the full ticket price, route information, and transfer stations.

### Senior Requests and Discounts
Users who are eligible for senior discounts can request the "Senior" role in the system by uploading their ID image. The admin can then review and approve or reject the senior requests. Once approved, users with the "Senior" role can benefit from ticket discounts.

### Admin Functionality
The system includes specific functionality for admin users. Admins have the authority to create, update, and delete stations and routes. They can also approve or reject refund requests submitted by users and manage senior requests. Additionally, admins have the ability to update the pricing schedule for all routes.

### Ride Simulation and Payment
Users can simulate starting a ride within the system. This functionality allows users to test the system's behavior and ensure a smooth user experience. Furthermore, users can make online payments for tickets or subscriptions, providing a convenient and seamless payment process.

### One Ride Ticket
In situations where users do not have an active subscription, they have the option to purchase a one-ride ticket. This ticket allows them to complete a single journey without a subscription plan.

Please update the ReadMe with this additional information to provide a comprehensive overview of the Cairo Metro System Project.
