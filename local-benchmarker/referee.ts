import { ChildProcess, spawn } from "node:child_process"

export type MatchResult = {
  time: number;
  scores: number[];
  agentsLogs: string[];
  refereeLog: string;
}

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
      const result = this.parseResult(data.toString());
      console.log(result);
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

  parseResult(data: string): MatchResult | undefined {
    const tokens = data.trimEnd().split('\u001e');
    if ((tokens.length - 2) % 2 != 0) {
      return undefined;
    }
    else {
      return {
        time: Number(tokens[0]),
        scores: tokens.slice(1, tokens.length / 2).map(score => Number(score)),
        agentsLogs: tokens.slice(tokens.length / 2, -1),
        refereeLog: tokens[tokens.length - 1]
      }
    }
  }
}
