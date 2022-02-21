import { BasicHttpResponse } from '@apjsb-serverless-lib/common-types';
import { AsyncHandlerObj } from '@apjsb-serverless-lib/middleware-chain';
import { APIGatewayProxyEvent, Context } from 'aws-lambda';
import { InjectionToken } from 'tsyringe';
export declare class Router<TResponse extends BasicHttpResponse> implements AsyncHandlerObj<APIGatewayProxyEvent, BasicHttpResponse> {
    private routes;
    addRoute<THandler extends AsyncHandlerObj<APIGatewayProxyEvent, TResponse>>(predicate: (event: APIGatewayProxyEvent) => boolean, handlerToken: InjectionToken<THandler>): Router<TResponse>;
    handle(event: APIGatewayProxyEvent, context: Context): Promise<BasicHttpResponse>;
}
