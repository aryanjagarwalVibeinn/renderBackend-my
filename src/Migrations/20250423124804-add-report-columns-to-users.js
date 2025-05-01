"use strict";

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.addColumn("users", "reportedUsers", {
      type: Sequelize.ARRAY(Sequelize.JSON),
      defaultValue: [],
    });

    await queryInterface.addColumn("users", "reportsReceived", {
      type: Sequelize.JSONB,
      allowNull: false,
      defaultValue: [],
    });
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.removeColumn("users", "reportedUsers");
    await queryInterface.removeColumn("users", "reportsReceived");
  },
};
