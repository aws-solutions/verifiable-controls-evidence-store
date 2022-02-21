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
const cdk = require("@aws-cdk/core");
const kms = require("@aws-cdk/aws-kms");
const ags_shared_infra_client_1 = require("./ags-shared-infra-client");
class AGSService extends cdk.Construct {
    constructor(scope, id, props) {
        var _a;
        super(scope, id);
        // populate service context
        this.serviceName = props.serviceName;
        // populate configuration
        this.configName = props.configName;
        this.configurations = props.configurations;
        // create shared infra client
        this.sharedInfraClient = new ags_shared_infra_client_1.AGSSharedInfraClient(this, 'sharedInfraClient');
        // remove policy specified in cdk.json for the given configuration
        this.removalPolicy = ((_a = this.getCurrentConfig()) === null || _a === void 0 ? void 0 : _a.retainData) ? cdk.RemovalPolicy.RETAIN
            : cdk.RemovalPolicy.DESTROY;
    }
    /**
     * Retrieves the current configuration.
     *
     * Configuration presents in `configuration` in `cdk.json` context provide a set of named
     * configuration settings that can be used to customize the behavior of the service.
     *
     * The configuration is looked up by the `configName` which can be specified in the
     * `targetEnvs` for each environment. If it is not specified, the `configName` that
     * is deployed with Shared Infra in the target enviroment will be used as default.
     *
     * If the configuration can't be found by the `configName` or the configurations are
     * not available in `cdk.json` context, it will return undefined.
     *
     * @returns the configuration looked up by either `configName` in Shared Infra or overridden
     * by `configName` set in `targetEnvs`.
     */
    getCurrentConfig() {
        var _a;
        const configName = this.configName || this.sharedInfraClient.configName;
        return (_a = this.configurations) === null || _a === void 0 ? void 0 : _a[configName];
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiYWdzLXNlcnZpY2UuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi9saWIvYWdzLXNlcnZpY2UudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7O0FBQUE7Ozs7Ozs7Ozs7Ozs7O0VBY0U7QUFDRixxQ0FBcUM7QUFDckMsd0NBQXdDO0FBQ3hDLHVFQUFpRTtBQVNqRSxNQUFhLFVBQVcsU0FBUSxHQUFHLENBQUMsU0FBUztJQWV6QyxZQUFZLEtBQW9CLEVBQUUsRUFBVSxFQUFFLEtBQXNCOztRQUNoRSxLQUFLLENBQUMsS0FBSyxFQUFFLEVBQUUsQ0FBQyxDQUFDO1FBRWpCLDJCQUEyQjtRQUMzQixJQUFJLENBQUMsV0FBVyxHQUFHLEtBQUssQ0FBQyxXQUFXLENBQUM7UUFFckMseUJBQXlCO1FBQ3pCLElBQUksQ0FBQyxVQUFVLEdBQUcsS0FBSyxDQUFDLFVBQVUsQ0FBQztRQUNuQyxJQUFJLENBQUMsY0FBYyxHQUFHLEtBQUssQ0FBQyxjQUFjLENBQUM7UUFFM0MsNkJBQTZCO1FBQzdCLElBQUksQ0FBQyxpQkFBaUIsR0FBRyxJQUFJLDhDQUFvQixDQUFDLElBQUksRUFBRSxtQkFBbUIsQ0FBQyxDQUFDO1FBRTdFLGtFQUFrRTtRQUNsRSxJQUFJLENBQUMsYUFBYSxHQUFHLE9BQUEsSUFBSSxDQUFDLGdCQUFnQixFQUFFLDBDQUFFLFVBQVUsRUFDcEQsQ0FBQyxDQUFDLEdBQUcsQ0FBQyxhQUFhLENBQUMsTUFBTTtZQUMxQixDQUFDLENBQUMsR0FBRyxDQUFDLGFBQWEsQ0FBQyxPQUFPLENBQUM7SUFDcEMsQ0FBQztJQUVEOzs7Ozs7Ozs7Ozs7Ozs7T0FlRztJQUNILGdCQUFnQjs7UUFDWixNQUFNLFVBQVUsR0FBRyxJQUFJLENBQUMsVUFBVSxJQUFJLElBQUksQ0FBQyxpQkFBaUIsQ0FBQyxVQUFVLENBQUM7UUFDeEUsYUFBTyxJQUFJLENBQUMsY0FBYywwQ0FBRyxVQUFVLEVBQUU7SUFDN0MsQ0FBQztJQUVEOzs7Ozs7Ozs7T0FTRztJQUNILGtCQUFrQixDQUFDLElBQVk7O1FBQzNCLE1BQU0sVUFBVSxHQUFHLENBQUMsSUFBWSxFQUFFLEdBQVcsRUFBWSxFQUFFLHdCQUN2RCxJQUFJLENBQUMsb0JBQW9CLENBQUMsSUFBSSxFQUFFLEdBQUcsQ0FBQyxtQ0FBSSxJQUFJLENBQUMsb0JBQW9CLENBQUMsSUFBSSxDQUFDLEdBQUEsQ0FBQztRQUU1RSxNQUFNLHNCQUFzQixHQUFhLE9BQ3JDLElBQUksQ0FBQyxnQkFBZ0IsRUFBRSwwQ0FBRSxzQkFBc0IsQ0FDdkIsQ0FBQztRQUU3QixPQUFPLFVBQVUsQ0FBQyxJQUFJLEVBQUUsc0JBQXNCLGFBQXRCLHNCQUFzQix1QkFBdEIsc0JBQXNCLENBQUcsSUFBSSxFQUFFLENBQUM7SUFDNUQsQ0FBQztJQUVEOzs7Ozs7Ozs7Ozs7T0FZRztJQUNILGlCQUFpQixDQUFDLElBQVk7O1FBQzFCLE1BQU0sVUFBVSxHQUFHLENBQUMsSUFBWSxFQUFFLEdBQVcsRUFBd0IsRUFBRTs7WUFDbkUsSUFBSSxHQUFHLElBQUksR0FBRyxDQUFDLFdBQVcsRUFBRSxLQUFLLE1BQU0sRUFBRTtnQkFDckMsT0FBTyxJQUFJLENBQUMsb0JBQW9CLENBQUMsSUFBSSxDQUFDLENBQUM7YUFDMUM7aUJBQU0sSUFBSSxHQUFHLEVBQUU7Z0JBQ1osYUFBTyxJQUFJLENBQUMsb0JBQW9CLENBQUMsSUFBSSxFQUFFLEdBQUcsQ0FBQyxtQ0FBSSxTQUFTLENBQUM7YUFDNUQ7aUJBQU07Z0JBQ0gsT0FBTyxTQUFTLENBQUM7YUFDcEI7UUFDTCxDQUFDLENBQUM7UUFFRixNQUFNLHNCQUFzQixHQUFhLE9BQ3JDLElBQUksQ0FBQyxnQkFBZ0IsRUFBRSwwQ0FBRSxzQkFBc0IsQ0FDdkIsQ0FBQztRQUU3QixPQUFPLFVBQVUsQ0FBQyxJQUFJLEVBQUUsc0JBQXNCLGFBQXRCLHNCQUFzQix1QkFBdEIsc0JBQXNCLENBQUcsSUFBSSxFQUFFLENBQUM7SUFDNUQsQ0FBQztJQUVPLG9CQUFvQixDQUFDLElBQVksRUFBRSxHQUFZO1FBQ25ELE9BQU8sR0FBRyxDQUFDLENBQUMsQ0FBQyxHQUFHLENBQUMsR0FBRyxDQUFDLFVBQVUsQ0FBQyxJQUFJLEVBQUUsU0FBUyxJQUFJLEVBQUUsRUFBRSxHQUFHLENBQUMsQ0FBQyxDQUFDLENBQUMsSUFBSSxDQUFDO0lBQ3ZFLENBQUM7SUFFTyxvQkFBb0IsQ0FBQyxJQUFZO1FBQ3JDLE9BQU8sSUFBSSxHQUFHLENBQUMsR0FBRyxDQUFDLElBQUksRUFBRSxTQUFTLElBQUksRUFBRSxFQUFFO1lBQ3RDLFdBQVcsRUFBRSxlQUFlLElBQUksQ0FBQyxXQUFXLElBQUksSUFBSSxFQUFFO1lBQ3RELEtBQUssRUFBRSxHQUFHLElBQUksQ0FBQyxXQUFXLElBQUksSUFBSSxFQUFFO1lBQ3BDLGlCQUFpQixFQUFFLElBQUk7WUFDdkIsYUFBYSxFQUFFLElBQUksQ0FBQyxhQUFhO1NBQ3BDLENBQUMsQ0FBQztJQUNQLENBQUM7Q0FDSjtBQXZIRCxnQ0F1SEMiLCJzb3VyY2VzQ29udGVudCI6WyIvKiBcbiAgQ29weXJpZ2h0IEFtYXpvbi5jb20sIEluYy4gb3IgaXRzIGFmZmlsaWF0ZXMuIEFsbCBSaWdodHMgUmVzZXJ2ZWQuXG4gIFxuICBMaWNlbnNlZCB1bmRlciB0aGUgQXBhY2hlIExpY2Vuc2UsIFZlcnNpb24gMi4wICh0aGUgXCJMaWNlbnNlXCIpLlxuICBZb3UgbWF5IG5vdCB1c2UgdGhpcyBmaWxlIGV4Y2VwdCBpbiBjb21wbGlhbmNlIHdpdGggdGhlIExpY2Vuc2UuXG4gIFlvdSBtYXkgb2J0YWluIGEgY29weSBvZiB0aGUgTGljZW5zZSBhdFxuICBcbiAgICAgIGh0dHA6Ly93d3cuYXBhY2hlLm9yZy9saWNlbnNlcy9MSUNFTlNFLTIuMFxuICBcbiAgVW5sZXNzIHJlcXVpcmVkIGJ5IGFwcGxpY2FibGUgbGF3IG9yIGFncmVlZCB0byBpbiB3cml0aW5nLCBzb2Z0d2FyZVxuICBkaXN0cmlidXRlZCB1bmRlciB0aGUgTGljZW5zZSBpcyBkaXN0cmlidXRlZCBvbiBhbiBcIkFTIElTXCIgQkFTSVMsXG4gIFdJVEhPVVQgV0FSUkFOVElFUyBPUiBDT05ESVRJT05TIE9GIEFOWSBLSU5ELCBlaXRoZXIgZXhwcmVzcyBvciBpbXBsaWVkLlxuICBTZWUgdGhlIExpY2Vuc2UgZm9yIHRoZSBzcGVjaWZpYyBsYW5ndWFnZSBnb3Zlcm5pbmcgcGVybWlzc2lvbnMgYW5kXG4gIGxpbWl0YXRpb25zIHVuZGVyIHRoZSBMaWNlbnNlLlxuKi9cbmltcG9ydCAqIGFzIGNkayBmcm9tICdAYXdzLWNkay9jb3JlJztcbmltcG9ydCAqIGFzIGttcyBmcm9tICdAYXdzLWNkay9hd3Mta21zJztcbmltcG9ydCB7IEFHU1NoYXJlZEluZnJhQ2xpZW50IH0gZnJvbSAnLi9hZ3Mtc2hhcmVkLWluZnJhLWNsaWVudCc7XG5pbXBvcnQgeyBDb25maWd1cmF0aW9ucyB9IGZyb20gJy4vYWdzLXR5cGVzJztcblxuZXhwb3J0IGludGVyZmFjZSBBR1NTZXJ2aWNlUHJvcHMge1xuICAgIHNlcnZpY2VOYW1lOiBzdHJpbmc7XG4gICAgY29uZmlnTmFtZTogc3RyaW5nO1xuICAgIGNvbmZpZ3VyYXRpb25zOiBDb25maWd1cmF0aW9ucztcbn1cblxuZXhwb3J0IGNsYXNzIEFHU1NlcnZpY2UgZXh0ZW5kcyBjZGsuQ29uc3RydWN0IHtcbiAgICAvLyBzZXJ2aWNlIGNvbnRleHRcbiAgICBwdWJsaWMgcmVhZG9ubHkgc2VydmljZU5hbWU6IHN0cmluZztcbiAgICBwdWJsaWMgcmVhZG9ubHkgbGFtYmRhTmFtZTogc3RyaW5nO1xuXG4gICAgLy8gc2VydmljZSBjb25maWd1cmF0aW9uXG4gICAgcHVibGljIHJlYWRvbmx5IGNvbmZpZ05hbWU/OiBzdHJpbmc7XG4gICAgcHVibGljIHJlYWRvbmx5IGNvbmZpZ3VyYXRpb25zPzogQ29uZmlndXJhdGlvbnM7XG5cbiAgICAvLyByZXRhaW4gcG9saWN5XG4gICAgcHVibGljIHJlYWRvbmx5IHJlbW92YWxQb2xpY3k6IGNkay5SZW1vdmFsUG9saWN5O1xuXG4gICAgLy8gcHJpdmF0ZVxuICAgIHB1YmxpYyByZWFkb25seSBzaGFyZWRJbmZyYUNsaWVudDogQUdTU2hhcmVkSW5mcmFDbGllbnQ7XG5cbiAgICBjb25zdHJ1Y3RvcihzY29wZTogY2RrLkNvbnN0cnVjdCwgaWQ6IHN0cmluZywgcHJvcHM6IEFHU1NlcnZpY2VQcm9wcykge1xuICAgICAgICBzdXBlcihzY29wZSwgaWQpO1xuXG4gICAgICAgIC8vIHBvcHVsYXRlIHNlcnZpY2UgY29udGV4dFxuICAgICAgICB0aGlzLnNlcnZpY2VOYW1lID0gcHJvcHMuc2VydmljZU5hbWU7XG5cbiAgICAgICAgLy8gcG9wdWxhdGUgY29uZmlndXJhdGlvblxuICAgICAgICB0aGlzLmNvbmZpZ05hbWUgPSBwcm9wcy5jb25maWdOYW1lO1xuICAgICAgICB0aGlzLmNvbmZpZ3VyYXRpb25zID0gcHJvcHMuY29uZmlndXJhdGlvbnM7XG5cbiAgICAgICAgLy8gY3JlYXRlIHNoYXJlZCBpbmZyYSBjbGllbnRcbiAgICAgICAgdGhpcy5zaGFyZWRJbmZyYUNsaWVudCA9IG5ldyBBR1NTaGFyZWRJbmZyYUNsaWVudCh0aGlzLCAnc2hhcmVkSW5mcmFDbGllbnQnKTtcblxuICAgICAgICAvLyByZW1vdmUgcG9saWN5IHNwZWNpZmllZCBpbiBjZGsuanNvbiBmb3IgdGhlIGdpdmVuIGNvbmZpZ3VyYXRpb25cbiAgICAgICAgdGhpcy5yZW1vdmFsUG9saWN5ID0gdGhpcy5nZXRDdXJyZW50Q29uZmlnKCk/LnJldGFpbkRhdGFcbiAgICAgICAgICAgID8gY2RrLlJlbW92YWxQb2xpY3kuUkVUQUlOXG4gICAgICAgICAgICA6IGNkay5SZW1vdmFsUG9saWN5LkRFU1RST1k7XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogUmV0cmlldmVzIHRoZSBjdXJyZW50IGNvbmZpZ3VyYXRpb24uXG4gICAgICpcbiAgICAgKiBDb25maWd1cmF0aW9uIHByZXNlbnRzIGluIGBjb25maWd1cmF0aW9uYCBpbiBgY2RrLmpzb25gIGNvbnRleHQgcHJvdmlkZSBhIHNldCBvZiBuYW1lZFxuICAgICAqIGNvbmZpZ3VyYXRpb24gc2V0dGluZ3MgdGhhdCBjYW4gYmUgdXNlZCB0byBjdXN0b21pemUgdGhlIGJlaGF2aW9yIG9mIHRoZSBzZXJ2aWNlLlxuICAgICAqXG4gICAgICogVGhlIGNvbmZpZ3VyYXRpb24gaXMgbG9va2VkIHVwIGJ5IHRoZSBgY29uZmlnTmFtZWAgd2hpY2ggY2FuIGJlIHNwZWNpZmllZCBpbiB0aGVcbiAgICAgKiBgdGFyZ2V0RW52c2AgZm9yIGVhY2ggZW52aXJvbm1lbnQuIElmIGl0IGlzIG5vdCBzcGVjaWZpZWQsIHRoZSBgY29uZmlnTmFtZWAgdGhhdFxuICAgICAqIGlzIGRlcGxveWVkIHdpdGggU2hhcmVkIEluZnJhIGluIHRoZSB0YXJnZXQgZW52aXJvbWVudCB3aWxsIGJlIHVzZWQgYXMgZGVmYXVsdC5cbiAgICAgKlxuICAgICAqIElmIHRoZSBjb25maWd1cmF0aW9uIGNhbid0IGJlIGZvdW5kIGJ5IHRoZSBgY29uZmlnTmFtZWAgb3IgdGhlIGNvbmZpZ3VyYXRpb25zIGFyZVxuICAgICAqIG5vdCBhdmFpbGFibGUgaW4gYGNkay5qc29uYCBjb250ZXh0LCBpdCB3aWxsIHJldHVybiB1bmRlZmluZWQuXG4gICAgICpcbiAgICAgKiBAcmV0dXJucyB0aGUgY29uZmlndXJhdGlvbiBsb29rZWQgdXAgYnkgZWl0aGVyIGBjb25maWdOYW1lYCBpbiBTaGFyZWQgSW5mcmEgb3Igb3ZlcnJpZGRlblxuICAgICAqIGJ5IGBjb25maWdOYW1lYCBzZXQgaW4gYHRhcmdldEVudnNgLlxuICAgICAqL1xuICAgIGdldEN1cnJlbnRDb25maWcoKTogUmVjb3JkPHN0cmluZywgc3RyaW5nPiB8IHVuZGVmaW5lZCB7XG4gICAgICAgIGNvbnN0IGNvbmZpZ05hbWUgPSB0aGlzLmNvbmZpZ05hbWUgfHwgdGhpcy5zaGFyZWRJbmZyYUNsaWVudC5jb25maWdOYW1lO1xuICAgICAgICByZXR1cm4gdGhpcy5jb25maWd1cmF0aW9ucz8uW2NvbmZpZ05hbWVdO1xuICAgIH1cblxuICAgIC8qKlxuICAgICAqIFJldHJpZXZlcyBLTVMga2V5cyBieSBuYW1lXG4gICAgICpcbiAgICAgKiBQcm92aWRpbmcgS01TIEtleXMgZm9yIHJlc291cmNlIGVuY3J5cHRpb24uXG4gICAgICogSWYgYGN1c3RvbWVyTWFuYWdlZENNS0FybnNgIGlzIHNwZWNpZmllZCBpbiB0aGUgQ29uZmlndXJhdGlvbiwgdGhlIGN1c3RvbWVyIEtNUyBLZXlzIHdpbGwgYmUgaW1wb3J0ZWQgYnlcbiAgICAgKiB0aGUgQVJOcyBzcGVjaWZpZWQuIElmIHRoZSByZXNvdXJjZSBuYW1lIGlzIG5vdCBmb3VuZCBpbiBgY3VzdG9tZXJNYW5hZ2VkQ01LQXJuc2AgaW4gdGhlIENvbmZpZ3VyYXRpb24sIGEgbmV3IEtNUyBrZXlcbiAgICAgKiB3aWxsIGJlIGNyZWF0ZWQgZm9yIHRoZSByZXNvdXJjZS5cbiAgICAgKlxuICAgICAqIEByZXR1cm5zIEtNUyBLZXkgZm9yIHRoZSBzcGVjaWZpZWQgbmFtZVxuICAgICAqL1xuICAgIGdldE1hbmRhdG9yeUtNU0tleShuYW1lOiBzdHJpbmcpOiBrbXMuSUtleSB7XG4gICAgICAgIGNvbnN0IHJlc29sdmVLZXkgPSAobmFtZTogc3RyaW5nLCBhcm46IHN0cmluZyk6IGttcy5JS2V5ID0+XG4gICAgICAgICAgICB0aGlzLmltcG9ydEN1c3RvbWVyS01TS2V5KG5hbWUsIGFybikgPz8gdGhpcy5jcmVhdGVDdXN0b21lcktNU0tleShuYW1lKTtcblxuICAgICAgICBjb25zdCBjdXN0b21lck1hbmFnZWRDTUtBcm5zID0gKDx1bmtub3duPihcbiAgICAgICAgICAgIHRoaXMuZ2V0Q3VycmVudENvbmZpZygpPy5jdXN0b21lck1hbmFnZWRDTUtBcm5zXG4gICAgICAgICkpIGFzIFJlY29yZDxzdHJpbmcsIHN0cmluZz47XG5cbiAgICAgICAgcmV0dXJuIHJlc29sdmVLZXkobmFtZSwgY3VzdG9tZXJNYW5hZ2VkQ01LQXJucz8uW25hbWVdKTtcbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBSZXRyaWV2ZXMgS01TIGtleXMgYnkgbmFtZVxuICAgICAqXG4gICAgICogUHJvdmlkaW5nIEtNUyBLZXlzIGZvciByZXNvdXJjZSBlbmNyeXB0aW9uLlxuICAgICAqIElmIGBjdXN0b21lck1hbmFnZWRDTUtBcm5zYCBpcyBzcGVjaWZpZWQgaW4gdGhlIENvbmZpZ3VyYXRpb24sIHRoZSBjdXN0b21lciBLTVMgS2V5cyB3aWxsIGJlIGltcG9ydGVkIGJ5XG4gICAgICogdGhlIEFSTnMgc3BlY2lmaWVkLiBJZiB0aGUgcmVzb3VyY2UgbmFtZSBpcyBub3QgZm91bmQgaW4gYGN1c3RvbWVyTWFuYWdlZENNS0FybnNgIGluIHRoZSBDb25maWd1cmF0aW9uLFxuICAgICAqIG5vIG5ldyBLTVMga2V5IHdpbGwgYmUgY3JlYXRlZCBhbmQgdW5kZWZpbmVkIHdpbGwgYmUgcmV0dXJuZWQuXG4gICAgICpcbiAgICAgKiBVc2VyIGNhbiBzcGVjaWZpZWQgYEFVVE9gIGluIGBjdXN0b21lck1hbmFnZWRDTUtBcm5zYCBpZiB1c2VyIHdhbnQgdG8gZW5mb3JjZSB0aGUgZW5jcnlwdGlvbiB3aXRoIGN1c3RvbWVyXG4gICAgICogS01TIGtleSBidXQgY2FuJ3QgcHJvdmlkZSBhbiBleHRlcm5hbCBrZXkgQXJuLiBJdCB3aWxsIGZvcmNlIGEgbmV3IEtNUyBrZXkgdG8gYmUgY3JlYXRlZCBhbmQgcmV0dXJuZWQuXG4gICAgICpcbiAgICAgKiBAcmV0dXJucyBLTVMgS2V5IGZvciB0aGUgc3BlY2lmaWVkIG5hbWUgb3IgdW5kZWZpbmVkXG4gICAgICovXG4gICAgZ2V0T3B0aW9uYWxLTVNLZXkobmFtZTogc3RyaW5nKToga21zLklLZXkgfCB1bmRlZmluZWQge1xuICAgICAgICBjb25zdCByZXNvbHZlS2V5ID0gKG5hbWU6IHN0cmluZywgYXJuOiBzdHJpbmcpOiBrbXMuSUtleSB8IHVuZGVmaW5lZCA9PiB7XG4gICAgICAgICAgICBpZiAoYXJuICYmIGFybi50b1VwcGVyQ2FzZSgpID09PSAnQVVUTycpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gdGhpcy5jcmVhdGVDdXN0b21lcktNU0tleShuYW1lKTtcbiAgICAgICAgICAgIH0gZWxzZSBpZiAoYXJuKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHRoaXMuaW1wb3J0Q3VzdG9tZXJLTVNLZXkobmFtZSwgYXJuKSA/PyB1bmRlZmluZWQ7XG4gICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgIHJldHVybiB1bmRlZmluZWQ7XG4gICAgICAgICAgICB9XG4gICAgICAgIH07XG5cbiAgICAgICAgY29uc3QgY3VzdG9tZXJNYW5hZ2VkQ01LQXJucyA9ICg8dW5rbm93bj4oXG4gICAgICAgICAgICB0aGlzLmdldEN1cnJlbnRDb25maWcoKT8uY3VzdG9tZXJNYW5hZ2VkQ01LQXJuc1xuICAgICAgICApKSBhcyBSZWNvcmQ8c3RyaW5nLCBzdHJpbmc+O1xuXG4gICAgICAgIHJldHVybiByZXNvbHZlS2V5KG5hbWUsIGN1c3RvbWVyTWFuYWdlZENNS0FybnM/LltuYW1lXSk7XG4gICAgfVxuXG4gICAgcHJpdmF0ZSBpbXBvcnRDdXN0b21lcktNU0tleShuYW1lOiBzdHJpbmcsIGFybj86IHN0cmluZyk6IGttcy5JS2V5IHwgbnVsbCB7XG4gICAgICAgIHJldHVybiBhcm4gPyBrbXMuS2V5LmZyb21LZXlBcm4odGhpcywgYENNS0tleSR7bmFtZX1gLCBhcm4pIDogbnVsbDtcbiAgICB9XG5cbiAgICBwcml2YXRlIGNyZWF0ZUN1c3RvbWVyS01TS2V5KG5hbWU6IHN0cmluZyk6IGttcy5LZXkge1xuICAgICAgICByZXR1cm4gbmV3IGttcy5LZXkodGhpcywgYENNS0tleSR7bmFtZX1gLCB7XG4gICAgICAgICAgICBkZXNjcmlwdGlvbjogYEtNUyBLZXkgZm9yICR7dGhpcy5zZXJ2aWNlTmFtZX0vJHtuYW1lfWAsXG4gICAgICAgICAgICBhbGlhczogYCR7dGhpcy5zZXJ2aWNlTmFtZX0tJHtuYW1lfWAsXG4gICAgICAgICAgICBlbmFibGVLZXlSb3RhdGlvbjogdHJ1ZSxcbiAgICAgICAgICAgIHJlbW92YWxQb2xpY3k6IHRoaXMucmVtb3ZhbFBvbGljeSxcbiAgICAgICAgfSk7XG4gICAgfVxufVxuIl19