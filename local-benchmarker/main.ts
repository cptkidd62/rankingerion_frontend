import { Server } from "./server";

const args = process.argv;
console.log(args);

const count = Number(args[2] ?? 1);

const server = new Server(count);
server.start();
