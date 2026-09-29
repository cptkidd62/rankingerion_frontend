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

  doMatch() {
    const message =
      "2|321|./referee-test/test|1|./referee-test/test|1|1|\n";

    this.process?.stdin?.write(message, (error) => {
      if (error) {
        console.error("JAVA STDIN WRITE ERROR:", error);
      }
    });
  }
}
