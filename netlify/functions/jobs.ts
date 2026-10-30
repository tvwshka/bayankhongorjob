import type { Config, Context } from "@netlify/functions";
import { timingSafeEqual } from "node:crypto";
import { desc, eq } from "drizzle-orm";
import { db } from "../../db/index.js";
import { jobs } from "../../db/schema.js";

const LIMITS = { title: 120, company: 120, district: 60, salary: 60, type: 40, phone: 30, description: 3000 };

const json = (data: unknown, status = 200) => Response.json(data, { status });

function isAdmin(req: Request) {
  const expected = process.env.ADMIN_PASSWORD;
  const given = req.headers.get("x-admin-password");
  if (!expected || !given) return false;
  const a = Buffer.from(expected);
  const b = Buffer.from(given);
  return a.length === b.length && timingSafeEqual(a, b);
}

function clean(value: unknown, max: number) {
  return String(value ?? "").trim().slice(0, max);
}

export default async (req: Request, context: Context) => {
  const url = new URL(req.url);

  // Admin password check: POST /api/admin
  if (url.pathname === "/api/admin") {
    if (req.method !== "POST") return json({ error: "Method not allowed" }, 405);
    if (!process.env.ADMIN_PASSWORD) return json({ error: "Админ нууц үг тохируулаагүй байна." }, 503);
    return isAdmin(req) ? json({ ok: true }) : json({ error: "Нууц үг буруу байна." }, 401);
  }

  if (req.method === "GET") {
    const rows = await db.select().from(jobs).orderBy(desc(jobs.createdAt)).limit(500);
    return json(rows, 200);
  }

  if (req.method === "POST") {
    let body: Record<string, unknown>;
    try {
      body = await req.json();
    } catch {
      return json({ error: "Буруу хүсэлт." }, 400);
    }
    // Honeypot field: real users never fill it in.
    if (body.website) return json({ error: "Буруу хүсэлт." }, 400);

    const values = {
      title: clean(body.title, LIMITS.title),
      company: clean(body.company, LIMITS.company),
      district: clean(body.district, LIMITS.district),
      salary: clean(body.salary, LIMITS.salary),
      type: clean(body.type, LIMITS.type),
      phone: clean(body.phone, LIMITS.phone),
      description: clean(body.description, LIMITS.description),
    };
    if (!values.title || !values.company || !values.district || !values.phone) {
      return json({ error: "Ажлын байр, байгууллага, байршил, утасны дугаар заавал бөглөнө." }, 400);
    }
    if (!/^[0-9+\-\s()]{6,30}$/.test(values.phone)) {
      return json({ error: "Утасны дугаар буруу байна." }, 400);
    }

    const [created] = await db.insert(jobs).values(values).returning();
    return json(created, 201);
  }

  if (req.method === "DELETE") {
    if (!isAdmin(req)) return json({ error: "Зөвхөн админ устгах эрхтэй." }, 401);
    const id = Number(context.params.id);
    if (!Number.isInteger(id)) return json({ error: "Буруу ID." }, 400);
    await db.delete(jobs).where(eq(jobs.id, id));
    return json({ ok: true });
  }

  return json({ error: "Method not allowed" }, 405);
};

export const config: Config = {
  path: ["/api/jobs", "/api/jobs/:id", "/api/admin"],
};
