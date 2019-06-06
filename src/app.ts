import http from 'http';
import socketIo from 'socket.io';
import { logger } from './logger';
import { socketListeners } from './socketListeners';

const server: http.Server = new http.Server();
const io: socketIo.Server = socketIo(server);

server.listen(process.env.npm_package_config_port, () => {
    logger.info(`Listening on port ${process.env.npm_package_config_port}`);
});

io.on('connect', socketListeners.onSocketConnect);

process.on('SIGTERM', async () => {
    logger.info('SIGTERM signal received.');
    closeSocketServer();
    process.exit(0);
});

function closeSocketServer(): void {
    if (io !== undefined) {
        logger.info('closing socket server');
        io.close();
    }
}
