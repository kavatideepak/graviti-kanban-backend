import { DataTypes } from 'sequelize';

export default function defineColumn(sequelize) {
  return sequelize.define('Column', {
    boardId: { type: DataTypes.INTEGER, allowNull: false },
    name: { type: DataTypes.STRING, allowNull: false },
    position: { type: DataTypes.FLOAT, allowNull: false, defaultValue: 1000 },
    wipLimit: { type: DataTypes.INTEGER, allowNull: true },
  });
}
