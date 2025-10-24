/**
 * Template for Application class
 */
export function generateApplicationTemplate(className: string): string {
    const appName = className.replace('Application', '');
    return `/**
 * ${className} - Application layer class for ${appName}
 * 
 * This class serves as the entry point for dependency injection and 
 * configuration of the ${appName} application following FFLIB architecture.
 * 
 * Responsibilities:
 * - Define and bind Service layer implementations
 * - Define and bind Domain layer implementations
 * - Define and bind Selector layer implementations
 * - Configure Unit of Work for this application context
 * 
 * @see https://docs.goharrier.com/technical/frameworks/fflib-apex-framework
 */
public class ${className} extends fflib_Application {
    
    /**
     * Configure Service factory for this application
     */
    public static final fflib_Application.ServiceFactory Service = 
        new fflib_Application.ServiceFactory(
            new Map<Type, Type> {
                // Register your service implementations here
                // Example: I${appName}Service.class => ${appName}ServiceImpl.class
            }
        );
    
    /**
     * Configure Domain factory for this application
     */
    public static final fflib_Application.DomainFactory Domain = 
        new fflib_Application.DomainFactory(
            ${className}.class,
            new Map<SObjectType, Type> {
                // Register your domain classes here
                // Example: Account.SObjectType => AccountDomain.class
            }
        );
    
    /**
     * Configure Selector factory for this application
     */
    public static final fflib_Application.SelectorFactory Selector = 
        new fflib_Application.SelectorFactory(
            new Map<SObjectType, Type> {
                // Register your selector classes here
                // Example: Account.SObjectType => AccountsSelector.class
            }
        );
    
    /**
     * Configure Unit of Work factory for this application
     */
    public static final fflib_Application.UnitOfWorkFactory UnitOfWork = 
        new fflib_Application.UnitOfWorkFactory(
            new List<SObjectType> {
                // Define the DML operation order for this application
                // Example: Account.SObjectType, Contact.SObjectType, Opportunity.SObjectType
            }
        );
}`;
}

/**
 * Template for Service interface
 */
export function generateServiceInterfaceTemplate(className: string): string {
    return `/**
 * ${className} - Service interface
 * 
 * Service layer handles multi-object orchestration and complex business processes.
 * 
 * Responsibilities:
 * - Orchestrate operations across multiple SObjects
 * - Implement complex business processes
 * - Transaction control via Unit of Work
 * - No direct SOQL - use Selectors
 * - No direct DML - use Unit of Work
 */
public interface ${className} {
    /**
     * Define your service methods here
     * Example: void processRecords(Set<Id> recordIds);
     */
}`;
}

/**
 * Template for Service base class (abstract)
 */
export function generateServiceBaseTemplate(interfaceName: string, baseClassName: string, applicationClassName?: string): string {
    // Use the provided application class name or fallback to 'Application'
    const appClass = applicationClassName || 'Application';
    
    return `/**
 * ${baseClassName} - Service base class
 * 
 * Abstract base implementation of ${interfaceName}.
 * Can contain common logic shared across implementations.
 */
public abstract class ${baseClassName} implements ${interfaceName} {
    
    /**
     * @description Service factory method to get service implementation
     * @return ${interfaceName} implementation
     */
    private static ${interfaceName} service() {
        return (${interfaceName}) ${appClass}.Service.newInstance(${interfaceName}.class);
    }
    
    /**
     * Implement shared service methods here
     */
    
    /**
     * Example method structure:
     * 
     * public void processRecords(Set<Id> recordIds) {
     *     // Common logic that can be used by subclasses
     * }
     */
}`;
}

/**
 * Template for Service implementation
 */
export function generateServiceImplTemplate(interfaceName: string, implClassName: string): string {
    return `/**
 * ${implClassName} - Service implementation
 */
public class ${implClassName} implements ${interfaceName} {
    
    /**
     * Implement your service methods here
     */
    
    /**
     * Example method structure:
     * 
     * public void processRecords(Set<Id> recordIds) {
     *     // 1. Query data using Selectors
     *     // List<Account> accounts = (List<Account>) Application.Selector
     *     //     .newInstance(Account.SObjectType)
     *     //     .selectSObjectsById(recordIds);
     *     
     *     // 2. Create Unit of Work
     *     // fflib_ISObjectUnitOfWork uow = Application.UnitOfWork.newInstance();
     *     
     *     // 3. Process business logic (potentially using Domain classes)
     *     // for (Account acc : accounts) {
     *     //     // Business logic
     *     //     uow.registerDirty(acc);
     *     // }
     *     
     *     // 4. Commit changes
     *     // uow.commitWork();
     * }
     */
}`;
}

