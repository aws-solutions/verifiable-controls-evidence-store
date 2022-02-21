"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.OptionMethodNoAuth = exports.PermissionsBoundary = void 0;
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
const iam = require("@aws-cdk/aws-iam");
const apigateway = require("@aws-cdk/aws-apigateway");
class PermissionsBoundary {
    constructor(permissionsBoundaryArn) {
        this.permissionsBoundaryArn = permissionsBoundaryArn;
    }
    visit(node) {
        if (node instanceof iam.CfnRole ||
            (node instanceof cdk.CfnResource &&
                cdk.CfnResource.isCfnResource(node) &&
                node.cfnResourceType === 'AWS::IAM::Role')) {
            node.addPropertyOverride('PermissionsBoundary', this.permissionsBoundaryArn);
        }
    }
}
exports.PermissionsBoundary = PermissionsBoundary;
class OptionMethodNoAuth {
    visit(node) {
        if (node instanceof apigateway.CfnMethod && node.httpMethod === 'OPTIONS') {
            node.addPropertyOverride('AuthorizationType', apigateway.AuthorizationType.NONE);
        }
    }
}
exports.OptionMethodNoAuth = OptionMethodNoAuth;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiYWdzLWFzcGVjdHMuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi9saWIvYWdzLWFzcGVjdHMudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7O0FBQUE7Ozs7Ozs7Ozs7Ozs7O0VBY0U7QUFDRixxQ0FBcUM7QUFDckMsd0NBQXdDO0FBQ3hDLHNEQUFzRDtBQUV0RCxNQUFhLG1CQUFtQjtJQUM1QixZQUE2QixzQkFBOEI7UUFBOUIsMkJBQXNCLEdBQXRCLHNCQUFzQixDQUFRO0lBQUcsQ0FBQztJQUV4RCxLQUFLLENBQUMsSUFBb0I7UUFDN0IsSUFDSSxJQUFJLFlBQVksR0FBRyxDQUFDLE9BQU87WUFDM0IsQ0FBQyxJQUFJLFlBQVksR0FBRyxDQUFDLFdBQVc7Z0JBQzVCLEdBQUcsQ0FBQyxXQUFXLENBQUMsYUFBYSxDQUFDLElBQUksQ0FBQztnQkFDbkMsSUFBSSxDQUFDLGVBQWUsS0FBSyxnQkFBZ0IsQ0FBQyxFQUNoRDtZQUNFLElBQUksQ0FBQyxtQkFBbUIsQ0FBQyxxQkFBcUIsRUFBRSxJQUFJLENBQUMsc0JBQXNCLENBQUMsQ0FBQztTQUNoRjtJQUNMLENBQUM7Q0FDSjtBQWJELGtEQWFDO0FBRUQsTUFBYSxrQkFBa0I7SUFDcEIsS0FBSyxDQUFDLElBQW9CO1FBQzdCLElBQUksSUFBSSxZQUFZLFVBQVUsQ0FBQyxTQUFTLElBQUksSUFBSSxDQUFDLFVBQVUsS0FBSyxTQUFTLEVBQUU7WUFDdkUsSUFBSSxDQUFDLG1CQUFtQixDQUNwQixtQkFBbUIsRUFDbkIsVUFBVSxDQUFDLGlCQUFpQixDQUFDLElBQUksQ0FDcEMsQ0FBQztTQUNMO0lBQ0wsQ0FBQztDQUNKO0FBVEQsZ0RBU0MiLCJzb3VyY2VzQ29udGVudCI6WyIvKiBcbiAgQ29weXJpZ2h0IEFtYXpvbi5jb20sIEluYy4gb3IgaXRzIGFmZmlsaWF0ZXMuIEFsbCBSaWdodHMgUmVzZXJ2ZWQuXG4gIFxuICBMaWNlbnNlZCB1bmRlciB0aGUgQXBhY2hlIExpY2Vuc2UsIFZlcnNpb24gMi4wICh0aGUgXCJMaWNlbnNlXCIpLlxuICBZb3UgbWF5IG5vdCB1c2UgdGhpcyBmaWxlIGV4Y2VwdCBpbiBjb21wbGlhbmNlIHdpdGggdGhlIExpY2Vuc2UuXG4gIFlvdSBtYXkgb2J0YWluIGEgY29weSBvZiB0aGUgTGljZW5zZSBhdFxuICBcbiAgICAgIGh0dHA6Ly93d3cuYXBhY2hlLm9yZy9saWNlbnNlcy9MSUNFTlNFLTIuMFxuICBcbiAgVW5sZXNzIHJlcXVpcmVkIGJ5IGFwcGxpY2FibGUgbGF3IG9yIGFncmVlZCB0byBpbiB3cml0aW5nLCBzb2Z0d2FyZVxuICBkaXN0cmlidXRlZCB1bmRlciB0aGUgTGljZW5zZSBpcyBkaXN0cmlidXRlZCBvbiBhbiBcIkFTIElTXCIgQkFTSVMsXG4gIFdJVEhPVVQgV0FSUkFOVElFUyBPUiBDT05ESVRJT05TIE9GIEFOWSBLSU5ELCBlaXRoZXIgZXhwcmVzcyBvciBpbXBsaWVkLlxuICBTZWUgdGhlIExpY2Vuc2UgZm9yIHRoZSBzcGVjaWZpYyBsYW5ndWFnZSBnb3Zlcm5pbmcgcGVybWlzc2lvbnMgYW5kXG4gIGxpbWl0YXRpb25zIHVuZGVyIHRoZSBMaWNlbnNlLlxuKi9cbmltcG9ydCAqIGFzIGNkayBmcm9tICdAYXdzLWNkay9jb3JlJztcbmltcG9ydCAqIGFzIGlhbSBmcm9tICdAYXdzLWNkay9hd3MtaWFtJztcbmltcG9ydCAqIGFzIGFwaWdhdGV3YXkgZnJvbSAnQGF3cy1jZGsvYXdzLWFwaWdhdGV3YXknO1xuXG5leHBvcnQgY2xhc3MgUGVybWlzc2lvbnNCb3VuZGFyeSBpbXBsZW1lbnRzIGNkay5JQXNwZWN0IHtcbiAgICBjb25zdHJ1Y3Rvcihwcml2YXRlIHJlYWRvbmx5IHBlcm1pc3Npb25zQm91bmRhcnlBcm46IHN0cmluZykge31cblxuICAgIHB1YmxpYyB2aXNpdChub2RlOiBjZGsuSUNvbnN0cnVjdCk6IHZvaWQge1xuICAgICAgICBpZiAoXG4gICAgICAgICAgICBub2RlIGluc3RhbmNlb2YgaWFtLkNmblJvbGUgfHxcbiAgICAgICAgICAgIChub2RlIGluc3RhbmNlb2YgY2RrLkNmblJlc291cmNlICYmXG4gICAgICAgICAgICAgICAgY2RrLkNmblJlc291cmNlLmlzQ2ZuUmVzb3VyY2Uobm9kZSkgJiZcbiAgICAgICAgICAgICAgICBub2RlLmNmblJlc291cmNlVHlwZSA9PT0gJ0FXUzo6SUFNOjpSb2xlJylcbiAgICAgICAgKSB7XG4gICAgICAgICAgICBub2RlLmFkZFByb3BlcnR5T3ZlcnJpZGUoJ1Blcm1pc3Npb25zQm91bmRhcnknLCB0aGlzLnBlcm1pc3Npb25zQm91bmRhcnlBcm4pO1xuICAgICAgICB9XG4gICAgfVxufVxuXG5leHBvcnQgY2xhc3MgT3B0aW9uTWV0aG9kTm9BdXRoIGltcGxlbWVudHMgY2RrLklBc3BlY3Qge1xuICAgIHB1YmxpYyB2aXNpdChub2RlOiBjZGsuSUNvbnN0cnVjdCk6IHZvaWQge1xuICAgICAgICBpZiAobm9kZSBpbnN0YW5jZW9mIGFwaWdhdGV3YXkuQ2ZuTWV0aG9kICYmIG5vZGUuaHR0cE1ldGhvZCA9PT0gJ09QVElPTlMnKSB7XG4gICAgICAgICAgICBub2RlLmFkZFByb3BlcnR5T3ZlcnJpZGUoXG4gICAgICAgICAgICAgICAgJ0F1dGhvcml6YXRpb25UeXBlJyxcbiAgICAgICAgICAgICAgICBhcGlnYXRld2F5LkF1dGhvcml6YXRpb25UeXBlLk5PTkVcbiAgICAgICAgICAgICk7XG4gICAgICAgIH1cbiAgICB9XG59XG4iXX0=