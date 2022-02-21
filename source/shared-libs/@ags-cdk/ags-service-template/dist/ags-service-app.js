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
const cdk = require("aws-cdk-lib");
const path = require("path");
const fs = require("fs");
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
        // check if it is deploy to personal account
        const isPersonal = this.node.tryGetContext('personal') === 'on';
        // get configuration path
        const configPath = path.resolve(props.currentDir, this.node.tryGetContext('configurationPath'));
        // get command line arguments of account, region and envName
        const account = this.node.tryGetContext('account') || process.env.CDK_DEFAULT_ACCOUNT;
        const region = this.node.tryGetContext('region') || process.env.CDK_DEFAULT_REGION;
        // default configuration is "Default.json" and default env is Default
        let envName = this.node.tryGetContext('envName') || 'Default';
        let configName = this.node.tryGetContext('configName') || 'Default';
        //handle personal dev deployment
        if (isPersonal) {
            configName = 'Personal';
            envName = 'Personal';
        }
        // read configuration from the file
        const configFilePath = path.join(configPath, `${configName}.json`);
        if (!fs.existsSync(configFilePath)) {
            throw new Error(`Service configuration file not found. path: [${configFilePath}]`);
        }
        const configFile = fs.readFileSync(configFilePath, { encoding: 'utf8' });
        // configuration is the data in the key named by the service name
        const configuration = JSON.parse(configFile)[serviceName];
        // read solution containing solution id and version file
        const solutionInfoFilePath = this.node.tryGetContext('solutionInfoFilePath');
        let solutionInfo = undefined;
        if (solutionInfoFilePath) {
            const solutionInfoFile = path.resolve(props.currentDir, solutionInfoFilePath);
            if (fs.existsSync(solutionInfoFile)) {
                solutionInfo = JSON.parse(fs.readFileSync(solutionInfoFile, { encoding: 'utf8' }));
            }
        }
        // synth stages based on input
        new props.stageConstructor(this, `${envName}Stage`, {
            env: {
                account: account || process.env.CDK_DEFAULT_ACCOUNT,
                region: region || process.env.CDK_DEFAULT_REGION,
            },
            serviceName,
            envName,
            configName,
            configuration,
            solutionInfo,
        });
        // dummy stack to remove the error for no stack after synth
        new cdk.Stack(this, 'NonOp', {});
    }
}
exports.AGSServiceApp = AGSServiceApp;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiYWdzLXNlcnZpY2UtYXBwLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vbGliL2Fncy1zZXJ2aWNlLWFwcC50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7QUFBQTs7Ozs7Ozs7Ozs7Ozs7RUFjRTtBQUNGLHVDQUFxQztBQUNyQyxtQ0FBbUM7QUFHbkMsNkJBQTZCO0FBQzdCLHlCQUF5QjtBQWF6QixNQUFhLGFBQXlDLFNBQVEsR0FBRyxDQUFDLEdBQUc7SUFDakUsWUFBWSxLQUE0QjtRQUNwQyxLQUFLLENBQUMsS0FBSyxDQUFDLENBQUM7UUFFYixtQkFBbUI7UUFDbkIsTUFBTSxXQUFXLEdBQUcsSUFBSSxDQUFDLElBQUksQ0FBQyxhQUFhLENBQUMsYUFBYSxDQUFDLENBQUM7UUFDM0QsSUFBSSxDQUFDLFlBQVksQ0FBQyxXQUFXLENBQUMsRUFBRTtZQUM1QixNQUFNLElBQUksS0FBSyxDQUNYLDhGQUE4RixDQUNqRyxDQUFDO1NBQ0w7UUFFRCxTQUFTLFlBQVksQ0FBQyxJQUFhO1lBQy9CLE9BQU8sQ0FBQyxDQUFDLElBQUksSUFBSSxtQkFBbUIsQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFDLElBQUksRUFBRSxDQUFDLENBQUM7UUFDM0QsQ0FBQztRQUVELDRDQUE0QztRQUM1QyxNQUFNLFVBQVUsR0FBRyxJQUFJLENBQUMsSUFBSSxDQUFDLGFBQWEsQ0FBQyxVQUFVLENBQUMsS0FBSyxJQUFJLENBQUM7UUFFaEUseUJBQXlCO1FBQ3pCLE1BQU0sVUFBVSxHQUFHLElBQUksQ0FBQyxPQUFPLENBQzNCLEtBQUssQ0FBQyxVQUFVLEVBQ2hCLElBQUksQ0FBQyxJQUFJLENBQUMsYUFBYSxDQUFDLG1CQUFtQixDQUFDLENBQy9DLENBQUM7UUFFRiw0REFBNEQ7UUFDNUQsTUFBTSxPQUFPLEdBQ1QsSUFBSSxDQUFDLElBQUksQ0FBQyxhQUFhLENBQUMsU0FBUyxDQUFDLElBQUksT0FBTyxDQUFDLEdBQUcsQ0FBQyxtQkFBbUIsQ0FBQztRQUUxRSxNQUFNLE1BQU0sR0FDUixJQUFJLENBQUMsSUFBSSxDQUFDLGFBQWEsQ0FBQyxRQUFRLENBQUMsSUFBSSxPQUFPLENBQUMsR0FBRyxDQUFDLGtCQUFrQixDQUFDO1FBRXhFLHFFQUFxRTtRQUNyRSxJQUFJLE9BQU8sR0FBRyxJQUFJLENBQUMsSUFBSSxDQUFDLGFBQWEsQ0FBQyxTQUFTLENBQUMsSUFBSSxTQUFTLENBQUM7UUFDOUQsSUFBSSxVQUFVLEdBQUcsSUFBSSxDQUFDLElBQUksQ0FBQyxhQUFhLENBQUMsWUFBWSxDQUFDLElBQUksU0FBUyxDQUFDO1FBRXBFLGdDQUFnQztRQUNoQyxJQUFJLFVBQVUsRUFBRTtZQUNaLFVBQVUsR0FBRyxVQUFVLENBQUM7WUFDeEIsT0FBTyxHQUFHLFVBQVUsQ0FBQztTQUN4QjtRQUVELG1DQUFtQztRQUNuQyxNQUFNLGNBQWMsR0FBRyxJQUFJLENBQUMsSUFBSSxDQUFDLFVBQVUsRUFBRSxHQUFHLFVBQVUsT0FBTyxDQUFDLENBQUM7UUFDbkUsSUFBSSxDQUFDLEVBQUUsQ0FBQyxVQUFVLENBQUMsY0FBYyxDQUFDLEVBQUU7WUFDaEMsTUFBTSxJQUFJLEtBQUssQ0FDWCxnREFBZ0QsY0FBYyxHQUFHLENBQ3BFLENBQUM7U0FDTDtRQUVELE1BQU0sVUFBVSxHQUFHLEVBQUUsQ0FBQyxZQUFZLENBQUMsY0FBYyxFQUFFLEVBQUUsUUFBUSxFQUFFLE1BQU0sRUFBRSxDQUFDLENBQUM7UUFFekUsaUVBQWlFO1FBQ2pFLE1BQU0sYUFBYSxHQUFHLElBQUksQ0FBQyxLQUFLLENBQUMsVUFBVSxDQUFDLENBQUMsV0FBVyxDQUFDLENBQUM7UUFFMUQsd0RBQXdEO1FBQ3hELE1BQU0sb0JBQW9CLEdBQUcsSUFBSSxDQUFDLElBQUksQ0FBQyxhQUFhLENBQUMsc0JBQXNCLENBQUMsQ0FBQztRQUM3RSxJQUFJLFlBQVksR0FBdUMsU0FBUyxDQUFDO1FBRWpFLElBQUksb0JBQW9CLEVBQUU7WUFDdEIsTUFBTSxnQkFBZ0IsR0FBRyxJQUFJLENBQUMsT0FBTyxDQUFDLEtBQUssQ0FBQyxVQUFVLEVBQUUsb0JBQW9CLENBQUMsQ0FBQztZQUM5RSxJQUFJLEVBQUUsQ0FBQyxVQUFVLENBQUMsZ0JBQWdCLENBQUMsRUFBRTtnQkFDakMsWUFBWSxHQUFHLElBQUksQ0FBQyxLQUFLLENBQ3JCLEVBQUUsQ0FBQyxZQUFZLENBQUMsZ0JBQWdCLEVBQUUsRUFBRSxRQUFRLEVBQUUsTUFBTSxFQUFFLENBQUMsQ0FDMUQsQ0FBQzthQUNMO1NBQ0o7UUFFRCw4QkFBOEI7UUFDOUIsSUFBSSxLQUFLLENBQUMsZ0JBQWdCLENBQUMsSUFBSSxFQUFFLEdBQUcsT0FBTyxPQUFPLEVBQUU7WUFDaEQsR0FBRyxFQUFFO2dCQUNELE9BQU8sRUFBRSxPQUFPLElBQUksT0FBTyxDQUFDLEdBQUcsQ0FBQyxtQkFBbUI7Z0JBQ25ELE1BQU0sRUFBRSxNQUFNLElBQUksT0FBTyxDQUFDLEdBQUcsQ0FBQyxrQkFBa0I7YUFDbkQ7WUFDRCxXQUFXO1lBQ1gsT0FBTztZQUNQLFVBQVU7WUFDVixhQUFhO1lBQ2IsWUFBWTtTQUNmLENBQUMsQ0FBQztRQUVILDJEQUEyRDtRQUMzRCxJQUFJLEdBQUcsQ0FBQyxLQUFLLENBQUMsSUFBSSxFQUFFLE9BQU8sRUFBRSxFQUFFLENBQUMsQ0FBQztJQUNyQyxDQUFDO0NBQ0o7QUFwRkQsc0NBb0ZDIiwic291cmNlc0NvbnRlbnQiOlsiLyogXG4gIENvcHlyaWdodCBBbWF6b24uY29tLCBJbmMuIG9yIGl0cyBhZmZpbGlhdGVzLiBBbGwgUmlnaHRzIFJlc2VydmVkLlxuICBcbiAgTGljZW5zZWQgdW5kZXIgdGhlIEFwYWNoZSBMaWNlbnNlLCBWZXJzaW9uIDIuMCAodGhlIFwiTGljZW5zZVwiKS5cbiAgWW91IG1heSBub3QgdXNlIHRoaXMgZmlsZSBleGNlcHQgaW4gY29tcGxpYW5jZSB3aXRoIHRoZSBMaWNlbnNlLlxuICBZb3UgbWF5IG9idGFpbiBhIGNvcHkgb2YgdGhlIExpY2Vuc2UgYXRcbiAgXG4gICAgICBodHRwOi8vd3d3LmFwYWNoZS5vcmcvbGljZW5zZXMvTElDRU5TRS0yLjBcbiAgXG4gIFVubGVzcyByZXF1aXJlZCBieSBhcHBsaWNhYmxlIGxhdyBvciBhZ3JlZWQgdG8gaW4gd3JpdGluZywgc29mdHdhcmVcbiAgZGlzdHJpYnV0ZWQgdW5kZXIgdGhlIExpY2Vuc2UgaXMgZGlzdHJpYnV0ZWQgb24gYW4gXCJBUyBJU1wiIEJBU0lTLFxuICBXSVRIT1VUIFdBUlJBTlRJRVMgT1IgQ09ORElUSU9OUyBPRiBBTlkgS0lORCwgZWl0aGVyIGV4cHJlc3Mgb3IgaW1wbGllZC5cbiAgU2VlIHRoZSBMaWNlbnNlIGZvciB0aGUgc3BlY2lmaWMgbGFuZ3VhZ2UgZ292ZXJuaW5nIHBlcm1pc3Npb25zIGFuZFxuICBsaW1pdGF0aW9ucyB1bmRlciB0aGUgTGljZW5zZS5cbiovXG5pbXBvcnQgJ3NvdXJjZS1tYXAtc3VwcG9ydC9yZWdpc3Rlcic7XG5pbXBvcnQgKiBhcyBjZGsgZnJvbSAnYXdzLWNkay1saWInO1xuaW1wb3J0IHsgQ29uc3RydWN0IH0gZnJvbSAnY29uc3RydWN0cyc7XG5pbXBvcnQgeyBBR1NTZXJ2aWNlU3RhZ2UsIEFHU1NlcnZpY2VTdGFnZVByb3BzIH0gZnJvbSAnLi9hZ3Mtc2VydmljZS1zdGFnZSc7XG5pbXBvcnQgKiBhcyBwYXRoIGZyb20gJ3BhdGgnO1xuaW1wb3J0ICogYXMgZnMgZnJvbSAnZnMnO1xuXG50eXBlIENvbnN0cnVjdG9yPFQgZXh0ZW5kcyBBR1NTZXJ2aWNlU3RhZ2U+ID0gbmV3IChcbiAgICBzY29wZTogQ29uc3RydWN0LFxuICAgIGlkOiBzdHJpbmcsXG4gICAgcHJvcHM6IEFHU1NlcnZpY2VTdGFnZVByb3BzXG4pID0+IFQ7XG5cbmV4cG9ydCBpbnRlcmZhY2UgQUdTU2VydmljZUFwcFByb3BzPFQgZXh0ZW5kcyBBR1NTZXJ2aWNlU3RhZ2U+IGV4dGVuZHMgY2RrLkFwcFByb3BzIHtcbiAgICBzdGFnZUNvbnN0cnVjdG9yOiBDb25zdHJ1Y3RvcjxUPjtcbiAgICBjdXJyZW50RGlyOiBzdHJpbmc7XG59XG5cbmV4cG9ydCBjbGFzcyBBR1NTZXJ2aWNlQXBwPFQgZXh0ZW5kcyBBR1NTZXJ2aWNlU3RhZ2U+IGV4dGVuZHMgY2RrLkFwcCB7XG4gICAgY29uc3RydWN0b3IocHJvcHM6IEFHU1NlcnZpY2VBcHBQcm9wczxUPikge1xuICAgICAgICBzdXBlcihwcm9wcyk7XG5cbiAgICAgICAgLy8gZ2V0IHNlcnZpY2UgbmFtZVxuICAgICAgICBjb25zdCBzZXJ2aWNlTmFtZSA9IHRoaXMubm9kZS50cnlHZXRDb250ZXh0KCdzZXJ2aWNlTmFtZScpO1xuICAgICAgICBpZiAoIXZhbGlkYXRlTmFtZShzZXJ2aWNlTmFtZSkpIHtcbiAgICAgICAgICAgIHRocm93IG5ldyBFcnJvcihcbiAgICAgICAgICAgICAgICAnU2VydmljZSBuYW1lIG11c3QgYmUgc3BlY2lmaWVkIGluIGNvbnRleHQuanNvbi4gVmFsaWQgdmFsdWUgc2hvdWxkIG1hdGNoIC9eW2EtekEtWjAtOS1fXSokLy4nXG4gICAgICAgICAgICApO1xuICAgICAgICB9XG5cbiAgICAgICAgZnVuY3Rpb24gdmFsaWRhdGVOYW1lKG5hbWU/OiBzdHJpbmcpOiBib29sZWFuIHtcbiAgICAgICAgICAgIHJldHVybiAhIW5hbWUgJiYgL15bYS16QS1aMC05XFwtX10rJC8udGVzdChuYW1lLnRyaW0oKSk7XG4gICAgICAgIH1cblxuICAgICAgICAvLyBjaGVjayBpZiBpdCBpcyBkZXBsb3kgdG8gcGVyc29uYWwgYWNjb3VudFxuICAgICAgICBjb25zdCBpc1BlcnNvbmFsID0gdGhpcy5ub2RlLnRyeUdldENvbnRleHQoJ3BlcnNvbmFsJykgPT09ICdvbic7XG5cbiAgICAgICAgLy8gZ2V0IGNvbmZpZ3VyYXRpb24gcGF0aFxuICAgICAgICBjb25zdCBjb25maWdQYXRoID0gcGF0aC5yZXNvbHZlKFxuICAgICAgICAgICAgcHJvcHMuY3VycmVudERpcixcbiAgICAgICAgICAgIHRoaXMubm9kZS50cnlHZXRDb250ZXh0KCdjb25maWd1cmF0aW9uUGF0aCcpXG4gICAgICAgICk7XG5cbiAgICAgICAgLy8gZ2V0IGNvbW1hbmQgbGluZSBhcmd1bWVudHMgb2YgYWNjb3VudCwgcmVnaW9uIGFuZCBlbnZOYW1lXG4gICAgICAgIGNvbnN0IGFjY291bnQgPVxuICAgICAgICAgICAgdGhpcy5ub2RlLnRyeUdldENvbnRleHQoJ2FjY291bnQnKSB8fCBwcm9jZXNzLmVudi5DREtfREVGQVVMVF9BQ0NPVU5UO1xuXG4gICAgICAgIGNvbnN0IHJlZ2lvbiA9XG4gICAgICAgICAgICB0aGlzLm5vZGUudHJ5R2V0Q29udGV4dCgncmVnaW9uJykgfHwgcHJvY2Vzcy5lbnYuQ0RLX0RFRkFVTFRfUkVHSU9OO1xuXG4gICAgICAgIC8vIGRlZmF1bHQgY29uZmlndXJhdGlvbiBpcyBcIkRlZmF1bHQuanNvblwiIGFuZCBkZWZhdWx0IGVudiBpcyBEZWZhdWx0XG4gICAgICAgIGxldCBlbnZOYW1lID0gdGhpcy5ub2RlLnRyeUdldENvbnRleHQoJ2Vudk5hbWUnKSB8fCAnRGVmYXVsdCc7XG4gICAgICAgIGxldCBjb25maWdOYW1lID0gdGhpcy5ub2RlLnRyeUdldENvbnRleHQoJ2NvbmZpZ05hbWUnKSB8fCAnRGVmYXVsdCc7XG5cbiAgICAgICAgLy9oYW5kbGUgcGVyc29uYWwgZGV2IGRlcGxveW1lbnRcbiAgICAgICAgaWYgKGlzUGVyc29uYWwpIHtcbiAgICAgICAgICAgIGNvbmZpZ05hbWUgPSAnUGVyc29uYWwnO1xuICAgICAgICAgICAgZW52TmFtZSA9ICdQZXJzb25hbCc7XG4gICAgICAgIH1cblxuICAgICAgICAvLyByZWFkIGNvbmZpZ3VyYXRpb24gZnJvbSB0aGUgZmlsZVxuICAgICAgICBjb25zdCBjb25maWdGaWxlUGF0aCA9IHBhdGguam9pbihjb25maWdQYXRoLCBgJHtjb25maWdOYW1lfS5qc29uYCk7XG4gICAgICAgIGlmICghZnMuZXhpc3RzU3luYyhjb25maWdGaWxlUGF0aCkpIHtcbiAgICAgICAgICAgIHRocm93IG5ldyBFcnJvcihcbiAgICAgICAgICAgICAgICBgU2VydmljZSBjb25maWd1cmF0aW9uIGZpbGUgbm90IGZvdW5kLiBwYXRoOiBbJHtjb25maWdGaWxlUGF0aH1dYFxuICAgICAgICAgICAgKTtcbiAgICAgICAgfVxuXG4gICAgICAgIGNvbnN0IGNvbmZpZ0ZpbGUgPSBmcy5yZWFkRmlsZVN5bmMoY29uZmlnRmlsZVBhdGgsIHsgZW5jb2Rpbmc6ICd1dGY4JyB9KTtcblxuICAgICAgICAvLyBjb25maWd1cmF0aW9uIGlzIHRoZSBkYXRhIGluIHRoZSBrZXkgbmFtZWQgYnkgdGhlIHNlcnZpY2UgbmFtZVxuICAgICAgICBjb25zdCBjb25maWd1cmF0aW9uID0gSlNPTi5wYXJzZShjb25maWdGaWxlKVtzZXJ2aWNlTmFtZV07XG5cbiAgICAgICAgLy8gcmVhZCBzb2x1dGlvbiBjb250YWluaW5nIHNvbHV0aW9uIGlkIGFuZCB2ZXJzaW9uIGZpbGVcbiAgICAgICAgY29uc3Qgc29sdXRpb25JbmZvRmlsZVBhdGggPSB0aGlzLm5vZGUudHJ5R2V0Q29udGV4dCgnc29sdXRpb25JbmZvRmlsZVBhdGgnKTtcbiAgICAgICAgbGV0IHNvbHV0aW9uSW5mbzogUmVjb3JkPHN0cmluZywgc3RyaW5nPiB8IHVuZGVmaW5lZCA9IHVuZGVmaW5lZDtcblxuICAgICAgICBpZiAoc29sdXRpb25JbmZvRmlsZVBhdGgpIHtcbiAgICAgICAgICAgIGNvbnN0IHNvbHV0aW9uSW5mb0ZpbGUgPSBwYXRoLnJlc29sdmUocHJvcHMuY3VycmVudERpciwgc29sdXRpb25JbmZvRmlsZVBhdGgpO1xuICAgICAgICAgICAgaWYgKGZzLmV4aXN0c1N5bmMoc29sdXRpb25JbmZvRmlsZSkpIHtcbiAgICAgICAgICAgICAgICBzb2x1dGlvbkluZm8gPSBKU09OLnBhcnNlKFxuICAgICAgICAgICAgICAgICAgICBmcy5yZWFkRmlsZVN5bmMoc29sdXRpb25JbmZvRmlsZSwgeyBlbmNvZGluZzogJ3V0ZjgnIH0pXG4gICAgICAgICAgICAgICAgKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuXG4gICAgICAgIC8vIHN5bnRoIHN0YWdlcyBiYXNlZCBvbiBpbnB1dFxuICAgICAgICBuZXcgcHJvcHMuc3RhZ2VDb25zdHJ1Y3Rvcih0aGlzLCBgJHtlbnZOYW1lfVN0YWdlYCwge1xuICAgICAgICAgICAgZW52OiB7XG4gICAgICAgICAgICAgICAgYWNjb3VudDogYWNjb3VudCB8fCBwcm9jZXNzLmVudi5DREtfREVGQVVMVF9BQ0NPVU5ULFxuICAgICAgICAgICAgICAgIHJlZ2lvbjogcmVnaW9uIHx8IHByb2Nlc3MuZW52LkNES19ERUZBVUxUX1JFR0lPTixcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICBzZXJ2aWNlTmFtZSxcbiAgICAgICAgICAgIGVudk5hbWUsXG4gICAgICAgICAgICBjb25maWdOYW1lLFxuICAgICAgICAgICAgY29uZmlndXJhdGlvbixcbiAgICAgICAgICAgIHNvbHV0aW9uSW5mbyxcbiAgICAgICAgfSk7XG5cbiAgICAgICAgLy8gZHVtbXkgc3RhY2sgdG8gcmVtb3ZlIHRoZSBlcnJvciBmb3Igbm8gc3RhY2sgYWZ0ZXIgc3ludGhcbiAgICAgICAgbmV3IGNkay5TdGFjayh0aGlzLCAnTm9uT3AnLCB7fSk7XG4gICAgfVxufVxuIl19