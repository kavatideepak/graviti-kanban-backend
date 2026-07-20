import { sequelize } from '../config/database.js';
import defineUser from './user.js';
import defineProject from './project.js';
import defineBoard from './board.js';
import defineColumn from './column.js';
import defineTicket from './ticket.js';
import defineLabel from './label.js';
import defineTicketLabel from './ticketLabel.js';
import defineComment from './comment.js';
import defineActivity from './activity.js';

const User = defineUser(sequelize);
const Project = defineProject(sequelize);
const Board = defineBoard(sequelize);
const Column = defineColumn(sequelize);
const Ticket = defineTicket(sequelize);
const Label = defineLabel(sequelize);
const TicketLabel = defineTicketLabel(sequelize);
const Comment = defineComment(sequelize);
const Activity = defineActivity(sequelize);

// Associations
Project.hasMany(Board, { foreignKey: 'projectId', onDelete: 'CASCADE' });
Board.belongsTo(Project, { foreignKey: 'projectId' });

Project.hasMany(Label, { foreignKey: 'projectId', onDelete: 'CASCADE' });
Label.belongsTo(Project, { foreignKey: 'projectId' });

Board.hasMany(Column, { foreignKey: 'boardId', onDelete: 'CASCADE' });
Column.belongsTo(Board, { foreignKey: 'boardId' });

Board.hasMany(Ticket, { foreignKey: 'boardId', onDelete: 'CASCADE' });
Ticket.belongsTo(Board, { foreignKey: 'boardId' });

Column.hasMany(Ticket, { foreignKey: 'columnId', onDelete: 'CASCADE' });
Ticket.belongsTo(Column, { foreignKey: 'columnId' });

Ticket.belongsTo(User, { as: 'assignee', foreignKey: 'assigneeId' });
Ticket.belongsTo(User, { as: 'reporter', foreignKey: 'reporterId' });

Ticket.belongsToMany(Label, { through: TicketLabel, foreignKey: 'ticketId', otherKey: 'labelId' });
Label.belongsToMany(Ticket, { through: TicketLabel, foreignKey: 'labelId', otherKey: 'ticketId' });

Ticket.hasMany(Comment, { foreignKey: 'ticketId', onDelete: 'CASCADE' });
Comment.belongsTo(Ticket, { foreignKey: 'ticketId' });
Comment.belongsTo(User, { as: 'author', foreignKey: 'authorId' });

Ticket.hasMany(Activity, { foreignKey: 'ticketId', onDelete: 'CASCADE' });
Activity.belongsTo(Ticket, { foreignKey: 'ticketId' });
Activity.belongsTo(User, { as: 'actor', foreignKey: 'actorId' });

export {
  sequelize,
  User,
  Project,
  Board,
  Column,
  Ticket,
  Label,
  TicketLabel,
  Comment,
  Activity,
};
