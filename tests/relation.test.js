const { MappingError, RelationMappingSchemaFactory, TYPES } = require('../index');
const { describe, test } = require('node:test');
const assert = require('node:assert');

describe('RelationMappingSchema mapping tests.', () => {
  test('RelationMappingSchemaToRelation_UseSourceType_SourcePropertyTypeDefferFromTargetType', () => {
    const schema = RelationMappingSchemaFactory.create()
      .property('some_id', 'id', TYPES.NUMBER)
      .property('some_date', 'someDate', TYPES.DATE);

    const testDate = new Date();
    const data = { id: '100', someDate: testDate };

    assert.deepStrictEqual(schema.toRelation(data), { some_id: 100, some_date: testDate.toISOString() });
  });

  test('RelationMappingSchemaToRelation_ReturnPartialResult_PartialDataPassed', () => {
    const schema = RelationMappingSchemaFactory.create()
      .property('some_id', 'id', TYPES.STRING)
      .property('some_key_first', 'someKeyFirst', TYPES.NUMBER)
      .property('some_key_second', 'someKeySecond', TYPES.BOOLEAN)
      .property('test', RelationMappingSchemaFactory.create().property('id', TYPES.STRING).optional('test_'));

    const data = { id: '100', someKeySecond: false };

    assert.deepStrictEqual(schema.toRelation(data), { some_id: '100', some_key_second: false });
  });

  test('RelationMappingSchemaToRelation_ReturnCorrectResult', () => {
    const schema = RelationMappingSchemaFactory.create()
      .property('some_id', 'id', TYPES.STRING)
      .property('some_key', 'someKey', TYPES.NUMBER)
      .property('test', RelationMappingSchemaFactory.create().property('id', TYPES.STRING).optional('test_'));

    const data = { id: '100', someKey: 100 };

    assert.deepStrictEqual(schema.toRelation(data), { some_id: '100', some_key: 100 });
  });

  test('RelationMappingSchemaToRelation_ThrowMappingError_TargetDataIsNotARecord', () => {
    const schema = RelationMappingSchemaFactory.create()
      .property('id', TYPES.STRING)
      .property('test', RelationMappingSchemaFactory.create().property('id', TYPES.STRING).optional('test_'));

    assert.throws(() => schema.toRelation(), MappingError);
    assert.throws(() => schema.toRelation('string'), MappingError);
    assert.throws(() => schema.toRelation(null), MappingError);
  });

  test('RelationMappingSchemaToObject_ReturnCorrectResult_ComplexDataSchema', () => {
    const schema = RelationMappingSchemaFactory.create()
      .relationName('user')
      .primaryKey('user_id')
      .property('user_id', 'id', TYPES.STRING)
      .property('name', TYPES.STRING)
      .property(
        'posts',
        RelationMappingSchemaFactory.create()
          .relationName('post')
          .property('id', 'id', TYPES.STRING)
          .property('title', TYPES.STRING)
          .property(
            'comments',
            RelationMappingSchemaFactory.create()
              .relationName('comment')
              .property('id', TYPES.STRING)
              .property('text', TYPES.STRING)
              .collection('comment_')
          )
          .property(
            'metadata',
            RelationMappingSchemaFactory.create()
              .relationName('meta')
              .property('id', TYPES.STRING)
              .property('archived', TYPES.BOOLEAN)
              .optional('meta_')
          )
          .property(
            'tags',
            RelationMappingSchemaFactory.create()
              .relationName('tag')
              .primaryKey('name')
              .property('name', TYPES.STRING)
              .collection('tag_')
          )
          .collection('post_')
      );

    const rows = [
      {
        user_id: '1',
        name: 'Alice',
        post_id: '101',
        post_title: 'Hello World',
        post_comment_id: '201',
        post_comment_text: 'Nice post!',
        post_meta_id: '101',
        post_meta_archived: false,
        post_tag_name: 'intro'
      },
      {
        user_id: '1',
        name: 'Alice',
        post_id: '101',
        post_title: 'Hello World',
        post_comment_id: '202',
        post_comment_text: 'Thanks for sharing!',
        post_meta_id: '101',
        post_meta_archived: false,
        post_tag_name: 'welcome'
      },
      {
        user_id: '1',
        name: 'Alice',
        post_id: '102',
        post_title: 'Another Post',
        post_comment_id: '203',
        post_comment_text: 'Interesting...',
        post_meta_id: null,
        post_meta_archived: null,
        post_tag_name: 'thoughts'
      },
      {
        user_id: '2',
        name: 'Bob',
        post_id: '103',
        post_title: "Bob's post",
        post_comment_id: '204',
        post_comment_text: 'Cool!',
        post_meta_id: '103',
        post_meta_archived: true,
        post_tag_name: 'bobtag'
      }
    ];

    const expected = [
      {
        id: '1',
        name: 'Alice',
        posts: [
          {
            id: '101',
            title: 'Hello World',
            comments: [
              { id: '201', text: 'Nice post!' },
              { id: '202', text: 'Thanks for sharing!' }
            ],
            metadata: { id: '101', archived: false },
            tags: [{ name: 'intro' }, { name: 'welcome' }]
          },
          {
            id: '102',
            title: 'Another Post',
            comments: [{ id: '203', text: 'Interesting...' }],
            metadata: null,
            tags: [{ name: 'thoughts' }]
          }
        ]
      },
      {
        id: '2',
        name: 'Bob',
        posts: [
          {
            id: '103',
            title: "Bob's post",
            comments: [{ id: '204', text: 'Cool!' }],
            metadata: { id: '103', archived: true },
            tags: [{ name: 'bobtag' }]
          }
        ]
      }
    ];

    assert.deepStrictEqual(schema.toObject(rows), expected);

    const expectedAttributes = [
      'user.user_id',
      'user.name',
      'post.id as post_id',
      'post.title as post_title',
      'comment.id as post_comment_id',
      'comment.text as post_comment_text',
      'meta.id as post_meta_id',
      'meta.archived as post_meta_archived',
      'tag.name as post_tag_name'
    ].sort();

    assert.deepStrictEqual(schema.getPrefixedAttributes().sort(), expectedAttributes);
  });
  test('RelationMappingSchemaToObject_SetNull_NoOptionalSubEntityInData', () => {
    const schema = RelationMappingSchemaFactory.create()
      .property('id', TYPES.STRING)
      .property('test', RelationMappingSchemaFactory.create().property('id', TYPES.STRING).optional('test_'));

    const data = [{ id: '1' }, { id: '2' }];

    assert.deepStrictEqual(schema.toObject(data), [
      { id: '1', test: null },
      { id: '2', test: null }
    ]);
  });

  test('RelationMappingSchemaToObject_ThrowMappingError_NoRequiredSubEntityInData', () => {
    const schema = RelationMappingSchemaFactory.create()
      .property('id', TYPES.STRING)
      .property('test', RelationMappingSchemaFactory.create().property('id', TYPES.STRING).required('test_'));

    const data = [{ id: '1' }, { id: '2' }];

    assert.throws(() => schema.toObject(data), MappingError);
  });

  test('RelationMappingSchemaToObject_SkipRows_NoPrimaryKeyInsideRowRecord', () => {
    const schema = RelationMappingSchemaFactory.create()
      .property('id', TYPES.STRING)
      .property('test', RelationMappingSchemaFactory.create().property('id', TYPES.STRING).collection('test_'));

    const rows = [
      { test_id: '1' },
      { id: undefined, test_id: '2' },
      { id: '1', test_id: '3' },
      { id: null, test_id: '4' }
    ];

    assert.deepStrictEqual(schema.toObject(rows), [{ id: '1', test: [{ id: '3' }] }]);
  });

  test('RelationMappingSchemaToObject_ThrowError_DataIsNotAnArrayOfRecords', () => {
    const schema = RelationMappingSchemaFactory.create()
      .property('id', TYPES.STRING)
      .property('test', RelationMappingSchemaFactory.create().property('id', TYPES.STRING).collection('test_'));

    assert.throws(() => schema.toObject(null), MappingError);
    assert.throws(() => schema.toObject([null]), MappingError);
  });

  test('RelationMappingSchemaToObject_UseIdAsDefaultPrimaryKey_NoPrimaryKeyAdded', () => {
    const schema = RelationMappingSchemaFactory.create()
      .property('id', TYPES.STRING)
      .property('test', RelationMappingSchemaFactory.create().property('id', TYPES.STRING).collection('test_'));

    const data = [
      { id: '1', test_id: '1' },
      { id: '1', test_id: '2' },
      { id: '2', test_id: '3' }
    ];

    const result = schema.toObject(data);

    assert.deepStrictEqual(
      [
        { id: '1', test: [{ id: '1' }, { id: '2' }] },
        { id: '2', test: [{ id: '3' }] }
      ],
      result
    );
  });

  test('RelationMappingSchemaToObject_TransformResult_TransformFunctionAdded', () => {
    const schema = RelationMappingSchemaFactory.create()
      .property('id', TYPES.STRING)
      .property(
        'test',
        RelationMappingSchemaFactory.create()
          .property('id', TYPES.STRING)
          .transform(data => data.id)
          .collection('test_')
      );

    const data = [
      { id: '1', test_id: '1' },
      { id: '1', test_id: '2' },
      { id: '2', test_id: '3' }
    ];

    const result = schema.toObject(data);

    assert.deepStrictEqual(
      [
        { id: '1', test: ['1', '2'] },
        { id: '2', test: ['3'] }
      ],
      result
    );
  });

  test('RelationMappingSchemaToRelation_GetPropertiesFromGetters_ObjectOwnPropertiesExposedAsGetters', () => {
    const schema = RelationMappingSchemaFactory.create()
      .property('some_id', 'id', TYPES.STRING)
      .property('some_key_first', 'someKeyFirst', TYPES.NUMBER);

    class SomeData {
      get id() {
        return 'test-1';
      }

      get someKeyFirst() {
        return '123';
      }
    }

    assert.deepStrictEqual(schema.toRelation(new SomeData()), { some_id: 'test-1', some_key_first: 123 });
  });
});

