import { Referee } from "./referee";
import { Server } from "./server";

const args = process.argv;
console.log(args);

const referee = new Referee();

referee.run();
referee.doMatch(2, 144, ["./referee-test/test", "./referee-test/test"], [1, 1], 1);

const server = new Server();
server.start();
