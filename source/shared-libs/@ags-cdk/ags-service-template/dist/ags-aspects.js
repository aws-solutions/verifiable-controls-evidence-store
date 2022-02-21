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
const cdk = require("aws-cdk-lib");
const iam = require("aws-cdk-lib/aws-iam");
const apigateway = require("aws-cdk-lib/aws-apigateway");
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiYWdzLWFzcGVjdHMuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi9saWIvYWdzLWFzcGVjdHMudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7O0FBQUE7Ozs7Ozs7Ozs7Ozs7O0VBY0U7QUFDRixtQ0FBbUM7QUFDbkMsMkNBQTJDO0FBQzNDLHlEQUF5RDtBQUd6RCxNQUFhLG1CQUFtQjtJQUM1QixZQUE2QixzQkFBOEI7UUFBOUIsMkJBQXNCLEdBQXRCLHNCQUFzQixDQUFRO0lBQUcsQ0FBQztJQUV4RCxLQUFLLENBQUMsSUFBZ0I7UUFDekIsSUFDSSxJQUFJLFlBQVksR0FBRyxDQUFDLE9BQU87WUFDM0IsQ0FBQyxJQUFJLFlBQVksR0FBRyxDQUFDLFdBQVc7Z0JBQzVCLEdBQUcsQ0FBQyxXQUFXLENBQUMsYUFBYSxDQUFDLElBQUksQ0FBQztnQkFDbkMsSUFBSSxDQUFDLGVBQWUsS0FBSyxnQkFBZ0IsQ0FBQyxFQUNoRDtZQUNFLElBQUksQ0FBQyxtQkFBbUIsQ0FBQyxxQkFBcUIsRUFBRSxJQUFJLENBQUMsc0JBQXNCLENBQUMsQ0FBQztTQUNoRjtJQUNMLENBQUM7Q0FDSjtBQWJELGtEQWFDO0FBRUQsTUFBYSxrQkFBa0I7SUFDcEIsS0FBSyxDQUFDLElBQWdCO1FBQ3pCLElBQUksSUFBSSxZQUFZLFVBQVUsQ0FBQyxTQUFTLElBQUksSUFBSSxDQUFDLFVBQVUsS0FBSyxTQUFTLEVBQUU7WUFDdkUsSUFBSSxDQUFDLG1CQUFtQixDQUNwQixtQkFBbUIsRUFDbkIsVUFBVSxDQUFDLGlCQUFpQixDQUFDLElBQUksQ0FDcEMsQ0FBQztTQUNMO0lBQ0wsQ0FBQztDQUNKO0FBVEQsZ0RBU0MiLCJzb3VyY2VzQ29udGVudCI6WyIvKiBcbiAgQ29weXJpZ2h0IEFtYXpvbi5jb20sIEluYy4gb3IgaXRzIGFmZmlsaWF0ZXMuIEFsbCBSaWdodHMgUmVzZXJ2ZWQuXG4gIFxuICBMaWNlbnNlZCB1bmRlciB0aGUgQXBhY2hlIExpY2Vuc2UsIFZlcnNpb24gMi4wICh0aGUgXCJMaWNlbnNlXCIpLlxuICBZb3UgbWF5IG5vdCB1c2UgdGhpcyBmaWxlIGV4Y2VwdCBpbiBjb21wbGlhbmNlIHdpdGggdGhlIExpY2Vuc2UuXG4gIFlvdSBtYXkgb2J0YWluIGEgY29weSBvZiB0aGUgTGljZW5zZSBhdFxuICBcbiAgICAgIGh0dHA6Ly93d3cuYXBhY2hlLm9yZy9saWNlbnNlcy9MSUNFTlNFLTIuMFxuICBcbiAgVW5sZXNzIHJlcXVpcmVkIGJ5IGFwcGxpY2FibGUgbGF3IG9yIGFncmVlZCB0byBpbiB3cml0aW5nLCBzb2Z0d2FyZVxuICBkaXN0cmlidXRlZCB1bmRlciB0aGUgTGljZW5zZSBpcyBkaXN0cmlidXRlZCBvbiBhbiBcIkFTIElTXCIgQkFTSVMsXG4gIFdJVEhPVVQgV0FSUkFOVElFUyBPUiBDT05ESVRJT05TIE9GIEFOWSBLSU5ELCBlaXRoZXIgZXhwcmVzcyBvciBpbXBsaWVkLlxuICBTZWUgdGhlIExpY2Vuc2UgZm9yIHRoZSBzcGVjaWZpYyBsYW5ndWFnZSBnb3Zlcm5pbmcgcGVybWlzc2lvbnMgYW5kXG4gIGxpbWl0YXRpb25zIHVuZGVyIHRoZSBMaWNlbnNlLlxuKi9cbmltcG9ydCAqIGFzIGNkayBmcm9tICdhd3MtY2RrLWxpYic7XG5pbXBvcnQgKiBhcyBpYW0gZnJvbSAnYXdzLWNkay1saWIvYXdzLWlhbSc7XG5pbXBvcnQgKiBhcyBhcGlnYXRld2F5IGZyb20gJ2F3cy1jZGstbGliL2F3cy1hcGlnYXRld2F5JztcbmltcG9ydCB7IElDb25zdHJ1Y3QgfSBmcm9tICdjb25zdHJ1Y3RzJztcblxuZXhwb3J0IGNsYXNzIFBlcm1pc3Npb25zQm91bmRhcnkgaW1wbGVtZW50cyBjZGsuSUFzcGVjdCB7XG4gICAgY29uc3RydWN0b3IocHJpdmF0ZSByZWFkb25seSBwZXJtaXNzaW9uc0JvdW5kYXJ5QXJuOiBzdHJpbmcpIHt9XG5cbiAgICBwdWJsaWMgdmlzaXQobm9kZTogSUNvbnN0cnVjdCk6IHZvaWQge1xuICAgICAgICBpZiAoXG4gICAgICAgICAgICBub2RlIGluc3RhbmNlb2YgaWFtLkNmblJvbGUgfHxcbiAgICAgICAgICAgIChub2RlIGluc3RhbmNlb2YgY2RrLkNmblJlc291cmNlICYmXG4gICAgICAgICAgICAgICAgY2RrLkNmblJlc291cmNlLmlzQ2ZuUmVzb3VyY2Uobm9kZSkgJiZcbiAgICAgICAgICAgICAgICBub2RlLmNmblJlc291cmNlVHlwZSA9PT0gJ0FXUzo6SUFNOjpSb2xlJylcbiAgICAgICAgKSB7XG4gICAgICAgICAgICBub2RlLmFkZFByb3BlcnR5T3ZlcnJpZGUoJ1Blcm1pc3Npb25zQm91bmRhcnknLCB0aGlzLnBlcm1pc3Npb25zQm91bmRhcnlBcm4pO1xuICAgICAgICB9XG4gICAgfVxufVxuXG5leHBvcnQgY2xhc3MgT3B0aW9uTWV0aG9kTm9BdXRoIGltcGxlbWVudHMgY2RrLklBc3BlY3Qge1xuICAgIHB1YmxpYyB2aXNpdChub2RlOiBJQ29uc3RydWN0KTogdm9pZCB7XG4gICAgICAgIGlmIChub2RlIGluc3RhbmNlb2YgYXBpZ2F0ZXdheS5DZm5NZXRob2QgJiYgbm9kZS5odHRwTWV0aG9kID09PSAnT1BUSU9OUycpIHtcbiAgICAgICAgICAgIG5vZGUuYWRkUHJvcGVydHlPdmVycmlkZShcbiAgICAgICAgICAgICAgICAnQXV0aG9yaXphdGlvblR5cGUnLFxuICAgICAgICAgICAgICAgIGFwaWdhdGV3YXkuQXV0aG9yaXphdGlvblR5cGUuTk9ORVxuICAgICAgICAgICAgKTtcbiAgICAgICAgfVxuICAgIH1cbn1cbiJdfQ==