import { Injectable } from '@nestjs/common';
import { ConnectionOptions, TLSSocket, connect } from 'tls';
import { readFileSync } from 'fs';
import { stdin } from 'process';

@Injectable()
export class ConnectorService {
  private options: ConnectionOptions = {
    pfx: readFileSync(
      process.env.CERTS_DIR! + process.env.CLIENT_CERTIFICATE! + '.p12',
    ),
    ca: [
      readFileSync(
        process.env.CERTS_DIR! + process.env.SERVER_CERTIFICATE! + '.pem',
      ),
    ],
    checkServerIdentity: () => undefined,
  };

  getSocket(host: string, port: number): TLSSocket {
    const socket = connect(port, host, this.options, () => {
      console.log(
        'client connected',
        socket.authorized ? 'authorized' : 'unauthorized',
      );
      stdin.pipe(socket);
      stdin.resume();
    });
    socket.setEncoding('utf8');
    socket.on('data', (data) => {
      console.log(data);
    });
    socket.on('end', () => {
      console.log('server ends connection');
    });
    return socket;
  }
}
