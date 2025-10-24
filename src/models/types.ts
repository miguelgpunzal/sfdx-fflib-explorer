export enum FFLibLayerType {
    APPLICATION = 'Application',
    SERVICE = 'Service',
    DOMAIN = 'Domain',
    SELECTOR = 'Selector',
    UNIT_OF_WORK = 'UnitOfWork'
}

export interface FFLibClass {
    name: string;
    filePath: string;
    layer: FFLibLayerType;
    applicationName?: string; // Which application this belongs to
    isNew?: boolean; // Newly created class
    isModified?: boolean; // Recently modified class
    modifiedDate?: Date; // When the file was last modified
}

export interface FFLibApplication {
    name: string;
    filePath: string;
    services: FFLibClass[];
    domains: FFLibClass[];
    selectors: FFLibClass[];
    unitOfWorks: string[]; // Just SObject API names, not classes
    registeredServiceNames?: string[]; // Service names extracted from ServiceFactory
    registeredDomainNames?: string[]; // Domain names extracted from DomainFactory
    registeredSelectorNames?: string[]; // Selector names extracted from SelectorFactory
}

export interface FFLibStructure {
    applications: FFLibApplication[];
    orphanedServices: FFLibClass[];
    orphanedDomains: FFLibClass[];
    orphanedSelectors: FFLibClass[];
    orphanedUnitOfWorks: FFLibClass[];
    recentChanges?: FFLibClass[]; // Recently created or modified classes
}
