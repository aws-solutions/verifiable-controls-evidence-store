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
const s3 = require("aws-cdk-lib/aws-s3");
const kms = require("aws-cdk-lib/aws-kms");
const iam = require("aws-cdk-lib/aws-iam");
const constructs_1 = require("constructs");
class AgsSecureBucket extends constructs_1.Construct {
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiYWdzLXNlY3VyZS1idWNrZXQuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi9saWIvYWdzLXNlY3VyZS1idWNrZXQudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7O0FBQUE7Ozs7Ozs7Ozs7Ozs7O0VBY0U7QUFDRix5Q0FBeUM7QUFDekMsMkNBQTJDO0FBQzNDLDJDQUEyQztBQUMzQywyQ0FBdUM7QUFZdkMsTUFBYSxlQUFnQixTQUFRLHNCQUFTO0lBSTFDLFlBQVksS0FBZ0IsRUFBRSxFQUFVLEVBQUUsS0FBMkI7UUFDakUsS0FBSyxDQUFDLEtBQUssRUFBRSxFQUFFLENBQUMsQ0FBQztRQUVqQixJQUFJLENBQUMsYUFBYSxHQUFHLEtBQUssQ0FBQyxnQkFBZ0I7WUFDdkMsQ0FBQyxDQUFDLEdBQUcsQ0FBQyxHQUFHLENBQUMsVUFBVSxDQUFDLElBQUksRUFBRSxrQkFBa0IsRUFBRSxFQUFFLEVBQUUsS0FBSyxDQUFDLGdCQUFnQixDQUFDO1lBQzFFLENBQUMsQ0FBQyxJQUFJLEdBQUcsQ0FBQyxHQUFHLENBQUMsSUFBSSxFQUFFLGtCQUFrQixFQUFFLEVBQUUsRUFBRTtnQkFDdEMsYUFBYSxFQUFFLEtBQUssQ0FBQyxhQUFhO2dCQUNsQyxpQkFBaUIsRUFBRSxJQUFJO2FBQzFCLENBQUMsQ0FBQztRQUVULElBQUksQ0FBQyxNQUFNLEdBQUcsSUFBSSxFQUFFLENBQUMsTUFBTSxDQUFDLElBQUksRUFBRSxPQUFPLEVBQUUsRUFBRSxFQUFFO1lBQzNDLEdBQUcsS0FBSztZQUNSLGFBQWEsRUFBRSxJQUFJLENBQUMsYUFBYTtZQUNqQyxVQUFVLEVBQUUsRUFBRSxDQUFDLGdCQUFnQixDQUFDLEdBQUc7WUFDbkMsaUJBQWlCLEVBQUUsRUFBRSxDQUFDLGlCQUFpQixDQUFDLFNBQVM7WUFDakQsYUFBYSxFQUFFLEVBQUUsQ0FBQyxtQkFBbUIsQ0FBQyxrQkFBa0I7WUFDeEQsU0FBUyxFQUFFLElBQUk7U0FDbEIsQ0FBQyxDQUFDO1FBRUgsSUFBSSxDQUFDLE1BQU0sQ0FBQyxtQkFBbUIsQ0FDM0IsSUFBSSxHQUFHLENBQUMsZUFBZSxDQUFDO1lBQ3BCLEdBQUcsRUFBRSxXQUFXO1lBQ2hCLFNBQVMsRUFBRSxDQUFDLEdBQUcsSUFBSSxDQUFDLE1BQU0sQ0FBQyxTQUFTLElBQUksQ0FBQztZQUN6QyxPQUFPLEVBQUUsQ0FBQyxHQUFHLENBQUM7WUFDZCxVQUFVLEVBQUUsQ0FBQyxJQUFJLEdBQUcsQ0FBQyxZQUFZLEVBQUUsQ0FBQztZQUNwQyxNQUFNLEVBQUUsR0FBRyxDQUFDLE1BQU0sQ0FBQyxJQUFJO1lBQ3ZCLFVBQVUsRUFBRTtnQkFDUixJQUFJLEVBQUU7b0JBQ0YscUJBQXFCLEVBQUUsT0FBTztpQkFDakM7YUFDSjtTQUNKLENBQUMsQ0FDTCxDQUFDO0lBQ04sQ0FBQztDQUNKO0FBdENELDBDQXNDQyIsInNvdXJjZXNDb250ZW50IjpbIi8qIFxuICBDb3B5cmlnaHQgQW1hem9uLmNvbSwgSW5jLiBvciBpdHMgYWZmaWxpYXRlcy4gQWxsIFJpZ2h0cyBSZXNlcnZlZC5cbiAgXG4gIExpY2Vuc2VkIHVuZGVyIHRoZSBBcGFjaGUgTGljZW5zZSwgVmVyc2lvbiAyLjAgKHRoZSBcIkxpY2Vuc2VcIikuXG4gIFlvdSBtYXkgbm90IHVzZSB0aGlzIGZpbGUgZXhjZXB0IGluIGNvbXBsaWFuY2Ugd2l0aCB0aGUgTGljZW5zZS5cbiAgWW91IG1heSBvYnRhaW4gYSBjb3B5IG9mIHRoZSBMaWNlbnNlIGF0XG4gIFxuICAgICAgaHR0cDovL3d3dy5hcGFjaGUub3JnL2xpY2Vuc2VzL0xJQ0VOU0UtMi4wXG4gIFxuICBVbmxlc3MgcmVxdWlyZWQgYnkgYXBwbGljYWJsZSBsYXcgb3IgYWdyZWVkIHRvIGluIHdyaXRpbmcsIHNvZnR3YXJlXG4gIGRpc3RyaWJ1dGVkIHVuZGVyIHRoZSBMaWNlbnNlIGlzIGRpc3RyaWJ1dGVkIG9uIGFuIFwiQVMgSVNcIiBCQVNJUyxcbiAgV0lUSE9VVCBXQVJSQU5USUVTIE9SIENPTkRJVElPTlMgT0YgQU5ZIEtJTkQsIGVpdGhlciBleHByZXNzIG9yIGltcGxpZWQuXG4gIFNlZSB0aGUgTGljZW5zZSBmb3IgdGhlIHNwZWNpZmljIGxhbmd1YWdlIGdvdmVybmluZyBwZXJtaXNzaW9ucyBhbmRcbiAgbGltaXRhdGlvbnMgdW5kZXIgdGhlIExpY2Vuc2UuXG4qL1xuaW1wb3J0ICogYXMgczMgZnJvbSAnYXdzLWNkay1saWIvYXdzLXMzJztcbmltcG9ydCAqIGFzIGttcyBmcm9tICdhd3MtY2RrLWxpYi9hd3Mta21zJztcbmltcG9ydCAqIGFzIGlhbSBmcm9tICdhd3MtY2RrLWxpYi9hd3MtaWFtJztcbmltcG9ydCB7IENvbnN0cnVjdCB9IGZyb20gJ2NvbnN0cnVjdHMnO1xuXG5leHBvcnQgdHlwZSBBZ3NTZWN1cmVCdWNrZXRQcm9wcyA9IE9taXQ8XG4gICAgczMuQnVja2V0UHJvcHMsXG4gICAgfCAnZW5jcnlwdGlvbktleSdcbiAgICB8ICdlbmNyeXB0aW9uJ1xuICAgIHwgJ2Jsb2NrUHVibGljQWNjZXNzJ1xuICAgIHwgJ2FjY2Vzc0NvbnRyb2wnXG4gICAgfCAndmVyc2lvbmVkJ1xuICAgIHwgJ3NlcnZlckFjY2Vzc0xvZ3NQcmVmaXgnXG4+ICYgeyBlbmNyeXB0aW9uS2V5QXJuPzogc3RyaW5nIH07XG5cbmV4cG9ydCBjbGFzcyBBZ3NTZWN1cmVCdWNrZXQgZXh0ZW5kcyBDb25zdHJ1Y3Qge1xuICAgIHB1YmxpYyByZWFkb25seSBidWNrZXQ6IHMzLkJ1Y2tldDtcbiAgICBwdWJsaWMgcmVhZG9ubHkgZW5jcnlwdGlvbktleToga21zLklLZXk7XG5cbiAgICBjb25zdHJ1Y3RvcihzY29wZTogQ29uc3RydWN0LCBpZDogc3RyaW5nLCBwcm9wczogQWdzU2VjdXJlQnVja2V0UHJvcHMpIHtcbiAgICAgICAgc3VwZXIoc2NvcGUsIGlkKTtcblxuICAgICAgICB0aGlzLmVuY3J5cHRpb25LZXkgPSBwcm9wcy5lbmNyeXB0aW9uS2V5QXJuXG4gICAgICAgICAgICA/IGttcy5LZXkuZnJvbUtleUFybih0aGlzLCBgZW5jcnlwdGlvbi1rZXktJHtpZH1gLCBwcm9wcy5lbmNyeXB0aW9uS2V5QXJuKVxuICAgICAgICAgICAgOiBuZXcga21zLktleSh0aGlzLCBgZW5jcnlwdGlvbi1rZXktJHtpZH1gLCB7XG4gICAgICAgICAgICAgICAgICByZW1vdmFsUG9saWN5OiBwcm9wcy5yZW1vdmFsUG9saWN5LFxuICAgICAgICAgICAgICAgICAgZW5hYmxlS2V5Um90YXRpb246IHRydWUsXG4gICAgICAgICAgICAgIH0pO1xuXG4gICAgICAgIHRoaXMuYnVja2V0ID0gbmV3IHMzLkJ1Y2tldCh0aGlzLCBgYWdzLSR7aWR9YCwge1xuICAgICAgICAgICAgLi4ucHJvcHMsXG4gICAgICAgICAgICBlbmNyeXB0aW9uS2V5OiB0aGlzLmVuY3J5cHRpb25LZXksXG4gICAgICAgICAgICBlbmNyeXB0aW9uOiBzMy5CdWNrZXRFbmNyeXB0aW9uLktNUyxcbiAgICAgICAgICAgIGJsb2NrUHVibGljQWNjZXNzOiBzMy5CbG9ja1B1YmxpY0FjY2Vzcy5CTE9DS19BTEwsXG4gICAgICAgICAgICBhY2Nlc3NDb250cm9sOiBzMy5CdWNrZXRBY2Nlc3NDb250cm9sLkxPR19ERUxJVkVSWV9XUklURSxcbiAgICAgICAgICAgIHZlcnNpb25lZDogdHJ1ZSxcbiAgICAgICAgfSk7XG5cbiAgICAgICAgdGhpcy5idWNrZXQuYWRkVG9SZXNvdXJjZVBvbGljeShcbiAgICAgICAgICAgIG5ldyBpYW0uUG9saWN5U3RhdGVtZW50KHtcbiAgICAgICAgICAgICAgICBzaWQ6ICdIdHRwc09ubHknLFxuICAgICAgICAgICAgICAgIHJlc291cmNlczogW2Ake3RoaXMuYnVja2V0LmJ1Y2tldEFybn0vKmBdLFxuICAgICAgICAgICAgICAgIGFjdGlvbnM6IFsnKiddLFxuICAgICAgICAgICAgICAgIHByaW5jaXBhbHM6IFtuZXcgaWFtLkFueVByaW5jaXBhbCgpXSxcbiAgICAgICAgICAgICAgICBlZmZlY3Q6IGlhbS5FZmZlY3QuREVOWSxcbiAgICAgICAgICAgICAgICBjb25kaXRpb25zOiB7XG4gICAgICAgICAgICAgICAgICAgIEJvb2w6IHtcbiAgICAgICAgICAgICAgICAgICAgICAgICdhd3M6U2VjdXJlVHJhbnNwb3J0JzogJ2ZhbHNlJyxcbiAgICAgICAgICAgICAgICAgICAgfSxcbiAgICAgICAgICAgICAgICB9LFxuICAgICAgICAgICAgfSlcbiAgICAgICAgKTtcbiAgICB9XG59XG4iXX0=