import { TLSSocket } from "node:tls";
import { promises as fs } from 'fs';
import { InputStream } from "./datastream/InputStream";
import { OutputStream } from "./datastream/OutputStream";
import { TaskManager } from "./task-manager";
import { MatchResult } from "./referee";

export class Socket {
  static CMD_PLAY = 1;
  static CMD_COMPILE = 2;
  static CMD_SOURCE = 3;
  static CMD_CANCEL = 4;
  static CMD_PRIORITY = 5;
  static CMD_PING = 7;
  static CMD_SETTINGS = 8;
  static ANS_REQUEST_SOURCE = 10;
  static ANS_COMPILED = 11;
  static ANS_COMPILATION_ERROR = 12;
  static ANS_ACCEPTED = 13;
  static ANS_PLAY_RESULT = 14;
  static ANS_PLAY_ERROR = 15;
  static ANS_PLAY_CANCELLED = 16;
  static ANS_WARNING = 17;
  static ANS_GENERAL_ERROR = 18;
  static ANS_PONG = 19;

  private outstream: OutputStream = new OutputStream();
  private instream: InputStream = new InputStream();
  private sendingQueue: Array<Buffer> = [];
  private registered = false;

  // ping
  private lastContactTime: number = 0;
  private intervalId: NodeJS.Timeout | undefined;

  // tasks
  private taskManager = new TaskManager(0,this);
  private sourceRequests = new Map<string, () => void>();

  constructor(count: number, private readonly socket: TLSSocket) {
    this.taskManager = new TaskManager(count,this);
    socket.on('data', (chunk: Buffer) => {
      this.instream.addToBuffer(chunk);
      while (this.parseBuffer());
    });
  }

  private parseBuffer(): boolean {
    // registration
    if (!this.registered) {
      const hostname = this.instream.peekUTF();
      if (hostname == null) {
        this.instream.resetCursor();
        return false;
      }
      const referee = this.instream.peekUTF();
      if (referee == null) {
        this.instream.resetCursor();
        return false;
      }
      const priority = this.instream.peekInt();
      if (priority == null) {
        this.instream.resetCursor();
        return false;
      }
      this.instream.clearCursor();
      this.registered = true;
      console.log(hostname + " registered");
      this.setContact();
      this.intervalId = setInterval(() => {
        if (Date.now() - this.lastContactTime > 60_000) {
          this.sendPing();
        }
      }, 30_000);
    }
    const cmd = this.instream.peekInt();
    if (cmd == null) {
      this.instream.resetCursor();
      return false;
    }
    console.log('cmd:', cmd);
    switch (cmd) {
      case Socket.ANS_PONG: {
        console.log("pong");
        this.setContact();
        break;
      }
      case Socket.CMD_PLAY: {
        const n = this.instream.peekInt();
        if (n == null) {
          this.instream.resetCursor();
          return false;
        }
        const agents: string[] = [];
        for (let i = 0; i < n; i++) {
          const agent = this.instream.peekUTF();
          if (agent == null) {
            this.instream.resetCursor();
            return false;
          }
          agents.push(agent);
        }
        const seed = this.instream.peekLong();
        if (seed == null) {
          this.instream.resetCursor();
          return false;
        }
        const referee = this.instream.peekUTF();
        if (referee == null) {
          this.instream.resetCursor();
          return false;
        }
        this.taskManager.addTask(n, agents, seed, referee);
        break;
      }
      case Socket.CMD_SOURCE: {
        const sourceName = this.instream.peekUTF();
        if (sourceName == null) {
          this.instream.resetCursor();
          return false;
        }
        const n = this.instream.peekInt();
        if (n == null) {
          this.instream.resetCursor();
          return false;
        }
        const code = this.instream.peekNBytes(n);
        if (code == null) {
          this.instream.resetCursor();
          return false;
        }
        this.processCode(sourceName, code);
        break;
      }
    }
    this.instream.clearCursor();
    return true;
  }

  private trySend() {
    while (this.sendingQueue.length > 0) {
      const buf = this.sendingQueue[0];
      const ok = this.socket!.write(buf);
      this.sendingQueue.shift();

      if (!ok) {
        this.socket!.once('drain', () => this.trySend());
        return;
      }
    }
  }

  private sendPing() {
    this.outstream.writeInt(Socket.CMD_PING);
    const buf = this.outstream.getBuffer();
    this.sendingQueue.push(buf);
    this.trySend();
  }

  private requestSource(sourceName: string) {
    this.outstream.writeInt(Socket.ANS_REQUEST_SOURCE);
    this.outstream.writeUTF(sourceName);
    const buf = this.outstream.getBuffer();
    this.sendingQueue.push(buf);
    this.trySend();
  }

  private setContact() {
    this.lastContactTime = Date.now();
  }

  getCode(sourceName: string): Promise<void> {
    return new Promise<void>((resolve) => {
      this.sourceRequests.set(sourceName, resolve);
      this.requestSource(sourceName);
    });
  }

  private async processCode(sourceName: string, code: Buffer<ArrayBufferLike>) {
    await this.saveCodeToFile(sourceName, code);

    const resolve = this.sourceRequests.get(sourceName);

    if (resolve) {
      resolve();
      this.sourceRequests.delete(sourceName);
    }
  }

  private async saveCodeToFile(sourceName: string, code: Buffer<ArrayBufferLike>) {
    await fs.writeFile('bots/' + sourceName, code);
    await fs.chmod('bots/' + sourceName, 0o755);
  }

  sendTaskAccepted(id: number) {
    console.log('accept');
    this.outstream.writeInt(Socket.ANS_ACCEPTED);
    this.outstream.writeInt(id);
    const buf = this.outstream.getBuffer();
    this.sendingQueue.push(buf);
    this.trySend();
  }

  sendMatchResult(result: MatchResult, id: number) {
    this.outstream.writeInt(Socket.ANS_PLAY_RESULT);
    this.outstream.writeInt(id);
    this.outstream.writeLong(result.time);
    result.scores.forEach((score) => {
      this.outstream.writeInt(score);
    })
    result.agentsLogs.forEach((log) => {
      this.outstream.writeInt(log.length);
      this.outstream.write(Buffer.from(log));
    })
    this.outstream.writeInt(result.refereeLog.length);
    this.outstream.write(Buffer.from(result.refereeLog));
    const buf = this.outstream.getBuffer();
    this.sendingQueue.push(buf);
    this.trySend();
  }

  sendCompilationError(agent: string) {
    this.outstream.writeInt(Socket.ANS_COMPILATION_ERROR);
    this.outstream.writeUTF(agent);
    const buf = this.outstream.getBuffer();
    this.sendingQueue.push(buf);
    this.trySend();
  }

  sendPlayError(id: number, msg: string) {
    this.outstream.writeInt(Socket.ANS_PLAY_ERROR);
    this.outstream.writeInt(id);
    this.outstream.writeUTF(msg);
    const buf = this.outstream.getBuffer();
    this.sendingQueue.push(buf);
    this.trySend();
  }
}