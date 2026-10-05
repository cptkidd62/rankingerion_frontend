# RANKINGERION

## About
The goal of this system is to allow competitive tests of bots for bot contests like CodinGame. Its features include basic bot upload and management (adding, deleting, editing name), rating based matchmaking and ranking viewing.

## Architecture
- Frontend: Vue
- Backend: Nest.js
- Local Benchmarker: NodeJS (TypeScript) and Java

## Installation and usage
Project requires Node and npm to run locally. Details can be found in respective READMEs of `server`, `client` and `local-benchmarker`.

Project can be also run through `./run.sh`:
- `./run.sh setup` - does all the installation and configuration, has to be done at least once
- `./run.sh start <referee-count>` - starts all the components (benchmarker with a given number of concurrent referees), requires everything done in setup stage
- `./run.sh stop` - stops all the components

## Author
Project originally created as a part of masters thesis of Zuzanna Kania at University of Wrocław.