/**
 * Template for Service class (legacy - combined interface and implementation)
 */
export function generateServiceTemplate(className: string): string {
    const interfaceName = `I${className}`;
    return `/**
 * ${interfaceName} - Service interface
 * 
 * Service layer handles multi-object orchestration and complex business processes.
 * 
 * Responsibilities:
 * - Orchestrate operations across multiple SObjects
 * - Implement complex business processes
 * - Transaction control via Unit of Work
 * - No direct SOQL - use Selectors
 * - No direct DML - use Unit of Work
 */
public interface ${interfaceName} {
    /**
     * Define your service methods here
     * Example: void processRecords(Set<Id> recordIds);
     */
}

/**
 * ${className} - Service implementation
 */
public class ${className} implements ${interfaceName} {
    
    /**
     * Implement your service methods here
     */
    
    /**
     * Example method structure:
     * 
     * public void processRecords(Set<Id> recordIds) {
     *     // 1. Query data using Selectors
     *     // List<Account> accounts = (List<Account>) Application.Selector
     *     //     .newInstance(Account.SObjectType)
     *     //     .selectSObjectsById(recordIds);
     *     
     *     // 2. Create Unit of Work
     *     // fflib_ISObjectUnitOfWork uow = Application.UnitOfWork.newInstance();
     *     
     *     // 3. Process business logic (potentially using Domain classes)
     *     // for (Account acc : accounts) {
     *     //     // Business logic
     *     //     uow.registerDirty(acc);
     *     // }
     *     
     *     // 4. Commit changes
     *     // uow.commitWork();
     * }
     */
}`;
}

/**
 * Template for Domain class
 */
export function generateDomainTemplate(className: string, sObjectName: string): string {
    return `/**
 * ${className} - Domain class for ${sObjectName}
 * 
 * Domain layer encapsulates single-object business logic and validation.
 * 
 * Responsibilities:
 * - Single SObject business logic
 * - Validation rules
 * - Field defaulting
 * - Record-level calculations
 * - No cross-object operations (use Services for that)
 * - No SOQL queries (use Selectors)
 */
public class ${className} extends fflib_SObjectDomain {
    
    /**
     * Constructor
     */
    public ${className}(List<${sObjectName}> records) {
        super(records);
    }
    
    /**
     * Factory class for creating instances
     */
    public class Constructor implements fflib_SObjectDomain.IConstructable {
        public fflib_SObjectDomain construct(List<SObject> sObjectList) {
            return new ${className}(sObjectList);
        }
    }
    
    /**
     * Trigger handler - before insert
     */
    public override void onBeforeInsert() {
        // Implement before insert logic
        // Example: setDefaults();
    }
    
    /**
     * Trigger handler - before update
     */
    public override void onBeforeUpdate(Map<Id, SObject> existingRecords) {
        // Implement before update logic
        // Example: validateChanges((Map<Id, ${sObjectName}>) existingRecords);
    }
    
    /**
     * Trigger handler - after insert
     */
    public override void onAfterInsert() {
        // Implement after insert logic
    }
    
    /**
     * Trigger handler - after update
     */
    public override void onAfterUpdate(Map<Id, SObject> existingRecords) {
        // Implement after update logic
    }
    
    /**
     * Example: Set default values on records
     */
    // private void setDefaults() {
    //     for (${sObjectName} record : (List<${sObjectName}>) Records) {
    //         // Set defaults
    //     }
    // }
    
    /**
     * Example: Validate changes
     */
    // private void validateChanges(Map<Id, ${sObjectName}> existingRecords) {
    //     for (${sObjectName} record : (List<${sObjectName}>) Records) {
    //         ${sObjectName} oldRecord = existingRecords.get(record.Id);
    //         // Validate changes
    //     }
    // }
    
    /**
     * Gets the records as the specific SObject type
     */
    public List<${sObjectName}> get${sObjectName}s() {
        return (List<${sObjectName}>) Records;
    }
}`;
}

/**
 * Template for Selector interface
 */
export function generateSelectorInterfaceTemplate(interfaceName: string, sObjectName: string): string {
    return `/**
 * ${interfaceName} - Selector interface for ${sObjectName}
 * 
 * Selector layer handles all SOQL queries for a specific SObject.
 * 
 * Responsibilities:
 * - All SOQL queries for ${sObjectName}
 * - Query construction and optimization
 * - Enforce Field Level Security (FLS)
 * - No business logic - queries only
 */
public interface ${interfaceName} {
    /**
     * Query records by Id
     * 
     * @param idSet Set of record Ids to query
     * @return List of ${sObjectName} records
     */
    List<${sObjectName}> selectById(Set<Id> idSet);
    
    /**
     * Define additional selector methods here
     * Example: List<${sObjectName}> selectByCustomCriteria(String fieldValue);
     */
}`;
}

