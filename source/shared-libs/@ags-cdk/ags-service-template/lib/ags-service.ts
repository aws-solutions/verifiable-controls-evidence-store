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
import * as cdk from 'aws-cdk-lib';
import * as kms from 'aws-cdk-lib/aws-kms';
import { Construct } from 'constructs';
import { AGSSharedInfraClient } from './ags-shared-infra-client';
import { Configuration } from './ags-types';

export interface AGSServiceProps {
    serviceName: string;
    configName: string;
    configuration: Configuration;
    solutionId?: string;
    solutionVersion?: string;
}

export class AGSService extends Construct {
    // service context
    public readonly serviceName: string;
    public readonly lambdaName: string;

    // service configuration
    public readonly configName?: string;
    public readonly configuration?: Configuration;

    // retain policy
    public readonly removalPolicy: cdk.RemovalPolicy;

    // private
    public readonly sharedInfraClient: AGSSharedInfraClient;

    constructor(scope: Construct, id: string, props: AGSServiceProps) {
        super(scope, id);

        // populate service context
        this.serviceName = props.serviceName;

        // populate configuration
        this.configName = props.configName;
        this.configuration = props.configuration;

        // create shared infra client
        this.sharedInfraClient = new AGSSharedInfraClient(this, 'sharedInfraClient');

        // remove policy specified in cdk.json for the given configuration
        this.removalPolicy = this.getCurrentConfig()?.retainData
            ? cdk.RemovalPolicy.RETAIN
            : cdk.RemovalPolicy.DESTROY;
    }

    /**
     * Retrieves the current configuration.
     *
     * Configuration presents in configuration files in the configuration directory
     *
     *
     * @returns the current configuration
     */
    getCurrentConfig(): Record<string, string> | undefined {
        return this.configuration;
    }

    /**
     * Retrieves KMS keys by name
     *
     * Providing KMS Keys for resource encryption.
     * If `customerManagedCMKArns` is specified in the Configuration, the customer KMS Keys will be imported by
     * the ARNs specified. If the resource name is not found in `customerManagedCMKArns` in the Configuration, a new KMS key
     * will be created for the resource.
     *
     * @returns KMS Key for the specified name
     */
    getMandatoryKMSKey(name: string): kms.IKey {
        const resolveKey = (name: string, arn: string): kms.IKey =>
            this.importCustomerKMSKey(name, arn) ?? this.createCustomerKMSKey(name);

        const customerManagedCMKArns = (<unknown>(
            this.getCurrentConfig()?.customerManagedCMKArns
        )) as Record<string, string>;

        return resolveKey(name, customerManagedCMKArns?.[name]);
    }

    /**
     * Retrieves KMS keys by name
     *
     * Providing KMS Keys for resource encryption.
     * If `customerManagedCMKArns` is specified in the Configuration, the customer KMS Keys will be imported by
     * the ARNs specified. If the resource name is not found in `customerManagedCMKArns` in the Configuration,
     * no new KMS key will be created and undefined will be returned.
     *
     * User can specified `AUTO` in `customerManagedCMKArns` if user want to enforce the encryption with customer
     * KMS key but can't provide an external key Arn. It will force a new KMS key to be created and returned.
     *
     * @returns KMS Key for the specified name or undefined
     */
    getOptionalKMSKey(name: string): kms.IKey | undefined {
        const resolveKey = (name: string, arn: string): kms.IKey | undefined => {
            if (arn && arn.toUpperCase() === 'AUTO') {
                return this.createCustomerKMSKey(name);
            } else if (arn) {
                return this.importCustomerKMSKey(name, arn) ?? undefined;
            } else {
                return undefined;
            }
        };

        const customerManagedCMKArns = (<unknown>(
            this.getCurrentConfig()?.customerManagedCMKArns
        )) as Record<string, string>;

        return resolveKey(name, customerManagedCMKArns?.[name]);
    }

    private importCustomerKMSKey(name: string, arn?: string): kms.IKey | null {
        return arn ? kms.Key.fromKeyArn(this, `CMKKey${name}`, arn) : null;
    }

    private createCustomerKMSKey(name: string): kms.Key {
        return new kms.Key(this, `CMKKey${name}`, {
            description: `KMS Key for ${this.serviceName}/${name}`,
            alias: `${this.serviceName}-${name}`,
            enableKeyRotation: true,
            removalPolicy: this.removalPolicy,
        });
    }
}
