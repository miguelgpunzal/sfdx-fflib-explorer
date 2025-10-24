# Quick Start Guide

## Installation

Install the extension from the VS Code Marketplace or VSIX file.

## First Time Setup

1. **Open a Salesforce Project**
   - Must contain `sfdx-project.json`
   - Should have FFLIB libraries installed

2. **Open FFLIB Explorer**
   - Click the FFLIB icon in the Activity Bar (left sidebar)
   - Or use Command Palette: `FFLIB: Refresh`

3. **Your First Application**
   ```
   1. Click "Applications" in the tree view
   2. Click "$(add) Create New Application"
   3. Enter: "MyFirstApplication"
   4. File created at: force-app/main/default/classes/MyFirstApplication.cls
   ```

4. **Add a Service**
   ```
   1. Expand "MyFirstApplication"
   2. Expand "Services"
   3. Click "$(add) Create New Service"
   4. Enter: "MyFirstService"
   5. Two files created:
      - IMyFirstService (interface)
      - MyFirstService (implementation)
   ```

5. **Add a Domain**
   ```
   1. Expand "Domains" under your application
   2. Click "$(add) Create New Domain"
   3. Enter Domain name: "AccountDomain"
   4. Enter SObject: "Account"
   5. File created with trigger handlers ready
   ```

6. **Add a Selector**
   ```
   1. Expand "Selectors"
   2. Click "$(add) Create New Selector"
   3. Enter: "AccountsSelector"
   4. Enter SObject: "Account"
   5. File created with query methods
   ```

## 5-Minute Tutorial

### Scenario: Build an Onboarding System

**Step 1: Create Application (30 seconds)**
```
Click: $(add) Create New Application
Name: OnboardingApplication
✓ Created with factories configured
```

**Step 2: Create Service (1 minute)**
```
Navigate: OnboardingApplication > Services
Click: $(add) Create New Service
Name: OnboardingService
✓ Interface and implementation created
```

**Step 3: Create Domain (1 minute)**
```
Navigate: OnboardingApplication > Domains
Click: $(add) Create New Domain
Name: OnboardingRecordDomain
SObject: Onboarding__c
✓ Domain with trigger handlers created
```

**Step 4: Create Selector (1 minute)**
```
Navigate: OnboardingApplication > Selectors
Click: $(add) Create New Selector
Name: OnboardingRecordsSelector
SObject: Onboarding__c
✓ Selector with query methods created
```

**Step 5: Wire Everything (1.5 minutes)**

Open `OnboardingApplication.cls` and register your classes in the factories:

```apex
// In Service factory
new Map<Type, Type> {
    IOnboardingService.class => OnboardingServiceImpl.class
}

// In Domain factory
new Map<SObjectType, Type> {
    Onboarding__c.SObjectType => OnboardingRecordDomain.class
}

// In Selector factory
new Map<SObjectType, Type> {
    Onboarding__c.SObjectType => OnboardingRecordsSelector.class
}

// In UnitOfWork factory
new List<SObjectType> {
    Account.SObjectType,
    Contact.SObjectType,
    Onboarding__c.SObjectType
}
```

**Done!** You now have a complete FFLIB application structure.

## Common Tasks

### Navigate to a Class
```
Simply click any class name in the tree view
```

### Refresh the View
```
Click the refresh icon (🔄) in the view title
Or: Command Palette > "FFLIB: Refresh"
```

### Create Multiple Classes
```
Repeat the "Create New" process for each layer
All classes are automatically organized under their application
```

## Tips

1. **Naming Pattern**: Start class names with the application name for auto-grouping
   - ✓ `OnboardingService` groups with `OnboardingApplication`
   - ✗ `MyService` won't auto-group

2. **Template Code**: Generated classes include helpful comments and examples

3. **Metadata Files**: `.cls-meta.xml` files are created automatically

4. **File Location**: Classes are created in your Salesforce classes directory
   - SFDX: `force-app/main/default/classes/`
   - Metadata API: `src/classes/`

## Need Help?

- Check the [README.md](../README.md) for full documentation
- See [USAGE.md](./USAGE.md) for detailed examples
- Review generated class templates for FFLIB patterns

## Next Steps

1. Implement business logic in your Service layer
2. Add validation in your Domain layer
3. Create query methods in your Selector layer
4. Test your application

Happy coding! 🎉
