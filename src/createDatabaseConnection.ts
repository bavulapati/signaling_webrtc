import reflect from 'reflect-metadata';
import { Connection, createConnection, getConnection } from 'typeorm';
import { logger } from './logger';

export function createDatabaseConnection(): void {
    createConnection()
        .then((connection: Connection): void => {
            logger.info(`Created a database connection named ${connection.name}`);
        })
        .catch((error: Error) => {
            logger.error(error);
        });
}

export function closeDatabaseConnection(): void {
    getConnection()
        .close()
        .then(() => {
            logger.info('disconnected from database');
        })
        .catch((error: Error) => {
            logger.error(error);
        });
}
