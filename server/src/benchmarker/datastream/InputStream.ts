export class InputStream {
  private buffer: Buffer;
  private cursor = 0;
  constructor() {
    this.buffer = Buffer.alloc(0);
  }

  addToBuffer(chunk: Buffer) {
    this.buffer = Buffer.concat([this.buffer, chunk]);
    if (process.env.DEBUG_BUFFER == 'true') {
      console.log('&&& buffer after receiving:');
      console.log(this.buffer);
    }
  }

  resetCursor() {
    this.cursor = 0;
  }

  clearCursor() {
    this.buffer = this.buffer.subarray(this.cursor);
    if (process.env.DEBUG_BUFFER == 'true') {
      console.log('&&& buffer after parsing:');
      console.log(this.buffer);
    }
    this.resetCursor();
  }

  peekInt(): number | null {
    if (this.buffer.length - this.cursor < 4) return null;
    const n = this.buffer.subarray(this.cursor).readInt32BE();
    this.cursor += 4;
    return n;
  }

  peekLong(): bigint | null {
    if (this.buffer.length - this.cursor < 4) return null;
    const n = this.buffer.subarray(this.cursor).readBigInt64BE();
    this.cursor += 8;
    return n;
  }

  peekNBytesString(bytes: number): string | null {
    if (bytes == 0) return '';
    if (this.buffer.length - this.cursor < bytes) return null;
    const s = String(this.buffer.subarray(this.cursor, this.cursor + bytes));
    this.cursor += bytes;
    return s;
  }

  peekUTF(): string | null {
    if (this.buffer.length - this.cursor < 2) return null;
    const len = this.buffer.subarray(this.cursor).readInt16BE();
    if (this.buffer.length - this.cursor < 2 + len) return null;
    const s = String(
      this.buffer.subarray(this.cursor + 2, this.cursor + 2 + len),
    );
    this.cursor += 2 + len;
    return s;
  }
}
