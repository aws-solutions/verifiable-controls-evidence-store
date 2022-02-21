"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AgsSecureBucket = void 0;
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
const s3 = require("@aws-cdk/aws-s3");
const kms = require("@aws-cdk/aws-kms");
const iam = require("@aws-cdk/aws-iam");
class AgsSecureBucket extends cdk.Construct {
    constructor(scope, id, props) {
        super(scope, id);
        this.encryptionKey = props.encryptionKeyArn
            ? kms.Key.fromKeyArn(this, `encryption-key-${id}`, props.encryptionKeyArn)
            : new kms.Key(this, `encryption-key-${id}`, {
                removalPolicy: props.removalPolicy,
                enableKeyRotation: true,
            });
        this.bucket = new s3.Bucket(this, `ags-${id}`, {
            ...props,
            encryptionKey: this.encryptionKey,
            encryption: s3.BucketEncryption.KMS,
            blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL,
            accessControl: s3.BucketAccessControl.LOG_DELIVERY_WRITE,
            versioned: true,
            serverAccessLogsPrefix: 'access-log',
        });
        this.bucket.addToResourcePolicy(new iam.PolicyStatement({
            sid: 'HttpsOnly',
            resources: [`${this.bucket.bucketArn}/*`],
            actions: ['*'],
            principals: [new iam.AnyPrincipal()],
            effect: iam.Effect.DENY,
            conditions: {
                Bool: {
                    'aws:SecureTransport': 'false',
                },
            },
        }));
    }
}
exports.AgsSecureBucket = AgsSecureBucket;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiYWdzLXNlY3VyZS1idWNrZXQuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi9saWIvYWdzLXNlY3VyZS1idWNrZXQudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7O0FBQUE7Ozs7Ozs7Ozs7Ozs7O0VBY0U7QUFDRixxQ0FBcUM7QUFDckMsc0NBQXNDO0FBQ3RDLHdDQUF3QztBQUN4Qyx3Q0FBd0M7QUFZeEMsTUFBYSxlQUFnQixTQUFRLEdBQUcsQ0FBQyxTQUFTO0lBSTlDLFlBQVksS0FBb0IsRUFBRSxFQUFVLEVBQUUsS0FBMkI7UUFDckUsS0FBSyxDQUFDLEtBQUssRUFBRSxFQUFFLENBQUMsQ0FBQztRQUVqQixJQUFJLENBQUMsYUFBYSxHQUFHLEtBQUssQ0FBQyxnQkFBZ0I7WUFDdkMsQ0FBQyxDQUFDLEdBQUcsQ0FBQyxHQUFHLENBQUMsVUFBVSxDQUFDLElBQUksRUFBRSxrQkFBa0IsRUFBRSxFQUFFLEVBQUUsS0FBSyxDQUFDLGdCQUFnQixDQUFDO1lBQzFFLENBQUMsQ0FBQyxJQUFJLEdBQUcsQ0FBQyxHQUFHLENBQUMsSUFBSSxFQUFFLGtCQUFrQixFQUFFLEVBQUUsRUFBRTtnQkFDdEMsYUFBYSxFQUFFLEtBQUssQ0FBQyxhQUFhO2dCQUNsQyxpQkFBaUIsRUFBRSxJQUFJO2FBQzFCLENBQUMsQ0FBQztRQUVULElBQUksQ0FBQyxNQUFNLEdBQUcsSUFBSSxFQUFFLENBQUMsTUFBTSxDQUFDLElBQUksRUFBRSxPQUFPLEVBQUUsRUFBRSxFQUFFO1lBQzNDLEdBQUcsS0FBSztZQUNSLGFBQWEsRUFBRSxJQUFJLENBQUMsYUFBYTtZQUNqQyxVQUFVLEVBQUUsRUFBRSxDQUFDLGdCQUFnQixDQUFDLEdBQUc7WUFDbkMsaUJBQWlCLEVBQUUsRUFBRSxDQUFDLGlCQUFpQixDQUFDLFNBQVM7WUFDakQsYUFBYSxFQUFFLEVBQUUsQ0FBQyxtQkFBbUIsQ0FBQyxrQkFBa0I7WUFDeEQsU0FBUyxFQUFFLElBQUk7WUFDZixzQkFBc0IsRUFBRSxZQUFZO1NBQ3ZDLENBQUMsQ0FBQztRQUVILElBQUksQ0FBQyxNQUFNLENBQUMsbUJBQW1CLENBQzNCLElBQUksR0FBRyxDQUFDLGVBQWUsQ0FBQztZQUNwQixHQUFHLEVBQUUsV0FBVztZQUNoQixTQUFTLEVBQUUsQ0FBQyxHQUFHLElBQUksQ0FBQyxNQUFNLENBQUMsU0FBUyxJQUFJLENBQUM7WUFDekMsT0FBTyxFQUFFLENBQUMsR0FBRyxDQUFDO1lBQ2QsVUFBVSxFQUFFLENBQUMsSUFBSSxHQUFHLENBQUMsWUFBWSxFQUFFLENBQUM7WUFDcEMsTUFBTSxFQUFFLEdBQUcsQ0FBQyxNQUFNLENBQUMsSUFBSTtZQUN2QixVQUFVLEVBQUU7Z0JBQ1IsSUFBSSxFQUFFO29CQUNGLHFCQUFxQixFQUFFLE9BQU87aUJBQ2pDO2FBQ0o7U0FDSixDQUFDLENBQ0wsQ0FBQztJQUNOLENBQUM7Q0FDSjtBQXZDRCwwQ0F1Q0MiLCJzb3VyY2VzQ29udGVudCI6WyIvKiBcbiAgQ29weXJpZ2h0IEFtYXpvbi5jb20sIEluYy4gb3IgaXRzIGFmZmlsaWF0ZXMuIEFsbCBSaWdodHMgUmVzZXJ2ZWQuXG4gIFxuICBMaWNlbnNlZCB1bmRlciB0aGUgQXBhY2hlIExpY2Vuc2UsIFZlcnNpb24gMi4wICh0aGUgXCJMaWNlbnNlXCIpLlxuICBZb3UgbWF5IG5vdCB1c2UgdGhpcyBmaWxlIGV4Y2VwdCBpbiBjb21wbGlhbmNlIHdpdGggdGhlIExpY2Vuc2UuXG4gIFlvdSBtYXkgb2J0YWluIGEgY29weSBvZiB0aGUgTGljZW5zZSBhdFxuICBcbiAgICAgIGh0dHA6Ly93d3cuYXBhY2hlLm9yZy9saWNlbnNlcy9MSUNFTlNFLTIuMFxuICBcbiAgVW5sZXNzIHJlcXVpcmVkIGJ5IGFwcGxpY2FibGUgbGF3IG9yIGFncmVlZCB0byBpbiB3cml0aW5nLCBzb2Z0d2FyZVxuICBkaXN0cmlidXRlZCB1bmRlciB0aGUgTGljZW5zZSBpcyBkaXN0cmlidXRlZCBvbiBhbiBcIkFTIElTXCIgQkFTSVMsXG4gIFdJVEhPVVQgV0FSUkFOVElFUyBPUiBDT05ESVRJT05TIE9GIEFOWSBLSU5ELCBlaXRoZXIgZXhwcmVzcyBvciBpbXBsaWVkLlxuICBTZWUgdGhlIExpY2Vuc2UgZm9yIHRoZSBzcGVjaWZpYyBsYW5ndWFnZSBnb3Zlcm5pbmcgcGVybWlzc2lvbnMgYW5kXG4gIGxpbWl0YXRpb25zIHVuZGVyIHRoZSBMaWNlbnNlLlxuKi9cbmltcG9ydCAqIGFzIGNkayBmcm9tICdAYXdzLWNkay9jb3JlJztcbmltcG9ydCAqIGFzIHMzIGZyb20gJ0Bhd3MtY2RrL2F3cy1zMyc7XG5pbXBvcnQgKiBhcyBrbXMgZnJvbSAnQGF3cy1jZGsvYXdzLWttcyc7XG5pbXBvcnQgKiBhcyBpYW0gZnJvbSAnQGF3cy1jZGsvYXdzLWlhbSc7XG5cbmV4cG9ydCB0eXBlIEFnc1NlY3VyZUJ1Y2tldFByb3BzID0gT21pdDxcbiAgICBzMy5CdWNrZXRQcm9wcyxcbiAgICB8ICdlbmNyeXB0aW9uS2V5J1xuICAgIHwgJ2VuY3J5cHRpb24nXG4gICAgfCAnYmxvY2tQdWJsaWNBY2Nlc3MnXG4gICAgfCAnYWNjZXNzQ29udHJvbCdcbiAgICB8ICd2ZXJzaW9uZWQnXG4gICAgfCAnc2VydmVyQWNjZXNzTG9nc1ByZWZpeCdcbj4gJiB7IGVuY3J5cHRpb25LZXlBcm4/OiBzdHJpbmcgfTtcblxuZXhwb3J0IGNsYXNzIEFnc1NlY3VyZUJ1Y2tldCBleHRlbmRzIGNkay5Db25zdHJ1Y3Qge1xuICAgIHB1YmxpYyByZWFkb25seSBidWNrZXQ6IHMzLkJ1Y2tldDtcbiAgICBwdWJsaWMgcmVhZG9ubHkgZW5jcnlwdGlvbktleToga21zLklLZXk7XG5cbiAgICBjb25zdHJ1Y3RvcihzY29wZTogY2RrLkNvbnN0cnVjdCwgaWQ6IHN0cmluZywgcHJvcHM6IEFnc1NlY3VyZUJ1Y2tldFByb3BzKSB7XG4gICAgICAgIHN1cGVyKHNjb3BlLCBpZCk7XG5cbiAgICAgICAgdGhpcy5lbmNyeXB0aW9uS2V5ID0gcHJvcHMuZW5jcnlwdGlvbktleUFyblxuICAgICAgICAgICAgPyBrbXMuS2V5LmZyb21LZXlBcm4odGhpcywgYGVuY3J5cHRpb24ta2V5LSR7aWR9YCwgcHJvcHMuZW5jcnlwdGlvbktleUFybilcbiAgICAgICAgICAgIDogbmV3IGttcy5LZXkodGhpcywgYGVuY3J5cHRpb24ta2V5LSR7aWR9YCwge1xuICAgICAgICAgICAgICAgICAgcmVtb3ZhbFBvbGljeTogcHJvcHMucmVtb3ZhbFBvbGljeSxcbiAgICAgICAgICAgICAgICAgIGVuYWJsZUtleVJvdGF0aW9uOiB0cnVlLFxuICAgICAgICAgICAgICB9KTtcblxuICAgICAgICB0aGlzLmJ1Y2tldCA9IG5ldyBzMy5CdWNrZXQodGhpcywgYGFncy0ke2lkfWAsIHtcbiAgICAgICAgICAgIC4uLnByb3BzLFxuICAgICAgICAgICAgZW5jcnlwdGlvbktleTogdGhpcy5lbmNyeXB0aW9uS2V5LFxuICAgICAgICAgICAgZW5jcnlwdGlvbjogczMuQnVja2V0RW5jcnlwdGlvbi5LTVMsXG4gICAgICAgICAgICBibG9ja1B1YmxpY0FjY2VzczogczMuQmxvY2tQdWJsaWNBY2Nlc3MuQkxPQ0tfQUxMLFxuICAgICAgICAgICAgYWNjZXNzQ29udHJvbDogczMuQnVja2V0QWNjZXNzQ29udHJvbC5MT0dfREVMSVZFUllfV1JJVEUsXG4gICAgICAgICAgICB2ZXJzaW9uZWQ6IHRydWUsXG4gICAgICAgICAgICBzZXJ2ZXJBY2Nlc3NMb2dzUHJlZml4OiAnYWNjZXNzLWxvZycsXG4gICAgICAgIH0pO1xuXG4gICAgICAgIHRoaXMuYnVja2V0LmFkZFRvUmVzb3VyY2VQb2xpY3koXG4gICAgICAgICAgICBuZXcgaWFtLlBvbGljeVN0YXRlbWVudCh7XG4gICAgICAgICAgICAgICAgc2lkOiAnSHR0cHNPbmx5JyxcbiAgICAgICAgICAgICAgICByZXNvdXJjZXM6IFtgJHt0aGlzLmJ1Y2tldC5idWNrZXRBcm59LypgXSxcbiAgICAgICAgICAgICAgICBhY3Rpb25zOiBbJyonXSxcbiAgICAgICAgICAgICAgICBwcmluY2lwYWxzOiBbbmV3IGlhbS5BbnlQcmluY2lwYWwoKV0sXG4gICAgICAgICAgICAgICAgZWZmZWN0OiBpYW0uRWZmZWN0LkRFTlksXG4gICAgICAgICAgICAgICAgY29uZGl0aW9uczoge1xuICAgICAgICAgICAgICAgICAgICBCb29sOiB7XG4gICAgICAgICAgICAgICAgICAgICAgICAnYXdzOlNlY3VyZVRyYW5zcG9ydCc6ICdmYWxzZScsXG4gICAgICAgICAgICAgICAgICAgIH0sXG4gICAgICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIH0pXG4gICAgICAgICk7XG4gICAgfVxufVxuIl19