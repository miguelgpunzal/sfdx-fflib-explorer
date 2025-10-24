# Salesforce FFLIB UI Configuration - Usage Guide

This guide shows you how to use the Salesforce FFLIB UI Configuration extension to manage your FFLIB architecture.

## Getting Started

### 1. Opening the FFLIB Explorer

After installing the extension, you'll see a new icon in the Activity Bar (left sidebar). Click it to open the FFLIB Explorer.

```
📦 FFLIB EXPLORER
└── Applications (3)
    ├── $(add) Create New Application
    ├── OnboardingApplication (12 classes)
    ├── ServiceApplication (8 classes)
    └── BillingApplication (15 classes)
```

### 2. Viewing Application Architecture

Click on any application to expand and see its architecture layers:

```
📦 OnboardingApplication (12 classes)
├── Services (3)
│   ├── $(add) Create New Service
│   ├── OnboardingService
│   ├── UserProvisioningService
│   └── EmailNotificationService
├── Domains (4)
│   ├── $(add) Create New Domain
│   ├── OnboardingRecordDomain
│   ├── UserDomain
│   ├── AccountDomain
│   └── ContactDomain
├── Selectors (3)
│   ├── $(add) Create New Selector
│   ├── OnboardingRecordsSelector
│   ├── UsersSelector
│   └── AccountsSelector
└── Unit of Work (2)
    ├── $(add) Create New Unit of Work
    ├── OnboardingUnitOfWork
    └── DataMigrationUnitOfWork
```

## Creating New Classes

### Creating an Application

1. Click **"$(add) Create New Application"**
2. Enter the application name (e.g., `OnboardingApplication`)
3. The extension creates:
   ```apex
   public class OnboardingApplication extends fflib_Application {
       public static final fflib_Application.ServiceFactory Service = ...
       public static final fflib_Application.DomainFactory Domain = ...
       public static final fflib_Application.SelectorFactory Selector = ...
       public static final fflib_Application.UnitOfWorkFactory UnitOfWork = ...
   }
   ```

### Creating a Service

1. Expand an Application
2. Expand **"Services"**
3. Click **"$(add) Create New Service"**
4. Enter service name (e.g., `OnboardingService`)
5. The extension creates:
   - Interface: `IOnboardingService`
   - Implementation: `OnboardingService implements IOnboardingService`

### Creating a Domain

1. Expand an Application
2. Expand **"Domains"**
3. Click **"$(add) Create New Domain"**
4. Enter domain name (e.g., `AccountDomain`)
5. Enter SObject name (e.g., `Account`)
6. The extension creates:
   ```apex
   public class AccountDomain extends fflib_SObjectDomain {
       public override void onBeforeInsert() { ... }
       public override void onBeforeUpdate(Map<Id, SObject> existingRecords) { ... }
       // ... more trigger handlers
   }
   ```

### Creating a Selector

1. Expand an Application
2. Expand **"Selectors"**
3. Click **"$(add) Create New Selector"**
4. Enter selector name (e.g., `AccountsSelector`)
5. Enter SObject name (e.g., `Account`)
6. The extension creates:
   ```apex
   public class AccountsSelector extends fflib_SObjectSelector {
       public Schema.SObjectType getSObjectType() { ... }
       public List<Schema.SObjectField> getSObjectFieldList() { ... }
       public List<Account> selectById(Set<Id> idSet) { ... }
   }
   ```

### Creating a Unit of Work

1. Expand an Application
2. Expand **"Unit of Work"**
3. Click **"$(add) Create New Unit of Work"**
4. Enter class name (e.g., `OnboardingUnitOfWork`)
5. The extension creates:
   ```apex
   public class OnboardingUnitOfWork extends fflib_SObjectUnitOfWork {
       public OnboardingUnitOfWork() {
           super(new List<SObjectType> { /* define order */ });
       }
   }
   ```

## Navigation

### Opening Files
Simply click on any class name in the tree view to open it in the editor.

### Refreshing the View
Click the refresh icon (🔄) in the view title bar to rescan the workspace.

## Example: Building a Complete Application

Let's build a complete Onboarding application:

### Step 1: Create the Application
```
Click: $(add) Create New Application
Enter: OnboardingApplication
```

