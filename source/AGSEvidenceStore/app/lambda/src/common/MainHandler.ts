/* 
  Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
  
  Licensed under the Apache License, Version 2.0 (the "License").
  You may not use this file except in compliance with the License.
  You may obtain a copy of the License at
  
      http://www.apache.org/licenses/LICENSE-2.0
  
  Unless required by applicable law or agreed to in writing, software
  distributed under the License is distributed on an "AS IS" BASIS,
  WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
  See the License for the specific language governing permissions and
  limitations under the License.
*/

import 'reflect-metadata';
import { container } from 'tsyringe';
import { APIGatewayProxyEvent, Context } from 'aws-lambda';
import { MiddlewareChain, LambdaHandler } from '@apjsb-serverless-lib/middleware-chain';
import { Router } from '@apjsb-serverless-lib/lambda-router';
import { BasicHttpResponse } from '@apjsb-serverless-lib/common-types';
import ResponseFormatter from '@apjsb-serverless-lib/response-formatter';
import cors from '@middy/http-cors';
import {
    ContextLoggingMiddleware,
    LoggerFactory,
    LoggingContext,
} from '@apjsb-serverless-lib/logger';
import { AppConfiguration } from './configuration/AppConfiguration';
import middy from '@middy/core';

export class MainHandler {
    readonly lambdaHandler: LambdaHandler<
        APIGatewayProxyEvent,
        BasicHttpResponse,
        Context
    >;
    constructor(router: Router<BasicHttpResponse>) {
        // setup middlewares
        const appConfig = container.resolve<AppConfiguration>('AppConfiguration');

        const middlewares = [
            ContextLoggingMiddleware<APIGatewayProxyEvent, BasicHttpResponse>(
                appConfig.applicationName,
                container,
                appConfig.runningLocally,
                'debug',
                {
                    'X-Amzn-Trace-Id': (event, _) =>
                        event.headers?.['X-Amzn-Trace-Id'] ?? 'n/a',
                }
            ),
            ResponseFormatter<APIGatewayProxyEvent, BasicHttpResponse>(),
            errorLogger<APIGatewayProxyEvent, BasicHttpResponse>(),
            cors(),
        ];

        // main lambda handler
        this.lambdaHandler = new MiddlewareChain<APIGatewayProxyEvent, BasicHttpResponse>(
            router,
            middlewares
        ).lambdaHandler;
    }
}

function errorLogger<TEvent, TResponse>(): middy.MiddlewareObject<TEvent, TResponse> {
    return {
        onError: (handler: middy.HandlerLambda, next: middy.NextFunction): void => {
            const iocContainer =
                (handler.context as LoggingContext)?.loggingContextContainer ?? container;

            const logger = iocContainer
                .resolve<LoggerFactory>('LoggerFactory')
                .getLogger('ErrorLoggingMiddleware');

            logger.error('Error received - ', handler.error);

            return next();
        },
    };
}
