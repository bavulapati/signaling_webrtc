import { BmrUserController } from './controllers/BmrUserController';
import { BmrUser } from './entity/BmrUser';
import { logger } from './logger';

export const allowConnectionOnAuthentication: (socket: SocketIO.Socket, next: (err?: Error) => void) => void
    = async (socket: SocketIO.Socket, next: (err?: Error) => void): Promise<void> => {

        const connectionQuery: IConnectionQuery = <IConnectionQuery>(socket.handshake.query);
        logger.info(connectionQuery.accessToken);
        if (connectionQuery.accessToken === 'lifetime_host_access_token') {
            logger.info('Authentication succeeded.');
            const authenticatedUser: BmrUser = new BmrUser(connectionQuery.userName);
            try {
                authenticatedUser.id = await BmrUserController.GET_INSTANCE()
                    .addUserIfNotPresent(authenticatedUser);
            } catch (error) {
                logger.error(<Error>error);
                next(<Error>error);
            }
            next();
        } else {
            logger.error('Authentication failed.');
            next(new Error('You are not authorized to make connections.'));
        }
    };

interface IConnectionQuery {
    accessToken: string;
    userName: string;
}
