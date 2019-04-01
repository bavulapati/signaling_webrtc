import appRootPath from 'app-root-path';
import winston from 'winston';
// winston carries its own types

const consoleTransportOptions: winston.transports.ConsoleTransportOptions = {
  format: winston.format.combine(
    winston.format.colorize(),
    winston.format.simple()
  ),
  handleExceptions: true,
  level: 'debug'
};

const fileTransportOptions: winston.transports.FileTransportOptions = {
  filename: `${appRootPath}/logs/app.log`,
  format: winston.format.combine(
    winston.format.timestamp({
      format: 'DD-MM-YYYY HH:mm:ss'
    }),
    winston.format.errors({ stack: true }),
    winston.format.splat(),
    winston.format.simple()
  ),
  handleExceptions: true,
  level: 'info',
  maxFiles: 5,
  maxsize: 5242880 // 5MB
};

export const logger: winston.Logger = winston.createLogger({
  exitOnError: false,
  transports: [
    new winston.transports.Console(consoleTransportOptions),
    new winston.transports.File(fileTransportOptions)
  ]
});
