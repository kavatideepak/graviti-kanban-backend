import { DataTypes } from 'sequelize';

export default function defineComment(sequelize) {
  return sequelize.define('Comment', {
    ticketId: { type: DataTypes.INTEGER, allowNull: false },
    authorId: { type: DataTypes.INTEGER, allowNull: false },
    body: { type: DataTypes.TEXT, allowNull: false },
  });
}
