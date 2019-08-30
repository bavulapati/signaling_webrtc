import socketIo from 'socket.io';
import { socketMessages } from './constants/socketMessages';
import { BmrServerController } from './controllers/BmrServerController';
import { BmrUserController } from './controllers/BmrUserController';
import { BmrServer } from './entity/BmrServer';
import { BmrUser } from './entity/BmrUser';
import { ServerStatus } from './enums';
import { IBmrServerStatusUpdate, ICandidateMsg, IConnectionQuery } from './interfaces';
import { logger } from './logger';

/**
 * Listeners for socket messages
 */
class SocketListeners {

    /**
     * onSocketConnect
     */
    public onSocketConnect = async (socket: socketIo.Socket): Promise<void> => {
        logger.info('a user connected');
        logger.info(`query params: ${JSON.stringify(socket.handshake.query)}`);
        const connectionQuery: IConnectionQuery = <IConnectionQuery>(socket.handshake.query);
        this.addToUserRoomIfNotHost(socket, connectionQuery);
        socket.on('disconnect', async () => {
            logger.info(`host: ${connectionQuery.isHost}`);
            logger.info(`${connectionQuery.isHost === 'true' ? 'Host' + ` ${connectionQuery.serialKey}` : 'Viewer'} socket disconnected`);
            if (connectionQuery.isHost === 'true') {
                await this.updateBmrHostStatus(socket, connectionQuery, ServerStatus.offline);
            } else {
                logger.info(JSON.stringify(socket.server.sockets.adapter.rooms));
            }
        });

        socket.on(socketMessages.register, async (room: string) => {
            logger.info(`a bmr server - ${room} want's to register`);
            try {
                const response: number = await BmrServerController.GET_INSTANCE()
                    .addServerIfNotPresent(connectionQuery, room);
                logger.info(`response: ${response}`);
                await this.updateBmrHostStatus(socket, connectionQuery, ServerStatus.online);
            } catch (error) {
                logger.error(`${error}`);
            }
        });

        socket.on('echo', (message: string): void => {
            logger.info(`receied echo messages as ${message}`);
            socket.emit('echo', message);
        });

        socket.on(socketMessages.message, (message: string): void => {
            logger.info(`Client said: ${message}`);
            // for a real app, would be room-only (not broadcast)
            socket.broadcast.emit(socketMessages.message, message);
        });

        socket.on(socketMessages.iceCandidate, (iceCandidate: ICandidateMsg, room: string) => {
            logger.info(`received ice-candidate in the room: ${room}`);
            socket.to(room)
                .emit(socketMessages.iceCandidate, room, iceCandidate);
        });

        socket.on(socketMessages.offer, (description: RTCSessionDescriptionInit, room: string) => {
            logger.info(`received offer in the room: ${room}`);
            socket.to(room)
                .emit(socketMessages.offer, room, description);
        });

        socket.on(socketMessages.answer, (description: RTCSessionDescriptionInit, room: string) => {
            logger.info(`received answer in the room: ${room}`);
            socket.to(room)
                .emit(socketMessages.answer, description);
        });

        socket.on(socketMessages.startCall, async (room: string) => {
            logger.info(`${room} is creating a call`);
            socket.to(room)
                .emit(socketMessages.startCall);
        });

        socket.on(socketMessages.hangUp, async (room: string) => {
            logger.info(`${room} wants to hang up call`);
            await this.updateBmrHostStatus(socket, connectionQuery, ServerStatus.online);
            socket.to(room)
                .emit(socketMessages.hangUp);
        });

        socket.on(socketMessages.createOrJoinRoom, async (room: string): Promise<void> => {
            await this.createOrJoinRoom(socket, room);
        });
        try {
            const userName: string = (<IConnectionQuery>(socket.handshake.query)).userName;
            logger.info(`received user_name: ${userName}`);
            await this.emitServersList(userName, socket);
        } catch (error) {
            logger.error(`error:  --- ${error}`);
        }
    }

