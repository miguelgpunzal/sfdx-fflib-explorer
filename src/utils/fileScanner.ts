import * as vscode from 'vscode';
import * as path from 'path';
import * as fs from 'fs';
import { FFLibClass, FFLibLayerType, FFLibApplication, FFLibStructure } from '../models/types';

export class FFLibFileScanner {
    private cachedStructure: FFLibStructure | null = null;
    private isScanning: boolean = false;
    private allClassesCache: FFLibClass[] | null = null; // Cache all scanned classes
    private applicationClassesCache: Map<string, FFLibApplication> = new Map(); // Cache loaded applications
    private applicationsOnlyCache: FFLibStructure | null = null; // Cache for applications-only scan
    
    /**
     * Scan for Application classes only (lightweight scan)
     */
    async scanApplicationsOnly(): Promise<FFLibStructure> {
        // Return cached applications if available
        if (this.applicationsOnlyCache) {
            console.log('Using cached applications structure');
            return this.applicationsOnlyCache;
        }

        const structure: FFLibStructure = {
            applications: [],
            orphanedServices: [],
            orphanedDomains: [],
            orphanedSelectors: [],
            orphanedUnitOfWorks: []
        };

        if (!vscode.workspace.workspaceFolders) {
            return structure;
        }

        // Find all .cls files
        const files = await vscode.workspace.findFiles('**/*.cls', '**/node_modules/**');
        console.log(`Scanning for Applications only - found ${files.length} .cls files`);

        // Read files in parallel
        const filePromises = files.map(async (file) => {
            const fileName = path.basename(file.fsPath, '.cls');
            const fileContent = await this.readFile(file.fsPath);
            const layer = this.detectLayer(fileName, fileContent);

            if (layer === FFLibLayerType.APPLICATION) {
                return {
                    fileName,
                    filePath: file.fsPath,
                    fileContent
                };
            }
            return null;
        });

        const results = await Promise.all(filePromises);

        // Create application entries (without loading their classes yet)
        for (const result of results) {
            if (result) {
                const appName = result.fileName.replace('Application', '');
                const uowObjects = this.extractUnitOfWorkObjects(result.fileContent);
                const serviceNames = this.extractServiceClasses(result.fileContent);
                const domainNames = this.extractDomainClasses(result.fileContent);
                const selectorNames = this.extractSelectorClasses(result.fileContent);

                console.log(`Found Application: ${appName}`);

                structure.applications.push({
                    name: result.fileName,
                    filePath: result.filePath,
                    services: [],
                    domains: [],
                    selectors: [],
                    unitOfWorks: uowObjects,
                    registeredServiceNames: serviceNames,
                    registeredDomainNames: domainNames,
                    registeredSelectorNames: selectorNames
                });
            }
        }

        // Cache the applications structure
        this.applicationsOnlyCache = structure;

        return structure;
    }

