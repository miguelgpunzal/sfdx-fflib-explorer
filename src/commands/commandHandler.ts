import * as vscode from 'vscode';
import * as path from 'path';
import * as fs from 'fs';
import { FFLibFileScanner } from '../utils/fileScanner';
import { FFLibTreeDataProvider } from '../treeview/fflibTreeProvider';
import { FFLibTreeItem } from '../treeview/treeItem';
import { generateApplicationTemplate, generateServiceInterfaceTemplate, generateServiceBaseTemplate, generateServiceImplTemplate, generateDomainTemplate, generateDomainInterfaceTemplate, generateDomainBaseTemplate, generateDomainImplTemplate, generateSelectorTemplate, generateSelectorInterfaceTemplate, generateSelectorBaseTemplate, generateSelectorImplTemplate, generateUnitOfWorkTemplate } from '../templates/classTemplates';

export class FFLibCommandHandler {
    constructor(
        private fileScanner: FFLibFileScanner,
        private treeDataProvider: FFLibTreeDataProvider
    ) {}

    async createApplication() {
        const className = await vscode.window.showInputBox({
            prompt: 'Enter the Application class name (e.g., BankApplication)',
            placeHolder: 'BankApplication',
            validateInput: (value) => {
                if (!value) {
                    return 'Class name is required';
                }
                if (!value.endsWith('Application')) {
                    return 'Application class name should end with "Application"';
                }
                if (!/^[A-Z][a-zA-Z0-9]*$/.test(value)) {
                    return 'Class name should start with uppercase letter and contain only alphanumeric characters';
                }
                return null;
            }
        });

        if (!className) {
            return;
        }

        await this.createClass(className, generateApplicationTemplate(className));
    }

    async createService(item?: any) {
        const applicationName = item?.application?.name?.replace('Application', '') || '';
        const fullApplicationClassName = item?.application?.name || undefined; // e.g., "OnboardingApplication"
        
        const className = await vscode.window.showInputBox({
            prompt: `Enter the Service base name${applicationName ? ` for ${applicationName}` : ''} (without 'I' or 'Impl')`,
            placeHolder: applicationName ? `${applicationName}Service` : 'AccountTransferService',
            validateInput: (value) => {
                if (!value) {
                    return 'Class name is required';
                }
                if (!value.endsWith('Service')) {
                    return 'Service class name should end with "Service"';
                }
                if (value.startsWith('I') || value.endsWith('Impl')) {
                    return 'Enter the base name only (without I prefix or Impl suffix)';
                }
                if (!/^[A-Z][a-zA-Z0-9]*$/.test(value)) {
                    return 'Class name should start with uppercase letter and contain only alphanumeric characters';
                }
                return null;
            }
        });

        if (!className) {
            return;
        }

        const classesDir = await this.fileScanner.findApexClassesDirectory();
        
        if (!classesDir) {
            vscode.window.showErrorMessage('Could not find Apex classes directory');
            return;
        }

        // Define the three class names
        const interfaceName = `I${className}`;
        const implName = `${className}Impl`;
        
        // Check if any already exist
        const interfacePath = path.join(classesDir, `${interfaceName}.cls`);
        const basePath = path.join(classesDir, `${className}.cls`);
        const implPath = path.join(classesDir, `${implName}.cls`);
        
        if (fs.existsSync(interfacePath) || fs.existsSync(basePath) || fs.existsSync(implPath)) {
            vscode.window.showErrorMessage(`One or more ${className} files already exist`);
            return;
        }

        // Show loading message
        await vscode.window.withProgress({
            location: vscode.ProgressLocation.Notification,
            title: `Creating ${className} files...`,
            cancellable: false
        }, async (progress) => {
            try {
                // Create all three files
                const createdFiles: string[] = [];
                
                progress.report({ message: 'Creating interface...' });
                // 1. Create interface (IAccountService)
                await this.createClassFileOnly(interfaceName, generateServiceInterfaceTemplate(interfaceName), classesDir);
                createdFiles.push(interfaceName);
                
                progress.report({ message: 'Creating base class...' });
                // 2. Create base class (AccountService) - with application context
                await this.createClassFileOnly(className, generateServiceBaseTemplate(interfaceName, className, fullApplicationClassName), classesDir);
                createdFiles.push(className);
                
                progress.report({ message: 'Creating implementation...' });
                // 3. Create implementation (AccountServiceImpl)
                await this.createClassFileOnly(implName, generateServiceImplTemplate(interfaceName, implName), classesDir);
                createdFiles.push(implName);
                
                progress.report({ message: 'Registering in Application...' });
                // 4. Register in Application if available
                if (item?.application) {
                    await this.registerServiceInApplication(item.application.filePath, interfaceName, implName);
                }
                
                progress.report({ message: 'Refreshing tree view...' });
                // Refresh tree view
                this.fileScanner.clearCache();
                this.treeDataProvider.refresh();
                
                // Show success message with options to open files
                vscode.window.showInformationMessage(
                    `Created Service files: ${createdFiles.join(', ')}${item?.application ? ' and registered in Application' : ''}`,
                    'Open Interface',
                    'Open Base Class',
                    'Open Implementation'
                ).then(selection => {
                    if (selection === 'Open Interface') {
                        vscode.workspace.openTextDocument(interfacePath).then(doc => {
                            vscode.window.showTextDocument(doc);
                        });
                    } else if (selection === 'Open Base Class') {
                        vscode.workspace.openTextDocument(basePath).then(doc => {
                            vscode.window.showTextDocument(doc);
                        });
                    } else if (selection === 'Open Implementation') {
                        vscode.workspace.openTextDocument(implPath).then(doc => {
                            vscode.window.showTextDocument(doc);
                        });
                    }
                });
            } catch (error) {
                vscode.window.showErrorMessage(`Error creating service files: ${error}`);
            }
        });
    }

