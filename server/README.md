# RANKINGERION SERVER

## About
Nest.js based backend server for Rankingerion system. Handles saved data, ratings, matchmaking and communication with benchmarker server.

## Installation and usage
To run locally run `setup-server.sh` (make sure you generated certs for local Benchmarker first) and `run-server.sh` in this folder. After that you can access it on port 3000.
Requires properly set `.env` (at `server/.env`) file (example to copy ready to work with local Benchmarker available in `.env.example`) and values in `AppConfig` class (`server/src/config`).
The `usersFile` property in `AppConfig` should point to an existing json file with user data (example to copy and modify available in `example-users.json`).
