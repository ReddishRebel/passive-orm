const { RelationMappingSchemaFactory, TYPES } = require('../index');
const { describe, test } = require('node:test');
const assert = require('node:assert');

describe('Readme examples tests.', () => {
  test('RelationMappingSchema_CorrectlyMapBasicUsageExample', () => {
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

    const sampleData = [
      { user_id: 1, user_name: 'Alice', roles_role_id: 10, roles_role_name: 'admin' },
      { user_id: 1, user_name: 'Alice', roles_role_id: 20, roles_role_name: 'editor' }
    ];

    const result = userSchema.toObject(sampleData);

    assert.deepStrictEqual(
      userSchema.getPrefixedAttributes().sort(),
      [
        'users.user_id',
        'users.user_name',
        'roles.role_id as roles_role_id',
        'roles.role_name as roles_role_name'
      ].sort()
    );

    assert.deepStrictEqual(result, [
      {
        id: 1,
        name: 'Alice',
        roles: [
          { id: 10, name: 'admin' },
          { id: 20, name: 'editor' }
        ]
      }
    ]);
  });

  test('RelationMappingSchema_CorrectlyMapEnumUsageExample', () => {
    const statusEnum = TYPES.ENUM(['active', 'inactive', 'pending']);
    const priorityEnum = TYPES.ENUM([1, 2, 3, 4, 5]);

    const userSchema = RelationMappingSchemaFactory.create()
      .property('id', TYPES.STRING)
      .property('name', TYPES.STRING)
      .property('status', statusEnum)
      .property('priority', priorityEnum.optional(3));

    const sampleData = [
      { id: '1', name: 'Alice', status: 'active', priority: 5 },
      { id: '2', name: 'Bob', status: 'inactive', priority: null }
    ];

    const result = userSchema.toObject(sampleData);

    assert.deepStrictEqual(result, [
      { id: '1', name: 'Alice', status: 'active', priority: 5 },
      { id: '2', name: 'Bob', status: 'inactive', priority: 3 }
    ]);

    // Test validation
    assert.throws(() => {
      userSchema.toObject([{ id: '1', name: 'Alice', status: 'invalid', priority: 1 }]);
    }, /Invalid enum value: invalid. Expected one of: active, inactive, pending/);
  });
});
