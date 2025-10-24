import * as vscode from 'vscode';
import { FFLibClass, FFLibLayerType, FFLibApplication, FFLibStructure } from '../models/types';

export class FFLibTreeItem extends vscode.TreeItem {
    public data?: any;
    public itemContextValue: string;

    constructor(
        label: string,
        collapsibleState: vscode.TreeItemCollapsibleState,
        itemContextValue: string,
        resourceUri?: vscode.Uri,
        data?: any
    ) {
        super(label, collapsibleState);
        this.itemContextValue = itemContextValue;
        this.contextValue = itemContextValue;
        this.resourceUri = resourceUri;
        this.data = data;

        // Set icons based on type
        this.iconPath = this.getIcon();
        
        // Set command for file items
        if (resourceUri && itemContextValue !== 'layer' && itemContextValue !== 'applicationsCategory') {
            this.command = {
                command: 'fflib.openFile',
                title: 'Open File',
                arguments: [this]
            };
        }
    }

    private getIcon(): vscode.ThemeIcon {
        switch (this.itemContextValue) {
            case 'application':
                return new vscode.ThemeIcon('package');
            case 'layer':
                return new vscode.ThemeIcon('folder');
            case 'service':
                return new vscode.ThemeIcon('symbol-method');
            case 'serviceInterface':
                return new vscode.ThemeIcon('symbol-interface');
            case 'serviceImpl':
                return new vscode.ThemeIcon('symbol-class');
            case 'domain':
                return new vscode.ThemeIcon('symbol-class');
            case 'domainInterface':
                return new vscode.ThemeIcon('symbol-interface');
            case 'selector':
                return new vscode.ThemeIcon('database');
            case 'selectorInterface':
                return new vscode.ThemeIcon('symbol-interface');
            case 'unitofwork':
                return new vscode.ThemeIcon('git-commit');
            case 'unitofworkobject':
                return new vscode.ThemeIcon('symbol-field');
            case 'createButton':
                return new vscode.ThemeIcon('add');
            default:
                return new vscode.ThemeIcon('file');
        }
    }
}
