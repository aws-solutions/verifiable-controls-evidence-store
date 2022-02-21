import * as cdk from '@aws-cdk/core';
import { Configurations } from './ags-types';
import { AGSServiceProps } from './ags-service';
export interface AGSServiceStageProps extends cdk.StageProps {
    /**
     * Name of the service.
     *
     * Required to be specified in cdk.json
     */
    serviceName: string;
    /**
     * Overridden configuration name by service
     *
     * configuration Name that overridden the `configName` deployed in Shared Infra
     * It is set when `configName` presents in any entry in `targetEnvs`
     */
    overriddenConfigName?: string;
    /**
     * Configuration data
     *
     * Configuration data retrieved from the `configurations` section in `cdk.json` context.
     */
    configurations?: Configurations;
    /**
     * Name of the target environment to be deployed to
     *
     */
    envName: string;
}
interface ServiceStackProps<T> extends Omit<cdk.StackProps, 'stackName' | 'description' | 'tags'> {
    serviceProps: T & AGSServiceProps;
}
declare type Constructor<T, U> = new (scope: cdk.Construct, id: string, props: ServiceStackProps<U>) => T;
/**
 * The Service Stage base class that defined a `Service Stage` that can be deployed into
 * a specific target environment.
 *
 * An instance of this class is synthed into a sub-directly in cdk.out and contains the
 * cloud assembly for a partitular target environment.
 */
export declare class AGSServiceStage extends cdk.Stage {
    readonly serviceName: string;
    readonly configurations: Configurations;
    readonly hasOverriddenConfigName: boolean;
    readonly overriddenConfigName: string;
    readonly tags: Record<string, string>;
    constructor(scope: cdk.Construct, id: string, props: AGSServiceStageProps);
    getConfigName(): string;
    /**
     * Instantiate and add a Service Stack to the stage.
     *
     * This function instantiate a new Service Stack class and add it to the stage.
     *
     * @param stackConstructor Service stack class name
     * @param name The name of the stack if there are multiple stacks. It can be omitted if only one stack
     * @param props The properties for this particular stack
     * @returns Service stack object
     */
    addStack<T extends cdk.Stack, U>(stackConstructor: Constructor<T, U>, name: string | undefined, props: U): T;
}
export {};
