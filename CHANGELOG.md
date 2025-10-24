# Change Log

All notable changes to the "Salesforce FFLIB Explorer" extension will be documented in this file.

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
