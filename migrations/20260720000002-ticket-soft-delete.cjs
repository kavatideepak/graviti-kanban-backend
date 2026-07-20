'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn('Tickets', 'deletedAt', {
      type: Sequelize.DATE,
      allowNull: true,
    });
    await queryInterface.addIndex('Tickets', ['deletedAt']);
  },

  async down(queryInterface) {
    await queryInterface.removeColumn('Tickets', 'deletedAt');
  },
};
