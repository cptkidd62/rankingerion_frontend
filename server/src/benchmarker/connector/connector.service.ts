import { Injectable } from '@nestjs/common';
import { ConnectionOptions, TLSSocket, connect } from 'tls';
import { readFileSync } from 'fs';

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
    });
    return socket;
  }
}
