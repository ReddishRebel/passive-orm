const optional = (transformType, defaultValue) => {
  return value => (value === undefined || value === null ? (defaultValue ?? undefined) : transformType(value));
};

class OwnPropertyType {
  #typeFactory;

  constructor(typeFactory) {
    this.#typeFactory = typeFactory;
  }

  create(data) {
    return this.#typeFactory(data);
  }

  optional(defaultValue) {
    return new OwnPropertyType(optional(this.#typeFactory, defaultValue));
  }
}

class SubSchemaPropertyType {
  #schemaDescriptor;

  get schemaDescriptor() {
    return this.#schemaDescriptor;
  }

  constructor(schemaDescriptor) {
    this.#schemaDescriptor = schemaDescriptor;
  }
}

const TYPES = {
  STRING: new OwnPropertyType(String),
  NUMBER: new OwnPropertyType(Number),
  BOOLEAN: new OwnPropertyType(value => {
    if (typeof value === 'boolean') {
      return value;
    }

    if (typeof value === 'string') {
      return value === 'true';
    }

    return !!value;
  }),
  DATE: new OwnPropertyType(value => new Date(value)),
  ISO_DATE_STRING: new OwnPropertyType(value => {
    if (value instanceof Date) {
      return value.toISOString();
    }

    return new Date(value).toISOString();
  })
};

module.exports = {
  OwnPropertyType,
  TYPES,
  SubSchemaPropertyType
};
