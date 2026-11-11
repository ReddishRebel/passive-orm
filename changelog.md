# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

## [1.0.3] - 2026-11-11

### Fixed

- Preserve explicit `null` defaults in optional property types in both mapping directions, including repeated `.optional()` calls.

### Changed

- Use Node.js 24 for development and CI, with matching Node.js type definitions. The package's minimum supported Node.js version remains unchanged.
- Update GitHub Actions to `actions/checkout@v7.0.1` and `actions/setup-node@v7.1.0`.
- Include `changelog.md` in the published package using its correct filename.

## [1.0.0] - 2025-10-08

### Added

#### Core Functionality
- **RelationMappingSchemaFactory** - Factory class for creating mapping schemas
- **RelationMappingSchema** - Core schema class with fluent immutable API
- **Schema Definition Methods**:
  - `.relationName(name)` - Set table name for SQL generation
  - `.primaryKey(key)` - Set primary key for row grouping (defaults to 'id')
  - `.property(...)` - Define property mappings with multiple overloads
  - `.transform(fn)` - Apply custom transformations to mapped objects

#### Relationship Mapping
- **Sub-schema Property Types**:
  - `.required(prefix)` - Required nested relationships (throws error if missing)
  - `.optional(prefix)` - Optional nested relationships (returns null if missing)
  - `.collection(prefix)` - Array/collection relationships
- **Prefix-based Join Support** - Handle SQL JOIN column conflicts with prefixes
- **Deep Nesting** - Support for arbitrarily nested schemas

#### Type System
- **Built-in Types** (`TYPES` object):
  - `TYPES.STRING` - String conversion
  - `TYPES.NUMBER` - Number conversion  
  - `TYPES.BOOLEAN` - Boolean conversion with string handling
  - `TYPES.DATE` - Date object conversion
  - `TYPES.ISO_DATE_STRING` - ISO date string conversion
- **Optional Type Support** - `.optional(defaultValue)` for null-safe defaults
- **Custom Types** - `OwnPropertyType` class for custom transformations
- **Bidirectional Mapping** - Different types for object→relation vs relation→object

#### Mapping Operations
- **`.getPrefixedAttributes()`** - Generate SQL SELECT columns with proper aliases
- **`.toObject(rows)`** - Transform flat SQL rows to nested objects
- **`.toRelation(objectData)`** - Reverse mapping from objects to flat structure
- **Row Grouping** - Automatic grouping by primary key for JOIN results
- **Null Handling** - Proper handling of null/undefined values and missing data

#### Developer Experience
- **TypeScript Support** - Full type definitions with complex generic inference
- **Immutable API** - Each method returns new instance, no mutation
- **Error Handling** - `MappingError` class for validation and mapping errors
- **Zero Dependencies** - No external runtime dependencies

#### Validation & Error Handling
- **Schema Validation** - Validate property names, types, and configuration
- **Runtime Validation** - Validate input data structure and required relationships
- **Descriptive Errors** - Clear error messages for debugging

#### Development Tools
- **ESLint Configuration** - Code quality rules with import sorting
- **Prettier Integration** - Consistent code formatting
- **TypeScript Checking** - Type validation with tsd
- **Testing Framework** - Node.js built-in test runner
- **Quality Scripts** - Automated linting, formatting, and type checking

### Technical Implementation

#### Architecture
- **Symbol-based Encapsulation** - Internal properties using symbols (`kSub`, `kAttrs`, `KOwn`)
- **Functional Programming** - Immutable data structures and pure functions
- **Type Safety** - Complex TypeScript generics for compile-time validation
- **Performance Optimized** - Efficient row grouping and property mapping

#### Testing
- **Unit Tests** - Comprehensive test coverage for all functionality
- **Integration Tests** - Tests matching README examples
- **Type Tests** - TypeScript definition testing with tsd
- **Error Testing** - Validation of error conditions and edge cases

#### API Design
- **Fluent Interface** - Chainable method calls for schema building
- **Method Overloading** - Multiple signatures for property definition
- **Consistent Naming** - Clear, descriptive method and property names
- **Extensibility** - Plugin-friendly architecture for custom types

[unreleased]: https://github.com/ReddishRebel/passive-orm/compare/v1.0.3...HEAD
[1.0.3]: https://github.com/ReddishRebel/passive-orm/compare/v1.0.2...v1.0.3
[1.0.0]: https://github.com/ReddishRebel/passive-orm/releases/tag/v1.0.0