describe('RelationMappingSchema building tests.', () => {
  test('RelationMappingSchemaGetPrefixedAttributes_ReturnEmptyAttributesList_NoRelationNameSet', () => {
    const schema = RelationMappingSchemaFactory.create()
      .property('test', 'test', TYPES.NUMBER)
      .property(
        'test',
        RelationMappingSchemaFactory.create().property('sub_test', 'subTest', TYPES.STRING).required('sub_')
      );

    assert.equal(schema.getPrefixedAttributes().length, 0);
  });

  test('RelationMappingSchemaGetPrefixedAttributes_ReturnAttributesList_RelationNameSet', () => {
    const schema = RelationMappingSchemaFactory.create()
      .relationName('test')
      .property('test', 'test', TYPES.NUMBER)
      .property(
        'subTest',
        RelationMappingSchemaFactory.create()
          .relationName('sub_test')
          .property('sub_test', 'subTest', TYPES.STRING)
          .required('sub_')
      );

    assert.deepStrictEqual(
      schema.getPrefixedAttributes().sort(),
      ['test.test', 'sub_test.sub_test as sub_sub_test'].sort()
    );
  });

  test('RelationMappingSchemaGetPrefixedAttributes_ReturnPartialAttributesList_RelationNameNotSetInSubSchema', () => {
    const schema = RelationMappingSchemaFactory.create()
      .relationName('test')
      .property('test', 'test', TYPES.NUMBER)
      .property(
        'subTest',
        RelationMappingSchemaFactory.create().property('sub_test', 'subTest', TYPES.STRING).required('sub_')
      );

    assert.deepStrictEqual(schema.getPrefixedAttributes(), ['test.test']);
  });

  test('RelationMappingSchemaProperty_ThrowMappingError_ComplexSourceType', () => {
    const subSchema = RelationMappingSchemaFactory.create().required('_prefix');
    assert.throws(
      () => RelationMappingSchemaFactory.create().property('sourceKey', 'targetKey', subSchema, TYPES.DATE),
      MappingError
    );
  });
  test('RelationMappingSchemaProperty_ThrowMappingError_InvalidSourceType', () => {
    assert.throws(
      () => RelationMappingSchemaFactory.create().property('sourceKey', 'targetKey', String, TYPES.DATE),
      MappingError
    );
  });
  test('RelationMappingSchemaProperty_ThrowMappingError_InvalidSourceKey', () => {
    assert.throws(
      () => RelationMappingSchemaFactory.create().property(undefined, 'targetKey', TYPES.DATE),
      MappingError
    );
  });
  test('RelationMappingSchemaProperty_ThrowMappingError_InvalidTargetKey', () => {
    assert.throws(
      () => RelationMappingSchemaFactory.create().property('source', undefined, TYPES.STRING),
      MappingError
    );
  });
  test('RelationMappingSchemaProperty_ThrowMappingError_InvalidPropertyType', () => {
    assert.throws(() => RelationMappingSchemaFactory.create().property('source', 'target', String), MappingError);
  });

  test('RelationMappingSchemaPrimaryKey_ThrowMappingError_InvalidPrimaryKeyPassed', () => {
    assert.throws(() => RelationMappingSchemaFactory.create().primaryKey(), MappingError);
    assert.throws(() => RelationMappingSchemaFactory.create().primaryKey(''), MappingError);
  });

  test('RelationMappingSchemaTransform_ThrowMappingError_InvalidTransformPassed', () => {
    assert.throws(() => RelationMappingSchemaFactory.create().transform(), MappingError);
    assert.throws(() => RelationMappingSchemaFactory.create().transform(true), MappingError);
  });

  test('RelationMappingSchemaRelationName_ThrowMappingError_InvalidRelationNamePassed', () => {
    assert.throws(() => RelationMappingSchemaFactory.create().relationName(), MappingError);
    assert.throws(() => RelationMappingSchemaFactory.create().relationName(''), MappingError);
  });
});

