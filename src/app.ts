import http from 'http';
import socketIo from 'socket.io';
import { allowConnectionOnAuthentication } from './allowConnectionOnAuthentication';
import { closeDatabaseConnection, createDatabaseConnection } from './createDatabaseConnection';
import { logger } from './logger';
import { socketListeners } from './socketListeners';

const server: http.Server = new http.Server();

const io: socketIo.Server = socketIo(server);

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
