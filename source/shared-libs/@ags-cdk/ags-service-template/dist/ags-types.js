"use strict";
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
Object.defineProperty(exports, "__esModule", { value: true });
exports.AGSRole = exports.SubnetGroup = void 0;
var SubnetGroup;
(function (SubnetGroup) {
    SubnetGroup["INGRESS"] = "ingress";
    SubnetGroup["SERVICE"] = "service";
    SubnetGroup["DATABASE"] = "database";
})(SubnetGroup = exports.SubnetGroup || (exports.SubnetGroup = {}));
var AGSRole;
(function (AGSRole) {
    // special privilege role has default access to all APIs
    AGSRole["SYSTEM_ADMIN"] = "SystemAdmin";
    // special role indicate no restriction
    AGSRole["EVERYONE"] = "Everyone";
    // AGS Personas
    AGSRole["APPLICATION_OWNER"] = "ApplicationOwner";
    AGSRole["APPLICATION_DEVELOPER"] = "ApplicationDeveloper";
    AGSRole["CHIEF_RISK_OFFICE"] = "ChiefRiskOffice";
    AGSRole["LINE_ONE_RISK"] = "Line1Risk";
    AGSRole["LINE_TWO_RISK"] = "Line2Risk";
    AGSRole["LINE_THREE_RISK"] = "Line3Risk";
    AGSRole["DOMAIN_OWNER"] = "DomainOwner";
    AGSRole["EVIDENCE_PROVIDER"] = "EvidenceProvider";
    AGSRole["CONTROL_OWNER"] = "ControlOwner";
    AGSRole["SERVICE_MANAGER"] = "ServiceManager";
})(AGSRole = exports.AGSRole || (exports.AGSRole = {}));
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiYWdzLXR5cGVzLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vbGliL2Fncy10eXBlcy50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiO0FBQUE7Ozs7Ozs7Ozs7Ozs7O0VBY0U7OztBQTRCRixJQUFZLFdBSVg7QUFKRCxXQUFZLFdBQVc7SUFDbkIsa0NBQW1CLENBQUE7SUFDbkIsa0NBQW1CLENBQUE7SUFDbkIsb0NBQXFCLENBQUE7QUFDekIsQ0FBQyxFQUpXLFdBQVcsR0FBWCxtQkFBVyxLQUFYLG1CQUFXLFFBSXRCO0FBRUQsSUFBWSxPQWtCWDtBQWxCRCxXQUFZLE9BQU87SUFDZix3REFBd0Q7SUFDeEQsdUNBQTRCLENBQUE7SUFFNUIsdUNBQXVDO0lBQ3ZDLGdDQUFxQixDQUFBO0lBRXJCLGVBQWU7SUFDZixpREFBc0MsQ0FBQTtJQUN0Qyx5REFBOEMsQ0FBQTtJQUM5QyxnREFBcUMsQ0FBQTtJQUNyQyxzQ0FBMkIsQ0FBQTtJQUMzQixzQ0FBMkIsQ0FBQTtJQUMzQix3Q0FBNkIsQ0FBQTtJQUM3Qix1Q0FBNEIsQ0FBQTtJQUM1QixpREFBc0MsQ0FBQTtJQUN0Qyx5Q0FBOEIsQ0FBQTtJQUM5Qiw2Q0FBa0MsQ0FBQTtBQUN0QyxDQUFDLEVBbEJXLE9BQU8sR0FBUCxlQUFPLEtBQVAsZUFBTyxRQWtCbEIiLCJzb3VyY2VzQ29udGVudCI6WyIvKiBcbiAgQ29weXJpZ2h0IEFtYXpvbi5jb20sIEluYy4gb3IgaXRzIGFmZmlsaWF0ZXMuIEFsbCBSaWdodHMgUmVzZXJ2ZWQuXG4gIFxuICBMaWNlbnNlZCB1bmRlciB0aGUgQXBhY2hlIExpY2Vuc2UsIFZlcnNpb24gMi4wICh0aGUgXCJMaWNlbnNlXCIpLlxuICBZb3UgbWF5IG5vdCB1c2UgdGhpcyBmaWxlIGV4Y2VwdCBpbiBjb21wbGlhbmNlIHdpdGggdGhlIExpY2Vuc2UuXG4gIFlvdSBtYXkgb2J0YWluIGEgY29weSBvZiB0aGUgTGljZW5zZSBhdFxuICBcbiAgICAgIGh0dHA6Ly93d3cuYXBhY2hlLm9yZy9saWNlbnNlcy9MSUNFTlNFLTIuMFxuICBcbiAgVW5sZXNzIHJlcXVpcmVkIGJ5IGFwcGxpY2FibGUgbGF3IG9yIGFncmVlZCB0byBpbiB3cml0aW5nLCBzb2Z0d2FyZVxuICBkaXN0cmlidXRlZCB1bmRlciB0aGUgTGljZW5zZSBpcyBkaXN0cmlidXRlZCBvbiBhbiBcIkFTIElTXCIgQkFTSVMsXG4gIFdJVEhPVVQgV0FSUkFOVElFUyBPUiBDT05ESVRJT05TIE9GIEFOWSBLSU5ELCBlaXRoZXIgZXhwcmVzcyBvciBpbXBsaWVkLlxuICBTZWUgdGhlIExpY2Vuc2UgZm9yIHRoZSBzcGVjaWZpYyBsYW5ndWFnZSBnb3Zlcm5pbmcgcGVybWlzc2lvbnMgYW5kXG4gIGxpbWl0YXRpb25zIHVuZGVyIHRoZSBMaWNlbnNlLlxuKi9cblxuZXhwb3J0IGludGVyZmFjZSBEZXBsb3ltZW50T3B0aW9ucyB7XG4gICAgYXBpR2F0ZXdheVR5cGU6ICdwcml2YXRlJyB8ICdwdWJsaWMnIHwgJ2Nsb3VkZnJvbnQnO1xuICAgIGJhc3Rpb25JbnN0YW5jZTogYm9vbGVhbjtcbiAgICBkZXZlbG9wbWVudFVzZXJSb2xlOiBib29sZWFuO1xuICAgIHRydXN0ZWREZXZlbG9wZXJBY2NvdW50czogc3RyaW5nO1xufVxuXG5leHBvcnQgaW50ZXJmYWNlIEFHU0Vudmlyb25tZW50IHtcbiAgICBhY2NvdW50OiBzdHJpbmc7XG4gICAgcmVnaW9uOiBzdHJpbmc7XG4gICAgY29uZmlnTmFtZT86IHN0cmluZztcbn1cblxuZXhwb3J0IGludGVyZmFjZSBTdWJuZXRNYXBwaW5nIHtcbiAgICBzdWJuZXRHcm91cE5hbWU6IHN0cmluZztcbiAgICBzZWN1cml0eUdyb3VwSWRzOiBzdHJpbmdbXTtcbn1cblxuZXhwb3J0IHR5cGUgU3VibmV0TWFwcGluZ09wdGlvbnMgPSB7XG4gICAgW2tleSBpbiBTdWJuZXRHcm91cF06IFN1Ym5ldE1hcHBpbmc7XG59O1xuXG5leHBvcnQgdHlwZSBBR1NFbnZpcm9ubWVudHMgPSBSZWNvcmQ8c3RyaW5nLCBBR1NFbnZpcm9ubWVudD47XG5cbmV4cG9ydCB0eXBlIENvbmZpZ3VyYXRpb24gPSBSZWNvcmQ8c3RyaW5nLCBhbnk+O1xuXG5leHBvcnQgZW51bSBTdWJuZXRHcm91cCB7XG4gICAgSU5HUkVTUyA9ICdpbmdyZXNzJyxcbiAgICBTRVJWSUNFID0gJ3NlcnZpY2UnLFxuICAgIERBVEFCQVNFID0gJ2RhdGFiYXNlJyxcbn1cblxuZXhwb3J0IGVudW0gQUdTUm9sZSB7XG4gICAgLy8gc3BlY2lhbCBwcml2aWxlZ2Ugcm9sZSBoYXMgZGVmYXVsdCBhY2Nlc3MgdG8gYWxsIEFQSXNcbiAgICBTWVNURU1fQURNSU4gPSAnU3lzdGVtQWRtaW4nLFxuXG4gICAgLy8gc3BlY2lhbCByb2xlIGluZGljYXRlIG5vIHJlc3RyaWN0aW9uXG4gICAgRVZFUllPTkUgPSAnRXZlcnlvbmUnLFxuXG4gICAgLy8gQUdTIFBlcnNvbmFzXG4gICAgQVBQTElDQVRJT05fT1dORVIgPSAnQXBwbGljYXRpb25Pd25lcicsXG4gICAgQVBQTElDQVRJT05fREVWRUxPUEVSID0gJ0FwcGxpY2F0aW9uRGV2ZWxvcGVyJyxcbiAgICBDSElFRl9SSVNLX09GRklDRSA9ICdDaGllZlJpc2tPZmZpY2UnLFxuICAgIExJTkVfT05FX1JJU0sgPSAnTGluZTFSaXNrJyxcbiAgICBMSU5FX1RXT19SSVNLID0gJ0xpbmUyUmlzaycsXG4gICAgTElORV9USFJFRV9SSVNLID0gJ0xpbmUzUmlzaycsXG4gICAgRE9NQUlOX09XTkVSID0gJ0RvbWFpbk93bmVyJyxcbiAgICBFVklERU5DRV9QUk9WSURFUiA9ICdFdmlkZW5jZVByb3ZpZGVyJyxcbiAgICBDT05UUk9MX09XTkVSID0gJ0NvbnRyb2xPd25lcicsXG4gICAgU0VSVklDRV9NQU5BR0VSID0gJ1NlcnZpY2VNYW5hZ2VyJyxcbn1cbiJdfQ==