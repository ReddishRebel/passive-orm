# Usage Guide

## Introduction

`passive-orm` is a lightweight library for transforming flat SQL query results into nested JavaScript objects. It's particularly useful when working with SQL JOINs where you need to map relational data into object hierarchies.

## Core Concepts

### Schema Definition

Schemas are defined using a fluent API pattern. Each method returns a new immutable instance:

```javascript
import { RelationMappingSchemaFactory, TYPES } from 'passive-orm';

const userSchema = RelationMappingSchemaFactory.create()
  .relationName('users')           // SQL table name
  .primaryKey('user_id')          // Primary key for grouping
  .property('user_id', 'id', TYPES.NUMBER)     // Map user_id → id
  .property('user_name', 'name', TYPES.STRING); // Map user_name → name
```

### Prefix-Based Joining

When working with JOINs, use prefixes to avoid column name conflicts:

```javascript
const userWithRolesSchema = RelationMappingSchemaFactory.create()
  .relationName('users')
  .primaryKey('user_id')
  .property('user_id', 'id', TYPES.NUMBER)
  .property('user_name', 'name', TYPES.STRING)
  .property(
    'roles',
    RelationMappingSchemaFactory.create()
      .relationName('roles')
      .primaryKey('role_id')
      .property('role_id', 'id', TYPES.NUMBER)
      .property('role_name', 'name', TYPES.STRING)
      .collection('roles_')  // Prefix for role columns
  );
```

### SQL Generation

Generate the correct SELECT columns:

```javascript
const columns = userWithRolesSchema.getPrefixedAttributes();
// Returns: [
//   'users.user_id', 
//   'users.user_name', 
//   'roles.role_id as roles_role_id', 
//   'roles.role_name as roles_role_name'
// ]
```

## Common Patterns

### One-to-Many Relationships

```javascript
const userWithPostsSchema = RelationMappingSchemaFactory.create()
  .relationName('users')
  .primaryKey('user_id')
  .property('user_id', 'id', TYPES.NUMBER)
  .property('user_name', 'name', TYPES.STRING)
  .property(
    'posts',
    RelationMappingSchemaFactory.create()
      .relationName('posts')
      .primaryKey('post_id')
      .property('post_id', 'id', TYPES.NUMBER)
      .property('post_title', 'title', TYPES.STRING)
      .property('post_content', 'content', TYPES.STRING)
      .collection('posts_')
  );

// SQL Query
const rows = await knex('users')
  .leftJoin('posts', 'users.user_id', 'posts.user_id')
  .select(userWithPostsSchema.getPrefixedAttributes());

// Mapping
const users = userWithPostsSchema.toObject(rows);
```

### Optional Relationships

Use `.optional()` for relationships that may not exist:

```javascript
const userWithOptionalProfileSchema = RelationMappingSchemaFactory.create()
  .relationName('users')
  .primaryKey('user_id')
  .property('user_id', 'id', TYPES.NUMBER)
  .property('user_name', 'name', TYPES.STRING)
  .property(
    'profile',
    RelationMappingSchemaFactory.create()
      .relationName('profiles')
      .property('profile_bio', 'bio', TYPES.STRING)
      .property('profile_avatar', 'avatar', TYPES.STRING)
      .optional('profile_')  // Will be null if no profile data
  );
```

### Required Relationships

Use `.required()` when the relationship must exist:

```javascript
const orderWithCustomerSchema = RelationMappingSchemaFactory.create()
  .relationName('orders')
  .primaryKey('order_id')
  .property('order_id', 'id', TYPES.NUMBER)
  .property('order_amount', 'amount', TYPES.NUMBER)
  .property(
    'customer',
    RelationMappingSchemaFactory.create()
      .relationName('customers')
      .property('customer_name', 'name', TYPES.STRING)
      .property('customer_email', 'email', TYPES.STRING)
      .required('customer_')  // Throws error if customer data missing
  );
```

### Deep Nesting

Schemas can be nested to any depth:

```javascript
const userWithPostsAndCommentsSchema = RelationMappingSchemaFactory.create()
  .relationName('users')
  .primaryKey('user_id')
  .property('user_id', 'id', TYPES.NUMBER)
  .property('user_name', 'name', TYPES.STRING)
  .property(
    'posts',
    RelationMappingSchemaFactory.create()
      .relationName('posts')
      .primaryKey('post_id')
      .property('post_id', 'id', TYPES.NUMBER)
      .property('post_title', 'title', TYPES.STRING)
      .property(
        'comments',
        RelationMappingSchemaFactory.create()
          .relationName('comments')
          .primaryKey('comment_id')
          .property('comment_id', 'id', TYPES.NUMBER)
          .property('comment_text', 'text', TYPES.STRING)
          .property('comment_author', 'author', TYPES.STRING)
          .collection('post_comments_')
      )
      .collection('posts_')
  );
```

## Type Transformations

### Built-in Types

```javascript
// String conversion
.property('name', TYPES.STRING)

// Number conversion
.property('age', TYPES.NUMBER)

// Boolean conversion (handles 'true'/'false' strings)
.property('is_active', 'isActive', TYPES.BOOLEAN)

// Date object conversion
.property('created_at', 'createdAt', TYPES.DATE)

// ISO string conversion
.property('updated_at', 'updatedAt', TYPES.ISO_DATE_STRING)
```

### Optional Types with Defaults

```javascript
// Default to empty string if null/undefined
.property('bio', TYPES.STRING.optional(''))

// Default to 0 if null/undefined
.property('score', TYPES.NUMBER.optional(0))

// Default to false if null/undefined
.property('verified', TYPES.BOOLEAN.optional(false))
```

### Custom Types

