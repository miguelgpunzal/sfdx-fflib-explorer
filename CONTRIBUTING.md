# Contributing to Salesforce FFLIB UI Configuration

Thank you for your interest in contributing! This document provides guidelines for contributing to this VS Code extension.

## Development Setup

1. Clone the repository
2. Install dependencies:
   ```bash
   npm install
   ```
3. Open in VS Code
4. Press `F5` to start debugging

## Project Structure

```
├── src/
│   ├── extension.ts              # Extension entry point
│   ├── commands/
│   │   └── commandHandler.ts     # Command implementations
│   ├── models/
│   │   └── types.ts              # TypeScript interfaces and types
│   ├── templates/
│   │   └── classTemplates.ts     # FFLIB class templates
│   ├── treeview/
│   │   ├── fflibTreeProvider.ts  # Tree view data provider
│   │   └── treeItem.ts           # Tree item implementation
│   └── utils/
│       └── fileScanner.ts        # Workspace file scanner
├── resources/                    # Icons and assets
├── out/                          # Compiled JavaScript (generated)
└── package.json                  # Extension manifest
```

## Development Workflow

1. Make changes to TypeScript files in `src/`
2. The TypeScript compiler will watch for changes
3. Press `F5` to launch the Extension Development Host
4. Test your changes in the new VS Code window
5. Make iterative changes and reload the extension

## Testing

- Test the extension with real Salesforce projects
- Ensure all FFLIB layers are detected correctly
- Verify class creation works for all layer types
- Check that generated code follows FFLIB patterns

## Code Style

- Use TypeScript with strict type checking
- Follow the existing code style
- Add JSDoc comments for public methods
- Keep methods focused and single-purpose

## Submitting Changes

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## Reporting Issues

When reporting issues, please include:
- VS Code version
- Extension version
- Salesforce project structure
- Steps to reproduce
- Expected vs actual behavior
- Screenshots if applicable

## Feature Requests

We welcome feature requests! Please:
- Check if the feature already exists or is planned
- Describe the use case and benefits
- Provide examples if possible

## Questions?

Feel free to open an issue for questions or discussion.

Thank you for contributing!
