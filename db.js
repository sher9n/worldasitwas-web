import pg from "pg";

const url = process.env.DATABASE_URL || "";

// Railway's private network does not need TLS; the public proxy does, and it
// presents a self-signed certificate.
const needsTls = /proxy\.rlwy\.net|sslmode=require/.test(url);

export const pool = url
  ? new pg.Pool({
      connectionString: url,
      ssl: needsTls ? { rejectUnauthorized: false } : false,
      max: 4,
      idleTimeoutMillis: 30_000,
      connectionTimeoutMillis: 8_000,
    })
  : null;

if (pool) {
  pool.on("error", (err) => console.error("[db] idle client error:", err.message));
}

export const dbReady = (async () => {
  if (!pool) {
    console.warn("[db] DATABASE_URL is not set, the waitlist will not accept sign-ups");
    return false;
  }
  try {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS waitlist (
        id               bigserial PRIMARY KEY,
        email            text NOT NULL,
        email_key        text NOT NULL UNIQUE,
        platform         text,
        requested_city   text,
        source           text,
        created_at       timestamptz NOT NULL DEFAULT now()
      )`);
    await pool.query(
      `CREATE INDEX IF NOT EXISTS waitlist_created_at_idx ON waitlist (created_at DESC)`
    );
    // added after the first release, so bring existing tables along
    await pool.query(`ALTER TABLE waitlist ADD COLUMN IF NOT EXISTS requested_city text`);
    const { rows } = await pool.query("SELECT count(*)::int AS n FROM waitlist");
    console.log(`[db] waitlist ready, ${rows[0].n} row(s)`);
    return true;
  } catch (err) {
    console.error("[db] setup failed:", err.message);
    return false;
  }
})();

// RFC-ish and deliberately conservative: one @, a dot in the domain, no spaces.
const EMAIL = /^[^\s@,;:<>()[\]\\"]{1,64}@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)+$/;

export function validEmail(value) {
  return typeof value === "string" && value.length <= 254 && EMAIL.test(value);
}

export async function addToWaitlist({ email, platform, platformChosen, requestedCity, source }) {
  const key = email.trim().toLowerCase();
  // Coming back a second time should add what is new and never quietly undo an
  // earlier answer, so the platform only moves when this request actually named one.
  const res = await pool.query(
    `INSERT INTO waitlist (email, email_key, platform, requested_city, source)
     VALUES ($1, $2, $3, $4, $5)
     ON CONFLICT (email_key) DO UPDATE
       SET requested_city = COALESCE(EXCLUDED.requested_city, waitlist.requested_city),
           platform       = CASE WHEN $6 THEN EXCLUDED.platform ELSE waitlist.platform END
     RETURNING (xmax = 0) AS inserted`,
    [email.trim(), key, platform || null, requestedCity || null, source || "site", platformChosen === true]
  );
  return { added: res.rows[0]?.inserted === true };
}

export async function waitlistSummary() {
  const [total, byPlatform, recent] = await Promise.all([
    pool.query("SELECT count(*)::int AS n FROM waitlist"),
    pool.query(
      "SELECT coalesce(platform,'unspecified') AS platform, count(*)::int AS n FROM waitlist GROUP BY 1 ORDER BY 2 DESC"
    ),
    pool.query(
      "SELECT email, platform, requested_city, source, created_at FROM waitlist ORDER BY created_at DESC LIMIT 500"
    ),
  ]);
  const cities = await pool.query(
    `SELECT requested_city AS city, count(*)::int AS n FROM waitlist
     WHERE requested_city IS NOT NULL AND requested_city <> ''
     GROUP BY 1 ORDER BY 2 DESC, 1 LIMIT 50`
  );
  return { total: total.rows[0].n, byPlatform: byPlatform.rows, requestedCities: cities.rows, recent: recent.rows };
}
