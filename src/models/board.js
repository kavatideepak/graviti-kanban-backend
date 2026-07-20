import { DataTypes } from 'sequelize';

export default function defineBoard(sequelize) {
  return sequelize.define('Board', {
    projectId: { type: DataTypes.INTEGER, allowNull: false },
    name: { type: DataTypes.STRING, allowNull: false },
    position: { type: DataTypes.FLOAT, allowNull: false, defaultValue: 1000 },
  });
}
