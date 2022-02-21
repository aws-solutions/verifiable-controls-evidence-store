import middy from '@middy/core';
import { APIGatewayProxyEvent, Context } from 'aws-lambda';
import { DependencyContainer } from 'tsyringe';
export declare function ContextLoggingMiddleware<TEvent, TResponse>(applicationName: string, rootContainer: DependencyContainer, runningLocally?: boolean, logLevel?: 'error' | 'warn' | 'info' | 'verbose' | 'debug' | 'silly', additionalMetadata?: {
    [key: string]: (event: APIGatewayProxyEvent, context: Context) => string;
}): middy.MiddlewareObject<TEvent, TResponse>;
export interface LoggingContext extends Context {
    loggingContextContainer: DependencyContainer;
}
