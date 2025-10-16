# passive-orm

Lightweight object-relational mapper for mapping flat and joined SQL results into nested JavaScript objects.

[![npm version](https://badge.fury.io/js/passive-orm.svg)](https://badge.fury.io/js/passive-orm)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

## Motivation

Traditional ORMs often become bulky, abstract away SQL too much, and limit flexibility when using raw queries or query builders like Knex.js. Developers frequently end up writing boilerplate code to transform flat query results into nested objects:

```js
const rows = await knex('users')
  .leftJoin('profiles', 'users.id', 'profiles.user_id')
  .select('users.id as user_id', 'users.name as user_name', 'profiles.id as profile_id', 'profiles.bio as profile_bio');

// ...write mapping logic here
```

With `passive-orm`, you define a mapping schema once and reuse it for data transformation.

## ✅ Purpose

This library enables:

- Defining **nested schemas** with `targetKey`, `prefix`, and `relationName`
- Auto-generating flat select attributes and mapping results into nested objects
- Minimal overhead — no query generation, only mapping

## 🚫 Not an ORM

This is _not_:

- A full-blown ORM (no schema migrations, no SQL abstraction layer)
- Designed for managing joins automatically — you write your own SQL
- A comprehensive data mapping tool that supports any possible combination of data formats.

## 🧰 Installation

```bash
npm install passive-orm
```

## 🔧 Basic Usage

```js
import { RelationMappingSchemaFactory, TYPES } from 'passive-orm';

// Define main schema
const userSchema = RelationMappingSchemaFactory.create()
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
      .collection('roles_')
  );

// Build SQL using your own query builder
const rows = await knex('users')
  .leftJoin('user_roles', 'users.user_id', 'user_roles.user_id')
  .leftJoin('roles', 'roles.role_id', 'user_roles.role_id')
  .select(userSchema.getPrefixedAttributes());

// Map resulting rows:
const users = userSchema.toObject(rows);
/*
[
  {
    id: 1,
    name: 'Alice',
    roles: [
      { id: 10, name: 'admin' },
      { id: 20, name: 'editor' }
    ]
  },
  ...
]
*/
```

## � Documentation

- **[API Reference](./docs/api.md)** - Complete API documentation
- **[Usage Guide](./docs/usage.md)** - Detailed examples and patterns

## 🧭 When to use

- You want full control over SQL but hate writing mapping logic.
- Your dataset includes joins and nested structures.
- You don't want the overhead of a full ORM, but need typed, consistent mapping.

## � Features

- **Zero dependencies** - Lightweight with no external dependencies
- **TypeScript support** - Full type safety and inference
- **Immutable API** - Fluent, functional-style schema building
- **Flexible mapping** - Support for optional, required, and collection relationships
- **Custom transformations** - Transform data during mapping
- **Query builder agnostic** - Works with any SQL query builder or raw SQL

## 📦 What's Included

- `RelationMappingSchemaFactory` - Create mapping schemas
- `TYPES` - Built-in type converters (STRING, NUMBER, BOOLEAN, DATE, etc.)
- `RequiredOwnPropertyType` - Create custom type transformations
- `MappingError` - Error handling for schema and mapping issues

## 📣 Contributing

Contributions are welcome! Please feel free to submit a Pull Request. For major changes, please open an issue first to discuss what you would like to change.

## 📄 License

MIT © [ReddishRebel](https://github.com/ReddishRebel)
