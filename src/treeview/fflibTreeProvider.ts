import * as vscode from 'vscode';
import { FFLibFileScanner } from '../utils/fileScanner';
import { FFLibTreeItem } from './treeItem';
import { FFLibLayerType, FFLibApplication } from '../models/types';

export class FFLibTreeDataProvider implements vscode.TreeDataProvider<FFLibTreeItem> {
    private _onDidChangeTreeData: vscode.EventEmitter<FFLibTreeItem | undefined | null | void> = new vscode.EventEmitter<FFLibTreeItem | undefined | null | void>();
    readonly onDidChangeTreeData: vscode.Event<FFLibTreeItem | undefined | null | void> = this._onDidChangeTreeData.event;

    constructor(private fileScanner: FFLibFileScanner) {}

    refresh(): void {
        this.fileScanner.clearCache();
        this._onDidChangeTreeData.fire();
    }

    getTreeItem(element: FFLibTreeItem): vscode.TreeItem {
        return element;
    }

    async getChildren(element?: FFLibTreeItem): Promise<FFLibTreeItem[]> {
        if (!vscode.workspace.workspaceFolders) {
            vscode.window.showInformationMessage('No workspace folder open');
            return [];
        }

        // Root level - show "Applications" category
        if (!element) {
            return this.getRootItems();
        }

        // Applications category - show all applications + "Create New Application" button
        if (element.itemContextValue === 'applicationsCategory') {
            return this.getApplicationItems();
        }

        // Individual application - show its layers (Services, Domains, Selectors, UOW)
        if (element.itemContextValue === 'application') {
            return this.getApplicationLayers(element);
        }

        // Layer category under an application - show classes + "Create New" button
        if (element.itemContextValue === 'layer') {
            return this.getLayerItems(element);
        }

        // Service item - show interface and implementation
        if (element.itemContextValue === 'service') {
            return this.getServiceChildren(element);
        }

        // Domains and Selectors are single files - no children
        // Removed getDomainChildren and getSelectorChildren handlers

        return [];
    }

    private async getRootItems(): Promise<FFLibTreeItem[]> {
        const items: FFLibTreeItem[] = [];

        // Use lightweight scan to only get Applications
        const structure = await this.fileScanner.scanApplicationsOnly();

        // Applications category
        const appCount = structure.applications.length;
        const applicationsCategory = new FFLibTreeItem(
            `Applications (${appCount})`,
            vscode.TreeItemCollapsibleState.Expanded,
            'applicationsCategory',
            undefined,
            structure
        );
        items.push(applicationsCategory);

        return items;
    }

    private async getApplicationItems(): Promise<FFLibTreeItem[]> {
        // Use lightweight scan to only get Applications
        const structure = await this.fileScanner.scanApplicationsOnly();
        const items: FFLibTreeItem[] = [];

        // Add "Create New Application" button
        const createButton = new FFLibTreeItem(
            'Create New Application',
            vscode.TreeItemCollapsibleState.None,
            'createButton',
            undefined,
            { action: 'createApplication' }
        );
        createButton.iconPath = new vscode.ThemeIcon('add');
        createButton.command = {
            command: 'fflib.createApplication',
            title: 'Create New Application'
        };
        items.push(createButton);

        // Add all applications (without class counts yet)
        for (const app of structure.applications) {
            const appItem = new FFLibTreeItem(
                app.name,
                vscode.TreeItemCollapsibleState.Collapsed,
                'application',
                vscode.Uri.file(app.filePath),
                app
            );
            // Add colored icon to distinguish applications from folders
            appItem.iconPath = new vscode.ThemeIcon('symbol-namespace', new vscode.ThemeColor('symbolIcon.namespaceForeground'));
            items.push(appItem);
        }

        return items;
    }

    private async getApplicationLayers(element: FFLibTreeItem): Promise<FFLibTreeItem[]> {
        let app: FFLibApplication = element.data;
        
        // Load classes for this application if not loaded yet
        if (app.services.length === 0 && app.domains.length === 0 && app.selectors.length === 0) {
            console.log(`Loading classes for ${app.name} on first expand...`);
            app = await this.fileScanner.loadApplicationClasses(app);
            // Update the element's data
            element.data = app;
        }
        
        const items: FFLibTreeItem[] = [];

        // Services layer
        items.push(new FFLibTreeItem(
            `Services (${app.services.length})`,
            vscode.TreeItemCollapsibleState.Collapsed,
            'layer',
            undefined,
            { application: app, layer: FFLibLayerType.SERVICE, classes: app.services }
        ));

        // Domains layer
        items.push(new FFLibTreeItem(
            `Domains (${app.domains.length})`,
            vscode.TreeItemCollapsibleState.Collapsed,
            'layer',
            undefined,
            { application: app, layer: FFLibLayerType.DOMAIN, classes: app.domains }
        ));

        // Selectors layer
        items.push(new FFLibTreeItem(
            `Selectors (${app.selectors.length})`,
            vscode.TreeItemCollapsibleState.Collapsed,
            'layer',
            undefined,
            { application: app, layer: FFLibLayerType.SELECTOR, classes: app.selectors }
        ));

        // Unit of Work layer - shows registered SObjects, not classes
        items.push(new FFLibTreeItem(
            `Unit of Work (${app.unitOfWorks.length} objects)`,
            vscode.TreeItemCollapsibleState.Collapsed,
            'layer',
            undefined,
            { application: app, layer: FFLibLayerType.UNIT_OF_WORK, objects: app.unitOfWorks }
        ));

        return items;
    }