    async createDomain(item?: any) {
        const applicationName = item?.application?.name?.replace('Application', '') || '';
        
        const className = await vscode.window.showInputBox({
            prompt: `Enter the Domain class name${applicationName ? ` for ${applicationName}` : ''}`,
            placeHolder: applicationName ? `${applicationName}Domain` : 'AccountsDomain',
            validateInput: (value) => {
                if (!value) {
                    return 'Class name is required';
                }
                if (!value.endsWith('Domain') && !value.endsWith('Domains') && !value.startsWith('Domain')) {
                    return 'Domain class name should start with "Domain" or end with "Domain" or "Domains"';
                }
                if (!/^[A-Z][a-zA-Z0-9]*$/.test(value)) {
                    return 'Class name should start with uppercase letter and contain only alphanumeric characters';
                }
                return null;
            }
        });

        if (!className) {
            return;
        }

        // Ask for SObject name
        const sObjectName = await vscode.window.showInputBox({
            prompt: 'Enter the SObject API name (e.g., Account, Contact, Custom__c)',
            placeHolder: 'Account',
            validateInput: (value) => {
                if (!value) {
                    return 'SObject name is required';
                }
                return null;
            }
        });

        if (!sObjectName) {
            return;
        }

        await this.createClass(className, generateDomainTemplate(className, sObjectName));
        
        // Register in Application if available
        if (item?.application) {
            await this.registerDomainInApplication(item.application.filePath, className, sObjectName);
            vscode.window.showInformationMessage(`${className} created and registered in Application`);
        } else {
            vscode.window.showInformationMessage(`${className} created`);
        }
    }

    async createSelector(item?: any) {
        const applicationName = item?.application?.name?.replace('Application', '') || '';
        
        const className = await vscode.window.showInputBox({
            prompt: `Enter the Selector class name${applicationName ? ` for ${applicationName}` : ''}`,
            placeHolder: applicationName ? `${applicationName}Selector` : 'AccountsSelector',
            validateInput: (value) => {
                if (!value) {
                    return 'Class name is required';
                }
                if (!value.endsWith('Selector') && !value.endsWith('Selectors') && !value.startsWith('Selector')) {
                    return 'Selector class name should start with "Selector" or end with "Selector" or "Selectors"';
                }
                if (!/^[A-Z][a-zA-Z0-9]*$/.test(value)) {
                    return 'Class name should start with uppercase letter and contain only alphanumeric characters';
                }
                return null;
            }
        });

        if (!className) {
            return;
        }

        // Ask for SObject name
        const sObjectName = await vscode.window.showInputBox({
            prompt: 'Enter the SObject API name (e.g., Account, Contact, Custom__c)',
            placeHolder: 'Account',
            validateInput: (value) => {
                if (!value) {
                    return 'SObject name is required';
                }
                return null;
            }
        });

        if (!sObjectName) {
            return;
        }

        await this.createClass(className, generateSelectorTemplate(className, sObjectName));
        
        // Register in Application if available
        if (item?.application) {
            await this.registerSelectorInApplication(item.application.filePath, className, sObjectName);
            vscode.window.showInformationMessage(`${className} created and registered in Application`);
        } else {
            vscode.window.showInformationMessage(`${className} created`);
        }
    }

