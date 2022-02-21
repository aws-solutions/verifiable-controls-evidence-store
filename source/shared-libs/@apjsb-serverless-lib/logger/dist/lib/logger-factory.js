"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    Object.defineProperty(o, k2, { enumerable: true, get: function() { return m[k]; } });
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.StaticLoggerFactory = exports.LambdaLoggerFactory = void 0;
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
const winston = __importStar(require("winston"));
const DEFAULT_LOG_LEVEL = 'debug';
class LambdaLoggerFactory {
    constructor(event, context, runLocally, additionalData, logLevel) {
        this.event = event;
        this.context = context;
        this.runLocally = runLocally;
        this.additionalData = additionalData;
        this.logLevel = logLevel;
    }
    static customTransports() {
        return [new winston.transports.Console()];
    }
    getLogger(name, logLevel) {
        var _a;
        const metadata = {};
        if (this.additionalData) {
            Object.entries(this.additionalData).forEach(([key, op]) => {
                metadata[key] = op ? op(this.event, this.context) : '';
            });
        }
        return winston.createLogger({
            defaultMeta: {
                ...metadata,
            },
            transports: LambdaLoggerFactory.customTransports(),
            format: winston.format.combine(winston.format.label({ label: name }), winston.format.timestamp(), winston.format.splat(), this.runLocally
                ? winston.format.prettyPrint({ colorize: true })
                : winston.format.json()),
            level: (_a = logLevel !== null && logLevel !== void 0 ? logLevel : this.logLevel) !== null && _a !== void 0 ? _a : DEFAULT_LOG_LEVEL,
        });
    }
}
exports.LambdaLoggerFactory = LambdaLoggerFactory;
class StaticLoggerFactory {
    getLogger(name, logLevel) {
        return winston.createLogger({
            transports: LambdaLoggerFactory.customTransports(),
            format: winston.format.combine(winston.format.label({ label: name }), winston.format.timestamp(), winston.format.splat(), winston.format.json()),
            level: logLevel !== null && logLevel !== void 0 ? logLevel : DEFAULT_LOG_LEVEL,
        });
    }
}
exports.StaticLoggerFactory = StaticLoggerFactory;
//# sourceMappingURL=logger-factory.js.map