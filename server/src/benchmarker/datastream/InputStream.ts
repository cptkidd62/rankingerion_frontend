export class InputStream {
  private buffer: Buffer;
  constructor() {
    this.buffer = Buffer.alloc(0);
  }

  addToBuffer(chunk: Buffer) {
    this.buffer = Buffer.concat([this.buffer, chunk]);
  }

  tryReadInt(): number | null {
    if (this.buffer.length < 4) return null;
    const n = this.buffer.readInt32BE();
    this.buffer = this.buffer.subarray(4);
    return n;
  }

  tryReadLong(): bigint | null {
    if (this.buffer.length < 4) return null;
    const n = this.buffer.readBigInt64BE();
    this.buffer = this.buffer.subarray(8);
    return n;
  }

  tryReadNBytesString(bytes: number): string | null {
    if (this.buffer.length < bytes) return null;
    const s = String(this.buffer.subarray(0, bytes));
    this.buffer = this.buffer.subarray(bytes);
    return s;
  }

  tryReadUTF(): string | null {
    if (this.buffer.length < 2) return null;
    const len = this.buffer.readInt16BE();
    if (this.buffer.length < 2 + len) return null;
    const s = String(this.buffer.subarray(2, 2 + len));
    this.buffer = this.buffer.subarray(2 + len);
    return s;
  }
}