```javascript
import { OwnPropertyType } from 'passive-orm';

// Custom transformation
const upperCaseType = new OwnPropertyType(value => 
  typeof value === 'string' ? value.toUpperCase() : value
);

// JSON parsing
const jsonType = new OwnPropertyType(value => 
  typeof value === 'string' ? JSON.parse(value) : value
);

// Usage
const schema = RelationMappingSchemaFactory.create()
  .property('display_name', 'displayName', upperCaseType)
  .property('metadata', jsonType);
```

### Different Types for Mapping Directions

Sometimes you need different transformations for database → object vs object → database:

```javascript
const schema = RelationMappingSchemaFactory.create()
  .property(
    'created_at',           // Database column
    'createdAt',            // Object property
    TYPES.ISO_DATE_STRING,  // Object → Database (Date → ISO string)
    TYPES.DATE              // Database → Object (ISO string → Date)
  );

// Forward mapping (database → object)
const objects = schema.toObject(rows);
// objects[0].createdAt is a Date object

// Reverse mapping (object → database)
const relationData = schema.toRelation({ createdAt: new Date() });
// relationData.created_at is an ISO string
```

## Data Transformation

### Transform Functions

Apply custom transformations to the final mapped objects:

```javascript
const userSchema = RelationMappingSchemaFactory.create()
  .relationName('users')
  .property('user_id', 'id', TYPES.NUMBER)
  .property('first_name', 'firstName', TYPES.STRING)
  .property('last_name', 'lastName', TYPES.STRING)
  .transform(user => ({
    ...user,
    fullName: `${user.firstName} ${user.lastName}`,
    initials: `${user.firstName[0]}${user.lastName[0]}`
  }));
```

### Collection Transformations

Transform arrays into other formats:

```javascript
const tagSchema = RelationMappingSchemaFactory.create()
  .relationName('tags')
  .primaryKey('tag_name')
  .property('tag_name', 'name', TYPES.STRING)
  .transform(tag => tag.name); // Transform objects to strings

const postSchema = RelationMappingSchemaFactory.create()
  .relationName('posts')
  .property('post_id', 'id', TYPES.NUMBER)
  .property('post_title', 'title', TYPES.STRING)
  .property('tags', tagSchema.collection('tags_'));

// Result: { id: 1, title: 'Post', tags: ['javascript', 'node'] }
// Instead of: { id: 1, title: 'Post', tags: [{ name: 'javascript' }, { name: 'node' }] }
```

## Working with Query Builders

### Knex.js Integration

```javascript
import knex from 'knex';

const db = knex({
  client: 'pg',
  connection: 'postgresql://localhost/mydb'
});

// Build query with schema-generated columns
async function getUsersWithRoles() {
  const columns = userWithRolesSchema.getPrefixedAttributes();
  
  const rows = await db('users')
    .leftJoin('user_roles', 'users.user_id', 'user_roles.user_id')
    .leftJoin('roles', 'roles.role_id', 'user_roles.role_id')
    .select(columns)
    .where('users.is_active', true);
  
  return userWithRolesSchema.toObject(rows);
}
```

### Raw SQL

```javascript
// Generate SELECT clause
const columns = schema.getPrefixedAttributes().join(', ');

const query = `
  SELECT ${columns}
  FROM users u
  LEFT JOIN user_roles ur ON u.user_id = ur.user_id
  LEFT JOIN roles r ON r.role_id = ur.role_id
  WHERE u.is_active = true
`;

const rows = await db.raw(query);
const users = schema.toObject(rows);
```

## Error Handling

### Schema Validation Errors

```javascript
import { MappingError } from 'passive-orm';

try {
  const schema = RelationMappingSchemaFactory.create()
    .property('', 'name', TYPES.STRING); // Invalid: empty property name
} catch (error) {
  if (error instanceof MappingError) {
    console.error('Schema error:', error.message);
  }
}
```

### Mapping Errors

```javascript
try {
  const result = schema.toObject(invalidData);
} catch (error) {
  if (error instanceof MappingError) {
    console.error('Mapping error:', error.message);
    // Handle missing required relationships, invalid data, etc.
  }
}
```

## Performance Considerations

### Efficient Column Selection

Only select the columns you need:

```javascript
// Good: Only select needed columns
const columns = schema.getPrefixedAttributes();
const rows = await knex('users').select(columns);

// Avoid: Selecting all columns with SELECT *
const rows = await knex('users').select('*');
```

### Large Result Sets

For large datasets, consider pagination at the SQL level:

```javascript
async function getUsersPaginated(page, limit) {
  const offset = (page - 1) * limit;
  const columns = schema.getPrefixedAttributes();
  
  const rows = await knex('users')
    .select(columns)
    .limit(limit)
    .offset(offset);
  
  return schema.toObject(rows);
}
```

### Schema Reuse

Create schemas once and reuse them:

```javascript
// Good: Create once, reuse many times
const userSchema = RelationMappingSchemaFactory.create()
  .relationName('users')
  .property('user_id', 'id', TYPES.NUMBER)
  .property('user_name', 'name', TYPES.STRING);

// Reuse in multiple functions
const users1 = userSchema.toObject(rows1);
const users2 = userSchema.toObject(rows2);
```

## TypeScript Support

The library includes full TypeScript definitions:

```typescript
import { RelationMappingSchemaFactory, TYPES } from 'passive-orm';

const schema = RelationMappingSchemaFactory.create()
  .relationName('users')
  .primaryKey('user_id')
  .property('user_id', 'id', TYPES.NUMBER)
  .property('user_name', 'name', TYPES.STRING);

// TypeScript infers the correct return type
const users = schema.toObject(rows); // Type: { id: number; name: string }[]
```
