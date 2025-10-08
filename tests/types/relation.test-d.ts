import {
  RelationMappingSchema,
  CollectionSubSchemaPropertyType,
  OptionalSubSchemaPropertyType
} from '../../types/relation';
import { OwnPropertyType } from '../../types/property';
import { RelationMappingSchemaFactory, TYPES } from '../../index';
import { expectType } from 'tsd';

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
      user_id: { objectKey: 'id'; objectType: OwnPropertyType<string>; relationType: OwnPropertyType<string> };
      name: { objectKey: 'name'; objectType: OwnPropertyType<string>; relationType: OwnPropertyType<string> };
      posts: {
        objectKey: 'posts';
        relationType: null;
        objectType: CollectionSubSchemaPropertyType<{
          relationName: 'post';
          properties: {
            id: { objectKey: 'id'; objectType: OwnPropertyType<string>; relationType: OwnPropertyType<string> };
            title: { objectKey: 'title'; objectType: OwnPropertyType<string>; relationType: OwnPropertyType<string> };
            comments: {
              objectKey: 'comments';
              relationType: null;
              objectType: CollectionSubSchemaPropertyType<{
                relationName: 'comment';
                properties: {
                  id: { objectKey: 'id'; objectType: OwnPropertyType<string>; relationType: OwnPropertyType<string> };
                  text: {
                    objectKey: 'text';
                    objectType: OwnPropertyType<string>;
                    relationType: OwnPropertyType<string>;
                  };
                };
              }>;
            };
            metadata: {
              objectKey: 'metadata';
              relationType: null;
              objectType: OptionalSubSchemaPropertyType<{
                relationName: 'meta';
                properties: {
                  id: { objectKey: 'id'; objectType: OwnPropertyType<string>; relationType: OwnPropertyType<string> };
                  archived: {
                    objectKey: 'archived';
                    objectType: OwnPropertyType<boolean>;
                    relationType: OwnPropertyType<boolean>;
                  };
                };
              }>;
            };
            tags: {
              objectKey: 'tags';
              relationType: null;
              objectType: CollectionSubSchemaPropertyType<{
                relationName: 'tag';
                primaryKey: 'name';
                transform: (tag: { name: string }) => string;
                properties: {
                  name: {
                    objectKey: 'name';
                    objectType: OwnPropertyType<string>;
                    relationType: OwnPropertyType<string>;
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
    name: string;
    posts: {
      id: string;
      title: string;
      comments: { id: string; text: string }[];
      metadata: { id: string; archived: boolean } | null;
      tags: string[];
    }[];
  }[]
>(schema.toObject([]));

expectType<{
  user_id: string;
  name: string;
}>(schema.toRelation({ id: '', name: '' }));

expectType<[{ id: string; name: string }]>([] as unknown as Parameters<typeof schema.toRelation>);
