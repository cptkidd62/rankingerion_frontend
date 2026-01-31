import { Injectable } from '@nestjs/common';
import { ConnectorService } from '../connector/connector.service';
import { TLSSocket } from 'tls';
import { Agent } from '../models/agent';
import { OutputStream } from '../datastream/OutputStream';
import { InputStream } from '../datastream/InputStream';

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

  constructor(private connectorService: ConnectorService) {
    this.socket = connectorService.getSocket(
      process.env.BENCHMARKER_SERVER!,
      Number(process.env.BENCHMARKER_PORT_CLIENTS!),
    );
    this.outstream = new OutputStream(this.socket);
    this.instream = new InputStream();
    this.socket.on('data', (chunk: Buffer) => {
      this.instream.addToBuffer(chunk);
      const ans = this.instream.tryReadInt();
      console.log('ans code: ' + ans);
      switch (ans) {
        case ClientService.ANS_ACCEPTED: {
          const id = this.instream.tryReadInt();
          console.log('id: ' + id);
          break;
        }
        case ClientService.ANS_PLAY_RESULT: {
          const id = this.instream.tryReadInt();
          console.log('id: ' + id);
          const time = this.instream.tryReadLong();
          console.log('time: ' + time);
          const score = this.instream.tryReadInt();
          console.log('score: ' + score);
          const log = this.instream.tryReadNBytesString(
            this.instream.tryReadInt() ?? 0,
          );
          console.log('log: ' + log);
          const summaries = this.instream.tryReadNBytesString(
            this.instream.tryReadInt() ?? 0,
          );
          console.log('summaries: ' + summaries);
          break;
        }
        case ClientService.ANS_COMPILATION_ERROR: {
          const agent = this.instream.tryReadUTF();
          console.log('agent: ' + agent);
          const msg = this.instream.tryReadNBytesString(
            this.instream.tryReadInt() ?? 0,
          );
          console.log('msg: ' + msg);
          break;
        }
        case ClientService.ANS_PLAY_ERROR: {
          const id = this.instream.tryReadInt();
          console.log('id: ' + id);
          const msg = this.instream.tryReadUTF();
          console.log('msg: ' + msg);
          break;
        }
        case ClientService.ANS_REQUEST_SOURCE: {
          const sourceName = this.instream.tryReadUTF();
          console.log('sourceName: ' + sourceName);
          break;
        }
        case ClientService.ANS_GENERAL_ERROR: {
          const msg = this.instream.tryReadUTF();
          console.log('msg: ' + msg);
          break;
        }
        case ClientService.CMD_PING: {
          console.log('ping request');
          break;
        }
      }
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
  }

  sendPlayTask() {
    console.log('in sendPlayTask');
    const agent = new Agent('randomScore#r1.cpp');
    this.outstream.writeInt(ClientService.CMD_PLAY);
    this.outstream.writeInt(1);
    this.outstream.writeUTF(agent.toString());
    this.outstream.writeLong(BigInt(1));
    this.outstream.writeUTF('Sandbox');
    console.log('end sendPlayTask');
  }
}
