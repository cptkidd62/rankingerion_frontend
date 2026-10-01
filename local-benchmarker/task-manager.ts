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
    console.log({ players, agents, seed, referee });
    console.log('tasks in queue:', this.tasks.length);
    this.processTask();
  }

  private async processTask() {
    if (this.processedTask != null) {
      return;
    }

    try {
      while (this.tasks.length > 0) {
        this.processedTask = this.tasks.pop()!;

        const files = await fs.readdir("bots/");

        for (const agent of this.processedTask.agents) {
          if (!files.includes(agent)) {
            await this.socket.getCode(agent);
          }
        }

        this.socket.sendTaskAccepted(this.taskId);

        try {
          const result = await this.referee.doMatch(
            this.processedTask.players,
            this.processedTask.seed,
            this.processedTask.agents.map(
              agent => './bots/' + agent
            ),
            Array(this.processedTask.players).fill(1),
            1
          );

          console.log('result', result);

          this.socket.sendMatchResult(result, this.taskId++);
        } catch (err) {
          const message = err instanceof Error ? err.message : String(err);
          this.socket.sendPlayError(this.taskId++, message);
        }
      }
    } finally {
      this.processedTask = null;
    }
  }
}