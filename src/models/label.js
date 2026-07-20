import { DataTypes } from 'sequelize';

export default function defineLabel(sequelize) {
  return sequelize.define('Label', {
    projectId: { type: DataTypes.INTEGER, allowNull: false },
    name: { type: DataTypes.STRING, allowNull: false },
    color: { type: DataTypes.STRING, allowNull: false, defaultValue: '#3b82f6' },
  });
}
