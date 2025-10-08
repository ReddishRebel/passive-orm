# API Reference

## Table of Contents

- [RelationMappingSchemaFactory](#relationmappingschemafactory)
- [RelationMappingSchema](#relationmappingschema)
- [TYPES](#types)
- [OwnPropertyType](#ownpropertytype)
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
1. `property(relationKey, objectKey, relationType, objectType)`
2. `property(relationKey, objectKey, type)`
3. `property(key, relationType, objectType)`
4. `property(key, type)`

**Parameters:**
- `relationKey` (string): Column name in the database
- `objectKey` (string): Property name in the resulting object
- `relationType` (OwnPropertyType): Type for reverse mapping (object → relation)
- `objectType` (OwnPropertyType | SubSchemaPropertyType): Type for forward mapping (relation → object)
- `type` (OwnPropertyType | SubSchemaPropertyType): Used for both directions when types are the same

**Returns:** New `RelationMappingSchema` instance

**Throws:** `MappingError` for invalid parameters

**Examples:**
```javascript
// Simple property mapping
const schema = RelationMappingSchemaFactory.create()
  .property('user_name', 'name', TYPES.STRING);

// Different types for relation vs object
const schema = RelationMappingSchemaFactory.create()
  .property('created_at', 'createdAt', TYPES.ISO_DATE_STRING, TYPES.DATE);

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

Pre-defined property types for common data transformations.

### Available Types

#### `TYPES.STRING`
Converts values to strings using `String()` constructor.

#### `TYPES.NUMBER` 
Converts values to numbers using `Number()` constructor.

#### `TYPES.BOOLEAN`
Converts values to booleans with special string handling:
- `'true'` → `true`
- `'false'` → `false`
- Other values use truthiness conversion

#### `TYPES.DATE`
Converts values to Date objects using `new Date(value)`.

#### `TYPES.ISO_DATE_STRING`
Converts values to ISO date strings:
- Date objects → `.toISOString()`
- Other values → `new Date(value).toISOString()`

### Using Optional Types

All types support the `.optional(defaultValue)` method:

```javascript
// With default value
TYPES.STRING.optional('N/A')

// Without default (returns undefined for null/undefined)
TYPES.NUMBER.optional()
```

---

## OwnPropertyType

Class for creating custom property types with transformation logic.

### Constructor

#### `new OwnPropertyType(typeFactory)`

**Parameters:**
- `typeFactory` (function): Function that transforms raw values

**Example:**
```javascript
const customType = new OwnPropertyType(value => value?.toString().toUpperCase());
```

### Methods

#### `create(data)`

Applies the type transformation to data.

**Parameters:**
- `data` (any): Raw value to transform

**Returns:** Transformed value

#### `optional(defaultValue)`

Creates a new optional version of this type.

**Parameters:**
- `defaultValue` (any): Value to use for null/undefined inputs

**Returns:** New `OwnPropertyType` instance

**Example:**
```javascript
const customType = new OwnPropertyType(value => value.trim());
const optionalCustomType = customType.optional('default');
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