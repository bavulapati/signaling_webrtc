import fs from 'fs';
import https from 'https';
import socketIo from 'socket.io';
// import { allowConnectionOnAuthentication } from './allowConnectionOnAuthentication';
import { closeDatabaseConnection, createDatabaseConnection } from './createDatabaseConnection';
import { logger } from './logger';
import { socketListeners } from './socketListeners';

const options: https.ServerOptions = {
  key: fs.readFileSync('/home/ec2-user/openSsl/key.pem'),
  cert: fs.readFileSync('/home/ec2-user/openSsl/cert.pem')
};

const server: https.Server = new https.Server(options);

const io: socketIo.Server = socketIo(server);
// tslint:disable-next-line: no-http-string
io.origins(['http://192.168.3.204:3000']);

const port: number = 8080;

// io.use(allowConnectionOnAuthentication);

server.listen(port, () => {
    logger.info(`Listening on port ${port}`);
    createDatabaseConnection();
});

io.on('connect', socketListeners.onSocketConnect);

function closeSocketServer(): void {
    closeDatabaseConnection();
    if (io !== undefined) {
        logger.info('closing socket server');
        io.close();
    }
}

process.on('SIGTERM', async () => {
    logger.info('SIGTERM signal received.');
    closeSocketServer();
    process.exit(0);
});
