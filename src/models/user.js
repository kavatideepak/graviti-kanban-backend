import { DataTypes } from 'sequelize';

export default function defineUser(sequelize) {
  return sequelize.define('User', {
    name: { type: DataTypes.STRING, allowNull: false },
    email: { type: DataTypes.STRING, allowNull: false, unique: true },
    avatarColor: { type: DataTypes.STRING, allowNull: false, defaultValue: '#64748b' },
    role: { type: DataTypes.STRING, allowNull: false, defaultValue: 'member' },
  });
}