test('Preserves null defaults through schema mapping', () => {
  const schema = RelationMappingSchemaFactory.create()
    .property('id', TYPES.STRING)
    .property('display_name', 'displayName', TYPES.STRING.optional(null, null));

  for (const value of [null, undefined]) {
    assert.deepStrictEqual(schema.toObject([{ id: '1', display_name: value }]), [{ id: '1', displayName: null }]);
    assert.deepStrictEqual(schema.toRelation({ id: '1', displayName: value }), {
      id: '1',
      display_name: null
    });
  }
});

describe('ENUM type tests', () => {
  test('TYPES.ENUM_FactoryFunction_CreatesEnumType', () => {
    const statusEnum = TYPES.ENUM(['active', 'inactive', 'pending']);
    const schema = RelationMappingSchemaFactory.create()
      .property('id', TYPES.STRING)
      .property('status', 'status', statusEnum);

    const result = schema.toObject([{ id: '1', status: 'active' }]);
    assert.deepStrictEqual(result, [{ id: '1', status: 'active' }]);
  });

  test('TYPES.ENUM_InvalidValue_ThrowsError', () => {
    const statusEnum = TYPES.ENUM(['active', 'inactive']);
    const schema = RelationMappingSchemaFactory.create()
      .property('id', TYPES.STRING)
      .property('status', 'status', statusEnum);

    assert.throws(() => {
      schema.toObject([{ id: '1', status: 'invalid' }]);
    }, /Invalid enum value: invalid. Expected one of: active, inactive/);
  });

  test('TYPES.ENUM_OptionalType_ReturnsOptionalEnum', () => {
    const statusEnum = TYPES.ENUM(['active', 'inactive']).optional('active');
    const schema = RelationMappingSchemaFactory.create()
      .property('id', TYPES.STRING)
      .property('status', 'status', statusEnum);

    const result = schema.toObject([{ id: '1', status: null }]);
    assert.deepStrictEqual(result, [{ id: '1', status: 'active' }]);
  });

  test('TYPES.ENUM_EmptyArray_ThrowsError', () => {
    assert.throws(() => TYPES.ENUM([]), /Enum values must be a non-empty array/);
  });

  test('TYPES.ENUM_NonArray_ThrowsError', () => {
    assert.throws(() => TYPES.ENUM('not-array'), /Enum values must be a non-empty array/);
  });

  test('TYPES.ENUM_MixedTypes_WorksCorrectly', () => {
    const mixedEnum = TYPES.ENUM(['string', 42, true]);
    const schema = RelationMappingSchemaFactory.create()
      .property('id', TYPES.STRING)
      .property('value', 'value', mixedEnum);

    const result1 = schema.toObject([{ id: '1', value: 'string' }]);
    const result2 = schema.toObject([{ id: '2', value: 42 }]);
    const result3 = schema.toObject([{ id: '3', value: true }]);

    assert.deepStrictEqual(result1, [{ id: '1', value: 'string' }]);
    assert.deepStrictEqual(result2, [{ id: '2', value: 42 }]);
    assert.deepStrictEqual(result3, [{ id: '3', value: true }]);
  });
});
