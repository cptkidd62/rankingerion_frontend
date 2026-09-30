import { Server } from "./server";

const args = process.argv;
console.log(args);

const server = new Server();
server.start();
