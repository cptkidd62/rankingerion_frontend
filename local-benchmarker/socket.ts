import { TLSSocket } from "node:tls";
import { InputStream } from "./datastream/InputStream";
import { OutputStream } from "./datastream/OutputStream";

export class Socket {
  private outstream: OutputStream = new OutputStream();
  private instream: InputStream = new InputStream();
  private registered = false;

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
      this.registered = true;
      console.log(hostname + " registered");
      return true;
    }
    return false;
  }
}