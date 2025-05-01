// migrations/XXXXXXXXXXXXXX-add-isBanned-to-users.ts
module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.addColumn("users", "is_banned", {
      type: Sequelize.BOOLEAN,
      defaultValue: false,
    });
  },

  down: async (queryInterface) => {
    await queryInterface.removeColumn("users", "is_banned");
  },
};