    /**
     * Load classes for a specific application
     */
    async loadApplicationClasses(application: FFLibApplication): Promise<FFLibApplication> {
        console.log(`Loading classes for application: ${application.name}`);
        
        // Check if we already have this application cached
        const cachedApp = this.applicationClassesCache.get(application.name);
        if (cachedApp) {
            console.log(`Using cached classes for ${application.name}`);
            return cachedApp;
        }
        
        if (!vscode.workspace.workspaceFolders) {
            return application;
        }

        // If we don't have all classes cached, scan them once
        if (!this.allClassesCache) {
            console.log('Building all classes cache...');
            const files = await vscode.workspace.findFiles('**/*.cls', '**/node_modules/**');
            
            // Read files in parallel
            const filePromises = files.map(async (file) => {
                const fileName = path.basename(file.fsPath, '.cls');
                const fileContent = await this.readFile(file.fsPath);
                const layer = this.detectLayer(fileName, fileContent);

                if (layer && layer !== FFLibLayerType.APPLICATION) {
                    return {
                        name: fileName,
                        filePath: file.fsPath,
                        layer
                    };
                }
                return null;
            });

            const results = await Promise.all(filePromises);
            this.allClassesCache = results.filter(r => r !== null) as FFLibClass[];
            console.log(`Cached ${this.allClassesCache.length} classes`);
        }

        const allClasses = this.allClassesCache;
        console.log(`Using ${allClasses.length} classes from cache to check against ${application.name}`);

        // Clear existing classes
        application.services = [];
        application.domains = [];
        application.selectors = [];

        // Create a map of found classes by name for quick lookup
        const classMap = new Map<string, FFLibClass>();
        for (const cls of allClasses) {
            classMap.set(cls.name, cls);
        }

        // Process Services - add all registered services (found or missing)
        if (application.registeredServiceNames) {
            for (const serviceName of application.registeredServiceNames) {
                // Look for the base service class (without I prefix or Impl suffix)
                const foundClass = classMap.get(serviceName);
                
                if (foundClass) {
                    application.services.push(foundClass);
                    console.log(`  Found registered service: ${serviceName}`);
                } else {
                    // Create a placeholder for missing class
                    const missingClass: FFLibClass = {
                        name: serviceName,
                        filePath: '', // Empty path indicates missing
                        layer: FFLibLayerType.SERVICE
                    };
                    application.services.push(missingClass);
                    console.log(`  Missing registered service: ${serviceName}`);
                }
            }
        }

        // Process Domains - add all registered domains (found or missing)
        if (application.registeredDomainNames) {
            for (const domainName of application.registeredDomainNames) {
                const foundClass = classMap.get(domainName);
                
                if (foundClass) {
                    application.domains.push(foundClass);
                    console.log(`  Found registered domain: ${domainName}`);
                } else {
                    const missingClass: FFLibClass = {
                        name: domainName,
                        filePath: '',
                        layer: FFLibLayerType.DOMAIN
                    };
                    application.domains.push(missingClass);
                    console.log(`  Missing registered domain: ${domainName}`);
                }
            }
        }

        // Process Selectors - add all registered selectors (found or missing)
        if (application.registeredSelectorNames) {
            for (const selectorName of application.registeredSelectorNames) {
                const foundClass = classMap.get(selectorName);
                
                if (foundClass) {
                    application.selectors.push(foundClass);
                    console.log(`  Found registered selector: ${selectorName}`);
                } else {
                    const missingClass: FFLibClass = {
                        name: selectorName,
                        filePath: '',
                        layer: FFLibLayerType.SELECTOR
                    };
                    application.selectors.push(missingClass);
                    console.log(`  Missing registered selector: ${selectorName}`);
                }
            }
        }

        console.log(`Loaded ${application.services.length} services, ${application.domains.length} domains, ${application.selectors.length} selectors`);

        // Cache the loaded application
        this.applicationClassesCache.set(application.name, application);

        return application;
    }

