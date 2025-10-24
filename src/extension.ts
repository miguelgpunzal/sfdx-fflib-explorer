import * as vscode from 'vscode';
import { FFLibTreeDataProvider } from './treeview/fflibTreeProvider';
import { FFLibFileScanner } from './utils/fileScanner';
import { FFLibCommandHandler } from './commands/commandHandler';

export function activate(context: vscode.ExtensionContext) {
    console.log('Salesforce FFLIB UI Configuration extension is now active');

    // Initialize file scanner
    const fileScanner = new FFLibFileScanner();

    // Initialize tree data provider
    const treeDataProvider = new FFLibTreeDataProvider(fileScanner);
    
    // Register tree view
    const treeView = vscode.window.createTreeView('fflibTreeView', {
        treeDataProvider: treeDataProvider,
        showCollapseAll: true
    });

    // Initialize command handler
    const commandHandler = new FFLibCommandHandler(fileScanner, treeDataProvider);

    // Register commands
    context.subscriptions.push(
        vscode.commands.registerCommand('fflib.refresh', () => treeDataProvider.refresh()),
        vscode.commands.registerCommand('fflib.createApplication', () => commandHandler.createApplication()),
        vscode.commands.registerCommand('fflib.createService', (item) => commandHandler.createService(item)),
        vscode.commands.registerCommand('fflib.createDomain', (item) => commandHandler.createDomain(item)),
        vscode.commands.registerCommand('fflib.createSelector', (item) => commandHandler.createSelector(item)),
        vscode.commands.registerCommand('fflib.createUnitOfWork', (item) => commandHandler.createUnitOfWork(item)),
        vscode.commands.registerCommand('fflib.openFile', (item) => commandHandler.openFile(item)),
        vscode.commands.registerCommand('fflib.revealDependencies', (item) => commandHandler.revealDependencies(item)),
        vscode.commands.registerCommand('fflib.retrieveClass', (cls) => commandHandler.retrieveClass(cls)),
        treeView
    );

    // Watch for file changes
    const watcher = vscode.workspace.createFileSystemWatcher('**/*.cls');
    watcher.onDidCreate(() => {
        fileScanner.clearCache();
        treeDataProvider.refresh();
    });
    watcher.onDidDelete(() => {
        fileScanner.clearCache();
        treeDataProvider.refresh();
    });
    watcher.onDidChange(() => {
        fileScanner.clearCache();
        treeDataProvider.refresh();
    });
    context.subscriptions.push(watcher);

    // Initial scan - give it a moment for workspace to fully load
    setTimeout(() => {
        fileScanner.clearCache();
        treeDataProvider.refresh();
    }, 1000);
}

export function deactivate() {}
