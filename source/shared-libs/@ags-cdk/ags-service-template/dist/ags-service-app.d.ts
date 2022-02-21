import 'source-map-support/register';
import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import { AGSServiceStage, AGSServiceStageProps } from './ags-service-stage';
declare type Constructor<T extends AGSServiceStage> = new (scope: Construct, id: string, props: AGSServiceStageProps) => T;
export interface AGSServiceAppProps<T extends AGSServiceStage> extends cdk.AppProps {
    stageConstructor: Constructor<T>;
    currentDir: string;
}
export declare class AGSServiceApp<T extends AGSServiceStage> extends cdk.App {
    constructor(props: AGSServiceAppProps<T>);
}
export {};
