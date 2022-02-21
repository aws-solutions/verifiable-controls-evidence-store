import { CredentialProvider } from './ApjsbAwsHttpclient';
import * as aws from 'aws-sdk';
export declare class DefaultCredentialProvider implements CredentialProvider {
    private readonly credentialChain;
    constructor();
    getCredential(): Promise<aws.Credentials>;
}
