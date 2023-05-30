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
export declare class AGSService extends Construct {
    readonly serviceName: string;
    readonly lambdaName: string;
    readonly configName?: string;
    readonly configuration?: Configuration;
    readonly removalPolicy: cdk.RemovalPolicy;
    readonly sharedInfraClient: AGSSharedInfraClient;
    constructor(scope: Construct, id: string, props: AGSServiceProps);
    /**
     * Retrieves the current configuration.
     *
     * Configuration presents in configuration files in the configuration directory
     *
     *
     * @returns the current configuration
     */
    getCurrentConfig(): Record<string, any> | undefined;
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
    getMandatoryKMSKey(name: string): kms.IKey;
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
    getOptionalKMSKey(name: string): kms.IKey | undefined;
    private importCustomerKMSKey;
    private createCustomerKMSKey;
}
