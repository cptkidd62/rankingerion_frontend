import { ChildProcess, spawn } from "node:child_process"
import { MatchResult } from "./referee";

export class CGReferee {
  private process: ChildProcess | undefined

  doMatch(playersCount: number, seed: bigint, agents: string[], agentsOpts: number[], logOpts: number): Promise<MatchResult> {
    return new Promise((resolve, reject) => {
      this.process = spawn("java", [
        "--add-opens=java.base/java.lang=ALL-UNNAMED",
        "-jar",
        "referee/target/referee.jar",
        "-p1",
        agents[0],
        "-p2",
        agents[1],
        "-seed",
        seed.toString(),
        "-l",
        "result.json",
      ]);

      let stdout = "";
      let stderr = "";

      this.process.stdout?.on("data", (chunk: Buffer) => {
        stdout += chunk.toString();
      });

      this.process.stderr?.on("data", (chunk: Buffer) => {
        stderr += chunk.toString();
      });

      this.process.on("error", reject);

      this.process.on("close", (code) => {
        if (code !== 0) {
          reject(new Error(`Referee exited with code ${code}\n${stderr}`));
          return;
        }

        const lines = stdout
          .split(/\r?\n/)
          .map(line => line.trim())
          .filter(line => line.length > 0)
          .filter(line => !line.startsWith("WARNING:"));

        resolve(this.parseResult(lines));

        console.log('do match');
      });
    })
  }

  private parseResult(data: string[]): MatchResult {
    return {
      time: BigInt(-1),
      scores: data.slice(0, data.length - 1).map(score => Number(score)),
      agentsLogs: [],
      refereeLog: ""
    }
  }
}