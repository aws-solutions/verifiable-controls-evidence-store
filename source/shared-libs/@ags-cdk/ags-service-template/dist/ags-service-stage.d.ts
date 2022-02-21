import * as cdk from 'aws-cdk-lib';
import { Configuration } from './ags-types';
import { AGSServiceProps } from './ags-service';
import { Construct } from 'constructs';
export interface AGSServiceStageProps extends cdk.StageProps {
    /**
     * Name of the service.
     *
     * Required to be specified in cdk.json
     */
    serviceName: string;
    /**
     * configuration name
     *
     * Name of the current configuration
     *
     */
    configName: string;
    /**
     * Configuration data
     *
     * Configuration data retrieved from the configuration file in the configuration directory.
     */
    configuration?: Configuration;
    /**
     * Name of the target environment to be deployed to
     *
     */
    envName: string;
    /**
     * Solution information such as solution id (from valence) and version
     */
    solutionInfo?: Record<string, string>;
}
interface ServiceStackProps<T> extends Omit<cdk.StackProps, 'stackName' | 'description' | 'tags'> {
    serviceProps: T & AGSServiceProps;
}
declare type Constructor<T, U> = new (scope: Construct, id: string, props: ServiceStackProps<U>) => T;
/**
 * The Service Stage base class that defined a `Service Stage` that can be deployed into
 * a specific target environment.
 *
 * An instance of this class is synthed into a sub-directly in cdk.out and contains the
 * cloud assembly for a partitular target environment.
 */
export declare class AGSServiceStage extends cdk.Stage {
    readonly serviceName: string;
    readonly configuration: Configuration;
    readonly configName: string;
    readonly tags: Record<string, string>;
    readonly solutionInfo?: Record<string, string>;
    constructor(scope: Construct, id: string, props: AGSServiceStageProps);
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
    addStack<T extends cdk.Stack, U extends {
        description?: string;
    }>(stackConstructor: Constructor<T, U>, name: string | undefined, props: U): T;
}
export {};
