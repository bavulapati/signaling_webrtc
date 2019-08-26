import { ClientRequest, IncomingMessage } from 'http';
import { request, RequestOptions } from 'https';
import { stringify } from 'querystring';
import { xml2json } from 'xml-js';
import { BmrUserController } from './controllers/BmrUserController';
import { BmrUser } from './entity/BmrUser';
import { tokenResponseMessage } from './enums';
import { IConnectionQuery, IValidateTokenResponse } from './interfaces';
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
                        .replace('Content-Type: application/xml', '')
                        .trim()}`);
                    const tr: string = xml2json(body.toString()
                        .replace('Content-Type: application/xml; charset=ISO-8859-1', '')
                        .trim(),
                                                { ignoreDeclaration: true, spaces: 4, compact: true, ignoreText: true });
                    const tokenResponse: IValidateTokenResponse = <IValidateTokenResponse>JSON.parse(tr);
                    logger.info('is it success : ', tokenResponse.root.status._attributes.message);
                    if (tokenResponse.root.status._attributes.message === tokenResponseMessage.success) {
                        resolve(true);
                    } else {
                        reject(tokenResponse.root.status._attributes.desc);
                    }
                });
            });

            req.write(postData);
            req.end();

        });
}