/**
 * Template for Selector base class
 */
export function generateSelectorBaseTemplate(interfaceName: string, baseClassName: string, sObjectName: string, applicationClassName?: string): string {
    // Use the provided application class name or fallback to 'Application'
    const appClass = applicationClassName || 'Application';
    
    return `/**
 * ${baseClassName} - Selector base class for ${sObjectName}
 * 
 * Abstract base implementation of ${interfaceName}.
 * Can contain common selector logic.
 */
public abstract class ${baseClassName} extends fflib_SObjectSelector implements ${interfaceName} {
    
    /**
     * @description Selector factory method to get selector implementation
     * @return ${interfaceName} implementation
     */
    private static ${interfaceName} selector() {
        return (${interfaceName}) ${appClass}.Selector.newInstance(${sObjectName}.SObjectType);
    }
    
    /**
     * Constructor
     */
    public ${baseClassName}() {
        super();
    }
    
    /**
     * Constructor with custom sorting
     */
    public ${baseClassName}(Boolean includeFieldSetFields, Boolean enforceCRUD, Boolean enforceFLS) {
        super(includeFieldSetFields, enforceCRUD, enforceFLS);
    }
    
    /**
     * Define the SObject this selector queries
     */
    public Schema.SObjectType getSObjectType() {
        return ${sObjectName}.SObjectType;
    }
    
    /**
     * Define the fields to query by default
     */
    public List<Schema.SObjectField> getSObjectFieldList() {
        return new List<Schema.SObjectField> {
            ${sObjectName}.Id,
            ${sObjectName}.Name
            // Add more fields as needed
        };
    }
    
    /**
     * Query records by Id
     * 
     * @param idSet Set of record Ids to query
     * @return List of ${sObjectName} records
     */
    public List<${sObjectName}> selectById(Set<Id> idSet) {
        return (List<${sObjectName}>) selectSObjectsById(idSet);
    }
}`;
}

/**
 * Template for Selector implementation class
 */
export function generateSelectorImplTemplate(interfaceName: string, implClassName: string, sObjectName: string): string {
    return `/**
 * ${implClassName} - Selector implementation for ${sObjectName}
 */
public class ${implClassName} extends fflib_SObjectSelector implements ${interfaceName} {
    
    /**
     * Constructor
     */
    public ${implClassName}() {
        super();
    }
    
    /**
     * Constructor with custom sorting
     */
    public ${implClassName}(Boolean includeFieldSetFields, Boolean enforceCRUD, Boolean enforceFLS) {
        super(includeFieldSetFields, enforceCRUD, enforceFLS);
    }
    
    /**
     * Define the SObject this selector queries
     */
    public Schema.SObjectType getSObjectType() {
        return ${sObjectName}.SObjectType;
    }
    
    /**
     * Define the fields to query by default
     */
    public List<Schema.SObjectField> getSObjectFieldList() {
        return new List<Schema.SObjectField> {
            ${sObjectName}.Id,
            ${sObjectName}.Name
            // Add more fields as needed
        };
    }
    
    /**
     * Query records by Id
     * 
     * @param idSet Set of record Ids to query
     * @return List of ${sObjectName} records
     */
    public List<${sObjectName}> selectById(Set<Id> idSet) {
        return (List<${sObjectName}>) selectSObjectsById(idSet);
    }
    
    /**
     * Example: Query with custom criteria
     * 
     * @param fieldValue Value to filter by
     * @return List of ${sObjectName} records
     */
    // public List<${sObjectName}> selectByCustomCriteria(String fieldValue) {
    //     return (List<${sObjectName}>) Database.query(
    //         newQueryFactory()
    //             .setCondition('SomeField__c = :fieldValue')
    //             .toSOQL()
    //     );
    // }
}`;
}

/**
 * Template for Selector class (legacy - single file)
 */
