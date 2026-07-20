import { DataTypes } from 'sequelize';

export default function defineTicketLabel(sequelize) {
  return sequelize.define('TicketLabel', {
    ticketId: { type: DataTypes.INTEGER, allowNull: false },
    labelId: { type: DataTypes.INTEGER, allowNull: false },
  }, { timestamps: false });
}
