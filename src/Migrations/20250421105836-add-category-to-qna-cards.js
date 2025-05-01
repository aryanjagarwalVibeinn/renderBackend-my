'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn('qna_cards', 'category', {
      type: Sequelize.STRING,
      allowNull: true,
      defaultValue: 'General', 
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.removeColumn('qna_cards', 'category');
  },
};
