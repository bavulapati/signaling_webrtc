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
            authenticatedUser.id = await BmrUserController.addUserIfNotPresent(authenticatedUser);
            logger.info(`authenticated user id : ${authenticatedUser.id}`);
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
