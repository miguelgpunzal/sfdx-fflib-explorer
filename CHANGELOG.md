# Change Log

All notable changes to the "Salesforce FFLIB Explorer" extension will be documented in this file.

## [1.0.10] - 2024-10-24
### Added
- SObject picker for Domain creation - Now uses org SObject list instead of manual input
- SObject picker for Selector creation - Now uses org SObject list instead of manual input
- Queries org using SF CLI (`sf sobject list`) with SFDX fallback
- Progress indicator while fetching SObjects from org

### Changed
- Domain creation now shows searchable SObject picker
- Selector creation now shows searchable SObject picker
- Consistent UX with Unit of Work SObject selection

## [1.0.9] - 2024-10-24
### Fixed
- Removed expand/collapse icons from Domain and Selector items in tree view
- Only Services show expand/collapse icons (since they have Interface + Base + Impl files)
- Domains and Selectors now display as single items without expansion (single file each)

## [1.0.8] - 2024-10-24
### Changed
- **CORRECTED FFLIB Structure**: Now follows proper FFLIB pattern
  - **Services**: 3 files (Interface + Base + Implementation)
    - `IAccountService` - Interface
    - `AccountService` - Abstract base class with factory methods
    - `AccountServiceImpl` - Concrete implementation
  - **Selectors**: 1 file (Just Base class)
    - `AccountsSelector` - Extends `fflib_SObjectSelector`
  - **Domains**: 1 file (Just Base class)  
    - `AccountsDomain` - Extends `fflib_SObjectDomain` with inner Constructor class

### Added
- Allow "Selector" as prefix in selector names (e.g., `SelectorBank`, `SelectorAccount`)
- Allow "Domain" as prefix in domain names (e.g., `DomainBank`, `DomainAccount`)

## [1.0.7] - 2024-10-24
### Changed
- **Selector creation**: Now creates 2 files (Interface + Implementation) instead of 3
  - `IAccountsSelector` (interface)
  - `AccountsSelector` (implementation, extends fflib_SObjectSelector)
- **Domain creation**: Still creates 1 file (just implementation with inner Constructor class)
  - `AccountsDomain` (extends fflib_SObjectDomain)

### Added
- Allow "Selector" as prefix in selector names (e.g., `SelectorBank`, `SelectorAccount`)
- Allow "Domain" as prefix in domain names (e.g., `DomainBank`, `DomainAccount`)

### Fixed
- Input validation now accepts both prefix and suffix patterns for Selectors and Domains

## [1.0.6] - 2024-10-24
### Fixed
- Fixed Unit of Work registration reading comments from Application file
- UoW registration now parses the Application file directly (not from cache) to avoid stale data
- Added `removeComments()` helper in commandHandler to ensure comments are stripped before checking existing UoW objects
- Fixed issue where fresh Application classes with example comments showed "already registered" message

## [1.0.5] - 2024-10-24
### Fixed
- Fixed Unit of Work registration not updating Application file when SObjects are selected
- Improved document edit logic to use position-based replacement instead of full document replacement

### Added
- Domain classes can now have "Domain" as prefix (e.g., `DomainAccount`) or suffix (e.g., `AccountDomain`)
- Better support for different domain naming conventions

## [1.0.4] - 2024-10-24
### Fixed
- Fixed issue where comments in Application files were being parsed as actual registrations
- Extension now properly ignores example code in comments (e.g., `// Example: IBankService.class => BankServiceImpl.class`)
- Added comment removal preprocessing before parsing Application factories

## [1.0.3] - 2024-10-24
### Changed
- Updated extension icon

## [1.0.2] - 2024-01-XX
### Added
- Interactive ASCII tree view simulation in README
- Comprehensive documentation with usage guides
- Architecture overview and design principles
- Commands reference table
- Professional formatting with badges and navigation

### Changed
- Enhanced README with detailed feature descriptions
- Added collapsible sections for better readability
- Improved installation and usage instructions

## [1.0.1] - 2024-01-XX
### Fixed
- Corrected repository URL in package.json
- Updated marketplace links

## [1.0.0] - 2024-10-24

### Added
- Initial release of Salesforce FFLIB Explorer extension
- FFLIB Explorer tree view in Activity Bar
- Automatic scanning and detection of FFLIB architecture layers
- Visual organization of Applications, Services, Domains, Selectors, and Unit of Work
- Create new Application classes with dependency injection configuration
- Create new Service classes (Interface + Base + Implementation - 3 files)
- Create new Selector classes (Interface + Base + Implementation - 3 files)
- Create new Domain classes with trigger handler methods
- Create new Unit of Work classes with multi-select SObject picker
- One-click navigation to class files
- Context-aware "Create New" buttons for each layer
- Automatic registration in Application factory classes
- Factory methods in base classes using correct Application class names
- Multi-level caching for performance optimization
- Loading progress indicators for all operations
- Missing class detection with retrieval functionality
- Icon differentiation for each FFLIB layer type
- Automatic file system watching for live updates
- Comprehensive class templates following FFLIB best practices
- Documentation and usage examples in all templates
- Support for both SFDX and Metadata API project structures
- Automatic .cls-meta.xml file generation

### Features
- Hierarchical tree view showing application architecture
- Lazy loading (Applications first, classes on expansion)
- Registration-based class detection from Application files
- Smart parsing of factory configurations
- Input validation for class names following FFLIB patterns
- Automatic workspace refresh on file changes
- Support for multiple Salesforce project directory structures
- Salesforce CLI integration for SObject retrieval
