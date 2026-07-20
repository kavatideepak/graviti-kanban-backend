'use strict';

/**
 * Default seed data. Canonical starting dataset for any environment (dev / deployed) via `db:seed`.
 * Two projects share one set of org users:
 *   1. Synapse    (SYN)  — WhatsApp-style real-time messaging platform.
 *   2. Photon PACS (PACS) — OHIF-based DICOM viewer + Node/DICOM/HL7 backend.
 * @type {import('sequelize-cli').Migration}
 */
module.exports = {
  async up(queryInterface) {
    const now = new Date();
    const ts = { createdAt: now, updatedAt: now };

    // --- Users (ids 1..6) ---
    await queryInterface.bulkInsert('Users', [
      { id: 1, name: 'Dheeraj', email: 'dheeraj@synapse.app', avatarColor: '#ef4444', role: 'CEO', ...ts },
      { id: 2, name: 'Ravi Kiran', email: 'ravi@synapse.app', avatarColor: '#3b82f6', role: 'BA/PM', ...ts },
      { id: 3, name: 'Deepak', email: 'deepak@synapse.app', avatarColor: '#22c55e', role: 'Developer', ...ts },
      { id: 4, name: 'Jilani Basha', email: 'jilani@synapse.app', avatarColor: '#a855f7', role: 'Developer', ...ts },
      { id: 5, name: 'Shashi Polavarapu', email: 'shashi@synapse.app', avatarColor: '#f59e0b', role: 'Project Manager', ...ts },
      { id: 6, name: 'Anjana', email: 'anjana@synapse.app', avatarColor: '#ec4899', role: 'Tester/BA', ...ts },
    ]);

    // --- Projects ---
    await queryInterface.bulkInsert('Projects', [
      {
        id: 1, key: 'SYN', name: 'Synapse',
        description: 'WhatsApp-style real-time messaging platform with enterprise features (corporate directory, presence, OOO auto-reply).',
        ticketSeq: 20, ...ts,
      },
      {
        id: 2, key: 'PACS', name: 'Photon PACS',
        description: 'OHIF-based DICOM viewer (fyzks_pacs_fe) + Node.js/DICOM/HL7 backend for radiology worklist, reporting and integrations.',
        ticketSeq: 34, ...ts,
      },
    ]);

    // --- Boards (one per project) ---
    await queryInterface.bulkInsert('Boards', [
      { id: 1, projectId: 1, name: 'Main Board', position: 1000, ...ts },
      { id: 2, projectId: 2, name: 'Main Board', position: 1000, ...ts },
    ]);

    // --- Columns (1..4 = Synapse, 5..8 = PACS) ---
    await queryInterface.bulkInsert('Columns', [
      { id: 1, boardId: 1, name: 'To Do', position: 1000, wipLimit: null, ...ts },
      { id: 2, boardId: 1, name: 'In Progress', position: 2000, wipLimit: 5, ...ts },
      { id: 3, boardId: 1, name: 'Review', position: 3000, wipLimit: 5, ...ts },
      { id: 4, boardId: 1, name: 'Done', position: 4000, wipLimit: null, ...ts },
      { id: 5, boardId: 2, name: 'To Do', position: 1000, wipLimit: null, ...ts },
      { id: 6, boardId: 2, name: 'In Progress', position: 2000, wipLimit: 5, ...ts },
      { id: 7, boardId: 2, name: 'Review', position: 3000, wipLimit: 5, ...ts },
      { id: 8, boardId: 2, name: 'Done', position: 4000, wipLimit: null, ...ts },
    ]);

    // --- Labels (1..7 = Synapse, 8..15 = PACS) ---
    await queryInterface.bulkInsert('Labels', [
      { id: 1, projectId: 1, name: 'backend', color: '#2563eb', ...ts },
      { id: 2, projectId: 1, name: 'mobile', color: '#16a34a', ...ts },
      { id: 3, projectId: 1, name: 'infra', color: '#a16207', ...ts },
      { id: 4, projectId: 1, name: 'realtime', color: '#0891b2', ...ts },
      { id: 5, projectId: 1, name: 'webrtc', color: '#7c3aed', ...ts },
      { id: 6, projectId: 1, name: 'security', color: '#dc2626', ...ts },
      { id: 7, projectId: 1, name: 'tech-debt', color: '#64748b', ...ts },
      { id: 8, projectId: 2, name: 'frontend', color: '#2563eb', ...ts },
      { id: 9, projectId: 2, name: 'backend', color: '#16a34a', ...ts },
      { id: 10, projectId: 2, name: 'infra', color: '#a16207', ...ts },
      { id: 11, projectId: 2, name: 'viewer', color: '#7c3aed', ...ts },
      { id: 12, projectId: 2, name: 'reporting', color: '#db2777', ...ts },
      { id: 13, projectId: 2, name: 'integrations', color: '#0891b2', ...ts },
      { id: 14, projectId: 2, name: 'security', color: '#dc2626', ...ts },
      { id: 15, projectId: 2, name: 'tech-debt', color: '#64748b', ...ts },
    ]);

    // helper: (id, boardId, columnId, key, title, description, priority, assigneeId, reporterId, position)
    const t = (id, boardId, columnId, key, title, description, priority, assigneeId, reporterId, position) =>
      ({ id, boardId, columnId, key, title, description, priority, assigneeId, reporterId, dueDate: null, position, ...ts });

    await queryInterface.bulkInsert('Tickets', [
      // ===== Synapse (board 1, columns 1..4) =====
      // Done
      t(1, 1, 4, 'SYN-1', 'Socket auth: JWT token → user-ID event', 'Refactored socket authentication from JWT token to a user_authenticated event.', 'medium', 3, 2, 1000),
      t(2, 1, 4, 'SYN-2', 'WhatsApp-style delivery via personal rooms', 'Deliver messages over personal user rooms; removed explicit join_chat/leave_chat.', 'high', 4, 2, 2000),
      t(3, 1, 4, 'SYN-3', 'Offline message delivery on reconnect', 'Flush pending messages (pending_messages_delivered) when a client reconnects.', 'medium', 3, 2, 3000),
      t(4, 1, 4, 'SYN-4', 'Presence / availability / OOO auto-reply', 'Online/idle/offline presence plus availability and out-of-office auto-reply.', 'medium', 4, 5, 4000),
      t(5, 1, 4, 'SYN-5', 'OTP auth + privacy consent flow', 'Phone number + OTP login with a privacy-consent step before use.', 'high', 3, 2, 5000),
      // In Progress
      t(6, 1, 2, 'SYN-6', 'WebRTC signaling events over Socket.io', 'CALL-1: offer/answer/ICE candidate + call-invite/accept/reject/end signaling.', 'high', 3, 5, 1000),
      t(7, 1, 2, 'SYN-7', 'Integrate react-native-webrtc + config plugin', 'CALL-4: wire up react-native-webrtc (or Expo-compatible equivalent) on mobile.', 'high', 4, 5, 2000),
      t(8, 1, 2, 'SYN-8', 'Add automated test suite (Jest + supertest)', 'BUG-1: backend has no tests; add controller + socket integration tests.', 'high', 6, 2, 3000),
      // Review
      t(9, 1, 3, 'SYN-9', 'Add call model + migration', 'CALL-3: caller, callee, type, status, started/ended, duration.', 'high', 3, 5, 1000),
      t(10, 1, 3, 'SYN-10', 'Provision & integrate STUN/TURN (coturn)', 'CALL-2: stand up a TURN/STUN server for WebRTC connectivity.', 'high', 4, 5, 2000),
      t(11, 1, 3, 'SYN-11', 'Media upload error handling & retry', 'BUG-6: show progress and retry/resume media uploads on flaky networks.', 'medium', 3, 6, 3000),
      // To Do
      t(12, 1, 1, 'SYN-12', 'Epic: 1:1 voice & video calling', 'WebRTC-based real-time voice & video calls with Socket.io signaling and TURN/STUN.', 'urgent', 3, 1, 1000),
      t(13, 1, 1, 'SYN-13', 'Incoming-call UI + full-screen call screen', 'CALL-5: ringing/accept/reject, mute, camera toggle, speaker, end.', 'high', 4, 5, 2000),
      t(14, 1, 1, 'SYN-14', 'Push wake for incoming calls', 'CALL-7: wake the app for incoming calls when backgrounded/killed (Expo + SNS).', 'high', 3, 5, 3000),
      t(15, 1, 1, 'SYN-15', 'Status / Stories (24h ephemeral)', 'FEAT-1: post image/text status, view others, auto-expire in 24h, view count.', 'medium', 4, 2, 4000),
      t(16, 1, 1, 'SYN-16', 'End-to-end encryption for messages', 'FEAT-3: key exchange, encrypted payloads at rest & in transit, safety numbers.', 'medium', 3, 1, 5000),
      t(17, 1, 1, 'SYN-17', 'Disappearing messages (per-chat timer)', 'FEAT-4: configurable timer; messages auto-delete on both sides.', 'medium', 4, 2, 6000),
      t(18, 1, 1, 'SYN-18', 'Environment separation — move off shared prod DB', 'BUG-2: single Postgres is shared across envs; migrations hit prod. Separate envs.', 'urgent', 3, 5, 7000),
      t(19, 1, 1, 'SYN-19', 'Keyboard & safe-area regression tests', 'BUG-5: keyboard fixes are escalation-level; iOS insets must be Platform.OS gated.', 'high', 6, 5, 8000),
      t(20, 1, 1, 'SYN-20', 'Location sharing (static + live)', 'FEAT-5: send current location; live location for N minutes.', 'low', 4, 2, 9000),

      // ===== Photon PACS (board 2, columns 5..8) =====
      // Done
      t(21, 2, 8, 'PACS-1', 'Unified date/time format across FE & BE', 'DONE-1: DD.MM.YYYY HH:mm across FE constants, BE utils and report header — 3 files kept in sync.', 'medium', 3, 5, 1000),
      t(22, 2, 8, 'PACS-2', 'Worklist multi-select filters on a single row', 'DONE-2: maxTagCount={1} + single-line-tags; antd needs !important flex-wrap.', 'low', 4, 5, 2000),
      t(23, 2, 8, 'PACS-3', 'Centres management & center-based filtering', 'DONE-3: centres management plus center-based worklist filtering.', 'medium', 3, 2, 3000),
      t(24, 2, 8, 'PACS-4', 'Dev server & build pipeline stabilized', 'DONE-4: stabilized dev server/build on :3000; webpack CSS errors confirmed false positives.', 'low', 4, 5, 4000),
      t(25, 2, 8, 'PACS-5', 'MPR series-switching fixes in viewer', 'DONE-5: fixed MPR series switching in the OHIF viewer.', 'medium', 3, 5, 5000),
      t(26, 2, 8, 'PACS-6', 'Voice recording capture & storage', 'DONE-6: voice-recording controller, model and storage directory.', 'medium', 4, 2, 6000),
      t(27, 2, 8, 'PACS-7', 'Referral physicians management', 'DONE-7: referral physicians controller + model.', 'low', 3, 2, 7000),
      // In Progress
      t(28, 2, 6, 'PACS-8', 'Global sync implementation (synchronizer work)', 'INP-2: broader Cornerstone Synchronizer work for global viewport sync.', 'high', 3, 5, 1000),
      t(29, 2, 6, 'PACS-9', 'Fix Global Stack Scroll for viewports 2 & 4', 'ACT-1 (P0): scrolling any viewport must sync all others; add manual event listeners to bypass Synchronizer handling.', 'urgent', 3, 5, 2000),
      t(30, 2, 6, 'PACS-10', 'Global Stack Scroll partial sync (VP2 & VP4 dead)', 'BUG-1 (P0): Cornerstone Synchronizer only fires STACK_VIEWPORT_SCROLL for VP1 & VP3. Blocked on ACT-1.', 'urgent', 4, 6, 3000),
      // Review
      t(31, 2, 7, 'PACS-11', 'Global Stack Scroll (sync across all viewports)', 'INP-1: ~90% done — currently syncs 2 of 4 viewports. See GLOBAL_SYNC_IMPLEMENTATION_NOTES.md.', 'high', 3, 5, 1000),
      // To Do — Action Items
      t(32, 2, 5, 'PACS-12', 'Remove debug console.logs before production', 'ACT-2: strip logs in createStackScrollSynchronizer.ts & toggleStackScroll.ts.', 'high', 4, 5, 1000),
      t(33, 2, 5, 'PACS-13', 'Report templates & report header configuration UI', 'ACT-3: radiologist picks template; header pulls centre + patient data; unified date format.', 'high', 3, 2, 2000),
      t(34, 2, 5, 'PACS-14', 'Transcription workflow (dictate → draft → sign-off)', 'ACT-4: transcription controller wired to report; status transitions logged.', 'high', 4, 2, 3000),
      t(35, 2, 5, 'PACS-15', 'Split study & merge/reconcile studies', 'ACT-5: split-study + order-reconcile controllers; verify series move correctly & audit-logged.', 'high', 3, 5, 4000),
      t(36, 2, 5, 'PACS-16', 'HL7 inbound listener hardening', 'ACT-6: retry on malformed messages, ack/nack, log to study_reception_logs.', 'high', 3, 5, 5000),
      t(37, 2, 5, 'PACS-17', 'Critical findings notifications', 'ACT-7: notify referring physician; track acknowledgement (critical_notifications).', 'high', 4, 2, 6000),
      t(38, 2, 5, 'PACS-18', 'Shareable report links (secure, expiring)', 'ACT-8: token-based access, expiry, access audit.', 'medium', 3, 5, 7000),
      // To Do — Backlog
      t(39, 2, 5, 'PACS-19', 'DICOM federation / query-retrieve across nodes', 'BLG-1: federated query/retrieve across DICOM nodes.', 'high', 3, 5, 8000),
      t(40, 2, 5, 'PACS-20', 'Node push logs & delivery status dashboard', 'BLG-2: dashboard for DICOM node push logs and delivery status.', 'medium', 4, 5, 9000),
      t(41, 2, 5, 'PACS-21', 'Billing & centre pricing engine', 'BLG-3: billing and centre-based pricing engine.', 'high', 3, 2, 10000),
      t(42, 2, 5, 'PACS-22', 'EMS order lifecycle', 'BLG-4: create / list / search / update / status for EMS orders.', 'high', 4, 2, 11000),
      t(43, 2, 5, 'PACS-23', 'MIS reports & aggregation dashboards', 'BLG-5: management information reports and aggregation dashboards.', 'medium', 3, 5, 12000),
      t(44, 2, 5, 'PACS-24', 'Column preferences & saved/quick filters per user', 'BLG-6: per-user worklist column preferences and saved/quick filters.', 'medium', 4, 2, 13000),
      t(45, 2, 5, 'PACS-25', 'User permissions, roles & session management', 'BLG-7: permissions, roles and session management.', 'high', 3, 5, 14000),
      t(46, 2, 5, 'PACS-26', 'Document templates & document generation', 'BLG-8: document templates and generation.', 'medium', 4, 2, 15000),
      t(47, 2, 5, 'PACS-27', 'Library (bookmarks / folders) for reference cases', 'BLG-9: bookmark/folder library for reference cases.', 'low', 4, 2, 16000),
      t(48, 2, 5, 'PACS-28', 'Snapshot / viewport snapshot capture & storage', 'BLG-10: capture and store viewport snapshots.', 'medium', 3, 5, 17000),
      t(49, 2, 5, 'PACS-29', 'License management & admin', 'BLG-11: license management and admin.', 'medium', 4, 5, 18000),
      t(50, 2, 5, 'PACS-30', 'Storage monitor & disk-usage alerts', 'BLG-12: storage monitoring and disk-usage alerts.', 'medium', 3, 5, 19000),
      t(51, 2, 5, 'PACS-31', 'OnlyOffice document editing integration (HTTPS)', 'BLG-13: integrate OnlyOffice document editing over HTTPS.', 'low', 4, 2, 20000),
      t(52, 2, 5, 'PACS-32', 'Migration tooling for legacy studies/orders', 'BLG-14: tooling to migrate legacy studies and orders.', 'medium', 3, 5, 21000),
      t(53, 2, 5, 'PACS-33', 'Viewer stats & tool-interaction analytics', 'BLG-15: viewer usage stats and tool-interaction analytics.', 'low', 4, 2, 22000),
      // To Do — Blocked
      t(54, 2, 5, 'PACS-34', 'yarn workspace add may not link package', 'BLK-1: workaround — re-run yarn install after add.', 'medium', 4, 5, 23000),
    ]);

    // --- Ticket ↔ label links ---
    const tl = (ticketId, labelId) => ({ ticketId, labelId });
    await queryInterface.bulkInsert('TicketLabels', [
      // Synapse
      tl(1, 1), tl(1, 4), tl(2, 1), tl(2, 4), tl(3, 1), tl(3, 4), tl(4, 1), tl(4, 4),
      tl(5, 1), tl(5, 6), tl(6, 1), tl(6, 4), tl(6, 5), tl(7, 2), tl(7, 5), tl(8, 1), tl(8, 7),
      tl(9, 1), tl(9, 5), tl(10, 3), tl(10, 5), tl(11, 1), tl(11, 2),
      tl(12, 1), tl(12, 2), tl(12, 5), tl(13, 2), tl(13, 5), tl(14, 1), tl(14, 2),
      tl(15, 1), tl(15, 2), tl(16, 1), tl(16, 6), tl(17, 1), tl(17, 2), tl(18, 3), tl(18, 7),
      tl(19, 2), tl(19, 7), tl(20, 2),
      // PACS
      tl(21, 8), tl(21, 9), tl(22, 8), tl(23, 9), tl(24, 10), tl(24, 15), tl(25, 8), tl(25, 11),
      tl(26, 9), tl(26, 12), tl(27, 9), tl(28, 8), tl(28, 11), tl(29, 8), tl(29, 11), tl(30, 8), tl(30, 11),
      tl(31, 8), tl(31, 11), tl(32, 8), tl(32, 15), tl(33, 8), tl(33, 12), tl(34, 9), tl(34, 12),
      tl(35, 9), tl(36, 9), tl(36, 13), tl(37, 9), tl(37, 12), tl(38, 9), tl(38, 14), tl(38, 12),
      tl(39, 9), tl(39, 13), tl(40, 9), tl(40, 13), tl(41, 9), tl(42, 9), tl(43, 9), tl(43, 12),
      tl(44, 8), tl(45, 9), tl(45, 14), tl(46, 9), tl(46, 12), tl(47, 8), tl(47, 11), tl(48, 8), tl(48, 11),
      tl(49, 9), tl(50, 10), tl(51, 9), tl(51, 12), tl(52, 10), tl(52, 15), tl(53, 8), tl(53, 11), tl(54, 10), tl(54, 15),
    ]);

    // Keep autoincrement sequences ahead of the explicit ids we inserted.
    for (const [table, seq] of [
      ['Users', 'Users_id_seq'],
      ['Projects', 'Projects_id_seq'],
      ['Boards', 'Boards_id_seq'],
      ['Columns', 'Columns_id_seq'],
      ['Labels', 'Labels_id_seq'],
      ['Tickets', 'Tickets_id_seq'],
    ]) {
      await queryInterface.sequelize.query(
        `SELECT setval('"${seq}"', (SELECT MAX(id) FROM "${table}"))`
      );
    }
  },

  async down(queryInterface) {
    for (const t of ['TicketLabels', 'Activities', 'Comments', 'Tickets', 'Labels', 'Columns', 'Boards', 'Projects', 'Users']) {
      await queryInterface.bulkDelete(t, null, {});
    }
  },
};
