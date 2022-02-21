"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AGSSharedInfraClient = void 0;
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
const aws_ec2_1 = require("@aws-cdk/aws-ec2");
const ssm = require("@aws-cdk/aws-ssm");
// SSM Parameter Names
const SSM_CONFIG_NAME = '/ags/configName';
const SSM_DEPLOYMENT_OPTIONS = '/ags/deploymentOptions';
const SSM_VPC_ID = '/ags/vpcId';
const SSM_VPC_ENDPOINT_ID = '/ags/apigatewayVpcEndpointId';
const SSM_PERMISSION_BOUNDARY_POLICY_ARN = '/ags/permissionBoundaryPolicyArn';
const SSM_WEB_DIST_ID = '/ags/webClientDistributionId';
const SSM_SUBNET_MAPPING = '/ags/subnetmapping';
const SSM_ES_SERVICE_LINKED_ROLE_AVILABLE = '/ags/elasticSearchServiceLinkedRoleAvailable';
const SSM_CUSTOM_API_RESOURCE_POLICY = '/ags/customAPIResourcePolicyJSON';
const SSM_API_WEB_ACL_ARN = '/ags/apigatewayWebAclArn';
class AGSSharedInfraClient extends cdk.Construct {
    constructor(scope, id) {
        super(scope, id);
        // load Shared Infra configurations from SSM Parameters
        this.configName = ssm.StringParameter.valueFromLookup(this, SSM_CONFIG_NAME);
        this.deploymentOptions = this.readJSONParameter(SSM_DEPLOYMENT_OPTIONS, {
            apiGatewayType: 'private',
            bastionInstance: false,
            developmentUserRole: true,
            trustedDeveloperAccounts: '',
        });
        this.trustedDeveloperAccounts = (this.deploymentOptions.trustedDeveloperAccounts || '').split(',');
        this.customAPIResourcePolicyJSON = this.readStringParameter(SSM_CUSTOM_API_RESOURCE_POLICY, 'NONE');
        // lookup vpc
        const vpcId = ssm.StringParameter.valueFromLookup(this, SSM_VPC_ID);
        this.vpc = aws_ec2_1.Vpc.fromLookup(this, 'vpc', {
            vpcId,
        });
        // look up apigatewayVpcEndpointId only when APIGateway is in private setting
        if (this.deploymentOptions.apiGatewayType === 'private') {
            const vpcEndpointId = ssm.StringParameter.valueFromLookup(this, SSM_VPC_ENDPOINT_ID);
            this.apigatewayVpcEndpoint =
                aws_ec2_1.InterfaceVpcEndpoint.fromInterfaceVpcEndpointAttributes(this, 'apigatewayVpcEndpoint', {
                    vpcEndpointId,
                    port: 443,
                });
        }
        // look up permission boundary policy arn from shared infra
        const policyArn = ssm.StringParameter.valueFromLookup(this, SSM_PERMISSION_BOUNDARY_POLICY_ARN);
        this.permissionBoundaryPolicyArn = /arn:aws:iam::[0-9]+:policy\/.+/.test(policyArn)
            ? policyArn
            : '';
        // look up web distribution id
        this.webDistributionId = ssm.StringParameter.valueFromLookup(this, SSM_WEB_DIST_ID);
        // look up subnet mapping
        const subnetMappingOptions = this.readJSONParameter(SSM_SUBNET_MAPPING, {
            ingress: {
                subnetGroupName: 'ingress',
                securityGroupIds: [],
            },
            service: {
                subnetGroupName: 'service',
                securityGroupIds: [],
            },
            database: {
                subnetGroupName: 'database',
                securityGroupIds: [],
            },
        });
        this.subnetMapping = {
            ingress: this.getSubnetSecurityGroupMapping(subnetMappingOptions.ingress),
            service: this.getSubnetSecurityGroupMapping(subnetMappingOptions.service),
            database: this.getSubnetSecurityGroupMapping(subnetMappingOptions.database),
        };
        const esServiceLinkedRoleFlag = ssm.StringParameter.valueFromLookup(this, SSM_ES_SERVICE_LINKED_ROLE_AVILABLE);
        this.elasticSearchServiceLinkedRoleAvailable =
            esServiceLinkedRoleFlag.toLowerCase() === 'true';
        this.apiGatewayWebAclArn = ssm.StringParameter.valueFromLookup(this, SSM_API_WEB_ACL_ARN);
    }
    getSubnetSecurityGroupMapping(mapping) {
        return {
            subnetGroupName: mapping.subnetGroupName,
            securityGroups: mapping.securityGroupIds.length > 0
                ? mapping.securityGroupIds.map((id) => aws_ec2_1.SecurityGroup.fromSecurityGroupId(this, `sg-${id}`, id, {
                    allowAllOutbound: false,
                    mutable: false,
                }))
                : undefined,
        };
    }
    getSubnetsByGroupName(subnetGroupName) {
        return {
            subnetGroupName: this.subnetMapping[subnetGroupName].subnetGroupName,
        };
    }
    getSubnetSecurityGroups(subnetGroupName) {
        return this.subnetMapping[subnetGroupName].securityGroups;
    }
    /**
     * Read JSON string stored in SSM ParameterStore and return object
     *
     * This function returns a default value if the value returned from `ssm.StringParameter.valueFromLookup` is an token
     * so that the synth process can continue. It happens when cdk doesn't have this ssm parameter cached in cdk.context.json
     *
     * During cdk synth time, SSM parameter values could be resolved into token first
     * before the real string value is fetched from the server. Once the value is fetched
     * it will be stored in cdk.context.json.
     *
     * CDK will run the same stack a few passes during the synth. The token will only
     * be resolved in the real string in the later passes but not the first pass.
     *
     * If the SSM parameter value need to be parsed and used in the stack code, the
     * stack code will only get the token in first pass and will fail and thus
     * prevent the stack synth to be completed.
     *
     * The workaround is to run cdk synth twice, with refreshContext flag in the
     * first time. When this flag is set, the stack should run some special code
     * which only retrieve SSM parameters. This will force cdk to retrieve it from
     * the environment and store it in cdk.context.json. The stack code should not
     * parse or interprete the value.
    
     * After the first synth completed (with only the SSM parameters in the stack),
     * run cdk synth again without setting this flag (refreshContext). The second
     * cdk synth will read the SSM parameter values from cdk.context.json and will pass.
     *
     * @param parameterName Name of the SSM parameter
     * @param defaultValue The default value of this SSM parameter if the value is not retrieve yet.
     * @returns JSON Object that stored in this SSM paramter or the default value
     */
    readJSONParameter(parameterName, defaultValue) {
        const value = ssm.StringParameter.valueFromLookup(this, parameterName);
        if (value === `dummy-value-for-${parameterName}`) {
            return defaultValue;
        }
        else {
            return JSON.parse(value);
        }
    }
    readStringParameter(parameterName, defaultValue) {
        const value = ssm.StringParameter.valueFromLookup(this, parameterName);
        if (value === `dummy-value-for-${parameterName}`) {
            return defaultValue;
        }
        else {
            return value;
        }
    }
}
exports.AGSSharedInfraClient = AGSSharedInfraClient;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiYWdzLXNoYXJlZC1pbmZyYS1jbGllbnQuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi9saWIvYWdzLXNoYXJlZC1pbmZyYS1jbGllbnQudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7O0FBQUE7Ozs7Ozs7Ozs7Ozs7O0VBY0U7QUFDRixxQ0FBcUM7QUFDckMsOENBUTBCO0FBQzFCLHdDQUF3QztBQVF4QyxzQkFBc0I7QUFDdEIsTUFBTSxlQUFlLEdBQUcsaUJBQWlCLENBQUM7QUFDMUMsTUFBTSxzQkFBc0IsR0FBRyx3QkFBd0IsQ0FBQztBQUN4RCxNQUFNLFVBQVUsR0FBRyxZQUFZLENBQUM7QUFDaEMsTUFBTSxtQkFBbUIsR0FBRyw4QkFBOEIsQ0FBQztBQUMzRCxNQUFNLGtDQUFrQyxHQUFHLGtDQUFrQyxDQUFDO0FBQzlFLE1BQU0sZUFBZSxHQUFHLDhCQUE4QixDQUFDO0FBQ3ZELE1BQU0sa0JBQWtCLEdBQUcsb0JBQW9CLENBQUM7QUFDaEQsTUFBTSxtQ0FBbUMsR0FDckMsOENBQThDLENBQUM7QUFDbkQsTUFBTSw4QkFBOEIsR0FBRyxrQ0FBa0MsQ0FBQztBQUMxRSxNQUFNLG1CQUFtQixHQUFHLDBCQUEwQixDQUFDO0FBRXZELE1BQWEsb0JBQXFCLFNBQVEsR0FBRyxDQUFDLFNBQVM7SUFpRW5ELFlBQVksS0FBb0IsRUFBRSxFQUFVO1FBQ3hDLEtBQUssQ0FBQyxLQUFLLEVBQUUsRUFBRSxDQUFDLENBQUM7UUFFakIsdURBQXVEO1FBQ3ZELElBQUksQ0FBQyxVQUFVLEdBQUcsR0FBRyxDQUFDLGVBQWUsQ0FBQyxlQUFlLENBQUMsSUFBSSxFQUFFLGVBQWUsQ0FBQyxDQUFDO1FBQzdFLElBQUksQ0FBQyxpQkFBaUIsR0FBRyxJQUFJLENBQUMsaUJBQWlCLENBQUMsc0JBQXNCLEVBQUU7WUFDcEUsY0FBYyxFQUFFLFNBQVM7WUFDekIsZUFBZSxFQUFFLEtBQUs7WUFDdEIsbUJBQW1CLEVBQUUsSUFBSTtZQUN6Qix3QkFBd0Is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QUM5QyxPQUFPLFlBQVksQ0FBQztTQUN2QjthQUFNO1lBQ0gsT0FBTyxLQUFLLENBQUM7U0FDaEI7SUFDTCxDQUFDO0NBQ0o7QUFoUEQsb0RBZ1BDIiwic291cmNlc0NvbnRlbnQiOlsiLyogXG4gIENvcHlyaWdodCBBbWF6b24uY29tLCBJbmMuIG9yIGl0cyBhZmZpbGlhdGVzLiBBbGwgUmlnaHRzIFJlc2VydmVkLlxuICBcbiAgTGljZW5zZWQgdW5kZXIgdGhlIEFwYWNoZSBMaWNlbnNlLCBWZXJzaW9uIDIuMCAodGhlIFwiTGljZW5zZVwiKS5cbiAgWW91IG1heSBub3QgdXNlIHRoaXMgZmlsZSBleGNlcHQgaW4gY29tcGxpYW5jZSB3aXRoIHRoZSBMaWNlbnNlLlxuICBZb3UgbWF5IG9idGFpbiBhIGNvcHkgb2YgdGhlIExpY2Vuc2UgYXRcbiAgXG4gICAgICBodHRwOi8vd3d3LmFwYWNoZS5vcmcvbGljZW5zZXMvTElDRU5TRS0yLjBcbiAgXG4gIFVubGVzcyByZXF1aXJlZCBieSBhcHBsaWNhYmxlIGxhdyBvciBhZ3JlZWQgdG8gaW4gd3JpdGluZywgc29mdHdhcmVcbiAgZGlzdHJpYnV0ZWQgdW5kZXIgdGhlIExpY2Vuc2UgaXMgZGlzdHJpYnV0ZWQgb24gYW4gXCJBUyBJU1wiIEJBU0lTLFxuICBXSVRIT1VUIFdBUlJBTlRJRVMgT1IgQ09ORElUSU9OUyBPRiBBTlkgS0lORCwgZWl0aGVyIGV4cHJlc3Mgb3IgaW1wbGllZC5cbiAgU2VlIHRoZSBMaWNlbnNlIGZvciB0aGUgc3BlY2lmaWMgbGFuZ3VhZ2UgZ292ZXJuaW5nIHBlcm1pc3Npb25zIGFuZFxuICBsaW1pdGF0aW9ucyB1bmRlciB0aGUgTGljZW5zZS5cbiovXG5pbXBvcnQgKiBhcyBjZGsgZnJvbSAnQGF3cy1jZGsvY29yZSc7XG5pbXBvcnQge1xuICAgIElWcGMsXG4gICAgVnBjLFxuICAgIElJbnRlcmZhY2VWcGNFbmRwb2ludCxcbiAgICBJbnRlcmZhY2VWcGNFbmRwb2ludCxcbiAgICBTdWJuZXRTZWxlY3Rpb24sXG4gICAgSVNlY3VyaXR5R3JvdXAsXG4gICAgU2VjdXJpdHlHcm91cCxcbn0gZnJvbSAnQGF3cy1jZGsvYXdzLWVjMic7XG5pbXBvcnQgKiBhcyBzc20gZnJvbSAnQGF3cy1jZGsvYXdzLXNzbSc7XG5pbXBvcnQge1xuICAgIERlcGxveW1lbnRPcHRpb25zLFxuICAgIFN1Ym5ldEdyb3VwLFxuICAgIFN1Ym5ldE1hcHBpbmcsXG4gICAgU3VibmV0TWFwcGluZ09wdGlvbnMsXG59IGZyb20gJy4vYWdzLXR5cGVzJztcblxuLy8gU1NNIFBhcmFtZXRlciBOYW1lc1xuY29uc3QgU1NNX0NPTkZJR19OQU1FID0gJy9hZ3MvY29uZmlnTmFtZSc7XG5jb25zdCBTU01fREVQTE9ZTUVOVF9PUFRJT05TID0gJy9hZ3MvZGVwbG95bWVudE9wdGlvbnMnO1xuY29uc3QgU1NNX1ZQQ19JRCA9ICcvYWdzL3ZwY0lkJztcbmNvbnN0IFNTTV9WUENfRU5EUE9JTlRfSUQgPSAnL2Fncy9hcGlnYXRld2F5VnBjRW5kcG9pbnRJZCc7XG5jb25zdCBTU01fUEVSTUlTU0lPTl9CT1VOREFSWV9QT0xJQ1lfQVJOID0gJy9hZ3MvcGVybWlzc2lvbkJvdW5kYXJ5UG9saWN5QXJuJztcbmNvbnN0IFNTTV9XRUJfRElTVF9JRCA9ICcvYWdzL3dlYkNsaWVudERpc3RyaWJ1dGlvbklkJztcbmNvbnN0IFNTTV9TVUJORVRfTUFQUElORyA9ICcvYWdzL3N1Ym5ldG1hcHBpbmcnO1xuY29uc3QgU1NNX0VTX1NFUlZJQ0VfTElOS0VEX1JPTEVfQVZJTEFCTEUgPVxuICAgICcvYWdzL2VsYXN0aWNTZWFyY2hTZXJ2aWNlTGlua2VkUm9sZUF2YWlsYWJsZSc7XG5jb25zdCBTU01fQ1VTVE9NX0FQSV9SRVNPVVJDRV9QT0xJQ1kgPSAnL2Fncy9jdXN0b21BUElSZXNvdXJjZVBvbGljeUpTT04nO1xuY29uc3QgU1NNX0FQSV9XRUJfQUNMX0FSTiA9ICcvYWdzL2FwaWdhdGV3YXlXZWJBY2xBcm4nO1xuXG5leHBvcnQgY2xhc3MgQUdTU2hhcmVkSW5mcmFDbGllbnQgZXh0ZW5kcyBjZGsuQ29uc3RydWN0IHtcbiAgICAvLyBzaGFyZWQgaW5mcmEgY29udGV4dFxuICAgIC8qKlxuICAgICAqIE5hbWUgb2YgdGhlIGNvbmZpZ3VyYXRpb24gZGVwbG95ZWQgYnkgdGhlIFNoYXJlZCBJbmZyYSBpbiB0aGUgdGFyZ2V0IGVudmlyb25tZW50LlxuICAgICAqXG4gICAgICovXG4gICAgcHVibGljIHJlYWRvbmx5IGNvbmZpZ05hbWU6IHN0cmluZztcbiAgICAvKipcbiAgICAgKiBEZXBsb3ltZW50IG9wdGlvbnMgb2YgdGhlIFNoYXJlZCBJbmZyYSBpbiB0aGUgdGFyZ2V0IGVudmlyb25tZW50LlxuICAgICAqXG4gICAgICovXG4gICAgcHVibGljIHJlYWRvbmx5IGRlcGxveW1lbnRPcHRpb25zOiBEZXBsb3ltZW50T3B0aW9ucztcbiAgICAvKipcbiAgICAgKiBBIGxpc3Qgb2YgdGhlIEFXUyBhY2NvdW50IElEcyBvZiB0aGUgdHJ1c3RlZCBkZXZlbG9wbWVudCBhY2NvdW50cy5cbiAgICAgKlxuICAgICAqIFNlcnZpY2VzIGRldmVwbG95ZWQgaW4gYW55IGFjY291bnQgaW4gdGhlIGxpc3Qgd2lsbCBiZSBhYmxlIHRvIGNhbGwgQVBJcyBpbiB0aGUgdGVhbSBzaGFyZWQgYWNjb3VudFxuICAgICAqL1xuICAgIHB1YmxpYyByZWFkb25seSB0cnVzdGVkRGV2ZWxvcGVyQWNjb3VudHM6IHN0cmluZ1tdO1xuICAgIC8qKlxuICAgICAqIFZQQyBpbiB0aGUgU2hhcmVkIEluZnJhIGluIHRoZSB0YXJnZXQgZW52aXJvbm1lbnQuXG4gICAgICpcbiAgICAgKi9cbiAgICBwdWJsaWMgcmVhZG9ubHkgdnBjOiBJVnBjO1xuICAgIC8qKlxuICAgICAqIEludGVyZmFjZVZQQ0VuZHBvaW50IGluIHRoZSBTaGFyZWQgSW5mcmEgaW4gdGhlIHRhcmdldCBlbnZpcm9ubWVudC5cbiAgICAgKlxuICAgICAqIFRoZSBJbnRlcmZhY2VWUENFbmRwb2ludCBpcyBvbmx5IGF2YWlsYWJsZSB3aGVuIGFwaUdhdGV3YXlUeXBlIGluXG4gICAgICogZGVwbG95bWVudE9wdGlvbnMgaXMgc2V0IHRvIGBwcml2YXRlYC5cbiAgICAgKiBXaGVuIGFwaUdhdGV3YXlUeXBlIGlzIHNldCB0byBgcHVibGljYCBvciBgY2xvdWRmcm9udGAsIHRoaXMgdmF1bGUgaXMgdW5kZWZpbmVkXG4gICAgICovXG4gICAgcHVibGljIHJlYWRvbmx5IGFwaWdhdGV3YXlWcGNFbmRwb2ludDogSUludGVyZmFjZVZwY0VuZHBvaW50O1xuICAgIC8qKlxuICAgICAqIENsb3VkRnJvbnQgZGlzdHJpYnV0aW9uIElEIGZvciBXZWIgQ2xpZW50IGRlcGxveWVkIGJ5IFNoYXJlZCBJbmZyYSBpbiB0aGUgdGFyZ2V0IGFjY291bnRcbiAgICAgKlxuICAgICAqL1xuICAgIHB1YmxpYyByZWFkb25seSB3ZWJEaXN0cmlidXRpb25JZDogc3RyaW5nO1xuXG4gICAgLyoqXG4gICAgICogTWFuYWdlZCBwZXJtaXNzaW9uIGJvdW5kYXJ5IHBvbGljeSBBUk5cbiAgICAgKlxuICAgICAqL1xuICAgIHB1YmxpYyByZWFkb25seSBwZXJtaXNzaW9uQm91bmRhcnlQb2xpY3lBcm46IHN0cmluZztcblxuICAgIC8qKlxuICAgICAqIEZsYWcgaW5kaWNhdGluZyB3aGV0aGVyIGEgc2VydmljZSBsaW5rZWQgcm9sZSBmb3IgRWxhc3RpY1NlYXJjaCBpcyBhdmFpbGFibGUgaW4gdGhlIHRhcmdldCBlbnZpcm9ubWVudC5cbiAgICAgKi9cbiAgICBwdWJsaWMgcmVhZG9ubHkgZWxhc3RpY1NlYXJjaFNlcnZpY2VMaW5rZWRSb2xlQXZhaWxhYmxlOiBib29sZWFuO1xuXG4gICAgLyoqXG4gICAgICogSlNPTiBUZXh0IGZvciBhZGRpdG9uYWwgY3VzdG9tIEFQSUdhdGV3YXkgcmVzb3VyY2UgcG9saWN5LiBTZXQgdG8gTk9ORSB0byBpbmRpY2F0ZSB0aGVyZSBpcyBubyBjdXN0b20gQVBJIHJlc291cmNlIHBvbGljeVxuICAgICAqL1xuICAgIHB1YmxpYyByZWFkb25seSBjdXN0b21BUElSZXNvdXJjZVBvbGljeUpTT046IHN0cmluZztcblxuICAgIC8qKlxuICAgICAqIEFSTiBvZiBXQUYgV2ViIEFDTCBmb3IgQVBJR2F0ZXdheSBBUElzXG4gICAgICovXG4gICAgcHVibGljIHJlYWRvbmx5IGFwaUdhdGV3YXlXZWJBY2xBcm46IHN0cmluZztcblxuICAgIHByaXZhdGUgcmVhZG9ubHkgc3VibmV0TWFwcGluZzoge1xuICAgICAgICBba2V5IGluIFN1Ym5ldEdyb3VwXToge1xuICAgICAgICAgICAgc3VibmV0R3JvdXBOYW1lOiBzdHJpbmc7XG4gICAgICAgICAgICBzZWN1cml0eUdyb3VwczogSVNlY3VyaXR5R3JvdXBbXSB8IHVuZGVmaW5lZDtcbiAgICAgICAgfTtcbiAgICB9O1xuXG4gICAgY29uc3RydWN0b3Ioc2NvcGU6IGNkay5Db25zdHJ1Y3QsIGlkOiBzdHJpbmcpIHtcbiAgICAgICAgc3VwZXIoc2NvcGUsIGlkKTtcblxuICAgICAgICAvLyBsb2FkIFNoYXJlZCBJbmZyYSBjb25maWd1cmF0aW9ucyBmcm9tIFNTTSBQYXJhbWV0ZXJzXG4gICAgICAgIHRoaXMuY29uZmlnTmFtZSA9IHNzbS5TdHJpbmdQYXJhbWV0ZXIudmFsdWVGcm9tTG9va3VwKHRoaXMsIFNTTV9DT05GSUdfTkFNRSk7XG4gICAgICAgIHRoaXMuZGVwbG95bWVudE9wdGlvbnMgPSB0aGlzLnJlYWRKU09OUGFyYW1ldGVyKFNTTV9ERVBMT1lNRU5UX09QVElPTlMsIHtcbiAgICAgICAgICAgIGFwaUdhdGV3YXlUeXBlOiAncHJpdmF0ZScsXG4gICAgICAgICAgICBiYXN0aW9uSW5zdGFuY2U6IGZhbHNlLFxuICAgICAgICAgICAgZGV2ZWxvcG1lbnRVc2VyUm9sZTogdHJ1ZSxcbiAgICAgICAgICAgIHRydXN0ZWREZXZlbG9wZXJBY2NvdW50czogJycsXG4gICAgICAgIH0pO1xuICAgICAgICB0aGlzLnRydXN0ZWREZXZlbG9wZXJBY2NvdW50cyA9IChcbiAgICAgICAgICAgIHRoaXMuZGVwbG95bWVudE9wdGlvbnMudHJ1c3RlZERldmVsb3BlckFjY291bnRzIHx8ICcnXG4gICAgICAgICkuc3BsaXQoJywnKTtcblxuICAgICAgICB0aGlzLmN1c3RvbUFQSVJlc291cmNlUG9saWN5SlNPTiA9IHRoaXMucmVhZFN0cmluZ1BhcmFtZXRlcihcbiAgICAgICAgICAgIFNTTV9DVVNUT01fQVBJX1JFU09VUkNFX1BPTElDWSxcbiAgICAgICAgICAgICdOT05FJ1xuICAgICAgICApO1xuXG4gICAgICAgIC8vIGxvb2t1cCB2cGNcbiAgICAgICAgY29uc3QgdnBjSWQgPSBzc20uU3RyaW5nUGFyYW1ldGVyLnZhbHVlRnJvbUxvb2t1cCh0aGlzLCBTU01fVlBDX0lEKTtcbiAgICAgICAgdGhpcy52cGMgPSBWcGMuZnJvbUxvb2t1cCh0aGlzLCAndnBjJywge1xuICAgICAgICAgICAgdnBjSWQsXG4gICAgICAgIH0pO1xuXG4gICAgICAgIC8vIGxvb2sgdXAgYXBpZ2F0ZXdheVZwY0VuZHBvaW50SWQgb25seSB3aGVuIEFQSUdhdGV3YXkgaXMgaW4gcHJpdmF0ZSBzZXR0aW5nXG4gICAgICAgIGlmICh0aGlzLmRlcGxveW1lbnRPcHRpb25zLmFwaUdhdGV3YXlUeXBlID09PSAncHJpdmF0ZScpIHtcbiAgICAgICAgICAgIGNvbnN0IHZwY0VuZHBvaW50SWQgPSBzc20uU3RyaW5nUGFyYW1ldGVyLnZhbHVlRnJvbUxvb2t1cChcbiAgICAgICAgICAgICAgICB0aGlzLFxuICAgICAgICAgICAgICAgIFNTTV9WUENfRU5EUE9JTlRfSURcbiAgICAgICAgICAgICk7XG4gICAgICAgICAgICB0aGlzLmFwaWdhdGV3YXlWcGNFbmRwb2ludCA9XG4gICAgICAgICAgICAgICAgSW50ZXJmYWNlVnBjRW5kcG9pbnQuZnJvbUludGVyZmFjZVZwY0VuZHBvaW50QXR0cmlidXRlcyhcbiAgICAgICAgICAgICAgICAgICAgdGhpcyxcbiAgICAgICAgICAgICAgICAgICAgJ2FwaWdhdGV3YXlWcGNFbmRwb2ludCcsXG4gICAgICAgICAgICAgICAgICAgIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHZwY0VuZHBvaW50SWQsXG4gICAgICAgICAgICAgICAgICAgICAgICBwb3J0OiA0NDMsXG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICApO1xuICAgICAgICB9XG5cbiAgICAgICAgLy8gbG9vayB1cCBwZXJtaXNzaW9uIGJvdW5kYXJ5IHBvbGljeSBhcm4gZnJvbSBzaGFyZWQgaW5mcmFcbiAgICAgICAgY29uc3QgcG9saWN5QXJuID0gc3NtLlN0cmluZ1BhcmFtZXRlci52YWx1ZUZyb21Mb29rdXAoXG4gICAgICAgICAgICB0aGlzLFxuICAgICAgICAgICAgU1NNX1BFUk1JU1NJT05fQk9VTkRBUllfUE9MSUNZX0FSTlxuICAgICAgICApO1xuXG4gICAgICAgIHRoaXMucGVybWlzc2lvbkJvdW5kYXJ5UG9saWN5QXJuID0gL2Fybjphd3M6aWFtOjpbMC05XSs6cG9saWN5XFwvLisvLnRlc3QoXG4gICAgICAgICAgICBwb2xpY3lBcm5cbiAgICAgICAgKVxuICAgICAgICAgICAgPyBwb2xpY3lBcm5cbiAgICAgICAgICAgIDogJyc7XG5cbiAgICAgICAgLy8gbG9vayB1cCB3ZWIgZGlzdHJpYnV0aW9uIGlkXG4gICAgICAgIHRoaXMud2ViRGlzdHJpYnV0aW9uSWQgPSBzc20uU3RyaW5nUGFyYW1ldGVyLnZhbHVlRnJvbUxvb2t1cChcbiAgICAgICAgICAgIHRoaXMsXG4gICAgICAgICAgICBTU01fV0VCX0RJU1RfSURcbiAgICAgICAgKTtcblxuICAgICAgICAvLyBsb29rIHVwIHN1Ym5ldCBtYXBwaW5nXG4gICAgICAgIGNvbnN0IHN1Ym5ldE1hcHBpbmdPcHRpb25zID0gdGhpcy5yZWFkSlNPTlBhcmFtZXRlcjxTdWJuZXRNYXBwaW5nT3B0aW9ucz4oXG4gICAgICAgICAgICBTU01fU1VCTkVUX01BUFBJTkcsXG4gICAgICAgICAgICB7XG4gICAgICAgICAgICAgICAgaW5ncmVzczoge1xuICAgICAgICAgICAgICAgICAgICBzdWJuZXRHcm91cE5hbWU6ICdpbmdyZXNzJyxcbiAgICAgICAgICAgICAgICAgICAgc2VjdXJpdHlHcm91cElkczogW10sXG4gICAgICAgICAgICAgICAgfSxcbiAgICAgICAgICAgICAgICBzZXJ2aWNlOiB7XG4gICAgICAgICAgICAgICAgICAgIHN1Ym5ldEdyb3VwTmFtZTogJ3NlcnZpY2UnLFxuICAgICAgICAgICAgICAgICAgICBzZWN1cml0eUdyb3VwSWRzOiBbXSxcbiAgICAgICAgICAgICAgICB9LFxuICAgICAgICAgICAgICAgIGRhdGFiYXNlOiB7XG4gICAgICAgICAgICAgICAgICAgIHN1Ym5ldEdyb3VwTmFtZTogJ2RhdGFiYXNlJyxcbiAgICAgICAgICAgICAgICAgICAgc2VjdXJpdHlHcm91cElkczogW10sXG4gICAgICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIH1cbiAgICAgICAgKTtcblxuICAgICAgICB0aGlzLnN1Ym5ldE1hcHBpbmcgPSB7XG4gICAgICAgICAgICBpbmdyZXNzOiB0aGlzLmdldFN1Ym5ldFNlY3VyaXR5R3JvdXBNYXBwaW5nKHN1Ym5ldE1hcHBpbmdPcHRpb25zLmluZ3Jlc3MpLFxuICAgICAgICAgICAgc2VydmljZTogdGhpcy5nZXRTdWJuZXRTZWN1cml0eUdyb3VwTWFwcGluZyhzdWJuZXRNYXBwaW5nT3B0aW9ucy5zZXJ2aWNlKSxcbiAgICAgICAgICAgIGRhdGFiYXNlOiB0aGlzLmdldFN1Ym5ldFNlY3VyaXR5R3JvdXBNYXBwaW5nKHN1Ym5ldE1hcHBpbmdPcHRpb25zLmRhdGFiYXNlKSxcbiAgICAgICAgfTtcblxuICAgICAgICBjb25zdCBlc1NlcnZpY2VMaW5rZWRSb2xlRmxhZyA9IHNzbS5TdHJpbmdQYXJhbWV0ZXIudmFsdWVGcm9tTG9va3VwKFxuICAgICAgICAgICAgdGhpcyxcbiAgICAgICAgICAgIFNTTV9FU19TRVJWSUNFX0xJTktFRF9ST0xFX0FWSUxBQkxFXG4gICAgICAgICk7XG4gICAgICAgIHRoaXMuZWxhc3RpY1NlYXJjaFNlcnZpY2VMaW5rZWRSb2xlQXZhaWxhYmxlID1cbiAgICAgICAgICAgIGVzU2VydmljZUxpbmtlZFJvbGVGbGFnLnRvTG93ZXJDYXNlKCkgPT09ICd0cnVlJztcblxuICAgICAgICB0aGlzLmFwaUdhdGV3YXlXZWJBY2xBcm4gPSBzc20uU3RyaW5nUGFyYW1ldGVyLnZhbHVlRnJvbUxvb2t1cChcbiAgICAgICAgICAgIHRoaXMsXG4gICAgICAgICAgICBTU01fQVBJX1dFQl9BQ0xfQVJOXG4gICAgICAgICk7XG4gICAgfVxuXG4gICAgZ2V0U3VibmV0U2VjdXJpdHlHcm91cE1hcHBpbmcobWFwcGluZzogU3VibmV0TWFwcGluZyk6IHtcbiAgICAgICAgc3VibmV0R3JvdXBOYW1lOiBzdHJpbmc7XG4gICAgICAgIHNlY3VyaXR5R3JvdXBzOiBJU2VjdXJpdHlHcm91cFtdIHwgdW5kZWZpbmVkO1xuICAgIH0ge1xuICAgICAgICByZXR1cm4ge1xuICAgICAgICAgICAgc3VibmV0R3JvdXBOYW1lOiBtYXBwaW5nLnN1Ym5ldEdyb3VwTmFtZSxcbiAgICAgICAgICAgIHNlY3VyaXR5R3JvdXBzOlxuICAgICAgICAgICAgICAgIG1hcHBpbmcuc2VjdXJpdHlHcm91cElkcy5sZW5ndGggPiAwXG4gICAgICAgICAgICAgICAgICAgID8gbWFwcGluZy5zZWN1cml0eUdyb3VwSWRzLm1hcCgoaWQpID0+XG4gICAgICAgICAgICAgICAgICAgICAgICAgIFNlY3VyaXR5R3JvdXAuZnJvbVNlY3VyaXR5R3JvdXBJZCh0aGlzLCBgc2ctJHtpZH1gLCBpZCwge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgYWxsb3dBbGxPdXRib3VuZDogZmFsc2UsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICBtdXRhYmxlOiBmYWxzZSxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgfSlcbiAgICAgICAgICAgICAgICAgICAgICApXG4gICAgICAgICAgICAgICAgICAgIDogdW5kZWZpbmVkLFxuICAgICAgICB9O1xuICAgIH1cblxuICAgIGdldFN1Ym5ldHNCeUdyb3VwTmFtZShzdWJuZXRHcm91cE5hbWU6IFN1Ym5ldEdyb3VwKTogU3VibmV0U2VsZWN0aW9uIHwgdW5kZWZpbmVkIHtcbiAgICAgICAgcmV0dXJuIHtcbiAgICAgICAgICAgIHN1Ym5ldEdyb3VwTmFtZTogdGhpcy5zdWJuZXRNYXBwaW5nW3N1Ym5ldEdyb3VwTmFtZV0uc3VibmV0R3JvdXBOYW1lLFxuICAgICAgICB9O1xuICAgIH1cblxuICAgIGdldFN1Ym5ldFNlY3VyaXR5R3JvdXBzKHN1Ym5ldEdyb3VwTmFtZTogU3VibmV0R3JvdXApOiBJU2VjdXJpdHlHcm91cFtdIHwgdW5kZWZpbmVkIHtcbiAgICAgICAgcmV0dXJuIHRoaXMuc3VibmV0TWFwcGluZ1tzdWJuZXRHcm91cE5hbWVdLnNlY3VyaXR5R3JvdXBzO1xuICAgIH1cblxuICAgIC8qKlxuICAgICAqIFJlYWQgSlNPTiBzdHJpbmcgc3RvcmVkIGluIFNTTSBQYXJhbWV0ZXJTdG9yZSBhbmQgcmV0dXJuIG9iamVjdFxuICAgICAqXG4gICAgICogVGhpcyBmdW5jdGlvbiByZXR1cm5zIGEgZGVmYXVsdCB2YWx1ZSBpZiB0aGUgdmFsdWUgcmV0dXJuZWQgZnJvbSBgc3NtLlN0cmluZ1BhcmFtZXRlci52YWx1ZUZyb21Mb29rdXBgIGlzIGFuIHRva2VuXG4gICAgICogc28gdGhhdCB0aGUgc3ludGggcHJvY2VzcyBjYW4gY29udGludWUuIEl0IGhhcHBlbnMgd2hlbiBjZGsgZG9lc24ndCBoYXZlIHRoaXMgc3NtIHBhcmFtZXRlciBjYWNoZWQgaW4gY2RrLmNvbnRleHQuanNvblxuICAgICAqIFxuICAgICAqIER1cmluZyBjZGsgc3ludGggdGltZSwgU1NNIHBhcmFtZXRlciB2YWx1ZXMgY291bGQgYmUgcmVzb2x2ZWQgaW50byB0b2tlbiBmaXJzdFxuICAgICAqIGJlZm9yZSB0aGUgcmVhbCBzdHJpbmcgdmFsdWUgaXMgZmV0Y2hlZCBmcm9tIHRoZSBzZXJ2ZXIuIE9uY2UgdGhlIHZhbHVlIGlzIGZldGNoZWRcbiAgICAgKiBpdCB3aWxsIGJlIHN0b3JlZCBpbiBjZGsuY29udGV4dC5qc29uLlxuICAgICAqXG4gICAgICogQ0RLIHdpbGwgcnVuIHRoZSBzYW1lIHN0YWNrIGEgZmV3IHBhc3NlcyBkdXJpbmcgdGhlIHN5bnRoLiBUaGUgdG9rZW4gd2lsbCBvbmx5XG4gICAgICogYmUgcmVzb2x2ZWQgaW4gdGhlIHJlYWwgc3RyaW5nIGluIHRoZSBsYXRlciBwYXNzZXMgYnV0IG5vdCB0aGUgZmlyc3QgcGFzcy5cbiAgICAgKlxuICAgICAqIElmIHRoZSBTU00gcGFyYW1ldGVyIHZhbHVlIG5lZWQgdG8gYmUgcGFyc2VkIGFuZCB1c2VkIGluIHRoZSBzdGFjayBjb2RlLCB0aGVcbiAgICAgKiBzdGFjayBjb2RlIHdpbGwgb25seSBnZXQgdGhlIHRva2VuIGluIGZpcnN0IHBhc3MgYW5kIHdpbGwgZmFpbCBhbmQgdGh1c1xuICAgICAqIHByZXZlbnQgdGhlIHN0YWNrIHN5bnRoIHRvIGJlIGNvbXBsZXRlZC5cbiAgICAgKlxuICAgICAqIFRoZSB3b3JrYXJvdW5kIGlzIHRvIHJ1biBjZGsgc3ludGggdHdpY2UsIHdpdGggcmVmcmVzaENvbnRleHQgZmxhZyBpbiB0aGVcbiAgICAgKiBmaXJzdCB0aW1lLiBXaGVuIHRoaXMgZmxhZyBpcyBzZXQsIHRoZSBzdGFjayBzaG91bGQgcnVuIHNvbWUgc3BlY2lhbCBjb2RlXG4gICAgICogd2hpY2ggb25seSByZXRyaWV2ZSBTU00gcGFyYW1ldGVycy4gVGhpcyB3aWxsIGZvcmNlIGNkayB0byByZXRyaWV2ZSBpdCBmcm9tXG4gICAgICogdGhlIGVudmlyb25tZW50IGFuZCBzdG9yZSBpdCBpbiBjZGsuY29udGV4dC5qc29uLiBUaGUgc3RhY2sgY29kZSBzaG91bGQgbm90XG4gICAgICogcGFyc2Ugb3IgaW50ZXJwcmV0ZSB0aGUgdmFsdWUuXG4gICAgXG4gICAgICogQWZ0ZXIgdGhlIGZpcnN0IHN5bnRoIGNvbXBsZXRlZCAod2l0aCBvbmx5IHRoZSBTU00gcGFyYW1ldGVycyBpbiB0aGUgc3RhY2spLFxuICAgICAqIHJ1biBjZGsgc3ludGggYWdhaW4gd2l0aG91dCBzZXR0aW5nIHRoaXMgZmxhZyAocmVmcmVzaENvbnRleHQpLiBUaGUgc2Vjb25kXG4gICAgICogY2RrIHN5bnRoIHdpbGwgcmVhZCB0aGUgU1NNIHBhcmFtZXRlciB2YWx1ZXMgZnJvbSBjZGsuY29udGV4dC5qc29uIGFuZCB3aWxsIHBhc3MuXG4gICAgICpcbiAgICAgKiBAcGFyYW0gcGFyYW1ldGVyTmFtZSBOYW1lIG9mIHRoZSBTU00gcGFyYW1ldGVyXG4gICAgICogQHBhcmFtIGRlZmF1bHRWYWx1ZSBUaGUgZGVmYXVsdCB2YWx1ZSBvZiB0aGlzIFNTTSBwYXJhbWV0ZXIgaWYgdGhlIHZhbHVlIGlzIG5vdCByZXRyaWV2ZSB5ZXQuXG4gICAgICogQHJldHVybnMgSlNPTiBPYmplY3QgdGhhdCBzdG9yZWQgaW4gdGhpcyBTU00gcGFyYW10ZXIgb3IgdGhlIGRlZmF1bHQgdmFsdWVcbiAgICAgKi9cbiAgICByZWFkSlNPTlBhcmFtZXRlcjxUPihwYXJhbWV0ZXJOYW1lOiBzdHJpbmcsIGRlZmF1bHRWYWx1ZTogVCk6IFQge1xuICAgICAgICBjb25zdCB2YWx1ZSA9IHNzbS5TdHJpbmdQYXJhbWV0ZXIudmFsdWVGcm9tTG9va3VwKHRoaXMsIHBhcmFtZXRlck5hbWUpO1xuICAgICAgICBpZiAodmFsdWUgPT09IGBkdW1teS12YWx1ZS1mb3ItJHtwYXJhbWV0ZXJOYW1lfWApIHtcbiAgICAgICAgICAgIHJldHVybiBkZWZhdWx0VmFsdWU7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICByZXR1cm4gSlNPTi5wYXJzZSh2YWx1ZSk7XG4gICAgICAgIH1cbiAgICB9XG5cbiAgICByZWFkU3RyaW5nUGFyYW1ldGVyKHBhcmFtZXRlck5hbWU6IHN0cmluZywgZGVmYXVsdFZhbHVlOiBzdHJpbmcpOiBzdHJpbmcge1xuICAgICAgICBjb25zdCB2YWx1ZSA9IHNzbS5TdHJpbmdQYXJhbWV0ZXIudmFsdWVGcm9tTG9va3VwKHRoaXMsIHBhcmFtZXRlck5hbWUpO1xuICAgICAgICBpZiAodmFsdWUgPT09IGBkdW1teS12YWx1ZS1mb3ItJHtwYXJhbWV0ZXJOYW1lfWApIHtcbiAgICAgICAgICAgIHJldHVybiBkZWZhdWx0VmFsdWU7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICByZXR1cm4gdmFsdWU7XG4gICAgICAgIH1cbiAgICB9XG59XG4iXX0=