import { Injectable } from '@nestjs/common';
import { ConnectorService } from '../connector/connector.service';
import { TLSSocket } from 'tls';
import { Agent } from '../models/agent';
import { OutputStream } from '../datastream/OutputStream';
import { InputStream } from '../datastream/InputStream';
import * as fs from 'fs';
import * as path from 'path';

@Injectable()
export class ClientService {
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

  private socket: TLSSocket;
  private outstream: OutputStream;
  private instream: InputStream;

  private sendingQueue: Array<Buffer> = [];

  constructor(private connectorService: ConnectorService) {
    this.socket = connectorService.getSocket(
      process.env.BENCHMARKER_SERVER!,
      Number(process.env.BENCHMARKER_PORT_CLIENTS!),
    );
    this.outstream = new OutputStream();
    this.instream = new InputStream();
    this.socket.on('data', (chunk: Buffer) => {
      this.instream.addToBuffer(chunk);
      while (this.parseBuffer());
    });
    this.socket.on('error', (err) => {
      console.error('!! socket error:', err);
    });
    this.socket.on('close', (hadError) => {
      console.log('socket closed, error?', hadError);
    });
    this.socket.on('timeout', () => {
      console.log('socket timeout');
    });
    this.outstream.writeUTF('lenovo');
    this.outstream.writeUTF(''); // referee
    this.outstream.writeInt(10);
    const buf = this.outstream.getBuffer();
    this.sendingQueue.push(buf);
    this.trySend();
  }

  sendPlayTask() {
    const agent = new Agent('randomScore#r1.cpp');
    this.outstream.writeInt(ClientService.CMD_PLAY);
    this.outstream.writeInt(1);
    this.outstream.writeUTF(agent.toString());
    this.outstream.writeLong(BigInt(1));
    this.outstream.writeUTF('Sandbox');
    const buf = this.outstream.getBuffer();
    this.sendingQueue.push(buf);
    this.trySend();
  }

  sendSource(sourceName: string) {
    const botsDir = process.env.BOTS_DIR ?? './';
    const filePath = path.join(botsDir, sourceName);
    try {
      const code_buf = fs.readFileSync(filePath);
      this.outstream.writeInt(ClientService.CMD_SOURCE);
      this.outstream.writeUTF(sourceName);
      this.outstream.writeInt(code_buf.length);
      this.outstream.write(code_buf);
      const buf = this.outstream.getBuffer();
      this.sendingQueue.push(buf);
      this.trySend();
    } catch (err) {
      console.error(err);
    }
  }

  sendPong() {
    this.outstream.writeInt(ClientService.ANS_PONG);
    const buf = this.outstream.getBuffer();
    this.sendingQueue.push(buf);
    this.trySend();
  }

  acceptPlayTask(id: number) {
    console.log(id);
    // TODO
  }

  parseBuffer(): boolean {
    const ans = this.instream.peekInt();
    if (ans == null) {
      this.instream.resetCursor();
      return false;
    }
    console.log('ans code: ' + ans);
    switch (ans) {
      case ClientService.ANS_ACCEPTED: {
        const id = this.instream.peekInt();
        if (id == null) {
          this.instream.resetCursor();
          return false;
        }
        console.log('id: ' + id);
        this.acceptPlayTask(id);
        break;
      }
      case ClientService.ANS_PLAY_RESULT: {
        const id = this.instream.peekInt();
        if (id == null) {
          this.instream.resetCursor();
          return false;
        }
        console.log('id: ' + id);
        const time = this.instream.peekLong();
        if (time == null) {
          this.instream.resetCursor();
          return false;
        }
        console.log('time: ' + time);
        const score = this.instream.peekInt();
        if (score == null) {
          this.instream.resetCursor();
          return false;
        }
        console.log('score: ' + score);
        const log = this.instream.peekNBytesString(
          this.instream.peekInt() ?? 0,
        );
        if (log == null) {
          this.instream.resetCursor();
          return false;
        }
        console.log('log: ' + log);
        const summaries = this.instream.peekNBytesString(
          this.instream.peekInt() ?? 0,
        );
        if (summaries == null) {
          this.instream.resetCursor();
          return false;
        }
        console.log('summaries: ' + summaries);
        // TODO
        break;
      }
      case ClientService.ANS_COMPILATION_ERROR: {
        const agent = this.instream.peekUTF();
        if (agent == null) {
          this.instream.resetCursor();
          return false;
        }
        console.log('agent: ' + agent);
        const msg = this.instream.peekNBytesString(
          this.instream.peekInt() ?? 0,
        );
        if (msg == null) {
          this.instream.resetCursor();
          return false;
        }
        console.log('msg: ' + msg);
        break;
      }
      case ClientService.ANS_PLAY_ERROR: {
        const id = this.instream.peekInt();
        if (id == null) {
          this.instream.resetCursor();
          return false;
        }
        console.log('id: ' + id);
        const msg = this.instream.peekUTF();
        if (msg == null) {
          this.instream.resetCursor();
          return false;
        }
        console.log('msg: ' + msg);
        break;
      }
      case ClientService.ANS_REQUEST_SOURCE: {
        const sourceName = this.instream.peekUTF();
        if (sourceName == null) {
          this.instream.resetCursor();
          return false;
        }
        console.log('sourceName: ' + sourceName);
        this.sendSource(sourceName);
        break;
      }
      case ClientService.ANS_GENERAL_ERROR: {
        const msg = this.instream.peekUTF();
        if (msg == null) {
          this.instream.resetCursor();
          return false;
        }
        console.log('msg: ' + msg);
        break;
      }
      case ClientService.CMD_PING: {
        console.log('ping request');
        this.sendPong();
        break;
      }
    }
    this.instream.clearCursor();
    return true;
  }

  private trySend() {
    while (this.sendingQueue.length > 0) {
      const buf = this.sendingQueue[0];
      const ok = this.socket.write(buf);
      this.sendingQueue.shift();

      if (!ok) {
        this.socket.once('drain', () => this.trySend());
        return;
      }
    }
  }
}
