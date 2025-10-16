import { SubSchemaPropertyType, OptionalOwnPropertyType, RequiredOwnPropertyType } from './property';

declare class RelationSubSchemaPropertyType<TSchemaDescriptor> extends SubSchemaPropertyType<TSchemaDescriptor> {
  get prefix(): string;

  constructor(schemaDescriptor: TSchemaDescriptor, prefix: string);
}

declare class OptionalSubSchemaPropertyType<
  TSchemaDescriptor
> extends RelationSubSchemaPropertyType<TSchemaDescriptor> {
  readonly kind = 'optional';
}

declare class RequiredSubSchemaPropertyType<
  TSchemaDescriptor
> extends RelationSubSchemaPropertyType<TSchemaDescriptor> {
  readonly kind = 'required';
}

declare class CollectionSubSchemaPropertyType<
  TSchemaDescriptor
> extends RelationSubSchemaPropertyType<TSchemaDescriptor> {
  readonly kind = 'collection';
}

type OwnPropertyType<ObjectType, RelationType> =
  | RequiredOwnPropertyType<ObjectType, RelationType>
  | OptionalOwnPropertyType<ObjectType, RelationType>;

type SubSchemaDescriptorPropertyType =
  | OptionalSubSchemaPropertyType<SchemaDescriptor>
  | RequiredSubSchemaPropertyType<SchemaDescriptor>
  | CollectionSubSchemaPropertyType<SchemaDescriptor>;

type SchemaDescriptorPropertyType = OwnPropertyType<any, any> | SubSchemaDescriptorPropertyType;

interface SchemaDescriptorProperty {
  objectKey: string;
  type: SchemaDescriptorPropertyType;
}

interface SchemaPropertiesProperties {
  [relationKey: string]: SchemaDescriptorProperty;
}

interface SchemaDescriptor {
  properties: SchemaPropertiesProperties;
  primaryKey?: string;
  transform?: (data: any) => any;
  relationName?: string;
}

type AddProperty<
  TSchemaDescriptor extends SchemaDescriptor,
  TRelationKey extends string,
  TObjectKey extends string,
  TType extends SchemaDescriptorPropertyType
> = Omit<TSchemaDescriptor, 'properties'> & {
  properties: {
    [K in keyof (TSchemaDescriptor['properties'] & {
      [key in TRelationKey]: {
        objectKey: TObjectKey;
        type: TType;
      };
    })]: (TSchemaDescriptor['properties'] & {
      [key in TRelationKey]: {
        objectKey: TObjectKey;
        type: TType;
      };
    })[K];
  };
};

type FilterProperties<T, U> = {
  [K in keyof T as T[K] extends U ? K : never]: T[K];
};

declare class RelationMappingSchema<TSchemaDescriptor extends SchemaDescriptor> {
  optional(prefix: string): OptionalSubSchemaPropertyType<TSchemaDescriptor>;

  required(prefix: string): RequiredSubSchemaPropertyType<TSchemaDescriptor>;

  collection(prefix: string): CollectionSubSchemaPropertyType<TSchemaDescriptor>;

  getPrefixedAttributes(): string[];

  property<
    const TRelationKey extends string,
    const TObjectKey extends string,
    const TType extends SchemaDescriptorPropertyType
  >(
    relationKey: TRelationKey,
    objectKey: TObjectKey,
    type: TType
  ): RelationMappingSchema<{
    [K in keyof AddProperty<TSchemaDescriptor, TRelationKey, TObjectKey, TType>]: AddProperty<
      TSchemaDescriptor,
      TRelationKey,
      TObjectKey,
      TType
    >[K];
  }>;

  property<const TRelationObjectKey extends string, const TType extends SchemaDescriptorPropertyType>(
    relationObjectKey: TRelationObjectKey,
    type: TType
  ): RelationMappingSchema<{
    [K in keyof AddProperty<TSchemaDescriptor, TRelationObjectKey, TRelationObjectKey, TType>]: AddProperty<
      TSchemaDescriptor,
      TRelationObjectKey,
      TRelationObjectKey,
      TType
    >[K];
  }>;

  primaryKey<T extends string>(
    primaryKey: T
  ): RelationMappingSchema<{
    [K in keyof (Omit<TSchemaDescriptor, 'primaryKey'> & { primaryKey: T })]: (Omit<TSchemaDescriptor, 'primaryKey'> & {
      primaryKey: T;
    })[K];
  }>;

