import * as Transport from 'winston-transport';
import { Logger } from './logger-type';
export interface LoggerFactory {
    getLogger(name: string, logLevel?: 'error' | 'warn' | 'info' | 'verbose' | 'debug' | 'silly'): Logger;
}
export declare class LambdaLoggerFactory<TEvent, TContext> implements LoggerFactory {
    private event;
    private context;
    private runLocally?;
    private additionalData?;
    private logLevel?;
    constructor(event: TEvent, context: TContext, runLocally?: boolean | undefined, additionalData?: {
        [key: string]: (event: TEvent, context: TContext) => string;
    } | undefined, logLevel?: "info" | "error" | "warn" | "verbose" | "debug" | "silly" | undefined);
    static customTransports(): Transport[];
    getLogger(name: string, logLevel?: 'error' | 'warn' | 'info' | 'verbose' | 'debug' | 'silly'): Logger;
}
export declare class StaticLoggerFactory implements LoggerFactory {
    getLogger(name: string, logLevel?: 'error' | 'warn' | 'info' | 'verbose' | 'debug' | 'silly'): Logger;
}