    async scanWorkspace(forceRefresh: boolean = false): Promise<FFLibStructure> {
        // Return cached structure if available and not forcing refresh
        if (this.cachedStructure && !forceRefresh && !this.isScanning) {
            return this.cachedStructure;
        }

        // If already scanning, wait for it to complete
        if (this.isScanning) {
            // Wait a bit and return cached or empty
            await new Promise(resolve => setTimeout(resolve, 100));
            return this.cachedStructure || this.getEmptyStructure();
        }

        this.isScanning = true;

        try {
            const structure: FFLibStructure = {
                applications: [],
                orphanedServices: [],
                orphanedDomains: [],
                orphanedSelectors: [],
                orphanedUnitOfWorks: []
            };

            if (!vscode.workspace.workspaceFolders) {
                this.cachedStructure = structure;
                return structure;
            }

            // Find all .cls files (Apex classes)
            const files = await vscode.workspace.findFiles('**/*.cls', '**/node_modules/**');
            console.log(`Found ${files.length} .cls files in workspace`);

            if (files.length === 0) {
                this.cachedStructure = structure;
                return structure;
            }

            const allClasses: FFLibClass[] = [];
            const applicationClasses: Map<string, FFLibApplication> = new Map();

            // Read all files in parallel for better performance
            const filePromises = files.map(async (file) => {
                const fileName = path.basename(file.fsPath, '.cls');
                const fileContent = await this.readFile(file.fsPath);
                
                const layer = this.detectLayer(fileName, fileContent);
                if (layer) {
                    const fflibClass: FFLibClass = {
                        name: fileName,
                        filePath: file.fsPath,
                        layer: layer
                    };

                    return { fflibClass, layer, fileName, filePath: file.fsPath };
                }
                return null;
            });

            const results = await Promise.all(filePromises);

            // Process results - first pass: identify applications and extract registered classes
            for (const result of results) {
                if (!result) {
                    continue;
                }

                if (result.layer === FFLibLayerType.APPLICATION) {
                    const appName = result.fileName.replace('Application', '');
                    const fileContent = await this.readFile(result.filePath);
                    
                    // Extract registered components from Application file
                    const uowObjects = this.extractUnitOfWorkObjects(fileContent);
                    const serviceNames = this.extractServiceClasses(fileContent);
                    const domainNames = this.extractDomainClasses(fileContent);
                    const selectorNames = this.extractSelectorClasses(fileContent);
                    
                    console.log(`Application ${appName} registered components:`);
                    console.log(`  Services: ${serviceNames.join(', ')}`);
                    console.log(`  Domains: ${domainNames.join(', ')}`);
                    console.log(`  Selectors: ${selectorNames.join(', ')}`);
                    console.log(`  UoW Objects: ${uowObjects.join(', ')}`);
                    
                    applicationClasses.set(appName, {
                        name: result.fileName,
                        filePath: result.filePath,
                        services: [],
                        domains: [],
                        selectors: [],
                        unitOfWorks: uowObjects,
                        registeredServiceNames: serviceNames,
                        registeredDomainNames: domainNames,
                        registeredSelectorNames: selectorNames
                    });
                } else {
                    allClasses.push(result.fflibClass);
                }
            }

            console.log(`Found ${allClasses.length} non-application classes to assign`);
            console.log(`Found ${applicationClasses.size} applications:`, Array.from(applicationClasses.keys()));

            // Assign classes to applications based on registration in Application file
            for (const cls of allClasses) {
                let assigned = false;

                // Try to match with an application's registered classes
                for (const [appName, app] of applicationClasses) {
                    let isRegistered = false;
                    
                    switch (cls.layer) {
                        case FFLibLayerType.SERVICE:
                            // Check if this service (without 'I' prefix or 'Impl' suffix) is registered
                            const serviceName = cls.name.replace(/^I/, '').replace(/Impl$/, '');
                            isRegistered = app.registeredServiceNames?.includes(serviceName) || false;
                            break;
                        case FFLibLayerType.DOMAIN:
                            // Check if this domain is registered
                            isRegistered = app.registeredDomainNames?.includes(cls.name) || false;
                            break;
                        case FFLibLayerType.SELECTOR:
                            // Check if this selector is registered
                            isRegistered = app.registeredSelectorNames?.includes(cls.name) || false;
                            break;
                    }
                    
                    if (isRegistered) {
                        console.log(`Assigning ${cls.name} (${cls.layer}) to ${appName} (registered in Application)`);
                        cls.applicationName = appName;
                        assigned = true;

                        switch (cls.layer) {
                            case FFLibLayerType.SERVICE:
                                // Only add non-interface and non-impl files as top-level services
                                // Interfaces and implementations will be shown as children when expanded
                                if (!cls.name.startsWith('I') && !cls.name.endsWith('ServiceImpl')) {
                                    console.log(`  Adding ${cls.name} to services`);
                                    app.services.push(cls);
                                } else {
                                    console.log(`  Skipping ${cls.name} (interface or impl - will show as child)`);
                                }
                                break;
                            case FFLibLayerType.DOMAIN:
                                // Only add non-interface files as top-level domains
                                if (!cls.name.startsWith('I')) {
                                    console.log(`  Adding ${cls.name} to domains`);
                                    app.domains.push(cls);
                                } else {
                                    console.log(`  Skipping ${cls.name} (interface - will show as child)`);
                                }
                                break;
                            case FFLibLayerType.SELECTOR:
                                // Only add non-interface files as top-level selectors
                                if (!cls.name.startsWith('I')) {
                                    console.log(`  Adding ${cls.name} to selectors`);
                                    app.selectors.push(cls);
                                } else {
                                    console.log(`  Skipping ${cls.name} (interface - will show as child)`);
                                }
                                break;
                        }
                        break;
                    }
                }

                // If not assigned to any application, add to orphaned list
                if (!assigned) {
                    switch (cls.layer) {
                        case FFLibLayerType.SERVICE:
                            structure.orphanedServices.push(cls);
                            break;
                        case FFLibLayerType.DOMAIN:
                            structure.orphanedDomains.push(cls);
                            break;
                        case FFLibLayerType.SELECTOR:
                            structure.orphanedSelectors.push(cls);
                            break;
                        case FFLibLayerType.UNIT_OF_WORK:
                            structure.orphanedUnitOfWorks.push(cls);
                            break;
                    }
                }
            }

            structure.applications = Array.from(applicationClasses.values());

            this.cachedStructure = structure;
            return structure;

        } finally {
            this.isScanning = false;
        }
    }

