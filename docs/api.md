# API Reference

## Table of Contents

- [RelationMappingSchemaFactory](#relationmappingschemafactory)
- [RelationMappingSchema](#relationmappingschema)
- [TYPES](#types)
- [RequiredOwnPropertyType](#requiredownpropertytype)
- [OptionalOwnPropertyType](#optionalownpropertytype)
- [MappingError](#mappingerror)

## RelationMappingSchemaFactory

Factory class for creating new `RelationMappingSchema` instances.

### Static Methods

#### `create()`

Creates a new empty relation mapping schema.

**Returns:** `RelationMappingSchema<{ properties: {} }>`

**Example:**
```javascript
const schema = RelationMappingSchemaFactory.create();
```

---

## RelationMappingSchema

Main class for defining and executing mapping schemas. Uses an immutable fluent API pattern where each method returns a new instance.

### Core Methods

#### `relationName(name)`

Sets the table/relation name used for generating SQL aliases.

**Parameters:**
- `name` (string): The table name (required, non-empty)

**Returns:** New `RelationMappingSchema` instance

**Throws:** `MappingError` if name is not a non-empty string

**Example:**
```javascript
const schema = RelationMappingSchemaFactory.create()
  .relationName('users');
```

#### `primaryKey(key)`

Sets the primary key field used for grouping rows during mapping.

**Parameters:**
- `key` (string): The primary key column name (required, non-empty)

**Returns:** New `RelationMappingSchema` instance

**Default:** `'id'` if not specified

**Throws:** `MappingError` if key is not a non-empty string

**Example:**
```javascript
const schema = RelationMappingSchemaFactory.create()
  .primaryKey('user_id');
```

#### `property(...args)`

Defines a property mapping with multiple overload signatures:

**Signatures:**
1. `property(relationKey, objectKey, type)`
2. `property(key, type)`

**Parameters:**
- `relationKey` (string): Column name in the database
- `objectKey` (string): Property name in the resulting object
- `type` (RequiredOwnPropertyType | OptionalOwnPropertyType | SubSchemaPropertyType): Property type.

**Returns:** New `RelationMappingSchema` instance

**Throws:** `MappingError` for invalid parameters

**Examples:**
```javascript
// Simple property mapping
const schema = RelationMappingSchemaFactory.create()
  .property('user_name', 'name', TYPES.STRING);

// Using optional types
const schema = RelationMappingSchemaFactory.create()
  .property('display_name', 'displayName', TYPES.STRING.optional('Anonymous'));

// Nested schema
const schema = RelationMappingSchemaFactory.create()
  .property('profile', subSchema.required('profile_'));
```

#### `transform(fn)`

Applies a transformation function to mapped objects.

**Parameters:**
- `fn` (function): Transformation function that receives the mapped object and returns the transformed result

**Returns:** New `RelationMappingSchema` instance

**Throws:** `MappingError` if fn is not a function

**Example:**
```javascript
const schema = RelationMappingSchemaFactory.create()
  .property('name', TYPES.STRING)
  .transform(data => ({ ...data, displayName: data.name.toUpperCase() }));
```

### Sub-Schema Methods

#### `required(prefix)`

Creates a required sub-schema property type.

**Parameters:**
- `prefix` (string): Column prefix for the sub-schema (required, non-empty)

**Returns:** `RequiredSubSchemaPropertyType`

**Behavior:** Throws `MappingError` during mapping if no data exists for this sub-schema

**Throws:** `MappingError` if prefix is not a non-empty string

**Example:**
```javascript
const userSchema = RelationMappingSchemaFactory.create()
  .property('profile', profileSchema.required('profile_'));
```

#### `optional(prefix)`

Creates an optional sub-schema property type.

**Parameters:**
- `prefix` (string): Column prefix for the sub-schema (required, non-empty)

**Returns:** `OptionalSubSchemaPropertyType`

**Behavior:** Returns `null` if no data exists for this sub-schema

**Throws:** `MappingError` if prefix is not a non-empty string

**Example:**
```javascript
const userSchema = RelationMappingSchemaFactory.create()
  .property('metadata', metaSchema.optional('meta_'));
```

#### `collection(prefix)`

Creates a collection (array) sub-schema property type.

**Parameters:**
- `prefix` (string): Column prefix for the sub-schema (required, non-empty)

**Returns:** `CollectionSubSchemaPropertyType`

**Behavior:** Returns an array of mapped objects, empty array if no data

**Throws:** `MappingError` if prefix is not a non-empty string

**Example:**
```javascript
const userSchema = RelationMappingSchemaFactory.create()
  .property('roles', roleSchema.collection('roles_'));
```

### Mapping Methods

#### `getPrefixedAttributes()`

Generates an array of SQL column selections with appropriate aliases.

**Returns:** `string[]` - Array of SQL column expressions

**Behavior:** 
- Returns empty array if no `relationName` is set on the schema
- Generates `table.column` format for own properties
- Generates `table.column as prefix_column` format for sub-schema properties

**Example:**
```javascript
const schema = RelationMappingSchemaFactory.create()
  .relationName('users')
  .property('user_id', 'id', TYPES.NUMBER)
  .property('roles', roleSchema.collection('roles_'));

const columns = schema.getPrefixedAttributes();
// Returns: ['users.user_id', 'roles.role_id as roles_role_id', 'roles.role_name as roles_role_name']

// Use with query builder
const rows = await knex('users')
  .leftJoin('user_roles', 'users.id', 'user_roles.user_id')
  .leftJoin('roles', 'roles.id', 'user_roles.role_id')
  .select(columns);
```

#### `toObject(rows)`

Transforms flat SQL result rows into nested JavaScript objects.

**Parameters:**
- `rows` (Array): Array of flat row objects from SQL query results

**Returns:** Array of mapped objects according to the schema

**Throws:** 
- `MappingError` if rows is not an array
- `MappingError` if any row is not an object
- `MappingError` if required sub-schema data is missing

**Behavior:**
- Groups rows by primary key
- Maps own properties using defined types
- Recursively maps sub-schemas with prefix stripping
- Applies transform function if defined
- Filters out rows with null/undefined primary keys

**Example:**
```javascript
const rows = [
  { user_id: 1, user_name: 'Alice', roles_role_id: 10, roles_role_name: 'admin' },
  { user_id: 1, user_name: 'Alice', roles_role_id: 20, roles_role_name: 'editor' }
];

const result = schema.toObject(rows);
// Returns: [{ id: 1, name: 'Alice', roles: [{ id: 10, name: 'admin' }, { id: 20, name: 'editor' }] }]
```

#### `toRelation(objectData)`

Reverse mapping: transforms a JavaScript object back to flat relational format.

**Parameters:**
- `objectData` (object): JavaScript object to transform

**Returns:** Flat object with database column names

**Throws:** `MappingError` if objectData is not an object

**Behavior:**
- Maps only own properties (not sub-schemas)
- Uses relation types for transformation
- Skips properties not present in input object

**Example:**
```javascript
const objectData = { id: 1, name: 'Alice', createdAt: new Date() };
const relationData = schema.toRelation(objectData);
// Returns: { user_id: 1, user_name: 'Alice', created_at: '2023-01-01T12:00:00.000Z' }
```

---

## TYPES

Pre-defined property types for common data transformations. All TYPES are instances of `RequiredOwnPropertyType`.

### Available Types

#### `TYPES.STRING`
Converts values to strings using `String()` constructor.
**Type:** `RequiredOwnPropertyType<string, string>`

#### `TYPES.NUMBER` 
Converts values to numbers using `Number()` constructor.
**Type:** `RequiredOwnPropertyType<number, number>`

#### `TYPES.BOOLEAN`
Converts values to booleans with special string handling:
- `'true'` → `true`
- `'false'` → `false`
- Other values use truthiness conversion
**Type:** `RequiredOwnPropertyType<boolean, boolean>`

#### `TYPES.DATE`
Converts values to Date objects using `new Date(value)` for database-to-object transformation, and to ISO strings using `.toISOString()` for object-to-database transformation.
**Type:** `RequiredOwnPropertyType<string, Date>`

#### `TYPES.ENUM(values)`
Factory function that creates an enum type which validates that values match one of the provided array elements. Uses a Set internally for efficient validation.
**Type:** `(values: T[]) => RequiredOwnPropertyType<T[number], T[number]>`

**Parameters:**
- `values` (array): Array of allowed values (required, non-empty)

**Throws:** `Error` if values is not a non-empty array

**Example:**
```javascript
// Create status enum
const statusEnum = TYPES.ENUM(['active', 'inactive', 'pending']);

// Use in schema
const schema = RelationMappingSchemaFactory.create()
  .property('id', TYPES.STRING)
  .property('status', 'status', statusEnum);

// Valid transformation
schema.toObject([{ id: '1', status: 'active' }]);
// Result: [{ id: '1', status: 'active' }]

// Invalid value throws error
schema.toObject([{ id: '1', status: 'invalid' }]);
// Throws: Invalid enum value: invalid. Expected one of: active, inactive, pending

// Works with optional
const optionalStatusEnum = statusEnum.optional('active');
schema.toObject([{ id: '1', status: null }]);
// Result: [{ id: '1', status: 'active' }]

// Supports any type of values
const versionEnum = TYPES.ENUM([1, 2, 3]);
const mixedEnum = TYPES.ENUM(['string', 42, true]);
```

### Using Optional Types

All types support the `.optional(defaultValue)` method which returns an `OptionalOwnPropertyType`:

```javascript
// With default value
TYPES.STRING.optional('N/A')

// Without default (returns undefined for null/undefined)
TYPES.NUMBER.optional()
```
---

## RequiredOwnPropertyType

Class for creating custom property types with transformation logic. Represents required properties that must have values.

### Constructor

#### `new RequiredOwnPropertyType(fromRelation)`
#### `new RequiredOwnPropertyType(fromRelation, toRelation)`

**Parameters:**
- `fromRelation` (function): Function that transforms database values to object values
- `toRelation` (function, optional): Function that transforms object values back to database values. If not provided, `fromRelation` is used for both directions

**Example:**
```javascript
import { RequiredOwnPropertyType } from 'passive-orm';

const upperCaseType = new RequiredOwnPropertyType(
  value => value?.toString().toUpperCase()
);

// With bidirectional transformation
const customDateType = new RequiredOwnPropertyType(
  value => new Date(value),        // DB -> Object
  value => value.toISOString()     // Object -> DB
);
```

### Properties

#### `kind`
Always `'required'` for `RequiredOwnPropertyType` instances.

#### `fromRelation(data)`
Transforms database value to object value.

#### `toRelation(data)`
Transforms object value back to database value.

### Methods

#### `optional(objectDefault, relationDefault)`

Creates an optional version of this type.

**Parameters:**
- `objectDefault` (any, optional): Default value for object transformation when input is null/undefined
- `relationDefault` (any, optional): Default value for relation transformation when input is null/undefined

**Returns:** `OptionalOwnPropertyType` instance

**Example:**
```javascript
const requiredType = new RequiredOwnPropertyType(value => value.trim());
const optionalType = requiredType.optional('default value');
```

---

## OptionalOwnPropertyType

Class representing optional property types that can handle null/undefined values gracefully.

### Constructor

Typically created via the `.optional()` method on `RequiredOwnPropertyType` rather than directly instantiated.

### Properties

#### `kind`
Always `'optional'` for `OptionalOwnPropertyType` instances.

#### `fromRelation(data)`
Transforms database value to object value, returning the default value for null/undefined inputs.

#### `toRelation(data)`
Transforms object value back to database value, returning the default value for null/undefined inputs.

### Methods

#### `optional(objectDefault, relationDefault)`

Creates a new optional version with updated defaults.

**Parameters:**
- `objectDefault` (any, optional): New default value for object transformation
- `relationDefault` (any, optional): New default value for relation transformation

**Returns:** New `OptionalOwnPropertyType` instance

**Example:**
```javascript
// Chain optional calls to update defaults
const optionalWithDefaults = TYPES.STRING
  .optional('initial default')
  .optional('updated default');
```

---

## MappingError

Custom error class for schema and mapping validation errors.

### Usage

Thrown by various schema methods when validation fails:

```javascript
try {
  const schema = RelationMappingSchemaFactory.create()
    .property('', 'name', TYPES.STRING); // Empty relationKey
} catch (error) {
  if (error instanceof MappingError) {
    console.log('Schema validation failed:', error.message);
  }
}
```

### Common Error Scenarios

- Empty or invalid property names
- Invalid type objects
- Missing required sub-schema data during mapping
- Invalid input data formats
- Empty prefixes for sub-schemas
