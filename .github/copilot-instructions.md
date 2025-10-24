# Salesforce FFLIB UI Configuration Extension

This VS Code extension provides a visual interface for managing FFLIB (FinancialForce Apex Library) architecture in Salesforce projects.

## Project Structure
- TypeScript-based VS Code extension
- Tree view provider for FFLIB architecture layers
- Commands for creating new FFLIB classes
- File system watcher for automatic updates

## FFLIB Architecture Layers
1. **Applications** - Entry point, dependency injection
2. **Services** - Multi-object orchestration and business processes
3. **Domains** - Single-object business logic and validation
4. **Selectors** - SOQL query handlers
5. **Unit of Work (UOW)** - DML operations and transaction control
