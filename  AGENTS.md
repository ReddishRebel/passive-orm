# passive-orm AI Coding Instructions

## Architecture Overview

**Core Purpose**: Transform flat SQL result rows into nested JavaScript objects using schema-based mapping. This is NOT a full ORM - no SQL generation, migrations, or database abstraction.

### Key Components

- **RelationMappingSchema** (`lib/relation.js`): Core mapping engine with immutable fluent API
- **Property Types** (`lib/property.js`): Type system with `TYPES` constants and transformation logic
- **Schema Factory** (`lib/relation.js`): Entry point via `RelationMappingSchemaFactory.create()`

### Data Flow Pattern

1. Define schema with `.property()`, `.required()`, `.optional()`, `.collection()`
2. Generate SQL column aliases with `.getPrefixedAttributes()`
3. Transform flat rows to nested objects with `.toObject(rows)`
4. Optionally apply custom transforms via `.transform(fn)`

## Critical Development Patterns

### Schema Definition Convention

```javascript
// Always use fluent API pattern - each method returns new immutable instance
const schema = RelationMappingSchemaFactory.create()
  .relationName('users') // Table name for SQL prefixing
  .primaryKey('user_id') // For row grouping during mapping
  .property('user_id', 'id', TYPES.NUMBER) // (dbColumn, objectKey, type)
  .property(
    'profile',
    subSchema.required('profile_') // Prefix for sub-schema columns
  );
```

### Prefix-Based Join Mapping

- **Required pattern**: Use consistent prefixes for joined tables (`roles_`, `profile_`)
- **SQL aliases**: Schema auto-generates `table.column as prefix_column` format
- **Nested mapping**: Strips prefixes during transformation to avoid conflicts

### Type System Usage

- Use `TYPES` constants: `STRING`, `NUMBER`, `BOOLEAN`, `DATE`, `ISO_DATE_STRING`
- Optional values: `TYPES.STRING.optional('default')` for null-safe defaults
- Custom types: Create `OwnPropertyType` with transform function

## Testing Patterns

### Unit Test Structure (`tests/`)

- **example.test.js**: Integration tests matching README examples
- **relation.test.js**: Core mapping logic tests
- **types/relation.test-d.ts**: TypeScript type checking with `tsd`

### Test Data Convention

```javascript
// Flat SQL-like results with prefixed columns
const sampleData = [{ user_id: 1, user_name: 'Alice', roles_role_id: 10, roles_role_name: 'admin' }];
```

## Development Workflow

### Scripts (package.json)

- `npm run test:unit` - Node.js built-in test runner (no external deps)
- `npm run test:types` - TypeScript type checking with tsd
- `npm run lint:fix` - ESLint with custom import sorting rules
- `npm run prettier:fix` - Code formatting
- `npm run check` - Run all quality checks

### Code Style Requirements

- **No console.log**: Enforced by ESLint (`no-console: error`)
- **Import sorting**: Auto-sorted imports/requires via `eslint-plugin-sort-imports-requires`
- **Prettier**: 120 char width, single quotes, no trailing commas

### TypeScript Integration

- Separate `.d.ts` files in `types/` directory mirror `lib/` structure
- Complex generic types for schema inference and type safety
- Use `tsd` for testing TypeScript definitions

## Error Handling Patterns

### MappingError Usage

- Throw `MappingError` for schema validation failures
- Include descriptive messages about what went wrong
- Common cases: missing required fields, invalid prefixes, type mismatches

### Validation Strategy

- Validate inputs at schema construction time, not during mapping
- Use immutable pattern - validation errors prevent new instance creation
- Symbol-based internal properties (`kSub`, `kAttrs`, `KOwn`) for encapsulation

## Key Files for Modification

- `lib/relation.js` - Core mapping logic and schema builder
- `lib/property.js` - Type definitions and transformations
- `index.js` - Public API exports
- `types/*.d.ts` - TypeScript definitions (keep in sync with JS)
- `tests/example.test.js` - Update when changing public API
