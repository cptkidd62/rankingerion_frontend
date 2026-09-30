import { Referee } from "./referee"
import { Socket } from "./socket";
import { promises as fs } from "node:fs";

type Task = {
  players: number,
  agents: string[],
  seed: bigint,
  referee: string,
}

export class TaskManager {
  private referee = new Referee();
  private tasks: Array<Task> = [];
  private processedTask: Task | null = null;
  private taskId = 0;

  constructor(private readonly socket: Socket) {
    this.referee.run();
  }

  addTask(players: number, agents: string[], seed: bigint, referee: string) {
    this.tasks.push({ players, agents, seed, referee });
    console.log('tasks in queue:', this.tasks.length);
    this.processTask();
  }

  private async processTask() {
    if (this.processedTask != null) {
      return;
    }
    while (this.tasks.length > 0) {
      this.processedTask = this.tasks.pop()!;
      const files = await fs.readdir("bots/");
      this.processedTask.agents.forEach(async (agent) => {
        if (!files.includes(agent)) {
          await this.socket.getCode(agent);
        }
      })
      this.socket.sendTaskAccepted(this.taskId);
    }
  }
}