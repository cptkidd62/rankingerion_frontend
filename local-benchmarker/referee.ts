import { ChildProcess, spawn } from "node:child_process"

export type MatchResult = {
  time: bigint;
  scores: number[];
  agentsLogs: string[];
  refereeLog: string;
}

export class Referee {
  private process: ChildProcess | undefined
  private buffer = ""
  private matchesRequests = new Array<(matchResult: MatchResult) => void>();

  run() {
    this.process = spawn("java", [
      "-cp",
      "referee-test/target/classes",
      "benchmarkerion.WorkerProcess",
      "w",
    ]);

    this.process.stdout?.on("data", (data) => {
      console.log("JAVA STDOUT:", JSON.stringify(data.toString()));
      this.buffer += data.toString();
      let newlineIndex;
      while ((newlineIndex = this.buffer.indexOf("\n")) !== -1) {
        const line = this.buffer.slice(0, newlineIndex);
        this.buffer = this.buffer.slice(newlineIndex + 1);
        this.handleResponse(line);
      }
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

  doMatch(playersCount: number, seed: bigint, agents: string[], agentsOpts: number[], logOpts: number): Promise<MatchResult> {
    let message = "";
    message += playersCount + "|";
    message += seed + "|";
    for (let i = 0; i < playersCount; i++) {
      message += agents[i] + "|" + agentsOpts[i] + "|";
    }
    message += logOpts + "|\n";

    console.log('message', message);
    this.process?.stdin?.write(message, (error) => {
      if (error) {
        console.error("JAVA STDIN WRITE ERROR:", error);
      }
    });

    console.log('do match');

    return new Promise((resolve) => {
      this.matchesRequests.push(resolve);
    });
  }

  private handleResponse(line: string) {
    if (line.startsWith("runOnePlay exception for:")) {
      // play exception
      return;
    }
    if (line.startsWith("WorkerProcess exception:")) {
      // worker exception
      return;
    }
    const result = this.parseResult(line);
    console.log('response', line);
    const resolve = this.matchesRequests.pop();
    if (resolve && result) {
      resolve(result);
    }
  }

  private parseResult(data: string): MatchResult | undefined {
    const tokens = data.trimEnd().split('\u001e');
    if ((tokens.length - 2) % 2 != 0) {
      return undefined;
    }
    else {
      return {
        time: BigInt(tokens[0]),
        scores: tokens.slice(1, tokens.length / 2).map(score => Number(score)),
        agentsLogs: tokens.slice(tokens.length / 2, -1),
        refereeLog: tokens[tokens.length - 1]
      }
    }
  }
}
