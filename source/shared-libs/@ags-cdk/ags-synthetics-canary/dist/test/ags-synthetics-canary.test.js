"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
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
const assert_1 = require("@aws-cdk/assert");
const cdk = require("@aws-cdk/core");
const synthetics = require("@aws-cdk/aws-synthetics");
const ags_synthetics_canary_1 = require("../lib/ags-synthetics-canary");
class TestStack extends cdk.Stack {
    constructor(scope, id, props) {
        super(scope, id, props);
        new ags_synthetics_canary_1.AGSSyntheticsCanary(this, 'Canary', {
            canaryName: 'test-canary',
            runtime: synthetics.Runtime.SYNTHETICS_NODEJS_PUPPETEER_3_0,
            test: synthetics.Test.custom({
                code: synthetics.Code.fromInline('Code here'),
                handler: 'index.handler',
            }),
            schedule: synthetics.Schedule.rate(cdk.Duration.minutes(10)),
            startAfterCreation: false,
            environmentVariables: {
                Env1: 'Value1',
                Env2: 'Value2',
            },
            timeoutInSeconds: 30,
        });
    }
}
test('Snapshot Test', () => {
    const app = new cdk.App();
    // WHEN
    const stack = new TestStack(app, 'MyTestStack', {
        env: { account: '123', region: 'ap-southeast-2' },
    });
    // THEN
    expect(assert_1.SynthUtils.toCloudFormation(stack)).toMatchSnapshot();
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiYWdzLXN5bnRoZXRpY3MtY2FuYXJ5LnRlc3QuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi90ZXN0L2Fncy1zeW50aGV0aWNzLWNhbmFyeS50ZXN0LnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7O0FBQUE7Ozs7Ozs7Ozs7Ozs7O0VBY0U7QUFDRiw0Q0FBNkM7QUFDN0MscUNBQXFDO0FBQ3JDLHNEQUFzRDtBQUN0RCx3RUFBbUU7QUFFbkUsTUFBTSxTQUFVLFNBQVEsR0FBRyxDQUFDLEtBQUs7SUFDN0IsWUFBWSxLQUFvQixFQUFFLEVBQVUsRUFBRSxLQUFxQjtRQUMvRCxLQUFLLENBQUMsS0FBSyxFQUFFLEVBQUUsRUFBRSxLQUFLLENBQUMsQ0FBQztRQUN4QixJQUFJLDJDQUFtQixDQUFDLElBQUksRUFBRSxRQUFRLEVBQUU7WUFDcEMsVUFBVSxFQUFFLGFBQWE7WUFDekIsT0FBTyxFQUFFLFVBQVUsQ0FBQyxPQUFPLENBQUMsK0JBQStCO1lBQzNELElBQUksRUFBRSxVQUFVLENBQUMsSUFBSSxDQUFDLE1BQU0sQ0FBQztnQkFDekIsSUFBSSxFQUFFLFVBQVUsQ0FBQyxJQUFJLENBQUMsVUFBVSxDQUFDLFdBQVcsQ0FBQztnQkFDN0MsT0FBTyxFQUFFLGVBQWU7YUFDM0IsQ0FBQztZQUNGLFFBQVEsRUFBRSxVQUFVLENBQUMsUUFBUSxDQUFDLElBQUksQ0FBQyxHQUFHLENBQUMsUUFBUSxDQUFDLE9BQU8sQ0FBQyxFQUFFLENBQUMsQ0FBQztZQUM1RCxrQkFBa0IsRUFBRSxLQUFLO1lBQ3pCLG9CQUFvQixFQUFFO2dCQUNsQixJQUFJLEVBQUUsUUFBUTtnQkFDZCxJQUFJLEVBQUUsUUFBUTthQUNqQjtZQUNELGdCQUFnQixFQUFFLEVBQUU7U0FDdkIsQ0FBQyxDQUFDO0lBQ1AsQ0FBQztDQUNKO0FBRUQsSUFBSSxDQUFDLGVBQWUsRUFBRSxHQUFHLEVBQUU7SUFDdkIsTUFBTSxHQUFHLEdBQUcsSUFBSSxHQUFHLENBQUMsR0FBRyxFQUFFLENBQUM7SUFDMUIsT0FBTztJQUNQLE1BQU0sS0FBSyxHQUFHLElBQUksU0FBUyxDQUFDLEdBQUcsRUFBRSxhQUFhLEVBQUU7UUFDNUMsR0FBRyxFQUFFLEVBQUUsT0FBTyxFQUFFLEtBQUssRUFBRSxNQUFNLEVBQUUsZ0JBQWdCLEVBQUU7S0FDcEQsQ0FBQyxDQUFDO0lBQ0gsT0FBTztJQUNQLE1BQU0sQ0FBQyxtQkFBVSxDQUFDLGdCQUFnQixDQUFDLEtBQUssQ0FBQyxDQUFDLENBQUMsZUFBZSxFQUFFLENBQUM7QUFDakUsQ0FBQyxDQUFDLENBQUMiLCJzb3VyY2VzQ29udGVudCI6WyIvKiBcbiAgQ29weXJpZ2h0IEFtYXpvbi5jb20sIEluYy4gb3IgaXRzIGFmZmlsaWF0ZXMuIEFsbCBSaWdodHMgUmVzZXJ2ZWQuXG4gIFxuICBMaWNlbnNlZCB1bmRlciB0aGUgQXBhY2hlIExpY2Vuc2UsIFZlcnNpb24gMi4wICh0aGUgXCJMaWNlbnNlXCIpLlxuICBZb3UgbWF5IG5vdCB1c2UgdGhpcyBmaWxlIGV4Y2VwdCBpbiBjb21wbGlhbmNlIHdpdGggdGhlIExpY2Vuc2UuXG4gIFlvdSBtYXkgb2J0YWluIGEgY29weSBvZiB0aGUgTGljZW5zZSBhdFxuICBcbiAgICAgIGh0dHA6Ly93d3cuYXBhY2hlLm9yZy9saWNlbnNlcy9MSUNFTlNFLTIuMFxuICBcbiAgVW5sZXNzIHJlcXVpcmVkIGJ5IGFwcGxpY2FibGUgbGF3IG9yIGFncmVlZCB0byBpbiB3cml0aW5nLCBzb2Z0d2FyZVxuICBkaXN0cmlidXRlZCB1bmRlciB0aGUgTGljZW5zZSBpcyBkaXN0cmlidXRlZCBvbiBhbiBcIkFTIElTXCIgQkFTSVMsXG4gIFdJVEhPVVQgV0FSUkFOVElFUyBPUiBDT05ESVRJT05TIE9GIEFOWSBLSU5ELCBlaXRoZXIgZXhwcmVzcyBvciBpbXBsaWVkLlxuICBTZWUgdGhlIExpY2Vuc2UgZm9yIHRoZSBzcGVjaWZpYyBsYW5ndWFnZSBnb3Zlcm5pbmcgcGVybWlzc2lvbnMgYW5kXG4gIGxpbWl0YXRpb25zIHVuZGVyIHRoZSBMaWNlbnNlLlxuKi9cbmltcG9ydCB7IFN5bnRoVXRpbHMgfSBmcm9tICdAYXdzLWNkay9hc3NlcnQnO1xuaW1wb3J0ICogYXMgY2RrIGZyb20gJ0Bhd3MtY2RrL2NvcmUnO1xuaW1wb3J0ICogYXMgc3ludGhldGljcyBmcm9tICdAYXdzLWNkay9hd3Mtc3ludGhldGljcyc7XG5pbXBvcnQgeyBBR1NTeW50aGV0aWNzQ2FuYXJ5IH0gZnJvbSAnLi4vbGliL2Fncy1zeW50aGV0aWNzLWNhbmFyeSc7XG5cbmNsYXNzIFRlc3RTdGFjayBleHRlbmRzIGNkay5TdGFjayB7XG4gICAgY29uc3RydWN0b3Ioc2NvcGU6IGNkay5Db25zdHJ1Y3QsIGlkOiBzdHJpbmcsIHByb3BzOiBjZGsuU3RhY2tQcm9wcykge1xuICAgICAgICBzdXBlcihzY29wZSwgaWQsIHByb3BzKTtcbiAgICAgICAgbmV3IEFHU1N5bnRoZXRpY3NDYW5hcnkodGhpcywgJ0NhbmFyeScsIHtcbiAgICAgICAgICAgIGNhbmFyeU5hbWU6ICd0ZXN0LWNhbmFyeScsXG4gICAgICAgICAgICBydW50aW1lOiBzeW50aGV0aWNzLlJ1bnRpbWUuU1lOVEhFVElDU19OT0RFSlNfUFVQUEVURUVSXzNfMCxcbiAgICAgICAgICAgIHRlc3Q6IHN5bnRoZXRpY3MuVGVzdC5jdXN0b20oe1xuICAgICAgICAgICAgICAgIGNvZGU6IHN5bnRoZXRpY3MuQ29kZS5mcm9tSW5saW5lKCdDb2RlIGhlcmUnKSxcbiAgICAgICAgICAgICAgICBoYW5kbGVyOiAnaW5kZXguaGFuZGxlcicsXG4gICAgICAgICAgICB9KSxcbiAgICAgICAgICAgIHNjaGVkdWxlOiBzeW50aGV0aWNzLlNjaGVkdWxlLnJhdGUoY2RrLkR1cmF0aW9uLm1pbnV0ZXMoMTApKSxcbiAgICAgICAgICAgIHN0YXJ0QWZ0ZXJDcmVhdGlvbjogZmFsc2UsXG4gICAgICAgICAgICBlbnZpcm9ubWVudFZhcmlhYmxlczoge1xuICAgICAgICAgICAgICAgIEVudjE6ICdWYWx1ZTEnLFxuICAgICAgICAgICAgICAgIEVudjI6ICdWYWx1ZTInLFxuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIHRpbWVvdXRJblNlY29uZHM6IDMwLFxuICAgICAgICB9KTtcbiAgICB9XG59XG5cbnRlc3QoJ1NuYXBzaG90IFRlc3QnLCAoKSA9PiB7XG4gICAgY29uc3QgYXBwID0gbmV3IGNkay5BcHAoKTtcbiAgICAvLyBXSEVOXG4gICAgY29uc3Qgc3RhY2sgPSBuZXcgVGVzdFN0YWNrKGFwcCwgJ015VGVzdFN0YWNrJywge1xuICAgICAgICBlbnY6IHsgYWNjb3VudDogJzEyMycsIHJlZ2lvbjogJ2FwLXNvdXRoZWFzdC0yJyB9LFxuICAgIH0pO1xuICAgIC8vIFRIRU5cbiAgICBleHBlY3QoU3ludGhVdGlscy50b0Nsb3VkRm9ybWF0aW9uKHN0YWNrKSkudG9NYXRjaFNuYXBzaG90KCk7XG59KTtcbiJdfQ==