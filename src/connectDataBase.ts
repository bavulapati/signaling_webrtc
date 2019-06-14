import mysql from 'mysql';
import { logger } from './logger';

const bmrDbConnectionConfig: mysql.ConnectionConfig = {
    host: 'ec2-13-229-127-186.ap-southeast-1.compute.amazonaws.com',
    database: 'bmr',
    user: 'bmrtest',
    password: 'bmrTest@123'
};

const bmrDbConnection: mysql.Connection = mysql.createConnection(
    bmrDbConnectionConfig
);

const bmrDbConnectioncallback: (err: mysql.MysqlError) => void =
    (err: mysql.MysqlError): void => {
        if (err === null || err === undefined) {
            logger.info('Database is connected ... nn');
        } else {
            logger.error('Error connecting database ... nn');
            logger.error(err);
        }
    };
const bmrDbDisConnectioncallback: (err: mysql.MysqlError) => void =
    (err: mysql.MysqlError): void => {
        if (err === null || err === undefined) {
            logger.info('Database is disconnected ... nn');
        } else {
            logger.error('Error disconnecting database ... nn');
            logger.error(err);
        }
    };
bmrDbConnection.connect(bmrDbConnectioncallback);
bmrDbConnection.end(bmrDbDisConnectioncallback);
