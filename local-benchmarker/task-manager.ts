import { RefereePool } from "./referee-pool";
import { Socket } from "./socket";
import { promises as fs } from "node:fs";

type Task = {
  id: number;
  players: number,
  agents: string[],
  seed: bigint,
  referee: string,
}

export class TaskManager {
  private refereePool = new RefereePool(0);
  private tasks: Array<Task> = [];
  private taskId = 0;

  constructor(count: number, private readonly socket: Socket) {
    this.refereePool = new RefereePool(count);
  }

  addTask(players: number, agents: string[], seed: bigint, referee: string) {
    this.tasks.push({ id: this.taskId++, players, agents, seed, referee });
    console.log({ players, agents, seed, referee });
    console.log('tasks in queue:', this.tasks.length);
    this.processTasks();
  }

  private async processTasks() {
    while (this.tasks.length > 0) {
      const processedTask = this.tasks.shift()!;
      this.processSingleTask(processedTask);
    }
  }

  private async processSingleTask(task: Task) {
    const files = await fs.readdir("bots/");

    for (const agent of task.agents) {
      if (!files.includes(agent)) {
        await this.socket.getCode(agent);
      }
    }

    this.socket.sendTaskAccepted(task.id);

    try {
      const result = await this.refereePool.doMatch(
        task.players,
        task.seed,
        task.agents.map(
          agent => './bots/' + agent
        ),
        Array(task.players).fill(1),
        1
      );

      console.log('result', result);

      this.socket.sendMatchResult(result, task.id);
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      this.socket.sendPlayError(task.id, message);
    }
  }
}