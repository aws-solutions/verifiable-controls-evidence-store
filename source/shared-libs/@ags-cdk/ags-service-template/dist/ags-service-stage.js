"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AGSServiceStage = void 0;
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
const ssm = require("aws-cdk-lib/aws-ssm");
const ags_aspects_1 = require("./ags-aspects");
/**
 * The Service Stage base class that defined a `Service Stage` that can be deployed into
 * a specific target environment.
 *
 * An instance of this class is synthed into a sub-directly in cdk.out and contains the
 * cloud assembly for a partitular target environment.
 */
class AGSServiceStage extends cdk.Stage {
    constructor(scope, id, props) {
        super(scope, id, props);
        this.serviceName = props.serviceName;
        this.configuration = props.configuration || {};
        this.configName = props.configName;
        console.log(`CDK synth ${this.serviceName} on stage [${id}] with configuration [${this.configName}] to target environment ${props.envName} [${this.account}/${this.region}].`);
        // common Tags
        this.tags = {
            'ags:application': 'AWS Governance Suite',
            'ags:service': this.serviceName,
            'ags:configName': this.configName,
            'ags:env': props.envName,
        };
        this.solutionInfo = props.solutionInfo;
    }
    /**
     * Instantiate and add a Service Stack to the stage.
     *
     * This function instantiate a new Service Stack class and add it to the stage.
     *
     * @param stackConstructor Service stack class name
     * @param name The name of the stack if there are multiple stacks. It can be omitted if only one stack
     * @param props The properties for this particular stack
     * @returns Service stack object
     */
    addStack(stackConstructor, name = '', props) {
        var _a, _b;
        let stackName = this.serviceName;
        if (name && name.trim().length > 0) {
            stackName += `-${name.trim()}`;
        }
        const solutionId = (_a = this.solutionInfo) === null || _a === void 0 ? void 0 : _a.solutionId;
        const solutionVersion = (_b = this.solutionInfo) === null || _b === void 0 ? void 0 : _b.solutionVersion;
        const agsDescription = `AGS Service stack for ${this.serviceName}`;
        // if there is a provided description, use it, otherwise construct it from solutionId, solutionVersion and standard AGS service descritpion
        const description = props.description
            ? props.description
            : solutionId && solutionVersion
                ? `(${solutionId}) - ${agsDescription}. Version ${solutionVersion}`
                : agsDescription;
        const stackProps = {
            serviceProps: {
                ...props,
                serviceName: this.serviceName,
                configName: this.configName,
                configuration: this.configuration,
                solutionId,
                solutionVersion,
            },
            stackName: stackName,
            description,
            tags: this.tags,
        };
        const stack = new stackConstructor(this, stackName, stackProps);
        // look up permission boundary policy arn from shared infra
        const policyArn = ssm.StringParameter.valueFromLookup(stack, '/ags/permissionBoundaryPolicyArn');
        if (/arn:aws:iam::[0-9]+:policy\/.+/.test(policyArn)) {
            cdk.Aspects.of(stack).add(new ags_aspects_1.PermissionsBoundary(policyArn));
        }
        return stack;
    }
}
exports.AGSServiceStage = AGSServiceStage;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiYWdzLXNlcnZpY2Utc3RhZ2UuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi9saWIvYWdzLXNlcnZpY2Utc3RhZ2UudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7O0FBQUE7Ozs7Ozs7Ozs7Ozs7O0VBY0U7QUFDRixtQ0FBbUM7QUFDbkMsMkNBQTJDO0FBRzNDLCtDQUFvRDtBQTZDcEQ7Ozs7OztHQU1HO0FBQ0gsTUFBYSxlQUFnQixTQUFRLEdBQUcsQ0FBQyxLQUFLO0lBTzFDLFlBQVksS0FBZ0IsRUFBRSxFQUFVLEVBQUUsS0FBMkI7UUFDakUsS0FBSyxDQUFDLEtBQUssRUFBRSxFQUFFLEVBQUUsS0FBSyxDQUFDLENBQUM7UUFFeEIsSUFBSSxDQUFDLFdBQVcsR0FBRyxLQUFLLENBQUMsV0FBVyxDQUFDO1FBQ3JDLElBQUksQ0FBQyxhQUFhLEdBQUcsS0FBSyxDQUFDLGFBQWEsSUFBSSxFQUFFLENBQUM7UUFDL0MsSUFBSSxDQUFDLFVBQVUsR0FBRyxLQUFLLENBQUMsVUFBVSxDQUFDO1FBRW5DLE9BQU8sQ0FBQyxHQUFHLENBQ1AsYUFBYSxJQUFJLENBQUMsV0FBVyxjQUFjLEVBQUUseUJBQXlCLElBQUksQ0FBQyxVQUFVLDJCQUEyQixLQUFLLENBQUMsT0FBTyxLQUFLLElBQUksQ0FBQyxPQUFPLElBQUksSUFBSSxDQUFDLE1BQU0sSUFBSSxDQUNwSyxDQUFDO1FBRUYsY0FBYztRQUNkLElBQUksQ0FBQyxJQUFJLEdBQUc7WUFDUixpQkFBaUIsRUFBRSxzQkFBc0I7WUFDekMsYUFBYSxFQUFFLElBQUksQ0FBQyxXQUFXO1lBQy9CLGdCQUFnQixFQUFFLElBQUksQ0FBQyxVQUFVO1lBQ2pDLFNBQVMsRUFBRSxLQUFLLENBQUMsT0FBTztTQUMzQixDQUFDO1FBRUYsSUFBSSxDQUFDLFlBQVksR0FBRyxLQUFLLENBQUMsWUFBWSxDQUFDO0lBQzNDLENBQUM7SUFFRDs7Ozs7Ozs7O09BU0c7SUFDSCxRQUFRLENBQ0osZ0JBQW1DLEVBQ25DLE9BQWUsRUFBRSxFQUNqQixLQUFROztRQUVSLElBQUksU0FBUyxHQUFHLElBQUksQ0FBQyxXQUFXLENBQUM7UUFDakMsSUFBSSxJQUFJLElBQUksSUFBSSxDQUFDLElBQUksRUFBRSxDQUFDLE1BQU0sR0FBRyxDQUFDLEVBQUU7WUFDaEMsU0FBUyxJQUFJLElBQUksSUFBSSxDQUFDLElBQUksRUFBRSxFQUFFLENBQUM7U0FDbEM7UUFFRCxNQUFNLFVBQVUsU0FBRyxJQUFJLENBQUMsWUFBWSwwQ0FBRSxVQUFVLENBQUM7UUFDakQsTUFBTSxlQUFlLFNBQUcsSUFBSSxDQUFDLFlBQVksMENBQUUsZUFBZSxDQUFDO1FBRTNELE1BQU0sY0FBYyxHQUFHLHlCQUF5QixJQUFJLENBQUMsV0FBVyxFQUFFLENBQUM7UUFFbkUsMklBQTJJO1FBQzNJLE1BQU0sV0FBVyxHQUFHLEtBQUssQ0FBQyxXQUFXO1lBQ2pDLENBQUMsQ0FBQyxLQUFLLENBQUMsV0FBVztZQUNuQixDQUFDLENBQUMsVUFBVSxJQUFJLGVBQWU7Z0JBQy9CLENBQUMsQ0FBQyxJQUFJLFVBQVUsT0FBTyxjQUFjLGFBQWEsZUFBZSxFQUFFO2dCQUNuRSxDQUFDLENBQUMsY0FBYyxDQUFDO1FBRXJCLE1BQU0sVUFBVSxHQUFHO1lBQ2YsWUFBWSxFQUFFO2dCQUNWLEdBQUcsS0FBSztnQkFDUixXQUFXLEVBQUUsSUFBSSxDQUFDLFdBQVc7Z0JBQzdCLFVBQVUsRUFBRSxJQUFJLENBQUMsVUFBVTtnQkFDM0IsYUFBYSxFQUFFLElBQUksQ0FBQyxhQUFhO2dCQUNqQyxVQUFVO2dCQUNWLGVBQWU7YUFDbEI7WUFDRCxTQUFTLEVBQUUsU0FBUztZQUNwQixXQUFXO1lBQ1gsSUFBSSxFQUFFLElBQUksQ0FBQyxJQUFJO1NBQ2xCLENBQUM7UUFFRixNQUFNLEtBQUssR0FBRyxJQUFJLGdCQUFnQixDQUFDLElBQUksRUFBRSxTQUFTLEVBQUUsVUFBVSxDQUFDLENBQUM7UUFFaEUsMkRBQTJEO1FBQzNELE1BQU0sU0FBUyxHQUFHLEdBQUcsQ0FBQyxlQUFlLENBQUMsZUFBZSxDQUNqRCxLQUFLLEVBQ0wsa0NBQWtDLENBQ3JDLENBQUM7UUFFRixJQUFJLGdDQUFnQyxDQUFDLElBQUksQ0FBQyxTQUFTLENBQUMsRUFBRTtZQUNsRCxHQUFHLENBQUMsT0FBTyxDQUFDLEVBQUUsQ0FBQyxLQUFLLENBQUMsQ0FBQyxHQUFHLENBQUMsSUFBSSxpQ0FBbUIsQ0FBQyxTQUFTLENBQUMsQ0FBQyxDQUFDO1NBQ2pFO1FBQ0QsT0FBTyxLQUFLLENBQUM7SUFDakIsQ0FBQztDQUNKO0FBeEZELDBDQXdGQyIsInNvdXJjZXNDb250ZW50IjpbIi8qIFxuICBDb3B5cmlnaHQgQW1hem9uLmNvbSwgSW5jLiBvciBpdHMgYWZmaWxpYXRlcy4gQWxsIFJpZ2h0cyBSZXNlcnZlZC5cbiAgXG4gIExpY2Vuc2VkIHVuZGVyIHRoZSBBcGFjaGUgTGljZW5zZSwgVmVyc2lvbiAyLjAgKHRoZSBcIkxpY2Vuc2VcIikuXG4gIFlvdSBtYXkgbm90IHVzZSB0aGlzIGZpbGUgZXhjZXB0IGluIGNvbXBsaWFuY2Ugd2l0aCB0aGUgTGljZW5zZS5cbiAgWW91IG1heSBvYnRhaW4gYSBjb3B5IG9mIHRoZSBMaWNlbnNlIGF0XG4gIFxuICAgICAgaHR0cDovL3d3dy5hcGFjaGUub3JnL2xpY2Vuc2VzL0xJQ0VOU0UtMi4wXG4gIFxuICBVbmxlc3MgcmVxdWlyZWQgYnkgYXBwbGljYWJsZSBsYXcgb3IgYWdyZWVkIHRvIGluIHdyaXRpbmcsIHNvZnR3YXJlXG4gIGRpc3RyaWJ1dGVkIHVuZGVyIHRoZSBMaWNlbnNlIGlzIGRpc3RyaWJ1dGVkIG9uIGFuIFwiQVMgSVNcIiBCQVNJUyxcbiAgV0lUSE9VVCBXQVJSQU5USUVTIE9SIENPTkRJVElPTlMgT0YgQU5ZIEtJTkQsIGVpdGhlciBleHByZXNzIG9yIGltcGxpZWQuXG4gIFNlZSB0aGUgTGljZW5zZSBmb3IgdGhlIHNwZWNpZmljIGxhbmd1YWdlIGdvdmVybmluZyBwZXJtaXNzaW9ucyBhbmRcbiAgbGltaXRhdGlvbnMgdW5kZXIgdGhlIExpY2Vuc2UuXG4qL1xuaW1wb3J0ICogYXMgY2RrIGZyb20gJ2F3cy1jZGstbGliJztcbmltcG9ydCAqIGFzIHNzbSBmcm9tICdhd3MtY2RrLWxpYi9hd3Mtc3NtJztcbmltcG9ydCB7IENvbmZpZ3VyYXRpb24gfSBmcm9tICcuL2Fncy10eXBlcyc7XG5pbXBvcnQgeyBBR1NTZXJ2aWNlUHJvcHMgfSBmcm9tICcuL2Fncy1zZXJ2aWNlJztcbmltcG9ydCB7IFBlcm1pc3Npb25zQm91bmRhcnkgfSBmcm9tICcuL2Fncy1hc3BlY3RzJztcbmltcG9ydCB7IENvbnN0cnVjdCB9IGZyb20gJ2NvbnN0cnVjdHMnO1xuZXhwb3J0IGludGVyZmFjZSBBR1NTZXJ2aWNlU3RhZ2VQcm9wcyBleHRlbmRzIGNkay5TdGFnZVByb3BzIHtcbiAgICAvKipcbiAgICAgKiBOYW1lIG9mIHRoZSBzZXJ2aWNlLlxuICAgICAqXG4gICAgICogUmVxdWlyZWQgdG8gYmUgc3BlY2lmaWVkIGluIGNkay5qc29uXG4gICAgICovXG4gICAgc2VydmljZU5hbWU6IHN0cmluZztcbiAgICAvKipcbiAgICAgKiBjb25maWd1cmF0aW9uIG5hbWVcbiAgICAgKlxuICAgICAqIE5hbWUgb2YgdGhlIGN1cnJlbnQgY29uZmlndXJhdGlvblxuICAgICAqXG4gICAgICovXG4gICAgY29uZmlnTmFtZTogc3RyaW5nO1xuICAgIC8qKlxuICAgICAqIENvbmZpZ3VyYXRpb24gZGF0YVxuICAgICAqXG4gICAgICogQ29uZmlndXJhdGlvbiBkYXRhIHJldHJpZXZlZCBmcm9tIHRoZSBjb25maWd1cmF0aW9uIGZpbGUgaW4gdGhlIGNvbmZpZ3VyYXRpb24gZGlyZWN0b3J5LlxuICAgICAqL1xuICAgIGNvbmZpZ3VyYXRpb24/OiBDb25maWd1cmF0aW9uO1xuICAgIC8qKlxuICAgICAqIE5hbWUgb2YgdGhlIHRhcmdldCBlbnZpcm9ubWVudCB0byBiZSBkZXBsb3llZCB0b1xuICAgICAqXG4gICAgICovXG4gICAgZW52TmFtZTogc3RyaW5nO1xuICAgIC8qKlxuICAgICAqIFNvbHV0aW9uIGluZm9ybWF0aW9uIHN1Y2ggYXMgc29sdXRpb24gaWQgKGZyb20gdmFsZW5jZSkgYW5kIHZlcnNpb25cbiAgICAgKi9cbiAgICBzb2x1dGlvbkluZm8/OiBSZWNvcmQ8c3RyaW5nLCBzdHJpbmc+O1xufVxuXG4vLyBnZW5lcmljIHR5cGUgZm9yIFNlcnZpY2UgY29uc3RydWN0b3IgZnVuY3Rpb25cbmludGVyZmFjZSBTZXJ2aWNlU3RhY2tQcm9wczxUPlxuICAgIGV4dGVuZHMgT21pdDxjZGsuU3RhY2tQcm9wcywgJ3N0YWNrTmFtZScgfCAnZGVzY3JpcHRpb24nIHwgJ3RhZ3MnPiB7XG4gICAgc2VydmljZVByb3BzOiBUICYgQUdTU2VydmljZVByb3BzO1xufVxuXG50eXBlIENvbnN0cnVjdG9yPFQsIFU+ID0gbmV3IChcbiAgICBzY29wZTogQ29uc3RydWN0LFxuICAgIGlkOiBzdHJpbmcsXG4gICAgcHJvcHM6IFNlcnZpY2VTdGFja1Byb3BzPFU+XG4pID0+IFQ7XG5cbi8qKlxuICogVGhlIFNlcnZpY2UgU3RhZ2UgYmFzZSBjbGFzcyB0aGF0IGRlZmluZWQgYSBgU2VydmljZSBTdGFnZWAgdGhhdCBjYW4gYmUgZGVwbG95ZWQgaW50b1xuICogYSBzcGVjaWZpYyB0YXJnZXQgZW52aXJvbm1lbnQuXG4gKlxuICogQW4gaW5zdGFuY2Ugb2YgdGhpcyBjbGFzcyBpcyBzeW50aGVkIGludG8gYSBzdWItZGlyZWN0bHkgaW4gY2RrLm91dCBhbmQgY29udGFpbnMgdGhlXG4gKiBjbG91ZCBhc3NlbWJseSBmb3IgYSBwYXJ0aXR1bGFyIHRhcmdldCBlbnZpcm9ubWVudC5cbiAqL1xuZXhwb3J0IGNsYXNzIEFHU1NlcnZpY2VTdGFnZSBleHRlbmRzIGNkay5TdGFnZSB7XG4gICAgcHVibGljIHJlYWRvbmx5IHNlcnZpY2VOYW1lOiBzdHJpbmc7XG4gICAgcHVibGljIHJlYWRvbmx5IGNvbmZpZ3VyYXRpb246IENvbmZpZ3VyYXRpb247XG4gICAgcHVibGljIHJlYWRvbmx5IGNvbmZpZ05hbWU6IHN0cmluZztcbiAgICBwdWJsaWMgcmVhZG9ubHkgdGFnczogUmVjb3JkPHN0cmluZywgc3RyaW5nPjtcbiAgICBwdWJsaWMgcmVhZG9ubHkgc29sdXRpb25JbmZvPzogUmVjb3JkPHN0cmluZywgc3RyaW5nPjtcblxuICAgIGNvbnN0cnVjdG9yKHNjb3BlOiBDb25zdHJ1Y3QsIGlkOiBzdHJpbmcsIHByb3BzOiBBR1NTZXJ2aWNlU3RhZ2VQcm9wcykge1xuICAgICAgICBzdXBlcihzY29wZSwgaWQsIHByb3BzKTtcblxuICAgICAgICB0aGlzLnNlcnZpY2VOYW1lID0gcHJvcHMuc2VydmljZU5hbWU7XG4gICAgICAgIHRoaXMuY29uZmlndXJhdGlvbiA9IHByb3BzLmNvbmZpZ3VyYXRpb24gfHwge307XG4gICAgICAgIHRoaXMuY29uZmlnTmFtZSA9IHByb3BzLmNvbmZpZ05hbWU7XG5cbiAgICAgICAgY29uc29sZS5sb2coXG4gICAgICAgICAgICBgQ0RLIHN5bnRoICR7dGhpcy5zZXJ2aWNlTmFtZX0gb24gc3RhZ2UgWyR7aWR9XSB3aXRoIGNvbmZpZ3VyYXRpb24gWyR7dGhpcy5jb25maWdOYW1lfV0gdG8gdGFyZ2V0IGVudmlyb25tZW50ICR7cHJvcHMuZW52TmFtZX0gWyR7dGhpcy5hY2NvdW50fS8ke3RoaXMucmVnaW9ufV0uYFxuICAgICAgICApO1xuXG4gICAgICAgIC8vIGNvbW1vbiBUYWdzXG4gICAgICAgIHRoaXMudGFncyA9IHtcbiAgICAgICAgICAgICdhZ3M6YXBwbGljYXRpb24nOiAnQVdTIEdvdmVybmFuY2UgU3VpdGUnLFxuICAgICAgICAgICAgJ2FnczpzZXJ2aWNlJzogdGhpcy5zZXJ2aWNlTmFtZSxcbiAgICAgICAgICAgICdhZ3M6Y29uZmlnTmFtZSc6IHRoaXMuY29uZmlnTmFtZSxcbiAgICAgICAgICAgICdhZ3M6ZW52JzogcHJvcHMuZW52TmFtZSxcbiAgICAgICAgfTtcblxuICAgICAgICB0aGlzLnNvbHV0aW9uSW5mbyA9IHByb3BzLnNvbHV0aW9uSW5mbztcbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBJbnN0YW50aWF0ZSBhbmQgYWRkIGEgU2VydmljZSBTdGFjayB0byB0aGUgc3RhZ2UuXG4gICAgICpcbiAgICAgKiBUaGlzIGZ1bmN0aW9uIGluc3RhbnRpYXRlIGEgbmV3IFNlcnZpY2UgU3RhY2sgY2xhc3MgYW5kIGFkZCBpdCB0byB0aGUgc3RhZ2UuXG4gICAgICpcbiAgICAgKiBAcGFyYW0gc3RhY2tDb25zdHJ1Y3RvciBTZXJ2aWNlIHN0YWNrIGNsYXNzIG5hbWVcbiAgICAgKiBAcGFyYW0gbmFtZSBUaGUgbmFtZSBvZiB0aGUgc3RhY2sgaWYgdGhlcmUgYXJlIG11bHRpcGxlIHN0YWNrcy4gSXQgY2FuIGJlIG9taXR0ZWQgaWYgb25seSBvbmUgc3RhY2tcbiAgICAgKiBAcGFyYW0gcHJvcHMgVGhlIHByb3BlcnRpZXMgZm9yIHRoaXMgcGFydGljdWxhciBzdGFja1xuICAgICAqIEByZXR1cm5zIFNlcnZpY2Ugc3RhY2sgb2JqZWN0XG4gICAgICovXG4gICAgYWRkU3RhY2s8VCBleHRlbmRzIGNkay5TdGFjaywgVSBleHRlbmRzIHsgZGVzY3JpcHRpb24/OiBzdHJpbmcgfT4oXG4gICAgICAgIHN0YWNrQ29uc3RydWN0b3I6IENvbnN0cnVjdG9yPFQsIFU+LFxuICAgICAgICBuYW1lOiBzdHJpbmcgPSAnJyxcbiAgICAgICAgcHJvcHM6IFVcbiAgICApOiBUIHtcbiAgICAgICAgbGV0IHN0YWNrTmFtZSA9IHRoaXMuc2VydmljZU5hbWU7XG4gICAgICAgIGlmIChuYW1lICYmIG5hbWUudHJpbSgpLmxlbmd0aCA+IDApIHtcbiAgICAgICAgICAgIHN0YWNrTmFtZSArPSBgLSR7bmFtZS50cmltKCl9YDtcbiAgICAgICAgfVxuXG4gICAgICAgIGNvbnN0IHNvbHV0aW9uSWQgPSB0aGlzLnNvbHV0aW9uSW5mbz8uc29sdXRpb25JZDtcbiAgICAgICAgY29uc3Qgc29sdXRpb25WZXJzaW9uID0gdGhpcy5zb2x1dGlvbkluZm8/LnNvbHV0aW9uVmVyc2lvbjtcblxuICAgICAgICBjb25zdCBhZ3NEZXNjcmlwdGlvbiA9IGBBR1MgU2VydmljZSBzdGFjayBmb3IgJHt0aGlzLnNlcnZpY2VOYW1lfWA7XG5cbiAgICAgICAgLy8gaWYgdGhlcmUgaXMgYSBwcm92aWRlZCBkZXNjcmlwdGlvbiwgdXNlIGl0LCBvdGhlcndpc2UgY29uc3RydWN0IGl0IGZyb20gc29sdXRpb25JZCwgc29sdXRpb25WZXJzaW9uIGFuZCBzdGFuZGFyZCBBR1Mgc2VydmljZSBkZXNjcml0cGlvblxuICAgICAgICBjb25zdCBkZXNjcmlwdGlvbiA9IHByb3BzLmRlc2NyaXB0aW9uXG4gICAgICAgICAgICA/IHByb3BzLmRlc2NyaXB0aW9uXG4gICAgICAgICAgICA6IHNvbHV0aW9uSWQgJiYgc29sdXRpb25WZXJzaW9uXG4gICAgICAgICAgICA/IGAoJHtzb2x1dGlvbklkfSkgLSAke2Fnc0Rlc2NyaXB0aW9ufS4gVmVyc2lvbiAke3NvbHV0aW9uVmVyc2lvbn1gXG4gICAgICAgICAgICA6IGFnc0Rlc2NyaXB0aW9uO1xuXG4gICAgICAgIGNvbnN0IHN0YWNrUHJvcHMgPSB7XG4gICAgICAgICAgICBzZXJ2aWNlUHJvcHM6IHtcbiAgICAgICAgICAgICAgICAuLi5wcm9wcyxcbiAgICAgICAgICAgICAgICBzZXJ2aWNlTmFtZTogdGhpcy5zZXJ2aWNlTmFtZSxcbiAgICAgICAgICAgICAgICBjb25maWdOYW1lOiB0aGlzLmNvbmZpZ05hbWUsXG4gICAgICAgICAgICAgICAgY29uZmlndXJhdGlvbjogdGhpcy5jb25maWd1cmF0aW9uLFxuICAgICAgICAgICAgICAgIHNvbHV0aW9uSWQsXG4gICAgICAgICAgICAgICAgc29sdXRpb25WZXJzaW9uLFxuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIHN0YWNrTmFtZTogc3RhY2tOYW1lLFxuICAgICAgICAgICAgZGVzY3JpcHRpb24sXG4gICAgICAgICAgICB0YWdzOiB0aGlzLnRhZ3MsXG4gICAgICAgIH07XG5cbiAgICAgICAgY29uc3Qgc3RhY2sgPSBuZXcgc3RhY2tDb25zdHJ1Y3Rvcih0aGlzLCBzdGFja05hbWUsIHN0YWNrUHJvcHMpO1xuXG4gICAgICAgIC8vIGxvb2sgdXAgcGVybWlzc2lvbiBib3VuZGFyeSBwb2xpY3kgYXJuIGZyb20gc2hhcmVkIGluZnJhXG4gICAgICAgIGNvbnN0IHBvbGljeUFybiA9IHNzbS5TdHJpbmdQYXJhbWV0ZXIudmFsdWVGcm9tTG9va3VwKFxuICAgICAgICAgICAgc3RhY2ssXG4gICAgICAgICAgICAnL2Fncy9wZXJtaXNzaW9uQm91bmRhcnlQb2xpY3lBcm4nXG4gICAgICAgICk7XG5cbiAgICAgICAgaWYgKC9hcm46YXdzOmlhbTo6WzAtOV0rOnBvbGljeVxcLy4rLy50ZXN0KHBvbGljeUFybikpIHtcbiAgICAgICAgICAgIGNkay5Bc3BlY3RzLm9mKHN0YWNrKS5hZGQobmV3IFBlcm1pc3Npb25zQm91bmRhcnkocG9saWN5QXJuKSk7XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIHN0YWNrO1xuICAgIH1cbn1cbiJdfQ==