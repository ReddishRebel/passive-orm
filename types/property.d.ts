export class OwnPropertyType<PropertyType> {
  constructor(typeFactory: (data: any) => PropertyType);

  create(data: any): PropertyType;

  optional<DefaultType>(defaultValue: DefaultType): OwnPropertyType<PropertyType | DefaultType>;
}

export class SubSchemaPropertyType<SchemaDescriptor> {
  get schemaDescriptor(): SchemaDescriptor;

  constructor(schemaDescriptor: SchemaDescriptor);
}

export const TYPES: {
  STRING: OwnPropertyType<string>;
  NUMBER: OwnPropertyType<number>;
  BOOLEAN: OwnPropertyType<boolean>;
  DATE: OwnPropertyType<Date>;
  ISO_DATE_STRING: OwnPropertyType<string>;
};
