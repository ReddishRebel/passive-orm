export class OwnPropertyType<RelationType, ObjectType> {
  constructor(fromRelation: (data: RelationType) => ObjectType);
  constructor(fromRelation: (data: RelationType) => ObjectType, toRelation: (data: ObjectType) => RelationType);

  fromRelation(data: RelationType): ObjectType;

  toRelation(data: ObjectType): RelationType;
}

export class RequiredOwnPropertyType<RelationType, ObjectType> extends OwnPropertyType<RelationType, ObjectType> {
  kind: 'required';

  optional<ObjectDefault = undefined, RelationDefault = undefined>(
    objectDefault?: ObjectDefault,
    relationDefault?: RelationDefault
  ): OptionalOwnPropertyType<RelationType | RelationDefault, ObjectType | ObjectDefault>;
}

export class OptionalOwnPropertyType<RelationType, ObjectType> extends OwnPropertyType<RelationType, ObjectType> {
  kind: 'optional';

  optional<ObjectDefault = undefined, RelationDefault = undefined>(
    objectDefault?: ObjectDefault,
    relationDefault?: RelationDefault
  ): OptionalOwnPropertyType<RelationType | RelationDefault, ObjectType | ObjectDefault>;
}

export class SubSchemaPropertyType<SchemaDescriptor> {
  get schemaDescriptor(): SchemaDescriptor;

  constructor(schemaDescriptor: SchemaDescriptor);
}

export function createEnumType<T extends readonly unknown[]>(values: T): RequiredOwnPropertyType<T[number], T[number]>;

export const TYPES: {
  STRING: RequiredOwnPropertyType<string, string>;
  NUMBER: RequiredOwnPropertyType<number, number>;
  BOOLEAN: RequiredOwnPropertyType<boolean, boolean>;
  DATE: RequiredOwnPropertyType<string, Date>;
  ENUM: typeof createEnumType;
};
