# Contributing to passive-orm

Thank you for your interest in contributing to passive-orm! This document provides guidelines and information for contributors.

## Development Setup

1. **Clone the repository:**
   ```bash
   git clone https://github.com/ReddishRebel/passive-orm.git
   cd passive-orm
   ```

2. **Use Node.js 24 and install dependencies:**
   ```bash
   nvm use
   npm ci
   ```

3. **Run tests to ensure everything works:**
   ```bash
   npm test
   ```

## Development Workflow

### Code Quality

Before submitting any changes, ensure your code passes all quality checks:

```bash
npm run check
```

This runs:
- **ESLint** - Code linting with import sorting
- **Prettier** - Code formatting
- **TypeScript** - Type checking

### Testing

Run the test suite:
```bash
npm test
```

This includes:
- **Unit tests** - `npm run test:unit`
- **Type tests** - `npm run test:types`

### Individual Commands

- `npm run lint:fix` - Fix linting issues
- `npm run prettier:fix` - Format code
- `npm run types` - Check TypeScript definitions

## Project Structure

```
passive-orm/
├── lib/                    # Source code
│   ├── relation.js         # Core mapping logic
│   ├── property.js         # Type system
│   ├── error.js           # Error classes
│   └── utils.js           # Utilities
├── types/                  # TypeScript definitions
│   ├── relation.d.ts       # Core types
│   ├── property.d.ts       # Property types
│   └── error.d.ts         # Error types
├── tests/                  # Test files
│   ├── example.test.js     # Integration tests
│   ├── relation.test.js    # Unit tests
│   └── types/             # TypeScript tests
├── docs/                   # Documentation
│   ├── api.md             # API reference
│   └── usage.md           # Usage guide
└── index.js               # Main entry point
```

## Coding Guidelines

### Code Style

- **No console.log** - Use proper error handling instead
- **Immutable API** - Always return new instances, never mutate
- **Descriptive naming** - Use clear, self-documenting names
- **Type safety** - Maintain TypeScript compatibility

### Architecture Principles

1. **No SQL generation** - This is a mapping library, not a query builder
2. **Minimal dependencies** - Keep the package lightweight
3. **Functional approach** - Prefer pure functions and immutable data
4. **Error clarity** - Provide helpful error messages

### Adding New Features

When adding features:

1. **Write tests first** - Add tests to `tests/relation.test.js`
2. **Update TypeScript definitions** - Keep `types/*.d.ts` in sync
3. **Add documentation** - Update `docs/api.md` and `docs/usage.md`
4. **Update examples** - Add to `tests/example.test.js` if needed

## Pull Request Process

1. **Fork the repository**
2. **Create a feature branch:**
   ```bash
   git checkout -b feature/your-feature-name
   ```
3. **Make your changes**
4. **Run quality checks:**
   ```bash
   npm run check
   npm test
   ```
5. **Commit with clear messages:**
   ```bash
   git commit -m "Add: description of your changes"
   ```
6. **Push and create a Pull Request**

### Commit Message Format

Use clear, descriptive commit messages:
- `Add: new feature or functionality`
- `Fix: bug fixes`
- `Update: changes to existing features`
- `Docs: documentation changes`
- `Test: test-related changes`

## TypeScript Considerations

This project uses complex TypeScript generics for type inference. When modifying:

1. **Test types** - Run `npm run test:types` to validate
2. **Update definitions** - Keep `.d.ts` files synchronized with `.js` files
3. **Maintain inference** - Ensure schema types are properly inferred

## Testing Guidelines

### Unit Tests

- Test all public methods
- Test error conditions
- Test edge cases (null, undefined, empty arrays)
- Use descriptive test names

### Type Tests

- Use `tsd` for TypeScript definition testing
- Test type inference with `expectType`
- Verify complex generic scenarios

### Example Tests

- Keep examples in `tests/example.test.js` matching README
- Ensure examples work end-to-end

## Documentation

### API Documentation

Update `docs/api.md` for:
- New public methods
- Changed method signatures
- New error conditions

### Usage Documentation

Update `docs/usage.md` for:
- New usage patterns
- Integration examples
- Best practices

## Release Process

(For maintainers)

1. Update version in `package.json`
2. Update `changelog.md`
3. Run full test suite
4. Create git tag
5. Publish to npm

## Getting Help

- **Issues** - Open GitHub issues for bugs or feature requests
- **Discussions** - Use GitHub discussions for questions
- **Email** - Contact maintainers for security issues

## Code of Conduct

- Be respectful and inclusive
- Focus on constructive feedback
- Help maintain a welcoming environment

Thank you for contributing to passive-orm!