export function generateSelectorTemplate(className: string, sObjectName: string): string {
    return `/**
 * ${className} - Selector class for ${sObjectName}
 * 
 * Selector layer handles all SOQL queries for a specific SObject.
 * 
 * Responsibilities:
 * - All SOQL queries for ${sObjectName}
 * - Query construction and optimization
 * - Enforce Field Level Security (FLS)
 * - No business logic - queries only
 */
public class ${className} extends fflib_SObjectSelector {
    
    /**
     * Constructor
     */
    public ${className}() {
        super();
    }
    
    /**
     * Constructor with custom sorting
     */
    public ${className}(Boolean includeFieldSetFields, Boolean enforceCRUD, Boolean enforceFLS) {
        super(includeFieldSetFields, enforceCRUD, enforceFLS);
    }
    
    /**
     * Define the SObject this selector queries
     */
    public Schema.SObjectType getSObjectType() {
        return ${sObjectName}.SObjectType;
    }
    
    /**
     * Define the fields to query by default
     */
    public List<Schema.SObjectField> getSObjectFieldList() {
        return new List<Schema.SObjectField> {
            ${sObjectName}.Id,
            ${sObjectName}.Name
            // Add more fields as needed
        };
    }
    
    /**
     * Query records by Id
     * 
     * @param idSet Set of record Ids to query
     * @return List of ${sObjectName} records
     */
    public List<${sObjectName}> selectById(Set<Id> idSet) {
        return (List<${sObjectName}>) selectSObjectsById(idSet);
    }
    
    /**
     * Example: Query with custom criteria
     * 
     * @param fieldValue Value to filter by
     * @return List of ${sObjectName} records
     */
    // public List<${sObjectName}> selectByCustomCriteria(String fieldValue) {
    //     return (List<${sObjectName}>) Database.query(
    //         newQueryFactory()
    //             .setCondition('SomeField__c = :fieldValue')
    //             .toSOQL()
    //     );
    // }
    
    /**
     * Example: Query with relationship fields
     */
    // public List<${sObjectName}> selectByIdWithRelationships(Set<Id> idSet) {
    //     fflib_QueryFactory queryFactory = newQueryFactory();
    //     
    //     // Add relationship fields
    //     // queryFactory.selectField('RelatedObject__r.Name');
    //     
    //     return (List<${sObjectName}>) Database.query(
    //         queryFactory
    //             .setCondition('Id IN :idSet')
    //             .toSOQL()
    //     );
    // }
}`;
}

/**
 * Template for Unit of Work class
 */
export function generateUnitOfWorkTemplate(className: string): string {
    return `/**
 * ${className} - Unit of Work implementation
 * 
 * Unit of Work manages DML operations and transaction control.
 * 
 * Responsibilities:
 * - DML operations (insert, update, delete, undelete)
 * - Transaction management
 * - Maintain relationship integrity
 * - Ensure proper operation order
 * - No business logic - DML only
 * 
 * Note: In most cases, you'll use the UnitOfWork from the Application class.
 * This is a custom implementation for special cases.
 */
public class ${className} extends fflib_SObjectUnitOfWork {
    
    /**
     * Constructor - define the SObject operation order
     */
    public ${className}() {
        super(
            new List<SObjectType> {
                // Define DML operation order here
                // Parent objects should come before child objects
                // Example:
                // Account.SObjectType,
                // Contact.SObjectType,
                // Opportunity.SObjectType,
                // OpportunityLineItem.SObjectType
            }
        );
    }
    
    /**
     * Constructor with custom DML implementation
     */
    public ${className}(fflib_SObjectUnitOfWork.IDML dml) {
        super(
            new List<SObjectType> {
                // Define DML operation order here
            },
            dml
        );
    }
    
    /**
     * Override this method to add custom logic before committing work
     */
    // public override void onCommitWorkStarting() {
    //     // Custom logic before commit
    //     super.onCommitWorkStarting();
    // }
    
    /**
     * Override this method to add custom logic after successful commit
     */
    // public override void onCommitWorkFinishing() {
    //     super.onCommitWorkFinishing();
    //     // Custom logic after commit
    // }
}`;
}

/**
 * Template for Domain interface
 */
export function generateDomainInterfaceTemplate(interfaceName: string, sObjectName: string): string {
    return `/**
 * ${interfaceName} - Domain interface for ${sObjectName}
 * 
 * Domain layer encapsulates single-object business logic and validation.
 * 
 * Responsibilities:
 * - Single SObject business logic
 * - Validation rules
 * - Field defaulting
 * - Record-level calculations
 * - No cross-object operations (use Services for that)
 * - No SOQL queries (use Selectors)
 */
public interface ${interfaceName} {
    /**
     * Get the records in this domain
     * 
     * @return List of ${sObjectName} records
     */
    List<${sObjectName}> getRecords();
    
    /**
     * Define additional domain methods here
     * Example: void validateBusinessRules();
     * Example: void applyDiscounts();
     */
}`;
}