    private getEmptyStructure(): FFLibStructure {
        return {
            applications: [],
            orphanedServices: [],
            orphanedDomains: [],
            orphanedSelectors: [],
            orphanedUnitOfWorks: []
        };
    }

    clearCache(): void {
        this.cachedStructure = null;
        this.allClassesCache = null;
        this.applicationClassesCache.clear();
        this.applicationsOnlyCache = null;
        console.log('All caches cleared');
    }

    getCachedStructure(): FFLibStructure | null {
        return this.cachedStructure;
    }

    /**
     * Extract SObject types registered in the UnitOfWork factory
     */
    private extractUnitOfWorkObjects(fileContent: string): string[] {
        const objects: string[] = [];
        
        try {
            // Remove comments to avoid matching example code in comments
            const cleanedContent = this.removeComments(fileContent);
            
            // Look for UnitOfWorkFactory pattern
            // Example: new List<SObjectType> { Account.SObjectType, Contact.SObjectType }
            const uowPattern = /UnitOfWorkFactory\s*\(\s*new\s+List<SObjectType>\s*\{([^}]+)\}/s;
            const match = cleanedContent.match(uowPattern);
            
            if (match && match[1]) {
                const objectsString = match[1];
                // Extract SObject names (e.g., Account.SObjectType -> Account)
                const objectMatches = objectsString.matchAll(/(\w+)\.SObjectType/g);
                
                for (const objMatch of objectMatches) {
                    if (objMatch[1]) {
                        objects.push(objMatch[1]);
                    }
                }
            }
        } catch (error) {
            // Silently fail if parsing errors occur
        }
        
        return objects;
    }

    /**
     * Extract Services registered in the ServiceFactory
     * Example: ICaseService.class => CaseServiceImpl.class
     */
    private extractServiceClasses(fileContent: string): string[] {
        const services: string[] = [];
        
        try {
            // Remove comments to avoid matching example code in comments
            const cleanedContent = this.removeComments(fileContent);
            
            // Look for ServiceFactory pattern
            // Example: new fflib_Application.ServiceFactory( new Map<Type, Type> { IService.class => ServiceImpl.class })
            const servicePattern = /ServiceFactory\s*\(\s*new\s+Map<Type,\s*Type>\s*\{([^}]+)\}/s;
            const match = cleanedContent.match(servicePattern);
            
            if (match && match[1]) {
                const mappingsString = match[1];
                // Extract interface names (e.g., ICaseService.class => CaseServiceImpl.class -> ICaseService)
                const serviceMatches = mappingsString.matchAll(/(\w+)\.class\s*=>/g);
                
                for (const svcMatch of serviceMatches) {
                    if (svcMatch[1] && svcMatch[1].startsWith('I')) {
                        // Remove 'I' prefix to get base service name
                        const serviceName = svcMatch[1].substring(1);
                        services.push(serviceName);
                    }
                }
            }
        } catch (error) {
            console.error('Error extracting services:', error);
        }
        
        return services;
    }

