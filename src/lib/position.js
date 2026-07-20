// Fractional ordering helpers. Cards carry a float `position`; inserting between two
// neighbors uses the midpoint so a reorder touches a single row.
export const POSITION_STEP = 1000;
const MIN_GAP = 0.0001; // below this the floats are getting too close — rebalance.

// Compute a position between optional prev/next neighbor positions.
export function between(prev, next) {
  if (prev == null && next == null) return POSITION_STEP;
  if (prev == null) return next - POSITION_STEP;
  if (next == null) return prev + POSITION_STEP;
  return (prev + next) / 2;
}

export function needsRebalance(prev, next) {
  return prev != null && next != null && Math.abs(next - prev) < MIN_GAP;
}

// Re-space every ticket in a column to clean POSITION_STEP intervals.
// Call inside a transaction. Returns the ordered tickets after the rewrite.
export async function rebalanceColumn(Ticket, columnId, transaction) {
  const tickets = await Ticket.findAll({
    where: { columnId },
    order: [['position', 'ASC'], ['id', 'ASC']],
    transaction,
  });
  let pos = POSITION_STEP;
  for (const t of tickets) {
    t.position = pos;
    await t.save({ transaction });
    pos += POSITION_STEP;
  }
  return tickets;
}
