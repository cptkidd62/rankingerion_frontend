import { Injectable } from '@nestjs/common';
import { ConnectorService } from '../connector/connector.service';
import { TLSSocket } from 'tls';
import { OutputStream } from '../datastream/OutputStream';
import { InputStream } from '../datastream/InputStream';
import * as fs from 'fs';
import * as path from 'path';
import {
  BatchContainer,
  PlayTaskContainer,
  TaskContainer,
} from '../tasks/containers';
import { PlayTask } from '../tasks/playtask';
import { PlayResult } from '../tasks/playresult';
import { ok } from 'assert';

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

  private queuedCompilations: number = 0;
  private queuedPlays: number = 0;
  private awaitingPlays: number = 0;

  private sendingQueue: Array<Buffer> = [];
  private batches: Array<BatchContainer> = [];
  private sentTasks: Array<TaskContainer> = [];
  private acceptedPlayTasks: Map<number, PlayTaskContainer> = new Map();

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

  sendPlayTask(playTask: PlayTaskContainer) {
    const agents = playTask.getAgents();
    this.outstream.writeInt(ClientService.CMD_PLAY);
    this.outstream.writeInt(agents.length);
    agents.forEach((agent) => this.outstream.writeUTF(agent.toString()));
    this.outstream.writeLong(playTask.getSeed());
    this.outstream.writeUTF(playTask.getReferee());
    const buf = this.outstream.getBuffer();
    this.sendingQueue.push(buf);
    this.sentTasks.push(playTask);
    console.log('senttasks queue: ', this.sentTasks);
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
    const task = this.sentTasks.shift();
    if (task instanceof PlayTaskContainer) {
      this.acceptedPlayTasks.set(id, task);
      console.log(this.acceptedPlayTasks.get(id));
    }
  }

  enqueueBatch(batch: PlayTask[]) {
    const bc = new BatchContainer(batch);
    if (Boolean(process.env.RESULTS_IN_ORDER) == true) {
      this.batches.push(bc);
    }
    this.queuedPlays += batch.length;
    if (
      Boolean(process.env.ASSUME_DRAW_FOR_EQUAL_AGENTS) == true &&
      batch.length > 1
    ) {
      let allEqual = true;
      for (let i = 0; i < batch.length; i++) {
        let equal = true;
        for (let p = 1; p < batch[i].agents.length; p++) {
          if (!batch[i].agents[p].equals(batch[i].agents[0])) {
            equal = allEqual = false;
            break;
          }
        }
        if (equal) {
          this.queuedPlays--;
          this.awaitingPlays++;
          bc.playCount++;
          const equalScores: number[] = new Array<number>(
            batch[i].agents.length,
          );
          equalScores.fill(1);
          bc.results[i] = new PlayResult(BigInt(-1), equalScores, [], '');
        }
        this.enqueuePlay(new PlayTaskContainer(i, bc));
      }
      if (allEqual) {
        if (Boolean(process.env.RESULTS_IN_ORDER) == true) {
          this.reportCompleteResults();
        } else {
          this.reportBatchResults(bc);
        }
      }
    } else {
      for (let i = 0; i < batch.length; i++) {
        this.enqueuePlay(new PlayTaskContainer(i, bc));
      }
    }
  }

  enqueuePlay(playTask: PlayTaskContainer) {
    this.sendPlayTask(playTask);
  }

  reportBatchResults(bc: BatchContainer) {
    ok(bc.playCount != 0);
    if (bc.playCount > 0) {
      this.reportBatchCompleted(bc.batch, bc.results);
    } else {
      const index = -bc.playCount - 1;
      this.playBatchError(bc.batch, index, bc.results[index].summaries);
    }
  }

  reportCompleteResults() {
    // TODO do poprawy - nie mogę mieć takiej pętli chyba
    while (true) {
      if (this.batches.length == 0) return;
      const bc = this.batches[0];
      ok(bc.playCount >= 0);
      if (bc.playCount != bc.batch.length) return;
      this.batches.shift();
      this.reportBatchCompleted(bc.batch, bc.results);
    }
  }

  reportBatchCompleted(batch: PlayTask[], playResults: PlayResult[]) {
    this.awaitingPlays -= batch.length;
    this.playBatchCompleted(batch, playResults);
  }

  playBatchCompleted(batch: PlayTask[], playResults: PlayResult[]) {
    ok(batch.length == playResults.length);
    console.log('Batch results:');
    for (let i = 0; i < batch.length; i++) {
      console.log(
        'id: ',
        i,
        ', seed: ',
        batch[i].seed,
        ', score: ',
        playResults[i].scores[0],
      );
    }
    console.log('--------');
  }

  playBatchError(batch: PlayTask[], idx: number, errorMsg: string) {
    console.log('Batch error: ', errorMsg, ' | ', batch, ' at ', idx);
  }

  taskPlayed(playTask: PlayTaskContainer, playResults: PlayResult) {
    if (playTask.bc.playCount < 0) return;
    playTask.bc.results[playTask.index] = playResults;
    playTask.bc.playCount++;
    if (Boolean(process.env.RESULTS_IN_ORDER) == true) {
      this.reportCompleteResults();
    } else if (playTask.bc.playCount == playTask.bc.batch.length) {
      this.reportBatchResults(playTask.bc);
    }
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
        // TODO
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
        const playTask = this.acceptedPlayTasks.get(id);
        if (playTask) {
          this.acceptedPlayTasks.delete(id);
          // TODO
        }
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
        throw new Error(msg);
      }
      case ClientService.CMD_PING: {
        console.log('ping request');
        this.sendPong();
        break;
      }
      default: {
        throw new Error('Invalid ANS ' + ans);
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
