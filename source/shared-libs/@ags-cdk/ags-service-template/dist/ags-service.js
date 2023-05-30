"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AGSService = void 0;
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
const cdk = require("aws-cdk-lib");
const kms = require("aws-cdk-lib/aws-kms");
const constructs_1 = require("constructs");
const ags_shared_infra_client_1 = require("./ags-shared-infra-client");
class AGSService extends constructs_1.Construct {
    constructor(scope, id, props) {
        var _a;
        super(scope, id);
        // populate service context
        this.serviceName = props.serviceName;
        // populate configuration
        this.configName = props.configName;
        this.configuration = props.configuration;
        // create shared infra client
        this.sharedInfraClient = new ags_shared_infra_client_1.AGSSharedInfraClient(this, 'sharedInfraClient');
        // remove policy specified in cdk.json for the given configuration
        this.removalPolicy = ((_a = this.getCurrentConfig()) === null || _a === void 0 ? void 0 : _a.retainData) ? cdk.RemovalPolicy.RETAIN
            : cdk.RemovalPolicy.DESTROY;
    }
    /**
     * Retrieves the current configuration.
     *
     * Configuration presents in configuration files in the configuration directory
     *
     *
     * @returns the current configuration
     */
    getCurrentConfig() {
        return this.configuration;
    }
    /**
     * Retrieves KMS keys by name
     *
     * Providing KMS Keys for resource encryption.
     * If `customerManagedCMKArns` is specified in the Configuration, the customer KMS Keys will be imported by
     * the ARNs specified. If the resource name is not found in `customerManagedCMKArns` in the Configuration, a new KMS key
     * will be created for the resource.
     *
     * @returns KMS Key for the specified name
     */
    getMandatoryKMSKey(name) {
        var _a;
        const resolveKey = (name, arn) => { var _a; return (_a = this.importCustomerKMSKey(name, arn)) !== null && _a !== void 0 ? _a : this.createCustomerKMSKey(name); };
        const customerManagedCMKArns = ((_a = this.getCurrentConfig()) === null || _a === void 0 ? void 0 : _a.customerManagedCMKArns);
        return resolveKey(name, customerManagedCMKArns === null || customerManagedCMKArns === void 0 ? void 0 : customerManagedCMKArns[name]);
    }
    /**
     * Retrieves KMS keys by name
     *
     * Providing KMS Keys for resource encryption.
     * If `customerManagedCMKArns` is specified in the Configuration, the customer KMS Keys will be imported by
     * the ARNs specified. If the resource name is not found in `customerManagedCMKArns` in the Configuration,
     * no new KMS key will be created and undefined will be returned.
     *
     * User can specified `AUTO` in `customerManagedCMKArns` if user want to enforce the encryption with customer
     * KMS key but can't provide an external key Arn. It will force a new KMS key to be created and returned.
     *
     * @returns KMS Key for the specified name or undefined
     */
    getOptionalKMSKey(name) {
        var _a;
        const resolveKey = (name, arn) => {
            var _a;
            if (arn && arn.toUpperCase() === 'AUTO') {
                return this.createCustomerKMSKey(name);
            }
            else if (arn) {
                return (_a = this.importCustomerKMSKey(name, arn)) !== null && _a !== void 0 ? _a : undefined;
            }
            else {
                return undefined;
            }
        };
        const customerManagedCMKArns = ((_a = this.getCurrentConfig()) === null || _a === void 0 ? void 0 : _a.customerManagedCMKArns);
        return resolveKey(name, customerManagedCMKArns === null || customerManagedCMKArns === void 0 ? void 0 : customerManagedCMKArns[name]);
    }
    importCustomerKMSKey(name, arn) {
        return arn ? kms.Key.fromKeyArn(this, `CMKKey${name}`, arn) : null;
    }
    createCustomerKMSKey(name) {
        return new kms.Key(this, `CMKKey${name}`, {
            description: `KMS Key for ${this.serviceName}/${name}`,
            alias: `${this.serviceName}-${name}`,
            enableKeyRotation: true,
            removalPolicy: this.removalPolicy,
        });
    }
}
exports.AGSService = AGSService;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiYWdzLXNlcnZpY2UuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi9saWIvYWdzLXNlcnZpY2UudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7O0FBQUE7Ozs7Ozs7Ozs7Ozs7O0VBY0U7QUFDRixtQ0FBbUM7QUFDbkMsMkNBQTJDO0FBQzNDLDJDQUF1QztBQUN2Qyx1RUFBaUU7QUFXakUsTUFBYSxVQUFXLFNBQVEsc0JBQVM7SUFlckMsWUFBWSxLQUFnQixFQUFFLEVBQVUsRUFBRSxLQUFzQjs7UUFDNUQsS0FBSyxDQUFDLEtBQUssRUFBRSxFQUFFLENBQUMsQ0FBQztRQUVqQiwyQkFBMkI7UUFDM0IsSUFBSSxDQUFDLFdBQVcsR0FBRyxLQUFLLENBQUMsV0FBVyxDQUFDO1FBRXJDLHlCQUF5QjtRQUN6QixJQUFJLENBQUMsVUFBVSxHQUFHLEtBQUssQ0FBQyxVQUFVLENBQUM7UUFDbkMsSUFBSSxDQUFDLGFBQWEsR0FBRyxLQUFLLENBQUMsYUFBYSxDQUFDO1FBRXpDLDZCQUE2QjtRQUM3QixJQUFJLENBQUMsaUJBQWlCLEdBQUcsSUFBSSw4Q0FBb0IsQ0FBQyxJQUFJLEVBQUUsbUJBQW1CLENBQUMsQ0FBQztRQUU3RSxrRUFBa0U7UUFDbEUsSUFBSSxDQUFDLGFBQWEsR0FBRyxPQUFBLElBQUksQ0FBQyxnQkFBZ0IsRUFBRSwwQ0FBRSxVQUFVLEVBQ3BELENBQUMsQ0FBQyxHQUFHLENBQUMsYUFBYSxDQUFDLE1BQU07WUFDMUIsQ0FBQyxDQUFDLEdBQUcsQ0FBQyxhQUFhLENBQUMsT0FBTyxDQUFDO0lBQ3BDLENBQUM7SUFFRDs7Ozs7OztPQU9HO0lBQ0gsZ0JBQWdCO1FBQ1osT0FBTyxJQUFJLENBQUMsYUFBYSxDQUFDO0lBQzlCLENBQUM7SUFFRDs7Ozs7Ozs7O09BU0c7SUFDSCxrQkFBa0IsQ0FBQyxJQUFZOztRQUMzQixNQUFNLFVBQVUsR0FBRyxDQUFDLElBQVksRUFBRSxHQUFXLEVBQVksRUFBRSx3QkFDdkQsSUFBSSxDQUFDLG9CQUFvQixDQUFDLElBQUksRUFBRSxHQUFHLENBQUMsbUNBQUksSUFBSSxDQUFDLG9CQUFvQixDQUFDLElBQUksQ0FBQyxHQUFBLENBQUM7UUFFNUUsTUFBTSxzQkFBc0IsR0FBYSxPQUNyQyxJQUFJLENBQUMsZ0JBQWdCLEVBQUUsMENBQUUsc0JBQXNCLENBQ3ZCLENBQUM7UUFFN0IsT0FBTyxVQUFVLENBQUMsSUFBSSxFQUFFLHNCQUFzQixhQUF0QixzQkFBc0IsdUJBQXRCLHNCQUFzQixDQUFHLElBQUksRUFBRSxDQUFDO0lBQzVELENBQUM7SUFFRDs7Ozs7Ozs7Ozs7O09BWUc7SUFDSCxpQkFBaUIsQ0FBQyxJQUFZOztRQUMxQixNQUFNLFVBQVUsR0FBRyxDQUFDLElBQVksRUFBRSxHQUFXLEVBQXdCLEVBQUU7O1lBQ25FLElBQUksR0FBRyxJQUFJLEdBQUcsQ0FBQyxXQUFXLEVBQUUsS0FBSyxNQUFNLEVBQUU7Z0JBQ3JDLE9BQU8sSUFBSSxDQUFDLG9CQUFvQixDQUFDLElBQUksQ0FBQyxDQUFDO2FBQzFDO2lCQUFNLElBQUksR0FBRyxFQUFFO2dCQUNaLGFBQU8sSUFBSSxDQUFDLG9CQUFvQixDQUFDLElBQUksRUFBRSxHQUFHLENBQUMsbUNBQUksU0FBUyxDQUFDO2FBQzVEO2lCQUFNO2dCQUNILE9BQU8sU0FBUyxDQUFDO2FBQ3BCO1FBQ0wsQ0FBQyxDQUFDO1FBRUYsTUFBTSxzQkFBc0IsR0FBYSxPQUNyQyxJQUFJLENBQUMsZ0JBQWdCLEVBQUUsMENBQUUsc0JBQXNCLENBQ3ZCLENBQUM7UUFFN0IsT0FBTyxVQUFVLENBQUMsSUFBSSxFQUFFLHNCQUFzQixhQUF0QixzQkFBc0IsdUJBQXRCLHNCQUFzQixDQUFHLElBQUksRUFBRSxDQUFDO0lBQzVELENBQUM7SUFFTyxvQkFBb0IsQ0FBQyxJQUFZLEVBQUUsR0FBWTtRQUNuRCxPQUFPLEdBQUcsQ0FBQyxDQUFDLENBQUMsR0FBRyxDQUFDLEdBQUcsQ0FBQyxVQUFVLENBQUMsSUFBSSxFQUFFLFNBQVMsSUFBSSxFQUFFLEVBQUUsR0FBRyxDQUFDLENBQUMsQ0FBQyxDQUFDLElBQUksQ0FBQztJQUN2RSxDQUFDO0lBRU8sb0JBQW9CLENBQUMsSUFBWTtRQUNyQyxPQUFPLElBQUksR0FBRyxDQUFDLEdBQUcsQ0FBQyxJQUFJLEVBQUUsU0FBUyxJQUFJLEVBQUUsRUFBRTtZQUN0QyxXQUFXLEVBQUUsZUFBZSxJQUFJLENBQUMsV0FBVyxJQUFJLElBQUksRUFBRTtZQUN0RCxLQUFLLEVBQUUsR0FBRyxJQUFJLENBQUMsV0FBVyxJQUFJLElBQUksRUFBRTtZQUNwQyxpQkFBaUIsRUFBRSxJQUFJO1lBQ3ZCLGFBQWEsRUFBRSxJQUFJLENBQUMsYUFBYTtTQUNwQyxDQUFDLENBQUM7SUFDUCxDQUFDO0NBQ0o7QUE5R0QsZ0NBOEdDIiwic291cmNlc0NvbnRlbnQiOlsiLyogXG4gIENvcHlyaWdodCBBbWF6b24uY29tLCBJbmMuIG9yIGl0cyBhZmZpbGlhdGVzLiBBbGwgUmlnaHRzIFJlc2VydmVkLlxuICBcbiAgTGljZW5zZWQgdW5kZXIgdGhlIEFwYWNoZSBMaWNlbnNlLCBWZXJzaW9uIDIuMCAodGhlIFwiTGljZW5zZVwiKS5cbiAgWW91IG1heSBub3QgdXNlIHRoaXMgZmlsZSBleGNlcHQgaW4gY29tcGxpYW5jZSB3aXRoIHRoZSBMaWNlbnNlLlxuICBZb3UgbWF5IG9idGFpbiBhIGNvcHkgb2YgdGhlIExpY2Vuc2UgYXRcbiAgXG4gICAgICBodHRwOi8vd3d3LmFwYWNoZS5vcmcvbGljZW5zZXMvTElDRU5TRS0yLjBcbiAgXG4gIFVubGVzcyByZXF1aXJlZCBieSBhcHBsaWNhYmxlIGxhdyBvciBhZ3JlZWQgdG8gaW4gd3JpdGluZywgc29mdHdhcmVcbiAgZGlzdHJpYnV0ZWQgdW5kZXIgdGhlIExpY2Vuc2UgaXMgZGlzdHJpYnV0ZWQgb24gYW4gXCJBUyBJU1wiIEJBU0lTLFxuICBXSVRIT1VUIFdBUlJBTlRJRVMgT1IgQ09ORElUSU9OUyBPRiBBTlkgS0lORCwgZWl0aGVyIGV4cHJlc3Mgb3IgaW1wbGllZC5cbiAgU2VlIHRoZSBMaWNlbnNlIGZvciB0aGUgc3BlY2lmaWMgbGFuZ3VhZ2UgZ292ZXJuaW5nIHBlcm1pc3Npb25zIGFuZFxuICBsaW1pdGF0aW9ucyB1bmRlciB0aGUgTGljZW5zZS5cbiovXG5pbXBvcnQgKiBhcyBjZGsgZnJvbSAnYXdzLWNkay1saWInO1xuaW1wb3J0ICogYXMga21zIGZyb20gJ2F3cy1jZGstbGliL2F3cy1rbXMnO1xuaW1wb3J0IHsgQ29uc3RydWN0IH0gZnJvbSAnY29uc3RydWN0cyc7XG5pbXBvcnQgeyBBR1NTaGFyZWRJbmZyYUNsaWVudCB9IGZyb20gJy4vYWdzLXNoYXJlZC1pbmZyYS1jbGllbnQnO1xuaW1wb3J0IHsgQ29uZmlndXJhdGlvbiB9IGZyb20gJy4vYWdzLXR5cGVzJztcblxuZXhwb3J0IGludGVyZmFjZSBBR1NTZXJ2aWNlUHJvcHMge1xuICAgIHNlcnZpY2VOYW1lOiBzdHJpbmc7XG4gICAgY29uZmlnTmFtZTogc3RyaW5nO1xuICAgIGNvbmZpZ3VyYXRpb246IENvbmZpZ3VyYXRpb247XG4gICAgc29sdXRpb25JZD86IHN0cmluZztcbiAgICBzb2x1dGlvblZlcnNpb24/OiBzdHJpbmc7XG59XG5cbmV4cG9ydCBjbGFzcyBBR1NTZXJ2aWNlIGV4dGVuZHMgQ29uc3RydWN0IHtcbiAgICAvLyBzZXJ2aWNlIGNvbnRleHRcbiAgICBwdWJsaWMgcmVhZG9ubHkgc2VydmljZU5hbWU6IHN0cmluZztcbiAgICBwdWJsaWMgcmVhZG9ubHkgbGFtYmRhTmFtZTogc3RyaW5nO1xuXG4gICAgLy8gc2VydmljZSBjb25maWd1cmF0aW9uXG4gICAgcHVibGljIHJlYWRvbmx5IGNvbmZpZ05hbWU/OiBzdHJpbmc7XG4gICAgcHVibGljIHJlYWRvbmx5IGNvbmZpZ3VyYXRpb24/OiBDb25maWd1cmF0aW9uO1xuXG4gICAgLy8gcmV0YWluIHBvbGljeVxuICAgIHB1YmxpYyByZWFkb25seSByZW1vdmFsUG9saWN5OiBjZGsuUmVtb3ZhbFBvbGljeTtcblxuICAgIC8vIHByaXZhdGVcbiAgICBwdWJsaWMgcmVhZG9ubHkgc2hhcmVkSW5mcmFDbGllbnQ6IEFHU1NoYXJlZEluZnJhQ2xpZW50O1xuXG4gICAgY29uc3RydWN0b3Ioc2NvcGU6IENvbnN0cnVjdCwgaWQ6IHN0cmluZywgcHJvcHM6IEFHU1NlcnZpY2VQcm9wcykge1xuICAgICAgICBzdXBlcihzY29wZSwgaWQpO1xuXG4gICAgICAgIC8vIHBvcHVsYXRlIHNlcnZpY2UgY29udGV4dFxuICAgICAgICB0aGlzLnNlcnZpY2VOYW1lID0gcHJvcHMuc2VydmljZU5hbWU7XG5cbiAgICAgICAgLy8gcG9wdWxhdGUgY29uZmlndXJhdGlvblxuICAgICAgICB0aGlzLmNvbmZpZ05hbWUgPSBwcm9wcy5jb25maWdOYW1lO1xuICAgICAgICB0aGlzLmNvbmZpZ3VyYXRpb24gPSBwcm9wcy5jb25maWd1cmF0aW9uO1xuXG4gICAgICAgIC8vIGNyZWF0ZSBzaGFyZWQgaW5mcmEgY2xpZW50XG4gICAgICAgIHRoaXMuc2hhcmVkSW5mcmFDbGllbnQgPSBuZXcgQUdTU2hhcmVkSW5mcmFDbGllbnQodGhpcywgJ3NoYXJlZEluZnJhQ2xpZW50Jyk7XG5cbiAgICAgICAgLy8gcmVtb3ZlIHBvbGljeSBzcGVjaWZpZWQgaW4gY2RrLmpzb24gZm9yIHRoZSBnaXZlbiBjb25maWd1cmF0aW9uXG4gICAgICAgIHRoaXMucmVtb3ZhbFBvbGljeSA9IHRoaXMuZ2V0Q3VycmVudENvbmZpZygpPy5yZXRhaW5EYXRhXG4gICAgICAgICAgICA/IGNkay5SZW1vdmFsUG9saWN5LlJFVEFJTlxuICAgICAgICAgICAgOiBjZGsuUmVtb3ZhbFBvbGljeS5ERVNUUk9ZO1xuICAgIH1cblxuICAgIC8qKlxuICAgICAqIFJldHJpZXZlcyB0aGUgY3VycmVudCBjb25maWd1cmF0aW9uLlxuICAgICAqXG4gICAgICogQ29uZmlndXJhdGlvbiBwcmVzZW50cyBpbiBjb25maWd1cmF0aW9uIGZpbGVzIGluIHRoZSBjb25maWd1cmF0aW9uIGRpcmVjdG9yeVxuICAgICAqXG4gICAgICpcbiAgICAgKiBAcmV0dXJucyB0aGUgY3VycmVudCBjb25maWd1cmF0aW9uXG4gICAgICovXG4gICAgZ2V0Q3VycmVudENvbmZpZygpOiBSZWNvcmQ8c3RyaW5nLCBhbnk+IHwgdW5kZWZpbmVkIHtcbiAgICAgICAgcmV0dXJuIHRoaXMuY29uZmlndXJhdGlvbjtcbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBSZXRyaWV2ZXMgS01TIGtleXMgYnkgbmFtZVxuICAgICAqXG4gICAgICogUHJvdmlkaW5nIEtNUyBLZXlzIGZvciByZXNvdXJjZSBlbmNyeXB0aW9uLlxuICAgICAqIElmIGBjdXN0b21lck1hbmFnZWRDTUtBcm5zYCBpcyBzcGVjaWZpZWQgaW4gdGhlIENvbmZpZ3VyYXRpb24sIHRoZSBjdXN0b21lciBLTVMgS2V5cyB3aWxsIGJlIGltcG9ydGVkIGJ5XG4gICAgICogdGhlIEFSTnMgc3BlY2lmaWVkLiBJZiB0aGUgcmVzb3VyY2UgbmFtZSBpcyBub3QgZm91bmQgaW4gYGN1c3RvbWVyTWFuYWdlZENNS0FybnNgIGluIHRoZSBDb25maWd1cmF0aW9uLCBhIG5ldyBLTVMga2V5XG4gICAgICogd2lsbCBiZSBjcmVhdGVkIGZvciB0aGUgcmVzb3VyY2UuXG4gICAgICpcbiAgICAgKiBAcmV0dXJucyBLTVMgS2V5IGZvciB0aGUgc3BlY2lmaWVkIG5hbWVcbiAgICAgKi9cbiAgICBnZXRNYW5kYXRvcnlLTVNLZXkobmFtZTogc3RyaW5nKToga21zLklLZXkge1xuICAgICAgICBjb25zdCByZXNvbHZlS2V5ID0gKG5hbWU6IHN0cmluZywgYXJuOiBzdHJpbmcpOiBrbXMuSUtleSA9PlxuICAgICAgICAgICAgdGhpcy5pbXBvcnRDdXN0b21lcktNU0tleShuYW1lLCBhcm4pID8/IHRoaXMuY3JlYXRlQ3VzdG9tZXJLTVNLZXkobmFtZSk7XG5cbiAgICAgICAgY29uc3QgY3VzdG9tZXJNYW5hZ2VkQ01LQXJucyA9ICg8dW5rbm93bj4oXG4gICAgICAgICAgICB0aGlzLmdldEN1cnJlbnRDb25maWcoKT8uY3VzdG9tZXJNYW5hZ2VkQ01LQXJuc1xuICAgICAgICApKSBhcyBSZWNvcmQ8c3RyaW5nLCBzdHJpbmc+O1xuXG4gICAgICAgIHJldHVybiByZXNvbHZlS2V5KG5hbWUsIGN1c3RvbWVyTWFuYWdlZENNS0FybnM/LltuYW1lXSk7XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogUmV0cmlldmVzIEtNUyBrZXlzIGJ5IG5hbWVcbiAgICAgKlxuICAgICAqIFByb3ZpZGluZyBLTVMgS2V5cyBmb3IgcmVzb3VyY2UgZW5jcnlwdGlvbi5cbiAgICAgKiBJZiBgY3VzdG9tZXJNYW5hZ2VkQ01LQXJuc2AgaXMgc3BlY2lmaWVkIGluIHRoZSBDb25maWd1cmF0aW9uLCB0aGUgY3VzdG9tZXIgS01TIEtleXMgd2lsbCBiZSBpbXBvcnRlZCBieVxuICAgICAqIHRoZSBBUk5zIHNwZWNpZmllZC4gSWYgdGhlIHJlc291cmNlIG5hbWUgaXMgbm90IGZvdW5kIGluIGBjdXN0b21lck1hbmFnZWRDTUtBcm5zYCBpbiB0aGUgQ29uZmlndXJhdGlvbixcbiAgICAgKiBubyBuZXcgS01TIGtleSB3aWxsIGJlIGNyZWF0ZWQgYW5kIHVuZGVmaW5lZCB3aWxsIGJlIHJldHVybmVkLlxuICAgICAqXG4gICAgICogVXNlciBjYW4gc3BlY2lmaWVkIGBBVVRPYCBpbiBgY3VzdG9tZXJNYW5hZ2VkQ01LQXJuc2AgaWYgdXNlciB3YW50IHRvIGVuZm9yY2UgdGhlIGVuY3J5cHRpb24gd2l0aCBjdXN0b21lclxuICAgICAqIEtNUyBrZXkgYnV0IGNhbid0IHByb3ZpZGUgYW4gZXh0ZXJuYWwga2V5IEFybi4gSXQgd2lsbCBmb3JjZSBhIG5ldyBLTVMga2V5IHRvIGJlIGNyZWF0ZWQgYW5kIHJldHVybmVkLlxuICAgICAqXG4gICAgICogQHJldHVybnMgS01TIEtleSBmb3IgdGhlIHNwZWNpZmllZCBuYW1lIG9yIHVuZGVmaW5lZFxuICAgICAqL1xuICAgIGdldE9wdGlvbmFsS01TS2V5KG5hbWU6IHN0cmluZyk6IGttcy5JS2V5IHwgdW5kZWZpbmVkIHtcbiAgICAgICAgY29uc3QgcmVzb2x2ZUtleSA9IChuYW1lOiBzdHJpbmcsIGFybjogc3RyaW5nKToga21zLklLZXkgfCB1bmRlZmluZWQgPT4ge1xuICAgICAgICAgICAgaWYgKGFybiAmJiBhcm4udG9VcHBlckNhc2UoKSA9PT0gJ0FVVE8nKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHRoaXMuY3JlYXRlQ3VzdG9tZXJLTVNLZXkobmFtZSk7XG4gICAgICAgICAgICB9IGVsc2UgaWYgKGFybikge1xuICAgICAgICAgICAgICAgIHJldHVybiB0aGlzLmltcG9ydEN1c3RvbWVyS01TS2V5KG5hbWUsIGFybikgPz8gdW5kZWZpbmVkO1xuICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gdW5kZWZpbmVkO1xuICAgICAgICAgICAgfVxuICAgICAgICB9O1xuXG4gICAgICAgIGNvbnN0IGN1c3RvbWVyTWFuYWdlZENNS0FybnMgPSAoPHVua25vd24+KFxuICAgICAgICAgICAgdGhpcy5nZXRDdXJyZW50Q29uZmlnKCk/LmN1c3RvbWVyTWFuYWdlZENNS0FybnNcbiAgICAgICAgKSkgYXMgUmVjb3JkPHN0cmluZywgc3RyaW5nPjtcblxuICAgICAgICByZXR1cm4gcmVzb2x2ZUtleShuYW1lLCBjdXN0b21lck1hbmFnZWRDTUtBcm5zPy5bbmFtZV0pO1xuICAgIH1cblxuICAgIHByaXZhdGUgaW1wb3J0Q3VzdG9tZXJLTVNLZXkobmFtZTogc3RyaW5nLCBhcm4/OiBzdHJpbmcpOiBrbXMuSUtleSB8IG51bGwge1xuICAgICAgICByZXR1cm4gYXJuID8ga21zLktleS5mcm9tS2V5QXJuKHRoaXMsIGBDTUtLZXkke25hbWV9YCwgYXJuKSA6IG51bGw7XG4gICAgfVxuXG4gICAgcHJpdmF0ZSBjcmVhdGVDdXN0b21lcktNU0tleShuYW1lOiBzdHJpbmcpOiBrbXMuS2V5IHtcbiAgICAgICAgcmV0dXJuIG5ldyBrbXMuS2V5KHRoaXMsIGBDTUtLZXkke25hbWV9YCwge1xuICAgICAgICAgICAgZGVzY3JpcHRpb246IGBLTVMgS2V5IGZvciAke3RoaXMuc2VydmljZU5hbWV9LyR7bmFtZX1gLFxuICAgICAgICAgICAgYWxpYXM6IGAke3RoaXMuc2VydmljZU5hbWV9LSR7bmFtZX1gLFxuICAgICAgICAgICAgZW5hYmxlS2V5Um90YXRpb246IHRydWUsXG4gICAgICAgICAgICByZW1vdmFsUG9saWN5OiB0aGlzLnJlbW92YWxQb2xpY3ksXG4gICAgICAgIH0pO1xuICAgIH1cbn1cbiJdfQ==