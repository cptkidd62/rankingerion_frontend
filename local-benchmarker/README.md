# LOCAL BENCHMARKER

## About
Lacal Benchmarker TLS server for local testing end development purposes. 

## Installation and usage
To run locally run `generate-certs.sh` (if not performed previously and no certs are present in `certs/` folder) and then run `run-local-benchmarker.sh <refereesCount>`. This will start a local Benchmarker TLS server at `0.0.0.0:5555`. `refereesCount` parameter is optional - it will start the server with the given number of concurrent referees. If not provided, it defaults to `1`.