import fs from 'fs';
import https from 'https';
// import http from 'http';
import socketIo from 'socket.io';
import { allowConnectionOnAuthentication } from './allowConnectionOnAuthentication';
import { closeDatabaseConnection, createDatabaseConnection } from './createDatabaseConnection';
import { logger } from './logger';
import { socketListeners } from './socketListeners';

const options: https.ServerOptions = {
  key: fs.readFileSync('/etc/letsencrypt/live/bmrsignal.idrivelite.com/privkey.pem'),
  cert: fs.readFileSync('/etc/letsencrypt/live/bmrsignal.idrivelite.com/fullchain.pem')
};
const server: https.Server = new https.Server(options);
const port: number = 443;
// const server: http.Server = new http.Server();
// const port: number = 8080;

const io: socketIo.Server = socketIo(server);

io.use(allowConnectionOnAuthentication);

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
