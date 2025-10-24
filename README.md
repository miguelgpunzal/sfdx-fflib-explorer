# Salesforce FFLIB UI Configuration

A Visual Studio Code extension that provides a user-friendly interface for managing and navigating FFLIB (FinancialForce Apex Library) architecture in Salesforce projects.

## Features

### 📊 Visual Architecture Explorer
- **Tree View Interface**: Browse your FFLIB architecture layers in a clean, hierarchical view
- **Application-Centric Organization**: See all your Applications and their associated layers
- **Layer Categories**: Organized display of Services, Domains, Selectors, and Unit of Work classes

### 🎯 Quick Navigation
- **One-Click File Opening**: Click any class to open it in the editor
- **Hierarchical Structure**: Easily understand the relationship between applications and their components
- **Visual Icons**: Distinct icons for each layer type for quick identification

### ⚡ Fast Class Creation
- **Create New Application**: Scaffold a new FFLIB Application class with proper structure
- **Create New Service**: Generate Service interface and implementation with FFLIB patterns
- **Create New Domain**: Create Domain classes with trigger handlers and business logic templates
- **Create New Selector**: Generate Selector classes with SOQL query methods
- **Create New Unit of Work**: Build Unit of Work classes for transaction management

### 🏗️ FFLIB Architecture Compliance
All generated classes follow FFLIB best practices:
- **Applications**: Dependency injection and factory configuration
- **Services**: Multi-object orchestration and business processes
- **Domains**: Single-object business logic and validation
- **Selectors**: SOQL query handlers with FLS enforcement
- **Unit of Work**: DML operations and transaction control

## Requirements

- Visual Studio Code 1.80.0 or higher
- A Salesforce project with `sfdx-project.json` file
- FFLIB libraries installed in your Salesforce project

## Installation

1. Open VS Code
2. Go to Extensions (Ctrl+Shift+X / Cmd+Shift+X)
3. Search for "Salesforce FFLIB UI Configuration"
4. Click Install

Or install from VSIX:
```bash
code --install-extension salesforce-fflib-ui-configurator-1.0.0.vsix
```

## Usage

### Opening the FFLIB Explorer

The extension **automatically activates** when you open a Salesforce project (detects `sfdx-project.json`).

**To open the UI:**

1. **Option 1 (Recommended)**: Click the **FFLIB Explorer icon** in the Activity Bar (left sidebar)
   - Look for the 📦 grid icon labeled "FFLIB EXPLORER"
   
2. **Option 2**: Use Command Palette
   - Press `Ctrl+Shift+P` (Windows/Linux) or `Cmd+Shift+P` (Mac)
   - Type: "FFLIB: Refresh"
   - Press Enter

The extension will **automatically scan** your project directories:
- `force-app/main/default/classes/` (SFDX)
- `src/classes/` (Metadata API)
- `classes/` (Legacy)

All FFLIB components are detected and organized by:
- Naming conventions (`*Application`, `*Service`, `*Domain`, `*Selector`, `*UnitOfWork`)
- Class content (detecting `extends fflib_Application`, etc.)
- Relationship to parent applications

### Creating a New Application

1. In the FFLIB Explorer, click **"Applications"**
2. Click the **"$(add) Create New Application"** button
3. Enter the application name (e.g., `OnboardingApplication`)
4. The extension creates the Application class with proper FFLIB structure

### Creating Services, Domains, Selectors, or UOW

1. Expand an Application in the tree view
2. Expand the layer you want to add to (Services, Domains, Selectors, or Unit of Work)
3. Click the **"$(add) Create New..."** button for that layer
4. Follow the prompts to provide:
   - Class name
   - SObject name (for Domains and Selectors)
5. The extension creates the class with appropriate templates and meta.xml file

### Navigating Classes

- Simply click on any class name in the tree view to open it in the editor
- Classes are automatically organized under their parent application

## Extension Settings

This extension contributes the following commands:

* `fflib.refresh`: Refresh the FFLIB Explorer view
* `fflib.createApplication`: Create a new Application class
* `fflib.createService`: Create a new Service class
* `fflib.createDomain`: Create a new Domain class
* `fflib.createSelector`: Create a new Selector class
* `fflib.createUnitOfWork`: Create a new Unit of Work class

## FFLIB Architecture Overview

This extension follows the FFLIB framework architecture:

### Layer Responsibilities

1. **Application Layer**
   - Entry point for dependency injection
   - Factory configuration for Services, Domains, Selectors, and UOW
   - Wiring up implementations

2. **Service Layer**
   - Multi-object orchestration
   - Complex business processes
   - Transaction control via Unit of Work
   - No direct SOQL (use Selectors)
   - No direct DML (use Unit of Work)

3. **Domain Layer**
   - Single-object business logic
   - Validation rules
   - Field defaulting
   - Record-level calculations
   - Trigger handlers
   - No cross-object operations

4. **Selector Layer**
   - All SOQL queries for specific SObjects
   - Query construction and optimization
   - Field Level Security (FLS) enforcement
   - No business logic

5. **Unit of Work Layer**
   - DML operations (insert, update, delete, undelete)
   - Transaction management
   - Maintain relationship integrity
   - Proper operation order
   - No business logic

## Project Structure Detection

The extension automatically detects Salesforce project structures:

- `force-app/main/default/classes/` (SFDX format)
- `src/classes/` (Metadata API format)
- `classes/` (Legacy format)

## Class Naming Conventions

The extension enforces FFLIB naming conventions:

- **Applications**: Must end with `Application` (e.g., `OnboardingApplication`)
- **Services**: Must end with `Service` or `ServiceImpl`
- **Domains**: Must end with `Domain` or `Domains`
- **Selectors**: Can start or end with `Selector` or `Selectors` (e.g., `AccountSelector`, `AccountsSelector`, `SelectorAccount`, `SelectorsAccount`)
- **Unit of Work**: Must contain `UnitOfWork`

## Generated Class Templates

All generated classes include:
- Comprehensive documentation comments
- FFLIB framework inheritance
- Example methods and patterns
- Best practice comments
- Proper Salesforce metadata (cls-meta.xml)

## Known Issues

- The extension requires FFLIB libraries to be installed in your Salesforce project
- Class detection is based on naming conventions and file content analysis
- Orphaned classes (not associated with an application) are currently collected but not displayed

## Release Notes

### 1.0.0

Initial release of Salesforce FFLIB UI Configuration

- Tree view explorer for FFLIB architecture
- Application, Service, Domain, Selector, and UOW class creation
- Automatic workspace scanning and organization
- One-click navigation to class files
- FFLIB-compliant templates for all layers

## Contributing

Found a bug or have a feature request? Please open an issue on our GitHub repository.

## Resources

- [FFLIB Framework Documentation](https://docs.goharrier.com/technical/frameworks/fflib-apex-framework)
- [FFLIB GitHub Repository](https://github.com/apex-enterprise-patterns/fflib-apex-common)
- [Salesforce DX Developer Guide](https://developer.salesforce.com/docs/atlas.en-us.sfdx_dev.meta/sfdx_dev/)

## License

MIT License - See LICENSE file for details

---

**Enjoy building scalable Salesforce applications with FFLIB!** 🚀
