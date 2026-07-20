// sequelize-cli config (CommonJS). App code uses src/config/database.js (ESM).
require('dotenv').config();

const common = {
  use_env_variable: 'DATABASE_URL',
  dialect: 'postgres',
  logging: false,
};

module.exports = {
  development: common,
  test: common,
  production: common,
};
