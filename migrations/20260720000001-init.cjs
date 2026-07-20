'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    const { INTEGER, STRING, TEXT, FLOAT, DATE, JSONB } = Sequelize;
    const ts = {
      createdAt: { type: DATE, allowNull: false, defaultValue: Sequelize.literal('NOW()') },
      updatedAt: { type: DATE, allowNull: false, defaultValue: Sequelize.literal('NOW()') },
    };
    const fk = (table, opts = {}) => ({
      type: INTEGER,
      references: { model: table, key: 'id' },
      onDelete: opts.onDelete || 'CASCADE',
      onUpdate: 'CASCADE',
      allowNull: opts.allowNull ?? false,
    });

    await queryInterface.createTable('Users', {
      id: { type: INTEGER, primaryKey: true, autoIncrement: true },
      name: { type: STRING, allowNull: false },
      email: { type: STRING, allowNull: false, unique: true },
      avatarColor: { type: STRING, allowNull: false, defaultValue: '#64748b' },
      role: { type: STRING, allowNull: false, defaultValue: 'member' },
      ...ts,
    });

    await queryInterface.createTable('Projects', {
      id: { type: INTEGER, primaryKey: true, autoIncrement: true },
      key: { type: STRING, allowNull: false, unique: true },
      name: { type: STRING, allowNull: false },
      description: { type: TEXT },
      ticketSeq: { type: INTEGER, allowNull: false, defaultValue: 0 },
      ...ts,
    });

    await queryInterface.createTable('Boards', {
      id: { type: INTEGER, primaryKey: true, autoIncrement: true },
      projectId: fk('Projects'),
      name: { type: STRING, allowNull: false },
      position: { type: FLOAT, allowNull: false, defaultValue: 1000 },
      ...ts,
    });

    await queryInterface.createTable('Columns', {
      id: { type: INTEGER, primaryKey: true, autoIncrement: true },
      boardId: fk('Boards'),
      name: { type: STRING, allowNull: false },
      position: { type: FLOAT, allowNull: false, defaultValue: 1000 },
      wipLimit: { type: INTEGER, allowNull: true },
      ...ts,
    });

    await queryInterface.createTable('Labels', {
      id: { type: INTEGER, primaryKey: true, autoIncrement: true },
      projectId: fk('Projects'),
      name: { type: STRING, allowNull: false },
      color: { type: STRING, allowNull: false, defaultValue: '#3b82f6' },
      ...ts,
    });

    await queryInterface.createTable('Tickets', {
      id: { type: INTEGER, primaryKey: true, autoIncrement: true },
      boardId: fk('Boards'),
      columnId: fk('Columns'),
      key: { type: STRING, allowNull: false, unique: true },
      title: { type: STRING, allowNull: false },
      description: { type: TEXT },
      priority: { type: STRING, allowNull: false, defaultValue: 'medium' },
      assigneeId: fk('Users', { allowNull: true, onDelete: 'SET NULL' }),
      reporterId: fk('Users', { allowNull: true, onDelete: 'SET NULL' }),
      dueDate: { type: DATE, allowNull: true },
      position: { type: FLOAT, allowNull: false, defaultValue: 1000 },
      ...ts,
    });
    await queryInterface.addConstraint('Tickets', {
      fields: ['priority'],
      type: 'check',
      name: 'tickets_priority_check',
      where: { priority: ['low', 'medium', 'high', 'urgent'] },
    });
    await queryInterface.addIndex('Tickets', ['boardId']);
    await queryInterface.addIndex('Tickets', ['columnId']);

    await queryInterface.createTable('TicketLabels', {
      ticketId: { ...fk('Tickets'), primaryKey: true },
      labelId: { ...fk('Labels'), primaryKey: true },
    });

    await queryInterface.createTable('Comments', {
      id: { type: INTEGER, primaryKey: true, autoIncrement: true },
      ticketId: fk('Tickets'),
      authorId: fk('Users', { onDelete: 'SET NULL', allowNull: true }),
      body: { type: TEXT, allowNull: false },
      ...ts,
    });

    await queryInterface.createTable('Activities', {
      id: { type: INTEGER, primaryKey: true, autoIncrement: true },
      ticketId: fk('Tickets'),
      actorId: fk('Users', { onDelete: 'SET NULL', allowNull: true }),
      type: { type: STRING, allowNull: false },
      meta: { type: JSONB, allowNull: false, defaultValue: {} },
      ...ts,
    });
    await queryInterface.addIndex('Activities', ['ticketId']);
  },

  async down(queryInterface) {
    await queryInterface.dropTable('Activities');
    await queryInterface.dropTable('Comments');
    await queryInterface.dropTable('TicketLabels');
    await queryInterface.dropTable('Tickets');
    await queryInterface.dropTable('Labels');
    await queryInterface.dropTable('Columns');
    await queryInterface.dropTable('Boards');
    await queryInterface.dropTable('Projects');
    await queryInterface.dropTable('Users');
  },
};