    /**
     * Extract Domains registered in the DomainFactory
     * Example: Account.SObjectType => AccountsDomain.class
     * Example: Case.SObjectType => DomainCase.Constructor.class
     */
    private extractDomainClasses(fileContent: string): string[] {
        const domains: string[] = [];
        
        try {
            // Remove comments to avoid matching example code in comments
            const cleanedContent = this.removeComments(fileContent);
            
            // Look for DomainFactory pattern
            // Example: new fflib_Application.DomainFactory( ... new Map<SObjectType, Type> { Account.SObjectType => AccountsDomain.class })
            const domainPattern = /DomainFactory\s*\([^)]*new\s+Map<\w+,\s*Type>\s*\{([^}]+)\}/s;
            const match = cleanedContent.match(domainPattern);
            
            if (match && match[1]) {
                const mappingsString = match[1];
                // Extract domain class names
                // Handles both: DomainCase.class and DomainCase.Constructor.class
                const domainMatches = mappingsString.matchAll(/=>\s*(\w+)(?:\.Constructor)?\.class/g);
                
                for (const domMatch of domainMatches) {
                    if (domMatch[1]) {
                        domains.push(domMatch[1]);
                    }
                }
            }
        } catch (error) {
            console.error('Error extracting domains:', error);
        }
        
