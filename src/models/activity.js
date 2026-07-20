import { DataTypes } from 'sequelize';

export default function defineActivity(sequelize) {
  return sequelize.define('Activity', {
    ticketId: { type: DataTypes.INTEGER, allowNull: false },
    actorId: { type: DataTypes.INTEGER, allowNull: true },
    type: { type: DataTypes.STRING, allowNull: false },
    meta: { type: DataTypes.JSONB, allowNull: false, defaultValue: {} },
  });
}
