import { Referee } from "./referee"

type Task = {
  players: number,
  agents: string[],
  seed: bigint,
  referee: string,
}

export class TaskManager {
  private referee = new Referee();
  private tasks: Array<Task> = [];

  constructor() {
    this.referee.run();
  }

  addTask(players: number, agents: string[], seed: bigint, referee: string) {
    this.tasks.push({ players, agents, seed, referee });
    console.log('tasks in queue:', this.tasks.length);
  }
}