import * as fs from 'fs'
import * as tls from 'tls'

export class Server {
  private server: tls.Server | undefined;
  private options: tls.TlsOptions | undefined;

  constructor() {
    this.options = {
      cert: fs.readFileSync('certs/server.crt'),
      key: fs.readFileSync('certs/server.key'),
      // ca: [fs.readFileSync('certs/public2crt'), fs.readFileSync('certs/public.crt')],
      ca: fs.readFileSync('certs/public.crt'),
    }
  }

  start() {
    this.server = tls.createServer(this.options!, socket => {
      socket.on('data', data => {
        this.handleData(data.toString());
      })
    });
    this.server.listen(5555, () => console.log('opened TCP server on', this.server!.address()));
  }

  private handleData(data: string) {
    console.log('tls received:', data);
  }
}