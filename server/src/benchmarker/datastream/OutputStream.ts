export class OutputStream {
  private buffer: Buffer;
  constructor() {
    this.buffer = Buffer.alloc(0);
  }

  writeUTF(str: string) {
    const l = Buffer.alloc(2);
    const c = Buffer.from(str, 'utf8');
    l.writeUInt16BE(c.length);
    this.buffer = Buffer.concat([this.buffer, l]);
    this.buffer = Buffer.concat([this.buffer, c]);
  }

  writeInt(v: number) {
    const b = Buffer.alloc(4);
    b.writeInt32BE(v);
    this.buffer = Buffer.concat([this.buffer, b]);
  }

  writeLong(v: bigint) {
    const b = Buffer.alloc(8);
    b.writeBigInt64BE(v);
    this.buffer = Buffer.concat([this.buffer, b]);
  }

  write(data: Buffer) {
    this.buffer = Buffer.concat([this.buffer, data]);
  }

  getBuffer(): Buffer {
    const buf = this.buffer;
    this.buffer = Buffer.alloc(0);
    return buf;
  }
}
