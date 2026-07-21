#!/usr/bin/env node
/**
 * One-off, idempotent maintenance script.
 *
 * Clears the demo tickets on the **Synapse** project's board and replaces them
 * with the current real task list (all in "To Do"), tagged with feat/fix labels.
 *
 * Safe to re-run. Only touches the Synapse project — PACS and everything else
 * is left alone. Reads DATABASE_URL from the backend .env, so:
 *   node scripts/set-synapse-tasks.cjs            # uses whatever .env points at
 *   DATABASE_URL=postgres://... node scripts/set-synapse-tasks.cjs   # override
 */
require('dotenv').config();
const { Client } = require('pg');

// title, priority, type (feat|fix)
const TASKS = [
  ['Implement Forward/Reply feature', 'Forward messages to other chats and reply/quote an existing message.', 'high', 'feat'],
  ['Implement image and document send feature', 'Send images and documents in chats, with upload, preview and download.', 'high', 'feat'],
  ['Implement ability to make people admin', 'Promote a group member to admin (and demote back).', 'medium', 'feat'],
  ['Implement ability to add/remove members from Group', 'Add new members to a group and remove existing ones.', 'high', 'feat'],
  ['Creating Group Flow should be checked', 'Review and fix the end-to-end create-group flow.', 'high', 'fix'],
  ['Role separation — admin & user, and adding feature', 'Separate admin vs user roles and add the corresponding capabilities.', 'high', 'feat'],
  ['Add "user added" text in the chat window', 'Show a system line in the chat when a user is added to a group.', 'medium', 'feat'],
  ['Change header view in groups to match WhatsApp', 'Rework the group chat header to match the WhatsApp layout.', 'medium', 'fix'],
  ['Add group info at the beginning of the chat window', 'Show group info (name, members, etc.) at the top of the group chat.', 'low', 'feat'],
];

const LABELS = [
  { name: 'feat', color: '#16a34a' },
  { name: 'fix', color: '#dc2626' },
];

async function main() {
  if (!process.env.DATABASE_URL) throw new Error('DATABASE_URL not set');
  const client = new Client({ connectionString: process.env.DATABASE_URL });
  await client.connect();
  const q = (sql, params) => client.query(sql, params);
  try {
    await q('BEGIN');

    const proj = (await q('SELECT id, key FROM "Projects" WHERE key = $1', ['SYN'])).rows[0];
    if (!proj) throw new Error('Synapse project (key=SYN) not found');
    const projectId = proj.id;

    const boards = (await q('SELECT id FROM "Boards" WHERE "projectId" = $1 ORDER BY id', [projectId])).rows;
    if (!boards.length) throw new Error('No board found for Synapse project');
    const boardId = boards[0].id;
    const boardIds = boards.map((b) => b.id);

    // Target column: "To Do" on the main board.
    const col = (await q(
      `SELECT id FROM "Columns" WHERE "boardId" = $1 AND lower(name) = 'to do' ORDER BY position LIMIT 1`,
      [boardId],
    )).rows[0];
    if (!col) throw new Error('"To Do" column not found on Synapse board');
    const columnId = col.id;

    // --- Remove existing Synapse tickets (and their child rows) ---
    const ticketIds = (await q('SELECT id FROM "Tickets" WHERE "boardId" = ANY($1)', [boardIds])).rows.map((r) => r.id);
    if (ticketIds.length) {
      await q('DELETE FROM "TicketLabels" WHERE "ticketId" = ANY($1)', [ticketIds]);
      await q('DELETE FROM "Comments" WHERE "ticketId" = ANY($1)', [ticketIds]);
      await q('DELETE FROM "Activities" WHERE "ticketId" = ANY($1)', [ticketIds]);
      await q('DELETE FROM "Tickets" WHERE id = ANY($1)', [ticketIds]);
    }
    console.log(`removed ${ticketIds.length} existing Synapse ticket(s)`);

    // --- Ensure feat/fix labels exist; get their ids ---
    const labelId = {};
    for (const { name, color } of LABELS) {
      let row = (await q('SELECT id FROM "Labels" WHERE "projectId" = $1 AND name = $2', [projectId, name])).rows[0];
      if (!row) {
        row = (await q(
          'INSERT INTO "Labels" ("projectId", name, color, "createdAt", "updatedAt") VALUES ($1,$2,$3,NOW(),NOW()) RETURNING id',
          [projectId, name, color],
        )).rows[0];
      }
      labelId[name] = row.id;
    }

    // --- Insert the task list, all in To Do ---
    let seq = 0;
    let position = 1000;
    for (const [title, description, priority, type] of TASKS) {
      seq += 1;
      const key = `${proj.key}-${seq}`;
      const t = (await q(
        `INSERT INTO "Tickets" ("boardId","columnId",key,title,description,priority,"assigneeId","reporterId","dueDate",position,"createdAt","updatedAt")
         VALUES ($1,$2,$3,$4,$5,$6,NULL,NULL,NULL,$7,NOW(),NOW()) RETURNING id`,
        [boardId, columnId, key, title, description, priority, position],
      )).rows[0];
      await q('INSERT INTO "TicketLabels" ("ticketId","labelId") VALUES ($1,$2)', [t.id, labelId[type]]);
      position += 1000;
      console.log(`  + ${key.padEnd(7)} [${type}] ${title}`);
    }

    // Keep the project key counter in sync with what we inserted.
    await q('UPDATE "Projects" SET "ticketSeq" = $1, "updatedAt" = NOW() WHERE id = $2', [seq, projectId]);
    // Keep the Tickets id sequence ahead of any explicit inserts elsewhere.
    await q(`SELECT setval('"Tickets_id_seq"', (SELECT MAX(id) FROM "Tickets"))`);

    await q('COMMIT');
    console.log(`\nDone: ${TASKS.length} tasks on Synapse board (project ${projectId}, board ${boardId}, To Do column ${columnId}).`);
  } catch (err) {
    await client.query('ROLLBACK').catch(() => {});
    throw err;
  } finally {
    await client.end();
  }
}

main().catch((err) => { console.error('FAILED:', err.message); process.exit(1); });
