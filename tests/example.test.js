const { test, describe } = require('node:test');
const assert = require('node:assert');
const { RelationMappingSchemaFactory, TYPES } = require('../index');

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
});
