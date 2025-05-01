"use strict";
// src//Config/Database.config.ts
Object.defineProperty(exports, "__esModule", { value: true });
exports.sequelize = void 0;
const tslib_1 = require("tslib");
// new db connection
const sequelize_typescript_1 = require("sequelize-typescript");
const dotenv_1 = (0, tslib_1.__importDefault)(require("dotenv"));
const User_model_1 = (0, tslib_1.__importDefault)(require("../Models/User.model"));
const Post_model_1 = (0, tslib_1.__importDefault)(require("@/Models/Post.model"));
const Story_model_1 = (0, tslib_1.__importDefault)(require("../Models/Story.model"));
const KanbanCard_model_1 = (0, tslib_1.__importDefault)(require("@/Models/KanbanCard.model"));
const KanbanImage_model_1 = (0, tslib_1.__importDefault)(require("@/Models/KanbanImage.model"));
dotenv_1.default.config();
exports.sequelize = new sequelize_typescript_1.Sequelize({
    database: process.env.DB_NAME,
    dialect: 'postgres',
    username: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    host: process.env.DB_HOST,
    port: Number(process.env.DB_PORT) || 5432,
    models: [User_model_1.default, Post_model_1.default, Story_model_1.default, KanbanCard_model_1.default, KanbanImage_model_1.default],
    logging: false,
    dialectOptions: {
        ssl: {
            require: true,
            rejectUnauthorized: false // ✅ Bypass self-signed certificate issues
        }
    },
    pool: {
        max: 5,
        min: 0,
        acquire: 30000,
        idle: 10000, // ✅ Max idle time (ms) before releasing a connection
    },
});
(async () => {
    try {
        await exports.sequelize.authenticate();
        console.log('✅ Database connection successful');
        // await sequelize.sync({ alter: true });
        // await sequelize.sync();
        console.log('✅ Database synchronized');
    }
    catch (error) {
        console.error('❌ Database connection failed:', error);
    }
})();
//# sourceMappingURL=Database.config.js.map