    async createUnitOfWork(item?: any) {
        if (!item?.application) {
            vscode.window.showErrorMessage('Please select an application to register the SObject in Unit of Work');
            return;
        }

        const application = item.application;
        
        // Parse existing objects from the file directly (not from cache) to avoid stale comment data
        const existingObjects = await this.getExistingUoWObjects(application.filePath);

        // Show progress while fetching SObjects
        await vscode.window.withProgress({
            location: vscode.ProgressLocation.Notification,
            title: "Fetching SObjects from org...",
            cancellable: false
        }, async (progress) => {
            // Fetch SObjects from org using SF CLI
            const terminal = vscode.window.createTerminal({ name: 'FFLIB Fetch SObjects', hideFromUser: true });
            
            try {
                // Get all SObjects using sf CLI
                const { exec } = require('child_process');
                const util = require('util');
                const execPromise = util.promisify(exec);
                
                progress.report({ message: "Querying org for SObjects..." });
                
                const { stdout } = await execPromise('sf sobject list --sobject all --json');
                const result = JSON.parse(stdout);
                
                let allSObjects: string[] = [];
                
                if (result.status === 0 && result.result) {
                    allSObjects = result.result.map((obj: any) => obj.name || obj).sort();
                }
                
                // If SF CLI fails, try SFDX
                if (allSObjects.length === 0) {
                    try {
                        const { stdout: sfdxStdout } = await execPromise('sfdx force:schema:sobject:list --json');
                        const sfdxResult = JSON.parse(sfdxStdout);
                        if (sfdxResult.status === 0 && sfdxResult.result) {
                            allSObjects = sfdxResult.result.sort();
                        }
                    } catch (sfdxError) {
                        // Ignore SFDX error if already failed
                    }
                }
                
                terminal.dispose();
                
                if (allSObjects.length === 0) {
                    vscode.window.showErrorMessage('Could not fetch SObjects from org. Make sure you are authenticated.');
                    return;
                }
                
                // Create quick pick items
                const quickPickItems: vscode.QuickPickItem[] = allSObjects.map(sobject => {
                    const isExisting = existingObjects.includes(sobject);
                    return {
                        label: sobject,
                        description: isExisting ? '✓ Already registered' : '',
                        picked: false,
                        // VS Code doesn't support disabled items, so we'll filter them out or show with description
                    };
                });
                
                // Show multi-select quick pick
                const selectedItems = await vscode.window.showQuickPick(quickPickItems, {
                    canPickMany: true,
                    placeHolder: `Select SObjects to register in ${application.name} Unit of Work`,
                    title: 'Register SObjects in Unit of Work',
                    matchOnDescription: true
                });
                
                if (!selectedItems || selectedItems.length === 0) {
                    return;
                }
                
                // Get selected object names
                const selectedObjects = selectedItems.map(item => item.label);
                
                // Add objects to the Application file
                const addedCount = await this.addSObjectsToUnitOfWork(application.filePath, selectedObjects);
                
                if (addedCount > 0) {
                    // Refresh tree view
                    this.fileScanner.clearCache();
                    this.treeDataProvider.refresh();
                }
                
            } catch (error) {
                terminal.dispose();
                vscode.window.showErrorMessage(`Error fetching SObjects: ${error}`);
            }
        });
    }

    /**
     * Get existing UoW objects from Application file, ignoring comments
     */
    private async getExistingUoWObjects(appFilePath: string): Promise<string[]> {
        try {
            const document = await vscode.workspace.openTextDocument(appFilePath);
            const text = document.getText();
            
            // Remove comments to avoid matching example code
            const cleanedText = this.removeComments(text);
            
            // Find the UnitOfWorkFactory pattern
            const uowPattern = /UnitOfWorkFactory\s*\(\s*new\s+List<SObjectType>\s*\{([^}]*)\}/s;
            const match = cleanedText.match(uowPattern);
            
            if (!match || !match[1]) {
                return [];
            }
            
            const existingList = match[1];
            const objects: string[] = [];
            
            // Extract SObject names
            const objectMatches = existingList.matchAll(/(\w+)\.SObjectType/g);
            for (const m of objectMatches) {
                if (m[1]) {
                    objects.push(m[1]);
                }
            }
            
            return objects;
        } catch (error) {
            console.error('Error reading UoW objects:', error);
            return [];
        }
    }