### Step 2: Create the Service Layer
```
Expand: OnboardingApplication > Services
Click: $(add) Create New Service
Enter: OnboardingService

Result: IOnboardingService interface and OnboardingService implementation
```

### Step 3: Create the Domain Layer
```
Expand: OnboardingApplication > Domains
Click: $(add) Create New Domain
Enter: OnboardingRecordDomain
SObject: Onboarding__c

Result: Domain class with trigger handlers
```

### Step 4: Create the Selector Layer
```
Expand: OnboardingApplication > Selectors
Click: $(add) Create New Selector
Enter: OnboardingRecordsSelector
SObject: Onboarding__c

Result: Selector class with SOQL methods
```

### Step 5: Wire It All Together

Open `OnboardingApplication.cls` and register your classes:

```apex
public class OnboardingApplication extends fflib_Application {
    
    public static final fflib_Application.ServiceFactory Service = 
        new fflib_Application.ServiceFactory(
            new Map<Type, Type> {
                IOnboardingService.class => OnboardingServiceImpl.class
            }
        );
    
    public static final fflib_Application.DomainFactory Domain = 
        new fflib_Application.DomainFactory(
            OnboardingApplication.class,
            new Map<SObjectType, Type> {
                Onboarding__c.SObjectType => OnboardingRecordDomain.class
            }
        );
    
    public static final fflib_Application.SelectorFactory Selector = 
        new fflib_Application.SelectorFactory(
            new Map<SObjectType, Type> {
                Onboarding__c.SObjectType => OnboardingRecordsSelector.class
            }
        );
    
    public static final fflib_Application.UnitOfWorkFactory UnitOfWork = 
        new fflib_Application.UnitOfWorkFactory(
            new List<SObjectType> {
                Account.SObjectType,
                Contact.SObjectType,
                Onboarding__c.SObjectType
            }
        );
}
```

## Best Practices

### Naming Conventions
- **Applications**: `[Name]Application` (e.g., `OnboardingApplication`)
- **Services**: `[Name]Service` / `[Name]ServiceImpl`
- **Domains**: `[SObject]Domain` or `[SObject]Domains`
- **Selectors**: `[SObject]Selector` or `[SObject]Selectors`
- **Unit of Work**: `[Name]UnitOfWork`

### Layer Responsibilities
Remember the FFLIB layer responsibilities:

1. **Application**: Dependency injection configuration only
2. **Service**: Multi-object orchestration, no SOQL, no DML
3. **Domain**: Single-object logic, trigger handlers, no SOQL
4. **Selector**: SOQL queries only, no business logic
5. **Unit of Work**: DML operations only, no business logic

### Project Structure
The extension works with these project structures:
- `force-app/main/default/classes/` (SFDX)
- `src/classes/` (Metadata API)
- `classes/` (Legacy)

## Troubleshooting

### Extension Not Detecting Classes
1. Ensure you have `sfdx-project.json` in your workspace
2. Check that your classes follow FFLIB naming conventions
3. Click the refresh icon to rescan
4. Verify your project structure is supported

### Classes Not Grouping Under Applications
- Class names should start with or include the application name
- Example: `OnboardingApplication` groups with `OnboardingService`, `OnboardingDomain`

### Create Button Not Showing
- Make sure you've expanded the correct layer category
- The button appears at the top of each layer's class list

## Keyboard Shortcuts

While there are no default keyboard shortcuts, you can add your own:

1. Open Keyboard Shortcuts (Ctrl+K Ctrl+S / Cmd+K Cmd+S)
2. Search for "fflib"
3. Assign shortcuts to commands:
   - `fflib.refresh`
   - `fflib.createApplication`
   - `fflib.createService`
   - etc.

## Tips & Tricks

1. **Quick Access**: Pin the FFLIB Explorer for quick access
2. **Search**: Use VS Code's search (Ctrl+Shift+F) to find usage across classes
3. **Multi-Root**: The extension works with multi-root workspaces
4. **Auto-Refresh**: The view automatically updates when files change

## Next Steps

- Read the [FFLIB Documentation](https://docs.goharrier.com/technical/frameworks/fflib-apex-framework)
- Check out the [FFLIB GitHub Repository](https://github.com/apex-enterprise-patterns/fflib-apex-common)
- Explore the generated class templates for best practice examples

Happy coding! 🚀