        return domains;
    }

    /**
     * Extract Selectors registered in the SelectorFactory
     * Example: Account.SObjectType => AccountsSelector.class
     * Example: Case.SObjectType => SelectorCase.Constructor.class
     */
    private extractSelectorClasses(fileContent: string): string[] {
        const selectors: string[] = [];
        
        try {
            // Remove comments to avoid matching example code in comments
            const cleanedContent = this.removeComments(fileContent);
            
            // Look for SelectorFactory pattern
            // Example: new fflib_Application.SelectorFactory( new Map<SObjectType, Type> { Account.SObjectType => AccountsSelector.class })
            const selectorPattern = /SelectorFactory\s*\(\s*new\s+Map<\w+,\s*Type>\s*\{([^}]+)\}/s;
            const match = cleanedContent.match(selectorPattern);
            
            if (match && match[1]) {
                const mappingsString = match[1];
                // Extract selector class names
                // Handles both: SelectorCase.class and SelectorCase.Constructor.class
                const selectorMatches = mappingsString.matchAll(/=>\s*(\w+)(?:\.Constructor)?\.class/g);
                
                for (const selMatch of selectorMatches) {
                    if (selMatch[1]) {
                        selectors.push(selMatch[1]);
                    }
                }
            }
        } catch (error) {
            console.error('Error extracting selectors:', error);
        }
        
        return selectors;
    }

    /**
     * Remove single-line and multi-line comments from Apex code
     */
    private removeComments(content: string): string {
        // Remove multi-line comments (/* ... */)
        let cleaned = content.replace(/\/\*[\s\S]*?\*\//g, '');
        
        // Remove single-line comments (// ...)
        cleaned = cleaned.replace(/\/\/.*$/gm, '');
        
        return cleaned;
    }

    private async readFile(filePath: string): Promise<string> {
        try {
            const content = await fs.promises.readFile(filePath, 'utf-8');
            return content;
        } catch (error) {
            console.error(`Error reading file ${filePath}:`, error);
            return '';
        }
    }

    private detectLayer(fileName: string, fileContent: string): FFLibLayerType | null {
        // Exclude test classes
        if (fileName.endsWith('Test') || fileName.endsWith('_Test')) {
            console.log(`  Excluding test class: ${fileName}`);
            return null;
        }

        // Detect based on naming convention and content
        
        // Application classes - must end with "Application" AND contain at least one factory
        if (fileName.endsWith('Application')) {
            const hasServiceFactory = fileContent.includes('ServiceFactory');
            const hasDomainFactory = fileContent.includes('DomainFactory');
            const hasSelectorFactory = fileContent.includes('SelectorFactory');
            const hasUnitOfWorkFactory = fileContent.includes('UnitOfWorkFactory');
            
            if (hasServiceFactory || hasDomainFactory || hasSelectorFactory || hasUnitOfWorkFactory) {
                console.log(`  Detected APPLICATION: ${fileName}`);
                return FFLibLayerType.APPLICATION;
            } else {
                console.log(`  ${fileName} ends with 'Application' but has no factories - not an Application class`);
                // Fall through to check other layer types
            }
        }
        
        // Also check for fflib_Application base class
        if (fileContent.includes('extends fflib_Application')) {
            console.log(`  Detected APPLICATION: ${fileName}`);
            return FFLibLayerType.APPLICATION;
        }

        // Service classes
        if (fileName.endsWith('Service') || 
            fileName.endsWith('ServiceImpl') ||
            fileName.startsWith('I') && fileName.includes('Service') ||
            fileContent.includes('implements IApplicationService') ||
            fileContent.includes('extends fflib_Service')) {
            console.log(`  Detected SERVICE: ${fileName}`);
            return FFLibLayerType.SERVICE;
        }

        // Domain classes - can have Domain as prefix OR suffix
        if (fileName.endsWith('Domain') || 
            fileName.endsWith('Domains') ||
            fileName.startsWith('Domain') ||
            fileName.startsWith('Domains') ||
            fileName.startsWith('I') && (fileName.includes('Domain') || fileName.includes('Domains')) ||
            fileContent.includes('extends fflib_SObjects') ||
            fileContent.includes('extends fflib_SObjectDomain')) {
            console.log(`  Detected DOMAIN: ${fileName}`);
            return FFLibLayerType.DOMAIN;
        }

        // Selector classes - can be prefix or suffix
        // Examples: AccountSelector, AccountSelectors, SelectorAccount, SelectorsAccount
        if (fileName.endsWith('Selector') || 
            fileName.endsWith('Selectors') ||
            fileName.startsWith('Selector') ||
            fileName.startsWith('Selectors') ||
            fileName.startsWith('I') && (fileName.includes('Selector') || fileName.includes('Selectors')) ||
            fileContent.includes('extends fflib_QueryFactory') ||
            fileContent.includes('extends fflib_SObjectSelector')) {
            console.log(`  Detected SELECTOR: ${fileName}`);
            return FFLibLayerType.SELECTOR;
        }

        // Unit of Work - typically in Application class but can be separate
        if (fileName.includes('UnitOfWork') || 
            fileContent.includes('fflib_ISObjectUnitOfWork') ||
            fileContent.includes('extends fflib_SObjectUnitOfWork')) {
            console.log(`  Detected UNIT_OF_WORK: ${fileName}`);
            return FFLibLayerType.UNIT_OF_WORK;
        }

        console.log(`  No layer detected for: ${fileName}`);
        return null;
    }

    async findApexClassesDirectory(): Promise<string | null> {
        if (!vscode.workspace.workspaceFolders) {
            return null;
        }

        const workspaceFolder = vscode.workspace.workspaceFolders[0];
        
        // Common Salesforce project structures
        const possiblePaths = [
            path.join(workspaceFolder.uri.fsPath, 'force-app', 'main', 'default', 'classes'),
            path.join(workspaceFolder.uri.fsPath, 'src', 'classes'),
            path.join(workspaceFolder.uri.fsPath, 'classes')
        ];

        for (const dirPath of possiblePaths) {
            if (fs.existsSync(dirPath)) {
                return dirPath;
            }
        }

        return null;
    }
}
