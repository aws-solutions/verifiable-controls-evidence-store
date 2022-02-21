import winston from 'winston';
import { Logger, LoggerOptions } from './logger-type';
/**
 * @deprecated The class should not be used anymore.
 * Use LoggerFactory.logger(name, level?) instead
 */
export declare class WinstonLogger implements Logger {
    logger: winston.Logger;
    constructor(options?: LoggerOptions);
    error: (message: string, ...meta: any[]) => void;
    warn: (message: string, ...meta: any[]) => void;
    info: (message: string, ...meta: any[]) => void;
    verbose: (message: string, ...meta: any[]) => void;
    debug: (message: string, ...meta: any[]) => void;
    silly: (message: string, ...meta: any[]) => void;
}