    private async createOrJoinRoom(socket: socketIo.Socket, room: string): Promise<void> {
        logger.info(`Received request to create or join room ${room}`);
        logger.info(socket.server.sockets.adapter.rooms[room]);
        const numClients: number = socket.server.sockets.adapter.rooms[room]
            === undefined ? 0 : Object.keys(socket.server.sockets.adapter.rooms[room].sockets).length;
        logger.info(`Room ${room} now has ${numClients} client(s)1`);
        if (numClients === 0) {
            socket.join(room, (error: Error): void => {
                if (error === null) {
                    logger.info(JSON.stringify(socket.rooms));
                    logger.info(`Room ${room} now has
                        ${Object.keys(socket.server.sockets.adapter.rooms[room].sockets).length} client(s)2`);
                    logger.info(`Client ID ${socket.id} created room ${room}`);
                    socket.emit(socketMessages.created, room);
                } else {
                    logger.error(error);
                }
            });
        } else if (numClients === 1) {
            socket.join(room, (error: Error): void => {
                if (error === null) {
                    logger.info(JSON.stringify(socket.rooms));
                    logger.info(`Client ID ${socket.id} joined room ${room}`);
                    logger.info(`Room ${room} now has
                        ${Object.keys(socket.server.sockets.adapter.rooms[room].sockets).length} client(s)3`);
                    socket.emit(socketMessages.joined, room);
                } else {
                    logger.error(error);
                }
            });
            const connectionQuery: IConnectionQuery = <IConnectionQuery>(socket.handshake.query);
            connectionQuery.serialKey = room;
            await this.updateBmrHostStatus(socket, connectionQuery, ServerStatus.insession);
        } else {
            socket.emit(socketMessages.full, room); // max two clients
        }
    }

    private async updateBmrHostStatus(socket: socketIo.Socket
        ,                             connectionQuery: IConnectionQuery
        ,                             serverStatus: ServerStatus): Promise<void> {

        logger.info(`trying to update the status to ${serverStatus} for the server ${connectionQuery.serialKey}`);
        const bmrServerStatusUpdate: IBmrServerStatusUpdate = {
            serialKey: connectionQuery.serialKey,
            status: serverStatus
        };
        try {
            await BmrServerController.GET_INSTANCE()
                .updateStatus(bmrServerStatusUpdate.status, connectionQuery.serialKey);
            await BmrServerController.GET_INSTANCE()
                .checkStatus(bmrServerStatusUpdate.serialKey);
        } catch (error) {
            logger.error(<Error>error);
        }
        socket.to(connectionQuery.userName)
            .emit(socketMessages.statusUpdate, bmrServerStatusUpdate);
    }

    private addToUserRoomIfNotHost(socket: socketIo.Socket, connectionQuery: IConnectionQuery): void {
        if (connectionQuery.isHost === 'false') {
            socket.join(connectionQuery.userName, (error: Error): void => {
                if (error === null) {
                    logger.info(`Room ${connectionQuery.userName} now has
                        ${Object.keys(socket.server.sockets.adapter.rooms[connectionQuery.userName].sockets).length} client(s)`);
                } else {
                    logger.error(error);
                }
            });
        }
    }

    private async emitServersList(userName: string, socket: socketIo.Socket): Promise<void> {
        const authenticatedUser: BmrUser = new BmrUser(userName);
        try {
            const userController: BmrUserController = BmrUserController.GET_INSTANCE();
            authenticatedUser.id = await userController.addUserIfNotPresent(authenticatedUser);
            const serversOfUser: BmrServer[] = await userController.getServersOfUser(authenticatedUser);
            logger.info(`serversOfUser: ${JSON.stringify(serversOfUser)}`);
            socket.emit(socketMessages.serverList, serversOfUser);
        } catch (error) {
            logger.error(<Error>error);
        }
    }

}

export const socketListeners: SocketListeners = new SocketListeners();
