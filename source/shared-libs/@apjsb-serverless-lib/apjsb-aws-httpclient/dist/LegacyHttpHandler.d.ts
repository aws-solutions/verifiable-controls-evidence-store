/// <reference types="node" />
import { HttpRequest, HttpResponse } from '@aws-sdk/protocol-http';
import * as https from 'https';
export declare function httpHandler(request: HttpRequest, agent?: https.Agent): Promise<HttpResponse>;
