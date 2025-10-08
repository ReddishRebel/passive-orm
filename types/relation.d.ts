import { SubSchemaPropertyType, OwnPropertyType } from './property';

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

type SubSchemaDescriptorPropertyType =
  | OptionalSubSchemaPropertyType<SchemaDescriptor>
  | RequiredSubSchemaPropertyType<SchemaDescriptor>
  | CollectionSubSchemaPropertyType<SchemaDescriptor>;

type SchemaDescriptorPropertyType = OwnPropertyType<any> | SubSchemaDescriptorPropertyType;

interface SchemaDescriptorProperty {
  objectKey: string;
  objectType: SchemaDescriptorPropertyType;
  relationType: SchemaDescriptorPropertyType | null;
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
  TObjectPropertyType,
  TRelationPropertyType
> = Omit<TSchemaDescriptor, 'properties'> & {
  properties: {
    [K in keyof (TSchemaDescriptor['properties'] & {
      [key in TRelationKey]: {
        objectKey: TObjectKey;
        objectType: TObjectPropertyType;
        relationType: TRelationPropertyType extends OwnPropertyType<any> ? TRelationPropertyType : null;
      };
    })]: (TSchemaDescriptor['properties'] & {
      [key in TRelationKey]: {
        objectKey: TObjectKey;
        objectType: TObjectPropertyType;
        relationType: TRelationPropertyType extends OwnPropertyType<any> ? TRelationPropertyType : null;
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
    const TRelationPropertyType extends OwnPropertyType<any>,
    const TObjectPropertyType extends SchemaDescriptorPropertyType
  >(
    relationKey: TRelationKey,
    objectKey: TObjectKey,
    relationType: TRelationPropertyType,
    objectType: TObjectPropertyType
  ): RelationMappingSchema<{
    [K in keyof AddProperty<
      TSchemaDescriptor,
      TRelationKey,
      TObjectKey,
      TObjectPropertyType,
      TRelationPropertyType
    >]: AddProperty<TSchemaDescriptor, TRelationKey, TObjectKey, TObjectPropertyType, TRelationPropertyType>[K];
  }>;

  property<
    const TRelationObjectKey extends string,
    const TRelationPropertyType extends OwnPropertyType<any>,
    const TObjectPropertyType extends SchemaDescriptorPropertyType
  >(
    relationObjectKey: TRelationObjectKey,
    relationType: TRelationPropertyType,
    objectType: TObjectPropertyType
  ): RelationMappingSchema<{
    [K in keyof AddProperty<
      TSchemaDescriptor,
      TRelationObjectKey,
      TRelationObjectKey,
      TObjectPropertyType,
      TRelationPropertyType
    >]: AddProperty<
      TSchemaDescriptor,
      TRelationObjectKey,
      TRelationObjectKey,
      TObjectPropertyType,
      TRelationPropertyType
    >[K];
  }>;

  property<
    const TRelationKey extends string,
    const TObjectKey extends string,
    const TRelationObjectPropertyType extends SchemaDescriptorPropertyType
  >(
    relationKey: TRelationKey,
    objectKey: TObjectKey,
    relationObjectPropertyType: TRelationObjectPropertyType
  ): RelationMappingSchema<{
    [K in keyof AddProperty<
      TSchemaDescriptor,
      TRelationKey,
      TObjectKey,
      TRelationObjectPropertyType,
      TRelationObjectPropertyType
    >]: AddProperty<
      TSchemaDescriptor,
      TRelationKey,
      TObjectKey,
      TRelationObjectPropertyType,
      TRelationObjectPropertyType
    >[K];
  }>;

  property<
    const TRelationObjectKey extends string,
    const TRelationObjectPropertyType extends SchemaDescriptorPropertyType
  >(
    relationObjectKey: TRelationObjectKey,
    relationObjectPropertyType: TRelationObjectPropertyType
  ): RelationMappingSchema<{
    [K in keyof AddProperty<
      TSchemaDescriptor,
      TRelationObjectKey,
      TRelationObjectKey,
      TRelationObjectPropertyType,
      TRelationObjectPropertyType
    >]: AddProperty<
      TSchemaDescriptor,
      TRelationObjectKey,
      TRelationObjectKey,
      TRelationObjectPropertyType,
      TRelationObjectPropertyType
    >[K];
  }>;

  primaryKey<T extends string>(
    primaryKey: T
  ): RelationMappingSchema<{
    [K in keyof (TSchemaDescriptor & { primaryKey: T })]: (TSchemaDescriptor & { primaryKey: T })[K];
  }>;

  relationName<T extends string>(
    relationName: T
  ): RelationMappingSchema<{
    [K in keyof (TSchemaDescriptor & { relationName: T })]: (TSchemaDescriptor & { relationName: T })[K];
  }>;

  transform<T extends (data: ObjectMappingResult<TSchemaDescriptor, null>) => unknown>(
    transform: T
  ): RelationMappingSchema<{
    [K in keyof (TSchemaDescriptor & { transform: T })]: (TSchemaDescriptor & { transform: T })[K];
  }>;

  toRelation(objectData: RelationalObjectInput<TSchemaDescriptor>): RelationalMappingResult<TSchemaDescriptor>;

  toObject(rows: any[]): ObjectMappingResult<TSchemaDescriptor, null>[];
}

type RelationalObjectInput<TSchemaDescriptor extends SchemaDescriptor> = TSchemaDescriptor extends boolean
  ? boolean
  : {
      -readonly [K in keyof FilterProperties<
        TSchemaDescriptor['properties'],
        { objectType: OwnPropertyType<any> }
      > as TSchemaDescriptor['properties'][K]['objectType'] extends OwnPropertyType<any>
        ? TSchemaDescriptor['properties'][K]['objectKey']
        : never]: TSchemaDescriptor['properties'][K]['objectType'] extends OwnPropertyType<infer TPropertyType>
        ? TPropertyType
        : unknown;
    };

type RelationalMappingResult<TSchemaDescriptor extends SchemaDescriptor> = TSchemaDescriptor extends boolean
  ? boolean
  : {
      -readonly [K in keyof FilterProperties<
        TSchemaDescriptor['properties'],
        { relationType: OwnPropertyType<any> }
      >]: TSchemaDescriptor['properties'][K]['relationType'] extends OwnPropertyType<infer TPropertyType>
        ? TPropertyType
        : unknown;
    };

type ObjectMappingResult<TSchemaDescriptor extends SchemaDescriptor, TDefault> = TSchemaDescriptor extends {
  transform: (data: any) => infer R;
}
  ? R
  : {
      -readonly [K in keyof TSchemaDescriptor['properties'] as TSchemaDescriptor['properties'][K]['objectKey']]: TSchemaDescriptor['properties'][K]['objectType'] extends OwnPropertyType<
        infer TPropertyType
      >
        ? TPropertyType
        : TSchemaDescriptor['properties'][K]['objectType'] extends RequiredSubSchemaPropertyType<
              infer TSubSchemaDescriptor extends SchemaDescriptor
            >
          ? ObjectMappingResult<TSubSchemaDescriptor, TDefault>
          : TSchemaDescriptor['properties'][K]['objectType'] extends CollectionSubSchemaPropertyType<
                infer TSubSchemaDescriptor extends SchemaDescriptor
              >
            ? ObjectMappingResult<TSubSchemaDescriptor, TDefault>[]
            : TSchemaDescriptor['properties'][K]['objectType'] extends OptionalSubSchemaPropertyType<
                  infer TSubSchemaDescriptor extends SchemaDescriptor
                >
              ? ObjectMappingResult<TSubSchemaDescriptor, TDefault> | TDefault
              : unknown;
    };

export class RelationMappingSchemaFactory {
  static create(): RelationMappingSchema<{ properties: {} }>;
}
