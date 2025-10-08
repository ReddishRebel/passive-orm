const { OwnPropertyType, SubSchemaPropertyType } = require('./property');
const { MappingError } = require('./error');
const { isRecord } = require('./utils');

const kSub = Symbol('kSub');
const kAttrs = Symbol('kAttrs');
const KOwn = Symbol('kOwn');

class RelationSubSchemaPropertyType extends SubSchemaPropertyType {
  #prefix;

  get prefix() {
    return this.#prefix;
  }

  constructor(schemaDescriptor, prefix) {
    super(schemaDescriptor);
    this.#prefix = prefix;
  }
}

class OptionalSubSchemaPropertyType extends RelationSubSchemaPropertyType {
  get kind() {
    return 'optional';
  }
}

class RequiredSubSchemaPropertyType extends RelationSubSchemaPropertyType {
  get kind() {
    return 'required';
  }
}

class CollectionSubSchemaPropertyType extends RelationSubSchemaPropertyType {
  get kind() {
    return 'collection';
  }
}

class RelationMappingSchema {
  #schemaDescriptor = {
    primaryKey: 'id',
    properties: {}
  };

  constructor(schemaDescriptor) {
    if (schemaDescriptor) {
      this.#schemaDescriptor = schemaDescriptor;
      this.#prepareSchemaDescriptor(this.#schemaDescriptor);
    }
  }

  getPrefixedAttributes() {
    return this.#schemaDescriptor[kAttrs];
  }

  /**
   * Expect args to be:
   * (relationKey, objectKey, relationType, objectType),
   * (relationKey, objectKey, type),
   * (key, relationType, objectType),
   * (key, type)
   */
  property(...args) {
    const parsed = this.#parsePropertyDescriptorValues(args);
    this.#validateProperty(parsed.relationKey, parsed.objectKey, parsed.relationType, parsed.objectType);
    return new RelationMappingSchema({
      ...this.#schemaDescriptor,
      properties: {
        ...this.#schemaDescriptor.properties,
        [parsed.relationKey]: {
          objectKey: parsed.objectKey,
          relationType: parsed.relationType,
          objectType: parsed.objectType
        }
      }
    });
  }

  required(prefix) {
    if (typeof prefix !== 'string' || prefix.length === 0) {
      throw new MappingError('Prefix must be a string with non zero length.');
    }
    return new RequiredSubSchemaPropertyType(this.#schemaDescriptor, prefix);
  }

  optional(prefix) {
    if (typeof prefix !== 'string' || prefix.length === 0) {
      throw new MappingError('Prefix must be a string with non zero length.');
    }
    return new OptionalSubSchemaPropertyType(this.#schemaDescriptor, prefix);
  }

  collection(prefix) {
    if (typeof prefix !== 'string' || prefix.length === 0) {
      throw new MappingError('Prefix must be a string with non zero length.');
    }
    return new CollectionSubSchemaPropertyType(this.#schemaDescriptor, prefix);
  }

  primaryKey(primaryKey) {
    if (typeof primaryKey !== 'string' || primaryKey.length === 0) {
      throw new MappingError('primaryKey must be a string with non zero length.');
    }
    return new RelationMappingSchema({ ...this.#schemaDescriptor, primaryKey });
  }

  transform(transform) {
    if (typeof transform !== 'function') {
      throw new MappingError('Transform is not a function.');
    }
    return new RelationMappingSchema({ ...this.#schemaDescriptor, transform });
  }

  relationName(relationName) {
    if (typeof relationName !== 'string' || relationName.length === 0) {
      throw new MappingError('relationName must be a string with non zero length.');
    }
    return new RelationMappingSchema({ ...this.#schemaDescriptor, relationName });
  }

  toObject(rows = []) {
    this.#validateRelationRows(rows);
    return this.#mapRelation(rows, this.#schemaDescriptor);
  }

  toRelation(objectData) {
    if (!isRecord(objectData)) {
      throw new MappingError(`objectData must be a record, got: ${objectData}.`);
    }
    return this.#mapObject(objectData, this.#schemaDescriptor);
  }

  #mapObject(objectData, schemaDescriptor) {
    const result = {};

    for (const ownProperty of schemaDescriptor[KOwn]) {
      if (Object.hasOwn(objectData, ownProperty.objectKey)) {
        result[ownProperty.relationKey] = ownProperty.relationType.create(objectData[ownProperty.objectKey]);
      }
    }

    return result;
  }

  #mapRelation(rows, schemaDescriptor) {
    const joinedRowsMap = this.#joinRows(rows, schemaDescriptor);
    const result = [];

    for (const joinedRows of joinedRowsMap.values()) {
      const mappedOwnedProperties = this.#mapObjectOwnProperties(joinedRows[0], schemaDescriptor);
      const mappedSubSchemas = this.#mapIncluded(joinedRows, schemaDescriptor[kSub]);
      const mappedObject = { ...mappedOwnedProperties, ...mappedSubSchemas };
      result.push(
        typeof schemaDescriptor.transform === 'function' ? schemaDescriptor.transform(mappedObject) : mappedObject
      );
    }

    return result;
  }

  #mapIncluded(rows, subSchemaTypeProperties) {
    const result = {};
    for (const subSchemaPropertyDescriptor of subSchemaTypeProperties) {
      const propertyType = subSchemaPropertyDescriptor.objectType;
      const objectKey = subSchemaPropertyDescriptor.objectKey;
      const subSchemaRows = rows.map(row => this.#pickAndStripPrefix(row, propertyType.prefix));
      const mappedSubSchemaRows = this.#mapRelation(subSchemaRows, propertyType.schemaDescriptor);
      if (propertyType instanceof CollectionSubSchemaPropertyType) {
        result[objectKey] = mappedSubSchemaRows;
      } else if (propertyType instanceof RequiredSubSchemaPropertyType) {
        if (!isRecord(mappedSubSchemaRows[0])) {
          throw new MappingError(`Missing required sub schema data for ${objectKey}.`);
        }
        result[objectKey] = mappedSubSchemaRows[0];
      } else {
        result[objectKey] = mappedSubSchemaRows[0] ?? null;
      }
    }
    return result;
  }

  #pickAndStripPrefix(data, prefix) {
    const result = {};
    for (const propertyName of Object.keys(data)) {
      if (propertyName.startsWith(prefix)) {
        result[propertyName.replace(prefix, '')] = data[propertyName];
      }
    }
    return result;
  }

  #mapObjectOwnProperties(row, schemaDescriptor) {
    const result = {};

    for (const ownProperty of schemaDescriptor[KOwn]) {
      result[ownProperty.objectKey] = ownProperty.objectType.create(row[ownProperty.relationKey]);
    }

    return result;
  }

  #joinRows(rows, schemaDescriptor) {
    const result = new Map();
    for (const row of rows) {
      const uniqueKeyValue = row[schemaDescriptor.primaryKey];
      if (uniqueKeyValue !== null && uniqueKeyValue !== undefined) {
        const entityRows = result.get(uniqueKeyValue);
        if (entityRows) {
          entityRows.push(row);
        } else {
          result.set(uniqueKeyValue, [row]);
        }
      }
    }
    return result;
  }

  #prepareSchemaDescriptor(schemaDescriptor, prefix = '') {
    const prefixedAttributes = [];
    schemaDescriptor[kSub] = [];
    schemaDescriptor[KOwn] = [];

    for (const [relationKey, propertyDescriptor] of Object.entries(schemaDescriptor.properties)) {
      if (
        propertyDescriptor.objectType instanceof RequiredSubSchemaPropertyType ||
        propertyDescriptor.objectType instanceof OptionalSubSchemaPropertyType ||
        propertyDescriptor.objectType instanceof CollectionSubSchemaPropertyType
      ) {
        const subSchemaPrefixedAttributes = this.#prepareSchemaDescriptor(
          propertyDescriptor.objectType.schemaDescriptor,
          prefix + propertyDescriptor.objectType.prefix
        );
        prefixedAttributes.push(...subSchemaPrefixedAttributes);

        schemaDescriptor[kSub].push(propertyDescriptor);
      } else if (propertyDescriptor.objectType instanceof OwnPropertyType) {
        if (typeof schemaDescriptor.relationName === 'string') {
          if (prefix.length === 0) {
            prefixedAttributes.push(`${schemaDescriptor.relationName}.${relationKey}`);
          } else {
            prefixedAttributes.push(`${schemaDescriptor.relationName}.${relationKey} as ${prefix}${relationKey}`);
          }
        }
        schemaDescriptor[KOwn].push({ relationKey, ...propertyDescriptor });
      }
    }

    if (prefix.length === 0) {
      schemaDescriptor[kAttrs] = prefixedAttributes;
    }

    return prefixedAttributes;
  }

  #validateRelationRows(rows) {
    if (!Array.isArray(rows)) {
      throw new MappingError('toObject data must be an array of records');
    }
    for (const row of rows) {
      if (!isRecord(row)) {
        throw new MappingError(`Each row must be an record, got: ${row}.`);
      }
    }
  }

  #parsePropertyDescriptorValues(args) {
    if (args.length >= 4) {
      return { relationKey: args[0], objectKey: args[1], relationType: args[2], objectType: args[3] };
    }

    if (args.length === 2) {
      return {
        relationKey: args[0],
        objectKey: args[0],
        relationType: args[1] instanceof OwnPropertyType ? args[1] : null,
        objectType: args[1]
      };
    }

    if (args.length === 3 && typeof args[1] === 'string') {
      return {
        relationKey: args[0],
        objectKey: args[1],
        relationType: args[2] instanceof OwnPropertyType ? args[2] : null,
        objectType: args[2]
      };
    }

    if (args.length === 3) {
      return { relationKey: args[0], objectKey: args[0], relationType: args[1], objectType: args[2] };
    }

    throw new MappingError(`Invalid arguments passed to property method: ${args}.`);
  }

  #validateProperty(relationKey, objectKey, relationType, objectType) {
    if (typeof relationKey !== 'string' || relationKey.length === 0) {
      throw new MappingError('Property relationName must be a string with non zero length.');
    }

    if (typeof objectKey !== 'string' || objectKey.length === 0) {
      throw new MappingError('Property objectKey must be a string with non zero length.');
    }

    if (relationType !== null && !(relationType instanceof OwnPropertyType)) {
      throw new MappingError('Relation property type must be instance of OwnPropertyType.');
    }

    if (!(objectType instanceof OwnPropertyType) && !(objectType instanceof RelationSubSchemaPropertyType)) {
      throw new MappingError(
        'Object property type must be instance of OwnPropertyType | RequiredSubSchemaPropertyType | OptionalSubSchemaPropertyType | CollectionSubSchemaPropertyType.'
      );
    }

    return { relationKey, objectKey, relationType, objectType };
  }
}

class RelationMappingSchemaFactory {
  static create() {
    return new RelationMappingSchema();
  }
}

module.exports = { RelationMappingSchemaFactory };
