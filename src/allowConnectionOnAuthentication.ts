import { logger } from './logger';

export const allowConnectionOnAuthentication: (socket: SocketIO.Socket, next: (err?: Error) => void) => void
    = (socket: SocketIO.Socket, next: (err?: Error) => void): void => {
        const connectionQuery: IConnectionQuery = <IConnectionQuery>(socket.handshake.query);
        logger.info(connectionQuery.accessToken);
        if (connectionQuery.accessToken === 'valid') {
            logger.info('Authentication succeeded.');
            next();
        } else {
            logger.error('Authentication failed.');
            next(new Error('You are not authorized to make connections.'));
        }
    };

interface IConnectionQuery {
    accessToken: string;
}
