import socketIo from 'socket.io';
import { IConnectionQuery } from './allowConnectionOnAuthentication';
import { socketMessages } from './constants/socketMessages';
import { BmrServerController } from './controllers/BmrServerController';
import { BmrUserController } from './controllers/BmrUserController';
import { BmrServer } from './entity/BmrServer';
import { BmrUser } from './entity/BmrUser';
import { logger } from './logger';

interface ICandidateMsg {
    label: number;
    id: string;
    candidate: string;
}

export interface IBmrUtilityResponse {
    user_name: string;
    bmr_serial_key: string;
    access_token: string;
    remote_disabled: number;
}

/**
 * Listeners for socket messages
 */
class SocketListeners {

    /**
     * onSocketConnect
     */
    public async onSocketConnect(socket: socketIo.Socket): Promise<void> {

        logger.info('a user connected');
        socket.on('disconnect', () => { logger.info('user disconnected'); });

        // socket.on(socketMessages.register, async (bmrUtilityResponse: IBmrUtilityResponse) => {
        //     logger.info(`a bmr server - ${bmrUtilityResponse.bmr_serial_key} want's to register`);
        //     const response: number = await BmrServerController.GET_INSTANCE()
        //         .addServerIfNotPresent(bmrUtilityResponse);
        //     logger.info(`response: ${response}`);
        // });

        socket.on('echo' , (message: string): void => {
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
                .emit(socketMessages.iceCandidate, iceCandidate);
        });

        socket.on(socketMessages.offer, (description: RTCSessionDescriptionInit, room: string) => {
            logger.info(`received offer in the room: ${room}`);
            socket.to(room)
                .emit(socketMessages.offer, description);
        });

        socket.on(socketMessages.answer, (description: RTCSessionDescriptionInit, room: string) => {
            logger.info(`received answer in the room: ${room}`);
            socket.to(room)
                .emit(socketMessages.answer, description);
        });

        socket.on(socketMessages.startCall, (room: string) => {
            logger.info(`${room} is creating a call`);
            socket.to(room)
                .emit(socketMessages.startCall);
        });

        socket.on(socketMessages.hangUp, (room: string) => {
            logger.info(`${room} wants to hang up call`);
            socket.to(room)
                .emit(socketMessages.hangUp);
        });

        socket.on(socketMessages.createOrJoinRoom, (room: string): void => {
            logger.info(`Received request to create or join room ${room}`);
            const clientsInRoom: socketIo.Room = socket.server.sockets.adapter.rooms[room];
            const numClients: number = clientsInRoom !== undefined
                ? Object.keys(clientsInRoom.sockets).length
                : 0;

            logger.info(`Room ${room} now has ${numClients} client(s)`);

            if (numClients === 0) {
                socket.join(room);
                logger.info(`Client ID ${socket.id} created room ${room}`);
                socket.emit(socketMessages.created, room, socket.id);
            } else if (numClients === 1) {
                logger.info(`Client ID ${socket.id} joined room ${room}`);
                socket.join(room);
                socket.emit(socketMessages.joined, room, socket.id);
            } else {
                // max two clients
                socket.emit(socketMessages.full, room);
            }
        });

        // await this.emitServersList((<IConnectionQuery>(socket.handshake.query)).userName, socket);

    }

    private async emitServersList(userName: string, socket: socketIo.Socket): Promise<void> {
        const authenticatedUser: BmrUser = new BmrUser(userName);
        try {
            const userController: BmrUserController = BmrUserController.GET_INSTANCE();
            authenticatedUser.id = await userController.addUserIfNotPresent(authenticatedUser);
            const serversOfUser: BmrServer[] = await userController.getServersOfUser(authenticatedUser);
            socket.emit(socketMessages.serverList, serversOfUser);
        } catch (error) {
            logger.error(<Error>error);
        }
    }
}

export const socketListeners: SocketListeners = new SocketListeners();
