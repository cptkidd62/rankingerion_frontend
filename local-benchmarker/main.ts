import { Referee } from "./referee";

const args = process.argv;
console.log(args);

const referee = new Referee();

referee.run();
referee.doMatch();