  relationName<T extends string>(
    relationName: T
  ): RelationMappingSchema<{
    [K in keyof (Omit<TSchemaDescriptor, 'relationName'> & { relationName: T })]: (Omit<
      TSchemaDescriptor,
      'relationName'
    > & {
      relationName: T;
    })[K];
  }>;

  transform<T extends (data: ObjectMappingResult<TSchemaDescriptor, null>) => unknown>(
    transform: T
  ): RelationMappingSchema<{
    [K in keyof (Omit<TSchemaDescriptor, 'transform'> & { transform: T })]: (Omit<TSchemaDescriptor, 'transform'> & {
      transform: T;
    })[K];
  }>;

  toRelation(objectData: RelationalObjectInput<TSchemaDescriptor>): RelationalMappingResult<TSchemaDescriptor>;

  toObject(rows: any[]): ObjectMappingResult<TSchemaDescriptor, null>[];
}

type RelationalObjectInput<TSchemaDescriptor extends SchemaDescriptor> = TSchemaDescriptor extends boolean
  ? boolean
  : {
      -readonly [K in keyof FilterProperties<
        TSchemaDescriptor['properties'],
        { type: RequiredOwnPropertyType<any, any> }
      > as TSchemaDescriptor['properties'][K]['type'] extends RequiredOwnPropertyType<any, any>
        ? TSchemaDescriptor['properties'][K]['objectKey']
        : never]: TSchemaDescriptor['properties'][K]['type'] extends RequiredOwnPropertyType<any, infer TObjectType>
        ? TObjectType
        : unknown;
    } & Partial<{
      -readonly [K in keyof FilterProperties<
        TSchemaDescriptor['properties'],
        { type: OptionalOwnPropertyType<any, any> }
      > as TSchemaDescriptor['properties'][K]['type'] extends OptionalOwnPropertyType<any, any>
        ? TSchemaDescriptor['properties'][K]['objectKey']
        : never]: TSchemaDescriptor['properties'][K]['type'] extends OptionalOwnPropertyType<any, infer TObjectType>
        ? TObjectType
        : unknown;
    }>;

type RelationalMappingResult<TSchemaDescriptor extends SchemaDescriptor> = TSchemaDescriptor extends boolean
  ? boolean
  : {
      -readonly [K in keyof FilterProperties<
        TSchemaDescriptor['properties'],
        { type: RequiredOwnPropertyType<any, any> }
      >]: TSchemaDescriptor['properties'][K]['type'] extends RequiredOwnPropertyType<infer TRelationType, any>
        ? TRelationType
        : unknown;
    } & Partial<{
      -readonly [K in keyof FilterProperties<
        TSchemaDescriptor['properties'],
        { type: OptionalOwnPropertyType<any, any> }
      >]: TSchemaDescriptor['properties'][K]['type'] extends OptionalOwnPropertyType<infer TRelationType, any>
        ? TRelationType
        : unknown;
    }>;

type ObjectMappingResult<TSchemaDescriptor extends SchemaDescriptor, TDefault> = TSchemaDescriptor extends {
  transform: (data: any) => infer R;
}
  ? R
  : {
      -readonly [K in keyof TSchemaDescriptor['properties'] as TSchemaDescriptor['properties'][K]['objectKey']]: TSchemaDescriptor['properties'][K]['type'] extends OwnPropertyType<
        any,
        infer TObjectType
      >
        ? TObjectType
        : TSchemaDescriptor['properties'][K]['type'] extends RequiredSubSchemaPropertyType<
              infer TSubSchemaDescriptor extends SchemaDescriptor
            >
          ? ObjectMappingResult<TSubSchemaDescriptor, TDefault>
          : TSchemaDescriptor['properties'][K]['type'] extends CollectionSubSchemaPropertyType<
                infer TSubSchemaDescriptor extends SchemaDescriptor
              >
            ? ObjectMappingResult<TSubSchemaDescriptor, TDefault>[]
            : TSchemaDescriptor['properties'][K]['type'] extends OptionalSubSchemaPropertyType<
                  infer TSubSchemaDescriptor extends SchemaDescriptor
                >
              ? ObjectMappingResult<TSubSchemaDescriptor, TDefault> | TDefault
              : unknown;
    };

export class RelationMappingSchemaFactory {
  static create(): RelationMappingSchema<{ properties: {} }>;
}
