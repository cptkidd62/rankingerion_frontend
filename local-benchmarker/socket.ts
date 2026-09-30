import { TLSSocket } from "node:tls";
import { InputStream } from "./datastream/InputStream";
import { OutputStream } from "./datastream/OutputStream";

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

  constructor(private readonly socket: TLSSocket) {
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
      return true;
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

  private setContact() {
    this.lastContactTime = Date.now();
  }
}