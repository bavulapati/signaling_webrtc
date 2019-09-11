import { ClientRequest, IncomingMessage } from 'http';
import { request, RequestOptions } from 'https';
import { stringify } from 'querystring';
import { BmrUserController } from './controllers/BmrUserController';
import { BmrUser } from './entity/BmrUser';
import { tokenResponseMessage } from './enums';
import { IConnectionQuery } from './interfaces';
import { logger } from './logger';

export const allowConnectionOnAuthentication: (socket: SocketIO.Socket, next: (err?: Error) => void) => void
    = async (socket: SocketIO.Socket, next: (err?: Error) => void): Promise<void> => {

        const connectionQuery: IConnectionQuery = <IConnectionQuery>(socket.handshake.query);
        logger.info(`connectionQuery.accessToken: ${connectionQuery.accessToken} &
                        connectionQuery.userName: ${connectionQuery.userName} &
                        connectionQuery.isHost: ${connectionQuery.isHost}`);
        try {
            if (await isValidUser(connectionQuery) === true) {
                logger.info('Authentication succeeded.');
                const authenticatedUser: BmrUser = new BmrUser(connectionQuery.userName);
                try {
                    authenticatedUser.id = await BmrUserController.GET_INSTANCE()
                        .addUserIfNotPresent(authenticatedUser);
                    next();
                } catch (error) {
                    logger.error(`${error}`);
                    next(<Error>error);
                }
            } else {
                logger.error('Authentication failed.');
                next(new Error('You are not authorized to make connections.'));
            }
        } catch (error) {
            logger.error(`${error}`);
            next(<Error>error);
        }
    };

async function isValidUser(connectionQuery: IConnectionQuery): Promise<boolean> {
    return new Promise(
        (resolve: (value: boolean) => void,
         reject: (err: string) => void): void => {
            const postData: string = stringify({
                idrive_user: connectionQuery.userName,
                access_token: connectionQuery.accessToken
            });
            const options: RequestOptions = {
                method: 'POST',
                hostname: 'www1.idrive.com',
                path: '/cgi-bin/vault/cloudmanage/bmr_verify_token.cgi',
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded; charset=utf-8',
                    'Content-Length': Buffer.byteLength(postData)
                }
            };

            const req: ClientRequest = request(options, (res: IncomingMessage) => {
                const chunks: Buffer[] = [];

                res.on('data', (chunk: Buffer) => {
                    chunks.push(chunk);
                });

                res.on('end', () => {
                    const body: Buffer = Buffer.concat(chunks);
                    logger.info(`verify token response: ${body.toString()
                        .trim()}`);
                    if (body.toString()
                        .trim()
                        .includes(tokenResponseMessage.success) === true) {
                        resolve(true);
                    } else {
                        reject('unauthorized user');
                    }
                });
            });

            req.write(postData);
            req.end();

        });
}
