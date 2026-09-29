import { ChildProcess, spawn } from "node:child_process"

export class Referee {
  private process: ChildProcess | undefined
  run() {
    this.process = spawn("java", [
      "-cp",
      "referee-test/target/classes",
      "benchmarkerion.WorkerProcess",
      "w",
    ]);

    this.process.stdout?.on("data", (data) => {
      console.log("JAVA STDOUT:", JSON.stringify(data.toString()));
    });

    this.process.stderr?.on("data", (data) => {
      console.log("JAVA STDERR:", JSON.stringify(data.toString()));
    });

    this.process.on("error", (error) => {
      console.error("JAVA PROCESS ERROR:", error);
    });

    this.process.on("exit", (code, signal) => {
      console.log("JAVA EXIT:", code, signal);
    });
  }

  doMatch(playersCount: number, seed: number, agents: string[], agentsOpts: number[], logOpts: number) {
    let message = "";
    message += playersCount + "|";
    message += seed + "|";
    for (let i = 0; i < playersCount; i++) {
      message += agents[i] + "|" + agentsOpts[i] + "|";
    }
    message += logOpts + "|\n";

    this.process?.stdin?.write(message, (error) => {
      if (error) {
        console.error("JAVA STDIN WRITE ERROR:", error);
      }
    });
  }
}
