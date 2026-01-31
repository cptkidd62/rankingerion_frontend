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
    timeout: 5000,
  };

  getSocket(host: string, port: number): TLSSocket {
    const socket = connect(port, host, this.options, () => {
      console.log(
        'client connected',
        socket.authorized ? 'authorized' : 'unauthorized',
      );
    });
    socket.on('data', (data) => {
      console.log('<< data:', JSON.stringify(data));
    });
    socket.on('error', (err) => {
      console.error('!! socket error:', err);
    });
    socket.on('close', (hadError) => {
      console.log('socket closed, error?', hadError);
    });
    socket.on('timeout', () => {
      console.log('socket timeout');
    });
    return socket;
  }
}
