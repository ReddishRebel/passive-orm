const { OwnPropertyType, TYPES } = require('./lib/property');
const { MappingError } = require('./lib/error');
const { RelationMappingSchemaFactory } = require('./lib/relation');

module.exports = { TYPES, RelationMappingSchemaFactory, MappingError, OwnPropertyType };
