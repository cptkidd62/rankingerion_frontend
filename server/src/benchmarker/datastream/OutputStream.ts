import { Socket } from 'net';

export class OutputStream {
  constructor(private socket: Socket) {}

  writeUTF(str: string) {
    const l = Buffer.alloc(2);
    const c = Buffer.from(str, 'utf8');
    l.writeUInt16BE(c.length);
    this.socket.write(l);
    this.socket.write(c);
  }

  writeInt(v: number) {
    const b = Buffer.alloc(4);
    b.writeInt32BE(v);
    this.socket.write(b);
  }

  writeLong(v: bigint) {
    const b = Buffer.alloc(8);
    b.writeBigInt64BE(v);
    this.socket.write(b);
  }

  write(data: Buffer) {
    this.socket.write(data);
  }
}