    private getLayerItems(element: FFLibTreeItem): FFLibTreeItem[] {
        const { application, layer } = element.data;
        const items: FFLibTreeItem[] = [];

        // Handle Unit of Work differently - it shows SObjects, not classes
        if (layer === FFLibLayerType.UNIT_OF_WORK) {
            // Add "Register New Object" button
            const createButton = new FFLibTreeItem(
                'Register New Object',
                vscode.TreeItemCollapsibleState.None,
                'createButton',
                undefined,
                { action: 'registerUnitOfWork', application }
            );
            createButton.iconPath = new vscode.ThemeIcon('add');
            createButton.command = {
                command: 'fflib.createUnitOfWork',
                title: 'Register New Object as Unit of Work',
                arguments: [{ application }]
            };
            items.push(createButton);

            // Add registered SObjects
            const objects = element.data.objects || [];
            for (const objectName of objects) {
                const objectItem = new FFLibTreeItem(
                    objectName,
                    vscode.TreeItemCollapsibleState.None,
                    'unitofworkobject',
                    vscode.Uri.file(application.filePath), // Points to Application file
                    { name: objectName, application }
                );
                items.push(objectItem);
            }

            return items;
        }

        // For other layers (Services, Domains, Selectors)
        const classes = element.data.classes || [];

        // Add "Create New" button for this layer
        const layerName = layer.toString();
        const createButton = new FFLibTreeItem(
            `Create New ${layerName}`,
            vscode.TreeItemCollapsibleState.None,
            'createButton',
            undefined,
            { action: `create${layerName}`, application }
        );
        createButton.iconPath = new vscode.ThemeIcon('add');
        
        // Set command based on layer type
        const commandMap: { [key: string]: string } = {
            [FFLibLayerType.SERVICE]: 'fflib.createService',
            [FFLibLayerType.DOMAIN]: 'fflib.createDomain',
            [FFLibLayerType.SELECTOR]: 'fflib.createSelector'
        };

        createButton.command = {
            command: commandMap[layer] || 'fflib.refresh',
            title: `Create New ${layerName}`,
            arguments: [{ application }]
        };
        items.push(createButton);

        // Add all classes in this layer
        for (const cls of classes) {
            const contextValue = layer.toLowerCase().replace('_', '');
            
            // Check if class file is missing (empty filePath)
            const isMissing = !cls.filePath;
            
            if (isMissing) {
                // Show missing class with warning and retrieve button
                const missingItem = new FFLibTreeItem(
                    `${cls.name} ⚠️ (Missing from directory)`,
                    vscode.TreeItemCollapsibleState.None,
                    `${contextValue}-missing`,
                    undefined,
                    cls
                );
                missingItem.iconPath = new vscode.ThemeIcon('warning', new vscode.ThemeColor('editorWarning.foreground'));
                missingItem.tooltip = `Class ${cls.name} is registered in the Application but does not exist in the workspace.`;
                items.push(missingItem);
            } else {
                // Only Services need to be expandable (they have Interface + Base + Impl)
                // Domains and Selectors are single files, so they should not be expandable
                const collapsibleState = (layer === FFLibLayerType.SERVICE) 
                    ? vscode.TreeItemCollapsibleState.Collapsed 
                    : vscode.TreeItemCollapsibleState.None;
                
                const clsItem = new FFLibTreeItem(
                    cls.name,
                    collapsibleState,
                    contextValue,
                    vscode.Uri.file(cls.filePath),
                    cls
                );
                items.push(clsItem);
            }
        }

        return items;
    }

    private async getServiceChildren(element: FFLibTreeItem): Promise<FFLibTreeItem[]> {
        const serviceCls = element.data;
        const items: FFLibTreeItem[] = [];

        // Try to find interface and implementation files
        const workspaceFolders = vscode.workspace.workspaceFolders;
        if (!workspaceFolders) {
            return items;
        }

        const serviceName = serviceCls.name;
        let interfaceName = '';
        let implName = '';

        // Determine naming pattern
        if (serviceName.endsWith('ServiceImpl')) {
            // This is the implementation
            implName = serviceName;
            interfaceName = 'I' + serviceName.replace('Impl', '');
        } else if (serviceName.endsWith('Service')) {
            // This could be base name
            interfaceName = 'I' + serviceName;
            implName = serviceName + 'Impl';
        } else if (serviceName.startsWith('I') && serviceName.includes('Service')) {
            // This is the interface
            interfaceName = serviceName;
            implName = serviceName.substring(1) + 'Impl';
        }

        // Search for interface file
        if (interfaceName) {
            const interfaceFiles = await vscode.workspace.findFiles(`**/${interfaceName}.cls`, '**/node_modules/**');
            if (interfaceFiles.length > 0) {
                const interfaceItem = new FFLibTreeItem(
                    `${interfaceName} (interface)`,
                    vscode.TreeItemCollapsibleState.None,
                    'serviceInterface',
                    interfaceFiles[0],
                    { name: interfaceName, filePath: interfaceFiles[0].fsPath }
                );
                items.push(interfaceItem);
            }
        }

        // Search for implementation file
        if (implName) {
            const implFiles = await vscode.workspace.findFiles(`**/${implName}.cls`, '**/node_modules/**');
            if (implFiles.length > 0) {
                const implItem = new FFLibTreeItem(
                    `${implName} (implementation)`,
                    vscode.TreeItemCollapsibleState.None,
                    'serviceImpl',
                    implFiles[0],
                    { name: implName, filePath: implFiles[0].fsPath }
                );
                items.push(implItem);
            }
        }

        return items;
    }

    // Removed getDomainChildren and getSelectorChildren methods
    // Domains and Selectors are now single files with no child items
}
