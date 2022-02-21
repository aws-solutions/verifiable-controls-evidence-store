import { BasicHttpResponse } from '@apjsb-serverless-lib/common-types';
import { AsyncHandlerObj } from '@apjsb-serverless-lib/middleware-chain';
import { APIGatewayProxyEvent } from 'aws-lambda';
import { InjectionToken } from 'tsyringe';
export interface RouteData<TResponse extends BasicHttpResponse, THandler extends AsyncHandlerObj<APIGatewayProxyEvent, TResponse>> {
    predicate: (event: APIGatewayProxyEvent) => boolean;
    handlerToken: InjectionToken<THandler>;
}
