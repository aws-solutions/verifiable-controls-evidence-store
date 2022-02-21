declare type loggerMethodType = (message: string, ...meta: any[]) => void;
export interface Logger {
    error: loggerMethodType;
    warn: loggerMethodType;
    info: loggerMethodType;
    verbose: loggerMethodType;
    debug: loggerMethodType;
    silly: loggerMethodType;
}
export interface LoggerOptions {
    logLevel: string;
}
export {};
