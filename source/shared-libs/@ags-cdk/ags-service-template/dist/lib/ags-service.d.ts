import * as cdk from '@aws-cdk/core';
import * as kms from '@aws-cdk/aws-kms';
import { AGSSharedInfraClient } from './ags-shared-infra-client';
import { Configurations } from './ags-types';
export interface AGSServiceProps {
    serviceName: string;
    configName: string;
    configurations: Configurations;
}
export declare class AGSService extends cdk.Construct {
    readonly serviceName: string;
    readonly lambdaName: string;
    readonly configName?: string;
    readonly configurations?: Configurations;
    readonly removalPolicy: cdk.RemovalPolicy;
    readonly sharedInfraClient: AGSSharedInfraClient;
    constructor(scope: cdk.Construct, id: string, props: AGSServiceProps);
    /**
     * Retrieves the current configuration.
     *
     * Configuration presents in `configuration` in `cdk.json` context provide a set of named
     * configuration settings that can be used to customize the behavior of the service.
     *
     * The configuration is looked up by the `configName` which can be specified in the
     * `targetEnvs` for each environment. If it is not specified, the `configName` that
     * is deployed with Shared Infra in the target enviroment will be used as default.
     *
     * If the configuration can't be found by the `configName` or the configurations are
     * not available in `cdk.json` context, it will return undefined.
     *
     * @returns the configuration looked up by either `configName` in Shared Infra or overridden
     * by `configName` set in `targetEnvs`.
     */
    getCurrentConfig(): Record<string, string> | undefined;
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
