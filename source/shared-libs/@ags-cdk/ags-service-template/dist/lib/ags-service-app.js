"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AGSServiceApp = void 0;
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
require("source-map-support/register");
const cdk = require("@aws-cdk/core");
class AGSServiceApp extends cdk.App {
    constructor(props) {
        super(props);
        // get service name
        const serviceName = this.node.tryGetContext('serviceName');
        if (!validateName(serviceName)) {
            throw new Error('Service name must be specified in context.json. Valid value should match /^[a-zA-Z0-9-_]*$/.');
        }
        function validateName(name) {
            return !!name && /^[a-zA-Z0-9\-_]+$/.test(name.trim());
        }
        // get target environments from cdk.json
        const targetEnvs = this.node.tryGetContext('targetEnvs');
        // get configurations from cdk.json
        const configurations = this.node.tryGetContext('configurations');
        // check if it is deploy to personal account
        const isPersonal = this.node.tryGetContext('personal') === 'on';
        // synth stages for each target environment
        if (isPersonal) {
            new props.stageConstructor(this, `PersonalStage`, {
                env: {
                    account: this.node.tryGetContext('account') ||
                        process.env.CDK_DEFAULT_ACCOUNT,
                    region: this.node.tryGetContext('region') ||
                        process.env.CDK_DEFAULT_REGION,
                },
                serviceName,
                envName: 'PersonalDev',
                overriddenConfigName: 'Personal',
                configurations,
            });
        }
        else {
            if (Object.keys(targetEnvs).length > 0) {
                for (const envName in targetEnvs) {
                    new props.stageConstructor(this, `${envName}Stage`, {
                        env: targetEnvs[envName],
                        serviceName,
                        envName,
                        overriddenConfigName: targetEnvs[envName].configName,
                        configurations,
                    });
                }
            }
            else {
                console.log('No target environment found.');
            }
        }
        // dummy stack to remove the error for no stack after synth
        new cdk.Stack(this, 'NonOp', {});
    }
}
exports.AGSServiceApp = AGSServiceApp;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiYWdzLXNlcnZpY2UtYXBwLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vbGliL2Fncy1zZXJ2aWNlLWFwcC50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7QUFBQTs7Ozs7Ozs7Ozs7Ozs7RUFjRTtBQUNGLHVDQUFxQztBQUNyQyxxQ0FBcUM7QUFjckMsTUFBYSxhQUF5QyxTQUFRLEdBQUcsQ0FBQyxHQUFHO0lBQ2pFLFlBQVksS0FBNEI7UUFDcEMsS0FBSyxDQUFDLEtBQUssQ0FBQyxDQUFDO1FBRWIsbUJBQW1CO1FBQ25CLE1BQU0sV0FBVyxHQUFHLElBQUksQ0FBQyxJQUFJLENBQUMsYUFBYSxDQUFDLGFBQWEsQ0FBQyxDQUFDO1FBQzNELElBQUksQ0FBQyxZQUFZLENBQUMsV0FBVyxDQUFDLEVBQUU7WUFDNUIsTUFBTSxJQUFJLEtBQUssQ0FDWCw4RkFBOEYsQ0FDakcsQ0FBQztTQUNMO1FBRUQsU0FBUyxZQUFZLENBQUMsSUFBYTtZQUMvQixPQUFPLENBQUMsQ0FBQyxJQUFJLElBQUksbUJBQW1CLENBQUMsSUFBSSxDQUFDLElBQUksQ0FBQyxJQUFJLEVBQUUsQ0FBQyxDQUFDO1FBQzNELENBQUM7UUFFRCx3Q0FBd0M7UUFDeEMsTUFBTSxVQUFVLEdBQW9CLElBQUksQ0FBQyxJQUFJLENBQUMsYUFBYSxDQUFDLFlBQVksQ0FBQyxDQUFDO1FBRTFFLG1DQUFtQztRQUNuQyxNQUFNLGNBQWMsR0FBbUIsSUFBSSxDQUFDLElBQUksQ0FBQyxhQUFhLENBQUMsZ0JBQWdCLENBQUMsQ0FBQztRQUVqRiw0Q0FBNEM7UUFDNUMsTUFBTSxVQUFVLEdBQUcsSUFBSSxDQUFDLElBQUksQ0FBQyxhQUFhLENBQUMsVUFBVSxDQUFDLEtBQUssSUFBSSxDQUFDO1FBRWhFLDJDQUEyQztRQUMzQyxJQUFJLFVBQVUsRUFBRTtZQUNaLElBQUksS0FBSyxDQUFDLGdCQUFnQixDQUFDLElBQUksRUFBRSxlQUFlLEVBQUU7Z0JBQzlDLEdBQUcsRUFBRTtvQkFDRCxPQUFPLEVBQ0gsSUFBSSxDQUFDLElBQUksQ0FBQyxhQUFhLENBQUMsU0FBUyxDQUFDO3dCQUNsQyxPQUFPLENBQUMsR0FBRyxDQUFDLG1CQUFtQjtvQkFDbkMsTUFBTSxFQUNGLElBQUksQ0FBQyxJQUFJLENBQUMsYUFBYSxDQUFDLFFBQVEsQ0FBQzt3QkFDakMsT0FBTyxDQUFDLEdBQUcsQ0FBQyxrQkFBa0I7aUJBQ3JDO2dCQUNELFdBQVc7Z0JBQ1gsT0FBTyxFQUFFLGFBQWE7Z0JBQ3RCLG9CQUFvQixFQUFFLFVBQVU7Z0JBQ2hDLGNBQWM7YUFDakIsQ0FBQyxDQUFDO1NBQ047YUFBTTtZQUNILElBQUksTUFBTSxDQUFDLElBQUksQ0FBQyxVQUFVLENBQUMsQ0FBQyxNQUFNLEdBQUcsQ0FBQyxFQUFFO2dCQUNwQyxLQUFLLE1BQU0sT0FBTyxJQUFJLFVBQVUsRUFBRTtvQkFDOUIsSUFBSSxLQUFLLENBQUMsZ0JBQWdCLENBQUMsSUFBSSxFQUFFLEdBQUcsT0FBTyxPQUFPLEVBQUU7d0JBQ2hELEdBQUcsRUFBRSxVQUFVLENBQUMsT0FBTyxDQUFDO3dCQUN4QixXQUFXO3dCQUNYLE9BQU87d0JBQ1Asb0JBQW9CLEVBQUUsVUFBVSxDQUFDLE9BQU8sQ0FBQyxDQUFDLFVBQVU7d0JBQ3BELGNBQWM7cUJBQ2pCLENBQUMsQ0FBQztpQkFDTjthQUNKO2lCQUFNO2dCQUNILE9BQU8sQ0FBQyxHQUFHLENBQUMsOEJBQThCLENBQUMsQ0FBQzthQUMvQztTQUNKO1FBRUQsMkRBQTJEO1FBQzNELElBQUksR0FBRyxDQUFDLEtBQUssQ0FBQyxJQUFJLEVBQUUsT0FBTyxFQUFFLEVBQUUsQ0FBQyxDQUFDO0lBQ3JDLENBQUM7Q0FDSjtBQTVERCxzQ0E0REMiLCJzb3VyY2VzQ29udGVudCI6WyIvKiBcbiAgQ29weXJpZ2h0IEFtYXpvbi5jb20sIEluYy4gb3IgaXRzIGFmZmlsaWF0ZXMuIEFsbCBSaWdodHMgUmVzZXJ2ZWQuXG4gIFxuICBMaWNlbnNlZCB1bmRlciB0aGUgQXBhY2hlIExpY2Vuc2UsIFZlcnNpb24gMi4wICh0aGUgXCJMaWNlbnNlXCIpLlxuICBZb3UgbWF5IG5vdCB1c2UgdGhpcyBmaWxlIGV4Y2VwdCBpbiBjb21wbGlhbmNlIHdpdGggdGhlIExpY2Vuc2UuXG4gIFlvdSBtYXkgb2J0YWluIGEgY29weSBvZiB0aGUgTGljZW5zZSBhdFxuICBcbiAgICAgIGh0dHA6Ly93d3cuYXBhY2hlLm9yZy9saWNlbnNlcy9MSUNFTlNFLTIuMFxuICBcbiAgVW5sZXNzIHJlcXVpcmVkIGJ5IGFwcGxpY2FibGUgbGF3IG9yIGFncmVlZCB0byBpbiB3cml0aW5nLCBzb2Z0d2FyZVxuICBkaXN0cmlidXRlZCB1bmRlciB0aGUgTGljZW5zZSBpcyBkaXN0cmlidXRlZCBvbiBhbiBcIkFTIElTXCIgQkFTSVMsXG4gIFdJVEhPVVQgV0FSUkFOVElFUyBPUiBDT05ESVRJT05TIE9GIEFOWSBLSU5ELCBlaXRoZXIgZXhwcmVzcyBvciBpbXBsaWVkLlxuICBTZWUgdGhlIExpY2Vuc2UgZm9yIHRoZSBzcGVjaWZpYyBsYW5ndWFnZSBnb3Zlcm5pbmcgcGVybWlzc2lvbnMgYW5kXG4gIGxpbWl0YXRpb25zIHVuZGVyIHRoZSBMaWNlbnNlLlxuKi9cbmltcG9ydCAnc291cmNlLW1hcC1zdXBwb3J0L3JlZ2lzdGVyJztcbmltcG9ydCAqIGFzIGNkayBmcm9tICdAYXdzLWNkay9jb3JlJztcbmltcG9ydCB7IEFHU0Vudmlyb25tZW50cywgQ29uZmlndXJhdGlvbnMgfSBmcm9tICcuL2Fncy10eXBlcyc7XG5pbXBvcnQgeyBBR1NTZXJ2aWNlU3RhZ2UsIEFHU1NlcnZpY2VTdGFnZVByb3BzIH0gZnJvbSAnLi9hZ3Mtc2VydmljZS1zdGFnZSc7XG5cbnR5cGUgQ29uc3RydWN0b3I8VCBleHRlbmRzIEFHU1NlcnZpY2VTdGFnZT4gPSBuZXcgKFxuICAgIHNjb3BlOiBjZGsuQ29uc3RydWN0LFxuICAgIGlkOiBzdHJpbmcsXG4gICAgcHJvcHM6IEFHU1NlcnZpY2VTdGFnZVByb3BzXG4pID0+IFQ7XG5cbmV4cG9ydCBpbnRlcmZhY2UgQUdTU2VydmljZUFwcFByb3BzPFQgZXh0ZW5kcyBBR1NTZXJ2aWNlU3RhZ2U+IGV4dGVuZHMgY2RrLkFwcFByb3BzIHtcbiAgICBzdGFnZUNvbnN0cnVjdG9yOiBDb25zdHJ1Y3RvcjxUPjtcbn1cblxuZXhwb3J0IGNsYXNzIEFHU1NlcnZpY2VBcHA8VCBleHRlbmRzIEFHU1NlcnZpY2VTdGFnZT4gZXh0ZW5kcyBjZGsuQXBwIHtcbiAgICBjb25zdHJ1Y3Rvcihwcm9wczogQUdTU2VydmljZUFwcFByb3BzPFQ+KSB7XG4gICAgICAgIHN1cGVyKHByb3BzKTtcblxuICAgICAgICAvLyBnZXQgc2VydmljZSBuYW1lXG4gICAgICAgIGNvbnN0IHNlcnZpY2VOYW1lID0gdGhpcy5ub2RlLnRyeUdldENvbnRleHQoJ3NlcnZpY2VOYW1lJyk7XG4gICAgICAgIGlmICghdmFsaWRhdGVOYW1lKHNlcnZpY2VOYW1lKSkge1xuICAgICAgICAgICAgdGhyb3cgbmV3IEVycm9yKFxuICAgICAgICAgICAgICAgICdTZXJ2aWNlIG5hbWUgbXVzdCBiZSBzcGVjaWZpZWQgaW4gY29udGV4dC5qc29uLiBWYWxpZCB2YWx1ZSBzaG91bGQgbWF0Y2ggL15bYS16QS1aMC05LV9dKiQvLidcbiAgICAgICAgICAgICk7XG4gICAgICAgIH1cblxuICAgICAgICBmdW5jdGlvbiB2YWxpZGF0ZU5hbWUobmFtZT86IHN0cmluZyk6IGJvb2xlYW4ge1xuICAgICAgICAgICAgcmV0dXJuICEhbmFtZSAmJiAvXlthLXpBLVowLTlcXC1fXSskLy50ZXN0KG5hbWUudHJpbSgpKTtcbiAgICAgICAgfVxuXG4gICAgICAgIC8vIGdldCB0YXJnZXQgZW52aXJvbm1lbnRzIGZyb20gY2RrLmpzb25cbiAgICAgICAgY29uc3QgdGFyZ2V0RW52czogQUdTRW52aXJvbm1lbnRzID0gdGhpcy5ub2RlLnRyeUdldENvbnRleHQoJ3RhcmdldEVudnMnKTtcblxuICAgICAgICAvLyBnZXQgY29uZmlndXJhdGlvbnMgZnJvbSBjZGsuanNvblxuICAgICAgICBjb25zdCBjb25maWd1cmF0aW9uczogQ29uZmlndXJhdGlvbnMgPSB0aGlzLm5vZGUudHJ5R2V0Q29udGV4dCgnY29uZmlndXJhdGlvbnMnKTtcblxuICAgICAgICAvLyBjaGVjayBpZiBpdCBpcyBkZXBsb3kgdG8gcGVyc29uYWwgYWNjb3VudFxuICAgICAgICBjb25zdCBpc1BlcnNvbmFsID0gdGhpcy5ub2RlLnRyeUdldENvbnRleHQoJ3BlcnNvbmFsJykgPT09ICdvbic7XG5cbiAgICAgICAgLy8gc3ludGggc3RhZ2VzIGZvciBlYWNoIHRhcmdldCBlbnZpcm9ubWVudFxuICAgICAgICBpZiAoaXNQZXJzb25hbCkge1xuICAgICAgICAgICAgbmV3IHByb3BzLnN0YWdlQ29uc3RydWN0b3IodGhpcywgYFBlcnNvbmFsU3RhZ2VgLCB7XG4gICAgICAgICAgICAgICAgZW52OiB7XG4gICAgICAgICAgICAgICAgICAgIGFjY291bnQ6XG4gICAgICAgICAgICAgICAgICAgICAgICB0aGlzLm5vZGUudHJ5R2V0Q29udGV4dCgnYWNjb3VudCcpIHx8XG4gICAgICAgICAgICAgICAgICAgICAgICBwcm9jZXNzLmVudi5DREtfREVGQVVMVF9BQ0NPVU5ULFxuICAgICAgICAgICAgICAgICAgICByZWdpb246XG4gICAgICAgICAgICAgICAgICAgICAgICB0aGlzLm5vZGUudHJ5R2V0Q29udGV4dCgncmVnaW9uJykgfHxcbiAgICAgICAgICAgICAgICAgICAgICAgIHByb2Nlc3MuZW52LkNES19ERUZBVUxUX1JFR0lPTixcbiAgICAgICAgICAgICAgICB9LFxuICAgICAgICAgICAgICAgIHNlcnZpY2VOYW1lLFxuICAgICAgICAgICAgICAgIGVudk5hbWU6ICdQZXJzb25hbERldicsXG4gICAgICAgICAgICAgICAgb3ZlcnJpZGRlbkNvbmZpZ05hbWU6ICdQZXJzb25hbCcsXG4gICAgICAgICAgICAgICAgY29uZmlndXJhdGlvbnMsXG4gICAgICAgICAgICB9KTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIGlmIChPYmplY3Qua2V5cyh0YXJnZXRFbnZzKS5sZW5ndGggPiAwKSB7XG4gICAgICAgICAgICAgICAgZm9yIChjb25zdCBlbnZOYW1lIGluIHRhcmdldEVudnMpIHtcbiAgICAgICAgICAgICAgICAgICAgbmV3IHByb3BzLnN0YWdlQ29uc3RydWN0b3IodGhpcywgYCR7ZW52TmFtZX1TdGFnZWAsIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGVudjogdGFyZ2V0RW52c1tlbnZOYW1lXSxcbiAgICAgICAgICAgICAgICAgICAgICAgIHNlcnZpY2VOYW1lLFxuICAgICAgICAgICAgICAgICAgICAgICAgZW52TmFtZSxcbiAgICAgICAgICAgICAgICAgICAgICAgIG92ZXJyaWRkZW5Db25maWdOYW1lOiB0YXJnZXRFbnZzW2Vudk5hbWVdLmNvbmZpZ05hbWUsXG4gICAgICAgICAgICAgICAgICAgICAgICBjb25maWd1cmF0aW9ucyxcbiAgICAgICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICBjb25zb2xlLmxvZygnTm8gdGFyZ2V0IGVudmlyb25tZW50IGZvdW5kLicpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG5cbiAgICAgICAgLy8gZHVtbXkgc3RhY2sgdG8gcmVtb3ZlIHRoZSBlcnJvciBmb3Igbm8gc3RhY2sgYWZ0ZXIgc3ludGhcbiAgICAgICAgbmV3IGNkay5TdGFjayh0aGlzLCAnTm9uT3AnLCB7fSk7XG4gICAgfVxufVxuIl19