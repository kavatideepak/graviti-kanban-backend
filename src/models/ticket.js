import { DataTypes } from 'sequelize';

export const PRIORITIES = ['low', 'medium', 'high', 'urgent'];

export default function defineTicket(sequelize) {
  return sequelize.define('Ticket', {
    boardId: { type: DataTypes.INTEGER, allowNull: false },
    columnId: { type: DataTypes.INTEGER, allowNull: false },
    key: { type: DataTypes.STRING, allowNull: false, unique: true },
    title: { type: DataTypes.STRING, allowNull: false },
    description: { type: DataTypes.TEXT },
    priority: {
      type: DataTypes.STRING,
      allowNull: false,
      defaultValue: 'medium',
      validate: { isIn: [PRIORITIES] },
    },
    assigneeId: { type: DataTypes.INTEGER, allowNull: true },
    reporterId: { type: DataTypes.INTEGER, allowNull: true },
    dueDate: { type: DataTypes.DATE, allowNull: true },
    position: { type: DataTypes.FLOAT, allowNull: false, defaultValue: 1000 },
  }, {
    // Soft delete: destroy() sets deletedAt and rows are excluded from queries by default.
    paranoid: true,
  });
}