    /**
     * Remove comments from Apex code
     */
    private removeComments(content: string): string {
        // Remove multi-line comments (/* ... */)
        let cleaned = content.replace(/\/\*[\s\S]*?\*\//g, '');
        
        // Remove single-line comments (// ...)
        cleaned = cleaned.replace(/\/\/.*$/gm, '');
        
        return cleaned;
    }

    private async addSObjectsToUnitOfWork(appFilePath: string, sObjectNames: string[]): Promise<number> {
        const document = await vscode.workspace.openTextDocument(appFilePath);
        const text = document.getText();
        
        // Remove comments to get accurate duplicate detection
        const cleanedText = this.removeComments(text);
        
        // Find the UnitOfWorkFactory pattern in cleaned text for duplicate checking
        const uowPattern = /UnitOfWorkFactory\s*\(\s*new\s+List<SObjectType>\s*\{([^}]*)\}/s;
        const match = cleanedText.match(uowPattern);
        
        if (!match) {
            vscode.window.showErrorMessage('Could not find UnitOfWorkFactory in Application file');
            return 0;
        }
        
        const existingList = match[1];
        
        // Parse existing SObjects to avoid duplicates
        const existingSObjects = new Set<string>();
        const existingMatches = existingList.matchAll(/(\w+)\.SObjectType/g);
        for (const m of existingMatches) {
            existingSObjects.add(m[1]);
        }
        
        // Filter out duplicates
        const newObjects = sObjectNames.filter(obj => !existingSObjects.has(obj));
        
        if (newObjects.length === 0) {
            vscode.window.showInformationMessage('All selected objects are already registered');
            return 0;
        }
        
        // Now find the pattern in the ORIGINAL text for replacement
        const originalMatch = text.match(uowPattern);
        if (!originalMatch) {
            vscode.window.showErrorMessage('Could not locate UnitOfWorkFactory in document');
            return 0;
        }
        
        const fullMatch = originalMatch[0];
        const originalExistingList = originalMatch[1];
        
        // Build new list
        let newList = originalExistingList.trim();
        
        // Add new entries
        for (const obj of newObjects) {
            if (newList.length > 0 && !newList.endsWith(',')) {
                newList += ',';
            }
            if (newList.length > 0) {
                newList += '\n                ';
            }
            newList += `${obj}.SObjectType`;
        }
        
        // Build the replacement text with proper formatting
        const replacement = `UnitOfWorkFactory(\n            new List<SObjectType> {\n                ${newList}\n            }`;
        
        // Find the position of the match in the document
        const matchIndex = text.indexOf(fullMatch);
        if (matchIndex === -1) {
            vscode.window.showErrorMessage('Could not locate UnitOfWorkFactory in document');
            return 0;
        }
        
        const startPos = document.positionAt(matchIndex);
        const endPos = document.positionAt(matchIndex + fullMatch.length);
        
        // Apply edit
        const edit = new vscode.WorkspaceEdit();
        edit.replace(document.uri, new vscode.Range(startPos, endPos), replacement);
        const success = await vscode.workspace.applyEdit(edit);
        
        if (success) {
            await document.save();
            // Open the file to show changes
            await vscode.window.showTextDocument(document);
            vscode.window.showInformationMessage(`Added ${newObjects.length} SObject(s) to Unit of Work: ${newObjects.join(', ')}`);
            return newObjects.length;
        } else {
            vscode.window.showErrorMessage('Failed to update Application file');
            return 0;
        }
    }

    private async createClass(className: string, content: string) {
        const classesDir = await this.fileScanner.findApexClassesDirectory();
        
        if (!classesDir) {
            vscode.window.showErrorMessage('Could not find Apex classes directory. Make sure you have a Salesforce project structure (force-app/main/default/classes or src/classes)');
            return;
        }

        const classFilePath = path.join(classesDir, `${className}.cls`);
        const metaFilePath = path.join(classesDir, `${className}.cls-meta.xml`);

        // Check if file already exists
        if (fs.existsSync(classFilePath)) {
            vscode.window.showErrorMessage(`Class ${className} already exists`);
            return;
        }

        try {
            // Create .cls file
            await fs.promises.writeFile(classFilePath, content, 'utf-8');

            // Create .cls-meta.xml file
            const metaContent = this.generateMetaXml();
            await fs.promises.writeFile(metaFilePath, metaContent, 'utf-8');

            // Open the created file
            const document = await vscode.workspace.openTextDocument(classFilePath);
            await vscode.window.showTextDocument(document);

            vscode.window.showInformationMessage(`Created ${className}`);

            // Refresh tree view
            this.treeDataProvider.refresh();
        } catch (error) {
            vscode.window.showErrorMessage(`Error creating class: ${error}`);
        }
    }

    private async createClassFileOnly(className: string, content: string, classesDir: string): Promise<void> {
        const classFilePath = path.join(classesDir, `${className}.cls`);
        const metaFilePath = path.join(classesDir, `${className}.cls-meta.xml`);

        // Create .cls file
        await fs.promises.writeFile(classFilePath, content, 'utf-8');

        // Create .cls-meta.xml file
        const metaContent = this.generateMetaXml();
        await fs.promises.writeFile(metaFilePath, metaContent, 'utf-8');
    }

    private generateMetaXml(): string {
        return `<?xml version="1.0" encoding="UTF-8"?>
<ApexClass xmlns="http://soap.sforce.com/2006/04/metadata">
    <apiVersion>59.0</apiVersion>
    <status>Active</status>
</ApexClass>`;
    }

    async openFile(item: FFLibTreeItem) {
        if (item.resourceUri) {
            const document = await vscode.workspace.openTextDocument(item.resourceUri);
            await vscode.window.showTextDocument(document);
        }
    }

    async revealDependencies(item: FFLibTreeItem) {
        // Future enhancement: show dependency graph
        vscode.window.showInformationMessage('Dependency visualization coming soon!');
    }

    private async registerServiceInApplication(appFilePath: string, interfaceName: string, implName: string): Promise<void> {
        const document = await vscode.workspace.openTextDocument(appFilePath);
        const text = document.getText();
        
        // Find the ServiceFactory pattern
        const servicePattern = /ServiceFactory\s*\(\s*new\s+Map<Type,\s*Type>\s*\{([^}]*)\}/s;
        const match = text.match(servicePattern);
        
        if (!match) {
            vscode.window.showWarningMessage('Could not find ServiceFactory in Application file. Please register manually.');
            return;
        }
        
        const existingList = match[1];
        
        // Build new entry: IAccountService.class => AccountServiceImpl.class
        const newEntry = `${interfaceName}.class => ${implName}.class`;
        
        // Determine if we need a comma before adding
        const trimmedExisting = existingList.trim();
        const needsComma = trimmedExisting.length > 0 && !trimmedExisting.endsWith(',');
        
        // Build the new list - add on new line with proper indentation
        let newList = existingList;
        if (trimmedExisting.length > 0) {
            newList = existingList.trimEnd();
            if (needsComma) {
                newList += ',\n                ';
            } else {
                newList += '\n                ';
            }
            newList += newEntry;
            const trailingWhitespace = existingList.match(/(\s*)$/)?.[1] || '';
            newList += trailingWhitespace;
        } else {
            newList = '\n                ' + newEntry + '\n            ';
        }
        
        // Replace in document
        const newText = text.replace(servicePattern, `ServiceFactory(\n            new Map<Type, Type> {${newList}}`);
        
        // Apply edit
        const edit = new vscode.WorkspaceEdit();
        edit.replace(document.uri, new vscode.Range(0, 0, document.lineCount, 0), newText);
        await vscode.workspace.applyEdit(edit);
        await document.save();
    }

    private async registerDomainInApplication(appFilePath: string, domainName: string, sObjectName: string): Promise<void> {
        const document = await vscode.workspace.openTextDocument(appFilePath);
        const text = document.getText();
        
        // Find the DomainFactory pattern
        const domainPattern = /DomainFactory\s*\([^)]*new\s+Map<\w+,\s*Type>\s*\{([^}]*)\}/s;
        const match = text.match(domainPattern);
        
        if (!match) {
            vscode.window.showWarningMessage('Could not find DomainFactory in Application file. Please register manually.');
            return;
        }
        
        const existingList = match[1];
        
        // Build new entry: Account.SObjectType => AccountsDomain.class
        const newEntry = `${sObjectName}.SObjectType => ${domainName}.class`;
        
        const trimmedExisting = existingList.trim();
        const needsComma = trimmedExisting.length > 0 && !trimmedExisting.endsWith(',');
        
        let newList = existingList;
        if (trimmedExisting.length > 0) {
            newList = existingList.trimEnd();
            if (needsComma) {
                newList += ',\n                ';
            } else {
                newList += '\n                ';
            }
            newList += newEntry;
            const trailingWhitespace = existingList.match(/(\s*)$/)?.[1] || '';
            newList += trailingWhitespace;
        } else {
            newList = '\n                ' + newEntry + '\n            ';
        }
        
        const newText = text.replace(domainPattern, (fullMatch) => {
            return fullMatch.replace(/\{([^}]*)\}/, `{${newList}}`);
        });
        
