const { MappingError } = require('./error');

const optional = (transformType, defaultValue) => {
  return value => (value === undefined || value === null ? (defaultValue ?? undefined) : transformType(value));
};

class OwnPropertyType {
  #fromRelation;

  #toRelation;

  get fromRelation() {
    return this.#fromRelation;
  }

  get toRelation() {
    return this.#toRelation;
  }

  constructor(fromRelation, toRelation) {
    this.#fromRelation = fromRelation;
    if (typeof toRelation === 'function') {
      this.#toRelation = toRelation;
    } else {
      this.#toRelation = fromRelation;
    }
  }
}
class RequiredOwnPropertyType extends OwnPropertyType {
  kind = 'required';

  optional(objectDefault, relationDefault) {
    return new OptionalOwnPropertyType(
      optional(this.fromRelation, objectDefault),
      optional(this.toRelation, relationDefault)
    );
  }
}

class OptionalOwnPropertyType extends OwnPropertyType {
  kind = 'optional';

  optional(objectDefault, relationDefault) {
    return new OptionalOwnPropertyType(
      optional(this.fromRelation, objectDefault),
      optional(this.toRelation, relationDefault)
    );
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

const createEnumType = values => {
  if (!Array.isArray(values) || values.length === 0) {
    throw new MappingError('Enum values must be a non-empty array');
  }

  const validValues = new Set(values);

  const enumValidator = value => {
    if (!validValues.has(value)) {
      throw new MappingError(`Invalid enum value: ${value}. Expected one of: ${values.join(', ')}`);
    }
    return value;
  };

  return new RequiredOwnPropertyType(enumValidator);
};

const TYPES = {
  STRING: new RequiredOwnPropertyType(String),
  NUMBER: new RequiredOwnPropertyType(Number),
  BOOLEAN: new RequiredOwnPropertyType(value => {
    if (typeof value === 'boolean') {
      return value;
    }

    if (typeof value === 'string') {
      return value === 'true';
    }

    return !!value;
  }, Boolean),
  DATE: new RequiredOwnPropertyType(
    value => new Date(value),
    value => value.toISOString()
  ),
  ENUM: createEnumType
};

module.exports = {
  RequiredOwnPropertyType,
  OwnPropertyType,
  TYPES,
  SubSchemaPropertyType,
  createEnumType
};
