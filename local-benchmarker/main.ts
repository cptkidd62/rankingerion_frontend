import { Server } from "./server";

const args = process.argv;
console.log(args);

const count = Number(args[2]);

const refereeCount = Number.isInteger(count) && count > 0 ? count : 1;

const server = new Server(refereeCount);
server.start();
