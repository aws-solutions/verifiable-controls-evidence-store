"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.WinstonLogger = void 0;
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
const winston_1 = __importDefault(require("winston"));
const defaultOptions = {
    logLevel: 'info',
};
/**
 * @deprecated The class should not be used anymore.
 * Use LoggerFactory.logger(name, level?) instead
 */
class WinstonLogger {
    constructor(options = defaultOptions) {
        /* eslint-disable-next-line @typescript-eslint/no-explicit-any */
        this.error = (message, ...meta) => {
            this.logger.log('error', message, ...meta);
        };
        /* eslint-disable-next-line @typescript-eslint/no-explicit-any */
        this.warn = (message, ...meta) => {
            this.logger.log('warn', message, ...meta);
        };
        /* eslint-disable-next-line @typescript-eslint/no-explicit-any */
        this.info = (message, ...meta) => {
            this.logger.log('info', message, ...meta);
        };
        /* eslint-disable-next-line @typescript-eslint/no-explicit-any */
        this.verbose = (message, ...meta) => {
            this.logger.log('verbose', message, ...meta);
        };
        /* eslint-disable-next-line @typescript-eslint/no-explicit-any */
        this.debug = (message, ...meta) => {
            this.logger.log('debug', message, ...meta);
        };
        /* eslint-disable-next-line @typescript-eslint/no-explicit-any */
        this.silly = (message, ...meta) => {
            this.logger.log('silly', message, ...meta);
        };
        this.logger = winston_1.default.createLogger({
            level: options.logLevel,
            format: winston_1.default.format.simple(),
            transports: [new winston_1.default.transports.Console()],
        });
    }
}
exports.WinstonLogger = WinstonLogger;
//# sourceMappingURL=winston-logger.js.map