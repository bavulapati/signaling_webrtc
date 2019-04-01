import socketIo from 'socket.io';
import { socketMessages } from './constants/socketMessages';
import { logger } from './logger';

interface ICandidateMsg {
    label: number;
    id: string;
    candidate: string;
}

/**
 * Listeners for socket messages
 */
class SocketListeners {

    /**
     * onSocketConnect
     */
    public onSocketConnect(socket: socketIo.Socket): void {
        logger.info('a user connected');
        socket.on('disconnect', () => { logger.info('user disconnected'); });

        socket.on(socketMessages.message, (message: string): void => {
            logger.info(`Client said: ${message}`);
            // for a real app, would be room-only (not broadcast)
            socket.broadcast.emit(socketMessages.message, message);
        });

        socket.on(socketMessages.iceCandidate, (iceCandidate: ICandidateMsg, room: string, clientId: string) => {
            logger.info(`received ice-candidate from client: ${clientId}`);
            socket.to(room)
                .emit(socketMessages.iceCandidate, iceCandidate);
        });

        socket.on(socketMessages.offer, (description: RTCSessionDescriptionInit, room: string, clientId: string) => {
            logger.info(`received offer from client: ${clientId}`);
            socket.to(room)
                .emit(socketMessages.offer, description);
        });

        socket.on(socketMessages.answer, (description: RTCSessionDescriptionInit, room: string, clientId: string) => {
            logger.info(`received answer from client: ${clientId}`);
            socket.to(room)
                .emit(socketMessages.answer, description);
        });

        socket.on(socketMessages.startCall, (room: string, clientId: string) => {
            logger.info(`${clientId} wants to start call`);
            socket.to(room)
                .emit(socketMessages.startCall);
        });

        socket.on(socketMessages.hangUp, (room: string, clientId: string) => {
            logger.info(`${clientId} wants to hang up call`);
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

    }
}

export const socketListeners: SocketListeners = new SocketListeners();
