const isRecord = data => {
  return typeof data === 'object' && data !== null && !Array.isArray(data);
};

module.exports = { isRecord };
