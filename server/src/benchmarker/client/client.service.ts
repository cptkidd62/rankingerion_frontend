import { Injectable } from '@nestjs/common';
import { ConnectorService } from '../connector/connector.service';
import { TLSSocket } from 'tls';
import { OutputStream } from '../datastream/OutputStream';
import { InputStream } from '../datastream/InputStream';
import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';
import {
  BatchContainer,
  CompileContainer,
  PlayTaskContainer,
  TaskContainer,
} from '../tasks/containers';
import { PlayTask } from '../tasks/playtask';
import { PlayResult } from '../tasks/playresult';
import { ok } from 'assert';
import { Agent } from '../models/agent';
import { AppConfigService } from '@/config/appconfig.service';
import { EventEmitter2 } from '@nestjs/event-emitter';

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

  private socket: TLSSocket | undefined;
  private outstream: OutputStream = new OutputStream();
  private instream: InputStream = new InputStream();

  private sendingQueue: Array<Buffer> = [];
  private batches: Array<BatchContainer> = [];
  private sentTasks: Array<TaskContainer> = [];
  private acceptedPlayTasks: Map<number, PlayTaskContainer> = new Map();

  isConnected: boolean = false;
  isReconnecting: boolean = false;
  disconnectHandled: boolean = false;
  private intervalID: NodeJS.Timeout | undefined;

  constructor(
    private connectorService: ConnectorService,
    private readonly appConfig: AppConfigService,
    private readonly eventEmiter: EventEmitter2
  ) {
    if (appConfig.config.useBenchmarker) {
      this.isConnected = false;
      this.isReconnecting = false;
      this.disconnectHandled = false;
      this.outstream = new OutputStream();
      this.instream = new InputStream();
      this.reconnect();
    }
  }

  private reconnect() {
    if (this.isReconnecting || this.isConnected) return;
    this.isReconnecting = true;
    clearInterval(this.intervalID);
    this.intervalID = setInterval(() => {
      this.connect();
    }, 10000);
  }

  private connect() {
    if (this.isConnected) return;
    this.socket = this.connectorService.getSocket(
      process.env.BENCHMARKER_SERVER!,
      Number(process.env.BENCHMARKER_PORT_CLIENTS!),
    );
    this.socket.on('data', (chunk: Buffer) => {
      this.instream.addToBuffer(chunk);
      while (this.parseBuffer());
    });
    this.socket.on('connect', () => {
      debugLog(1, 'client connected', this.socket!.authorized ? 'authorized' : 'unauthorized');
      this.isConnected = true;
      this.isReconnecting = false;
      this.disconnectHandled = false;
      clearInterval(this.intervalID);
      this.register();
      this.eventEmiter.emit('client_connected');
    });
    this.socket.on('error', (err) => {
      debugError(1, '!! socket error:', err);
      this.handleDisconnecting();
    });
    this.socket.on('close', (err) => {
      debugLog(1, 'socket closed, error?', err);
      this.handleDisconnecting();
    });
    this.socket.on('timeout', () => {
      debugLog(1, 'socket timeout');
      this.socket!.destroy();
      this.handleDisconnecting();
    });
  }

  private register() {
    this.outstream.writeUTF(os.hostname());
    this.outstream.writeUTF(''); // referee
    this.outstream.writeInt(10);
    const buf = this.outstream.getBuffer();
    this.sendingQueue.push(buf);
    this.trySend();
  }

  private handleDisconnecting() {
    if (this.disconnectHandled) return;
    this.disconnectHandled = true;
    this.isConnected = false;
    this.batches.forEach((batch) => batch.fail('connectionError'));
    this.batches = [];
    this.sentTasks = [];
    this.acceptedPlayTasks.clear();
    this.reconnect();
  }

  private sendCompileTask(compileTask: CompileContainer) {
    this.outstream.writeInt(ClientService.CMD_COMPILE);
    this.outstream.writeUTF(compileTask.agent.toString());
    this.outstream.writeUTF(compileTask.referee);
    this.outstream.writeInt(compileTask.expectedPlays);
    const buf = this.outstream.getBuffer();
    this.sendingQueue.push(buf);
    this.sentTasks.push(compileTask);
    debugLog(3, 'senttasks queue: ', this.sentTasks);
    this.trySend();
  }

  private sendPlayTask(playTask: PlayTaskContainer) {
    const agents = playTask.getAgents();
    this.outstream.writeInt(ClientService.CMD_PLAY);
    this.outstream.writeInt(agents.length);
    agents.forEach((agent) => this.outstream.writeUTF(agent.toString()));
    this.outstream.writeLong(playTask.getSeed());
    this.outstream.writeUTF(playTask.getReferee());
    const buf = this.outstream.getBuffer();
    this.sendingQueue.push(buf);
    this.sentTasks.push(playTask);
    debugLog(3, 'senttasks queue: ', this.sentTasks);
    this.trySend();
  }

  private sendSource(sourceName: string) {
    const botsDir = this.appConfig.config.botsDir;
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
      debugError(1, err);
    }
  }

  private sendPong() {
    this.outstream.writeInt(ClientService.ANS_PONG);
    const buf = this.outstream.getBuffer();
    this.sendingQueue.push(buf);
    this.trySend();
  }

  private acceptPlayTask(id: number) {
    debugLog(3, id);
    const task = this.sentTasks.shift();
    debugLog(3, 'senttasks queue: ', this.sentTasks);
    if (task instanceof PlayTaskContainer) {
      this.acceptedPlayTasks.set(id, task);
      debugLog(3, this.acceptedPlayTasks.get(id));
      debugLog(3, this.acceptedPlayTasks);
    }
  }

  enqueueBatch(batch: PlayTask[]): Promise<PlayResult[]> {
    const bc = new BatchContainer(batch);
    if (Boolean(process.env.RESULTS_IN_ORDER) == true) {
      this.batches.push(bc);
    }
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
          bc.playCount++;
          const equalScores: number[] = new Array<number>(
            batch[i].agents.length,
          );
          equalScores.fill(1);
          bc.results[i] = new PlayResult(BigInt(-1), equalScores, [], '');
        } else {
          this.enqueuePlay(new PlayTaskContainer(i, bc));
        }
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
    return bc.promise;
  }

  private enqueuePlay(playTask: PlayTaskContainer) {
    this.sendPlayTask(playTask);
  }

  private reportBatchResults(bc: BatchContainer) {
    ok(bc.playCount != 0);
    if (bc.playCount > 0) {
      bc.complete();
    } else {
      const index = -bc.playCount - 1;
      bc.fail(bc.results[index].summaries);
    }
  }

  private reportCompleteResults() {
    while (true) {
      if (this.batches.length == 0) return;
      const bc = this.batches[0];
      ok(bc.playCount >= 0);
      if (bc.playCount != bc.batch.length) return;
      this.batches.shift();
      bc.complete();
    }
  }

  private compilationError(agent: Agent, errorMsg: string) {
    debugLog(
      1,
      'Compilation error on agent: ' +
      agent.toString() +
      ' with msg: ' +
      errorMsg,
    );
  }

  private taskPlayed(playTask: PlayTaskContainer, playResults: PlayResult) {
    if (playTask.bc.playCount < 0) return;
    playTask.bc.results[playTask.index] = playResults;
    playTask.bc.playCount++;
    if (Boolean(process.env.RESULTS_IN_ORDER) == true) {
      this.reportCompleteResults();
    } else if (playTask.bc.playCount == playTask.bc.batch.length) {
      this.reportBatchResults(playTask.bc);
    }
  }

  private taskError(playTask: PlayTaskContainer, errorMsg: string) {
    if (playTask.bc.playCount < 0) return;
    playTask.bc.playCount = -playTask.index - 1;
    playTask.bc.results[playTask.index] = PlayResult.Error(errorMsg);
    const i = this.batches.indexOf(playTask.bc);
    if (i > -1) {
      const batch = this.batches.splice(i, 1);
      batch[0].fail(errorMsg);
    }
  }

  private parseBuffer(): boolean {
    const ans = this.instream.peekInt();
    if (ans == null) {
      this.instream.resetCursor();
      return false;
    }
    debugLog(3, 'ans code:', ans);
    switch (ans) {
      case ClientService.ANS_COMPILED: {
        debugLog(2, 'compiled');
        this.acceptPlayTask(-1);
        break;
      }
      case ClientService.ANS_ACCEPTED: {
        const id = this.instream.peekInt();
        if (id == null) {
          this.instream.resetCursor();
          return false;
        }
        debugLog(2, 'id:', id);
        this.acceptPlayTask(id);
        break;
      }
      case ClientService.ANS_PLAY_RESULT: {
        const id = this.instream.peekInt();
        if (id == null) {
          this.instream.resetCursor();
          return false;
        }
        const playTask = this.acceptedPlayTasks.get(id);
        debugLog(3, 'Playtask with id: ', id, playTask);
        if (!playTask) throw Error('No playtask found with id ' + id);
        this.acceptedPlayTasks.delete(id);
        const time = this.instream.peekLong();
        if (time == null) {
          this.instream.resetCursor();
          return false;
        }
        const scores: number[] = [];
        for (let i = 0; i < playTask.getAgents().length; i++) {
          const s = this.instream.peekInt();
          if (s == null) {
            this.instream.resetCursor();
            return false;
          }
          scores[i] = s;
        }
        debugLog(3, 'scores:', scores);
        const logs: string[] = [];
        for (let i = 0; i < playTask.getAgents().length; i++) {
          const log = this.instream.peekNBytesString(
            this.instream.peekInt() ?? 0,
          );
          if (log == null) {
            this.instream.resetCursor();
            return false;
          }
          logs[i] = log;
        }
        debugLog(3, 'logs:', logs);
        const summaries = this.instream.peekNBytesString(
          this.instream.peekInt() ?? 0,
        );
        if (summaries == null) {
          this.instream.resetCursor();
          return false;
        }
        debugLog(3, 'summaries:', summaries);
        const result = new PlayResult(time, scores, logs, summaries);
        this.taskPlayed(playTask, result);
        break;
      }
      case ClientService.ANS_COMPILATION_ERROR: {
        const agent = this.instream.peekUTF();
        if (agent == null) {
          this.instream.resetCursor();
          return false;
        }
        const msg = this.instream.peekNBytesString(
          this.instream.peekInt() ?? 0,
        );
        if (msg == null) {
          this.instream.resetCursor();
          return false;
        }
        this.compilationError(new Agent(agent), msg);
        break;
      }
      case ClientService.ANS_PLAY_ERROR: {
        const id = this.instream.peekInt();
        if (id == null) {
          this.instream.resetCursor();
          return false;
        }
        const msg = this.instream.peekUTF();
        if (msg == null) {
          this.instream.resetCursor();
          return false;
        }
        const playTask = this.acceptedPlayTasks.get(id);
        if (playTask) {
          this.acceptedPlayTasks.delete(id);
          this.taskError(playTask, msg);
        }
        break;
      }
      case ClientService.ANS_REQUEST_SOURCE: {
        const sourceName = this.instream.peekUTF();
        if (sourceName == null) {
          this.instream.resetCursor();
          return false;
        }
        debugLog(3, 'sourceName: ' + sourceName);
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
        debugLog(3, 'ping request');
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
      const ok = this.socket!.write(buf);
      this.sendingQueue.shift();

      if (!ok) {
        this.socket!.once('drain', () => this.trySend());
        return;
      }
    }
  }
}

function debugLog(level: number, ...args: unknown[]) {
  if (Number(process.env.DEBUG_LEVEL!) >= level) {
    console.log(...args);
  }
}

function debugError(level: number, ...args: unknown[]) {
  if (Number(process.env.DEBUG_LEVEL!) >= level) {
    console.error(...args);
  }
}
