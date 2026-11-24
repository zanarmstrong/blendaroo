// Older tests' way to reach the shared server: resolves to { base: <this folder over http, with a trailing slash>, close }.
const { HTTP, ROOT } = require('./qa_helpers');
module.exports = async () => ({ base: HTTP + ROOT + '/', close: () => {} });
