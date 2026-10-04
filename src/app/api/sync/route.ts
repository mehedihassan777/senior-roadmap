import { neon } from "@neondatabase/serverless";
import { timingSafeEqual } from "node:crypto";

export const dynamic = "force-dynamic";

interface TaskIn {
  id: string;
  c: boolean;
  t: number;
}
interface NoteIn {
  day: number;
  n: string;
  t: number;
}
interface StartIn {
  v: string;
  t: number;
}

const TASK_ID = /^d\d{1,3}-t\d{1,2}$/;
const DATE = /^\d{4}-\d{2}-\d{2}$/;
const isTime = (x: unknown): x is number => typeof x === "number" && Number.isFinite(x) && x > 0;

function json(body: unknown, status = 200) {
  return Response.json(body, { status, headers: { "cache-control": "no-store" } });
}

function passcodeOk(given: string, expected: string) {
  const a = Buffer.from(given);
  const b = Buffer.from(expected);
  return a.length === b.length && timingSafeEqual(a, b);
}

/**
 * POST /api/sync
 * Body: { tasks: TaskIn[], notes: NoteIn[], start: StartIn | null }  (only the client's changed items)
 * Upserts each item if it is newer than what the DB has, then returns the full DB state
 * so the client can merge anything the DB has that is newer.
 */
export async function POST(request: Request) {
  const url = process.env.DATABASE_URL;
  const passcode = process.env.SYNC_PASSCODE;
  if (!url || !passcode) {
    return json({ error: "not_configured", message: "Server is missing DATABASE_URL or SYNC_PASSCODE." }, 503);
  }
  if (!passcodeOk(request.headers.get("x-sync-passcode") ?? "", passcode)) {
    return json({ error: "unauthorized", message: "Wrong passcode." }, 401);
  }

  let body: { tasks?: TaskIn[]; notes?: NoteIn[]; start?: StartIn | null };
  try {
    body = await request.json();
  } catch {
    return json({ error: "bad_request", message: "Invalid JSON." }, 400);
  }

  const tasks = (body.tasks ?? []).filter(
    (x) => typeof x?.id === "string" && TASK_ID.test(x.id) && typeof x.c === "boolean" && isTime(x.t),
  );
  const notes = (body.notes ?? []).filter(
    (x) =>
      Number.isInteger(x?.day) && x.day >= 1 && x.day <= 1000 && typeof x.n === "string" && x.n.length <= 20000 && isTime(x.t),
  );
  const start =
    body.start && typeof body.start.v === "string" && DATE.test(body.start.v) && isTime(body.start.t) ? body.start : null;
  if (tasks.length > 5000 || notes.length > 1000) return json({ error: "too_large" }, 413);

  const sql = neon(url);
  try {
    if (tasks.length) {
      await sql`
        INSERT INTO task_progress (task_id, day, completed, t)
        SELECT * FROM unnest(
          ${tasks.map((x) => x.id)}::text[],
          ${tasks.map((x) => Number(x.id.match(/^d(\d+)-/)![1]))}::int[],
          ${tasks.map((x) => x.c)}::boolean[],
          ${tasks.map((x) => x.t)}::bigint[]
        )
        ON CONFLICT (task_id) DO UPDATE
          SET completed = EXCLUDED.completed, t = EXCLUDED.t
          WHERE task_progress.t < EXCLUDED.t`;
    }
    if (notes.length) {
      await sql`
        INSERT INTO day_notes (day, note, t)
        SELECT * FROM unnest(
          ${notes.map((x) => x.day)}::int[],
          ${notes.map((x) => x.n)}::text[],
          ${notes.map((x) => x.t)}::bigint[]
        )
        ON CONFLICT (day) DO UPDATE
          SET note = EXCLUDED.note, t = EXCLUDED.t
          WHERE day_notes.t < EXCLUDED.t`;
    }
    if (start) {
      await sql`
        INSERT INTO settings (key, value, t) VALUES ('start_date', ${start.v}, ${start.t})
        ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value, t = EXCLUDED.t
        WHERE settings.t < EXCLUDED.t`;
    }

    const [taskRows, noteRows, setRows] = await Promise.all([
      sql`SELECT task_id, completed, t FROM task_progress`,
      sql`SELECT day, note, t FROM day_notes`,
      sql`SELECT value, t FROM settings WHERE key = 'start_date'`,
    ]);

    return json({
      tasks: taskRows.map((r) => ({ id: r.task_id as string, c: r.completed as boolean, t: Number(r.t) })),
      notes: noteRows.map((r) => ({ day: Number(r.day), n: r.note as string, t: Number(r.t) })),
      start: setRows[0] ? { v: setRows[0].value as string, t: Number(setRows[0].t) } : null,
    });
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    const missing = /relation .* does not exist/i.test(msg);
    return json(
      {
        error: "db_error",
        message: missing ? "Tables not found. Run neon/schema.sql in the Neon SQL Editor." : `Database error: ${msg}`,
      },
      500,
    );
  }
}
