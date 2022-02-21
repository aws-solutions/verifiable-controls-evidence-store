import winston from 'winston';
import { Logger, LoggerOptions } from './logger-type';
export declare class ContextLogger implements Logger {
    logger: winston.Logger;
    constructor(meta?: Record<string, string>, options?: LoggerOptions, parentLogger?: ContextLogger);
    getChildLogger(meta: Record<string, string>): ContextLogger;
    error: (message: string, ...meta: any[]) => void;
    warn: (message: string, ...meta: any[]) => void;
    info: (message: string, ...meta: any[]) => void;
    verbose: (message: string, ...meta: any[]) => void;
    debug: (message: string, ...meta: any[]) => void;
    silly: (message: string, ...meta: any[]) => void;
}