/**
 * Template for Domain base class
 */
export function generateDomainBaseTemplate(interfaceName: string, baseClassName: string, sObjectName: string, applicationClassName?: string): string {
    // Use the provided application class name or fallback to 'Application'
    const appClass = applicationClassName || 'Application';
    
    return `/**
 * ${baseClassName} - Domain base class for ${sObjectName}
 * 
 * Abstract base implementation of ${interfaceName}.
 * Can contain common domain logic.
 */
public abstract class ${baseClassName} extends fflib_SObjectDomain implements ${interfaceName} {
    
    /**
     * @description Domain factory method to get domain implementation
     * @param records List of ${sObjectName} records
     * @return ${interfaceName} implementation
     */
    public static ${interfaceName} newInstance(List<${sObjectName}> records) {
        return (${interfaceName}) ${appClass}.Domain.newInstance(records);
    }
    
    /**
     * @description Domain factory method to get domain implementation
     * @param records List of SObject records
     * @return ${interfaceName} implementation
     */
    public static ${interfaceName} newInstance(List<SObject> records) {
        return (${interfaceName}) ${appClass}.Domain.newInstance(records);
    }
    
    /**
     * @description Domain factory method to get domain implementation
     * @param recordIds Set of record Ids
     * @return ${interfaceName} implementation
     */
    public static ${interfaceName} newInstance(Set<Id> recordIds) {
        return (${interfaceName}) ${appClass}.Domain.newInstance(recordIds);
    }
    
    /**
     * Constructor
     */
    public ${baseClassName}(List<${sObjectName}> records) {
        super(records);
    }
    
    /**
     * Get the records as ${sObjectName} list
     */
    public List<${sObjectName}> getRecords() {
        return (List<${sObjectName}>) Records;
    }
    
    /**
     * Trigger handler - before insert
     */
    public override void onBeforeInsert() {
        // Implement before insert logic
    }
    
    /**
     * Trigger handler - before update
     */
    public override void onBeforeUpdate(Map<Id, SObject> existingRecords) {
        // Implement before update logic
    }
    
    /**
     * Trigger handler - after insert
     */
    public override void onAfterInsert() {
        // Implement after insert logic
    }
    
    /**
     * Trigger handler - after update
     */
    public override void onAfterUpdate(Map<Id, SObject> existingRecords) {
        // Implement after update logic
    }
}`;
}

/**
 * Template for Domain implementation class
 */
export function generateDomainImplTemplate(interfaceName: string, implClassName: string, sObjectName: string): string {
    return `/**
 * ${implClassName} - Domain implementation for ${sObjectName}
 */
public class ${implClassName} extends fflib_SObjectDomain implements ${interfaceName} {
    
    /**
     * Constructor
     */
    public ${implClassName}(List<${sObjectName}> records) {
        super(records);
    }
    
    /**
     * Factory class for creating instances
     */
    public class Constructor implements fflib_SObjectDomain.IConstructable {
        public fflib_SObjectDomain construct(List<SObject> sObjectList) {
            return new ${implClassName}(sObjectList);
        }
    }
    
    /**
     * Get the records as ${sObjectName} list
     */
    public List<${sObjectName}> getRecords() {
        return (List<${sObjectName}>) Records;
    }
    
    /**
     * Trigger handler - before insert
     */
    public override void onBeforeInsert() {
        // Implement before insert logic
        // Example: setDefaults();
    }
    
    /**
     * Trigger handler - before update
     */
    public override void onBeforeUpdate(Map<Id, SObject> existingRecords) {
        // Implement before update logic
        // Example: validateChanges((Map<Id, ${sObjectName}>) existingRecords);
    }
    
    /**
     * Trigger handler - after insert
     */
    public override void onAfterInsert() {
        // Implement after insert logic
    }
    
    /**
     * Trigger handler - after update
     */
    public override void onAfterUpdate(Map<Id, SObject> existingRecords) {
        // Implement after update logic
    }
    
    /**
     * Example: Set default values on records
     */
    // private void setDefaults() {
    //     for (${sObjectName} record : getRecords()) {
    //         // Set defaults
    //     }
    // }
    
    /**
     * Example: Validate changes
     */
    // private void validateChanges(Map<Id, ${sObjectName}> existingRecords) {
    //     for (${sObjectName} record : getRecords()) {
    //         ${sObjectName} oldRecord = existingRecords.get(record.Id);
    //         // Validate changes
    //     }
    // }
}`;
}
