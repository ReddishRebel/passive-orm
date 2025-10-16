import {
  RelationMappingSchema,
  CollectionSubSchemaPropertyType,
  OptionalSubSchemaPropertyType
} from '../../types/relation';
import { RequiredOwnPropertyType, OptionalOwnPropertyType } from '../../types/property';
import { RelationMappingSchemaFactory, TYPES } from '../../index';
import { expectType } from 'tsd';

const schema = RelationMappingSchemaFactory.create()
  .relationName('user')
  .primaryKey('user_id')
  .property('user_id', 'id', TYPES.STRING)
  .property('name', TYPES.STRING.optional())
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
          .transform(tag => tag.name)
          .collection('tag_')
      )
      .collection('post_')
  );

expectType<
  RelationMappingSchema<{
    primaryKey: 'user_id';
    relationName: 'user';
    properties: {
      user_id: { objectKey: 'id'; type: RequiredOwnPropertyType<string, string> };
      name: { objectKey: 'name'; type: OptionalOwnPropertyType<string | undefined, string | undefined> };
      posts: {
        objectKey: 'posts';
        type: CollectionSubSchemaPropertyType<{
          relationName: 'post';
          properties: {
            id: { objectKey: 'id'; type: RequiredOwnPropertyType<string, string> };
            title: { objectKey: 'title'; type: RequiredOwnPropertyType<string, string> };
            comments: {
              objectKey: 'comments';
              type: CollectionSubSchemaPropertyType<{
                relationName: 'comment';
                properties: {
                  id: { objectKey: 'id'; type: RequiredOwnPropertyType<string, string> };
                  text: {
                    objectKey: 'text';
                    type: RequiredOwnPropertyType<string, string>;
                  };
                };
              }>;
            };
            metadata: {
              objectKey: 'metadata';
              type: OptionalSubSchemaPropertyType<{
                relationName: 'meta';
                properties: {
                  id: { objectKey: 'id'; type: RequiredOwnPropertyType<string, string> };
                  archived: {
                    objectKey: 'archived';
                    type: RequiredOwnPropertyType<boolean, boolean>;
                  };
                };
              }>;
            };
            tags: {
              objectKey: 'tags';
              type: CollectionSubSchemaPropertyType<{
                relationName: 'tag';
                primaryKey: 'name';
                transform: (tag: { name: string }) => string;
                properties: {
                  name: {
                    objectKey: 'name';
                    type: RequiredOwnPropertyType<string, string>;
                  };
                };
              }>;
            };
          };
        }>;
      };
    };
  }>
>(schema);

expectType<
  {
    id: string;
    name: string | undefined;
    posts: {
      id: string;
      title: string;
      comments: { id: string; text: string }[];
      metadata: { id: string; archived: boolean } | null;
      tags: string[];
    }[];
  }[]
>(schema.toObject([]));

expectType<
  {
    user_id: string;
  } & Partial<{ name: string | undefined }>
>(schema.toRelation({ id: '', name: '' }));

expectType<[{ id: string } & Partial<{ name: string | undefined }>]>(
  [] as unknown as Parameters<typeof schema.toRelation>
);

// Test String ENUM
const statusEnum = TYPES.ENUM(['active', 'inactive', 'pending'] as const);
expectType<RequiredOwnPropertyType<'active' | 'inactive' | 'pending', 'active' | 'inactive' | 'pending'>>(statusEnum);

// Test Number ENUM
const directEnum = TYPES.ENUM([1, 3, 5] as const);
expectType<RequiredOwnPropertyType<1 | 3 | 5, 1 | 3 | 5>>(directEnum);

// Test enum values in transformation
expectType<'active' | 'inactive' | 'pending'>(statusEnum.fromRelation('active' as 'active' | 'inactive' | 'pending'));
expectType<'active' | 'inactive' | 'pending'>(statusEnum.toRelation('pending' as 'active' | 'inactive' | 'pending'));
