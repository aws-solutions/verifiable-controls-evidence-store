export interface DeploymentOptions {
    apiGatewayType: 'private' | 'public' | 'cloudfront';
    bastionInstance: boolean;
    developmentUserRole: boolean;
    trustedDeveloperAccounts: string;
}
export interface AGSEnvironment {
    account: string;
    region: string;
    configName?: string;
}
export interface SubnetMapping {
    subnetGroupName: string;
    securityGroupIds: string[];
}
export declare type SubnetMappingOptions = {
    [key in SubnetGroup]: SubnetMapping;
};
export declare type AGSEnvironments = Record<string, AGSEnvironment>;
export declare type Configurations = Record<string, Record<string, string>>;
export declare enum SubnetGroup {
    INGRESS = "ingress",
    SERVICE = "service",
    DATABASE = "database"
}
export declare enum AGSRole {
    SYSTEM_ADMIN = "SystemAdmin",
    EVERYONE = "Everyone",
    APPLICATION_OWNER = "ApplicationOwner",
    APPLICATION_DEVELOPER = "ApplicationDeveloper",
    CHIEF_RISK_OFFICE = "ChiefRiskOffice",
    LINE_ONE_RISK = "Line1Risk",
    LINE_TWO_RISK = "Line2Risk",
    LINE_THREE_RISK = "Line3Risk",
    DOMAIN_OWNER = "DomainOwner",
    EVIDENCE_PROVIDER = "EvidenceProvider",
    CONTROL_OWNER = "ControlOwner",
    SERVICE_MANAGER = "ServiceManager"
}
