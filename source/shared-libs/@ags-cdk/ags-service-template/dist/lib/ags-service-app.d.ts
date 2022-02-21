import 'source-map-support/register';
import * as cdk from '@aws-cdk/core';
import { AGSServiceStage, AGSServiceStageProps } from './ags-service-stage';
declare type Constructor<T extends AGSServiceStage> = new (scope: cdk.Construct, id: string, props: AGSServiceStageProps) => T;
export interface AGSServiceAppProps<T extends AGSServiceStage> extends cdk.AppProps {
    stageConstructor: Constructor<T>;
}
export declare class AGSServiceApp<T extends AGSServiceStage> extends cdk.App {
    constructor(props: AGSServiceAppProps<T>);
}
export {};
