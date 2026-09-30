import * as fs from 'fs'
import * as tls from 'tls'
import { Socket } from './socket';

export class Server {
  private server: tls.Server | undefined;
  private options: tls.TlsOptions = {
    pfx: fs.readFileSync('certs/server.p12'),
    ca: fs.readFileSync('certs/ca.pem'),
    requestCert: true,
    rejectUnauthorized: true,
  };

  start() {
    this.server = tls.createServer(this.options, connection => {
      const socket = new Socket(connection);
    });
    this.server.listen(5555, () => console.log('opened TCP server on', this.server!.address()));
  }
}