//Config/database.js

require("dotenv").config();

module.exports = {
  development: {
    username: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    host: process.env.DB_HOST,
    port: process.env.DB_PORT || 6543,
    dialect: "postgres",
    dialectOptions: {
      ssl: {
        require: true,
        rejectUnauthorized: false, // Allow SSL connections
      },
    },
    migrationStorage: "sequelize",
    migrationStorageTableName: "sequelize_meta",
    seederStorage: "sequelize",
    seederStorageTableName: "sequelize_seed",
    logging: console.log, // Enable logging to debug queries
  }
};
 
  