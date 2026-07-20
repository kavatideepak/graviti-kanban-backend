import { DataTypes } from 'sequelize';

export default function defineProject(sequelize) {
  return sequelize.define('Project', {
    key: { type: DataTypes.STRING, allowNull: false, unique: true },
    name: { type: DataTypes.STRING, allowNull: false },
    description: { type: DataTypes.TEXT },
    ticketSeq: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 0 },
  });
}