        const edit = new vscode.WorkspaceEdit();
        edit.replace(document.uri, new vscode.Range(0, 0, document.lineCount, 0), newText);
        await vscode.workspace.applyEdit(edit);
        await document.save();
    }

    private async registerSelectorInApplication(appFilePath: string, selectorName: string, sObjectName: string): Promise<void> {
        const document = await vscode.workspace.openTextDocument(appFilePath);
        const text = document.getText();
        
        // Find the SelectorFactory pattern
        const selectorPattern = /SelectorFactory\s*\(\s*new\s+Map<\w+,\s*Type>\s*\{([^}]*)\}/s;
        const match = text.match(selectorPattern);
        
        if (!match) {
            vscode.window.showWarningMessage('Could not find SelectorFactory in Application file. Please register manually.');
            return;
        }
        
        const existingList = match[1];
        
        // Build new entry: Account.SObjectType => AccountsSelector.class
        const newEntry = `${sObjectName}.SObjectType => ${selectorName}.class`;
        
        const trimmedExisting = existingList.trim();
        const needsComma = trimmedExisting.length > 0 && !trimmedExisting.endsWith(',');
        
        let newList = existingList;
        if (trimmedExisting.length > 0) {
            newList = existingList.trimEnd();
            if (needsComma) {
                newList += ',\n                ';
            } else {
                newList += '\n                ';
            }
            newList += newEntry;
            const trailingWhitespace = existingList.match(/(\s*)$/)?.[1] || '';
            newList += trailingWhitespace;
        } else {
            newList = '\n                ' + newEntry + '\n            ';
        }
        
        const newText = text.replace(selectorPattern, `SelectorFactory(\n            new Map<SObjectType, Type> {${newList}}`);
        
        const edit = new vscode.WorkspaceEdit();
        edit.replace(document.uri, new vscode.Range(0, 0, document.lineCount, 0), newText);
        await vscode.workspace.applyEdit(edit);
        await document.save();
    }

    async retrieveClass(item: any) {
        // When called from context menu, item is the TreeItem
        // Extract the class data from the TreeItem
        const cls = item.data || item;
        const className = cls.name;
        const layer = cls.layer;
        
        if (!className) {
            vscode.window.showErrorMessage('Could not determine class name to retrieve');
            return;
        }
        
        const terminal = vscode.window.createTerminal('FFLIB Retrieve');
        terminal.show();

        // Build list of classes to retrieve based on layer type
        const classesToRetrieve: string[] = [className];
        
        if (layer === 'Service') {
            // For services, also retrieve interface and implementation
            // e.g., AccountService -> IAccountService, AccountServiceImpl
            const interfaceName = `I${className}`;
            const implName = `${className}Impl`;
            classesToRetrieve.push(interfaceName, implName);
        } else if (layer === 'Domain') {
            // For domains, also retrieve interface
            // e.g., AccountsDomain -> IAccountsDomain
            const interfaceName = `I${className}`;
            classesToRetrieve.push(interfaceName);
        } else if (layer === 'Selector') {
            // For selectors, also retrieve interface
            // e.g., AccountsSelector -> IAccountsSelector
            const interfaceName = `I${className}`;
            classesToRetrieve.push(interfaceName);
        }

        // Retrieve each class individually (not all or nothing)
        for (const clsName of classesToRetrieve) {
            terminal.sendText(`sf project retrieve start --metadata ApexClass:${clsName} 2>/dev/null || sfdx force:source:retrieve -m ApexClass:${clsName} 2>/dev/null || echo "Could not retrieve ${clsName} (may not exist in org)"`);
        }

        vscode.window.showInformationMessage(
            `Retrieving ${className} and related classes from org. Check terminal for progress.`,
            'Refresh Now'
        ).then((selection) => {
            if (selection === 'Refresh Now') {
                this.fileScanner.clearCache();
                this.treeDataProvider.refresh();
            }
        });

        // Also auto-refresh after a delay
        setTimeout(() => {
            this.fileScanner.clearCache();
            this.treeDataProvider.refresh();
        }, 8000);
    }
}
