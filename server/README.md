# RANKINGERION SERVER

## About
Nest.js based backend server for Rankingerion system. Handles saved data, ratings, matchmaking and communication with benchmarker server.

## Installation and usage
To run locally perform `npm install` and `npm run start` in this folder. After that you can access it on port 3000.
Requires properly set `.env` file (example to copy available in `.env.example`) and values in `AppConfig` class (`src/config`).
Connecting with Benchmarker server requires working certificates and correct connection data in `.env`.
