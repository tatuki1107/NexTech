import { Elysia } from "elysia";
import { cors } from "@elysiajs/cors";
import { sql } from "drizzle-orm";
import { db } from "./db/client";

const app = new Elysia()
  .use(cors())
  .get("/api", () => ({ message: "Hello Elysia" }))
  .get("/api/db-health", async () => {
    await db.execute(sql`select 1`);  //DBが返答できるかのテスト用
    return { message: "Database connected" };
  })
  .get("/api/events", async () => {
    const result = await db.execute(sql`
      select
        events.id,
        events.title,
        events.format,
        events.venue_name as "venueName",
        events.start_at as "startAt",
        events.end_at as "endAt",
        events.application_deadline as "applicationDeadline",
        events.capacity,
        categories.name as "categoryName",
        organizers.name as "organizerName",
        greatest(
          events.capacity - count(registrations.id) filter (
            where registrations.status in ('pending', 'confirmed', 'checked_in', 'no_show')
          ),
          0
        )::integer as "seatsLeft"
      from events
      inner join categories on categories.id = events.category_id
      inner join organizers on organizers.id = events.organizer_id
      left join registrations on registrations.event_id = events.id
      where events.status = 'published' and events.visibility = 'public'
      group by events.id, categories.name, organizers.name
      order by events.start_at asc
    `);

    return { events: result };
  })
  .get("/api/events/:id", async ({ params, set }) => {
    const result = await db.execute(sql`
      select
        events.id,
        events.title,
        events.description,
        events.format,
        events.venue_name as "venueName",
        events.start_at as "startAt",
        events.end_at as "endAt",
        events.application_deadline as "applicationDeadline",
        events.capacity,
        categories.name as "categoryName",
        organizers.name as "organizerName",
        count(registrations.id) filter (
          where registrations.status in ('pending', 'confirmed', 'checked_in', 'no_show')
        )::integer as "applicationCount",
        greatest(
          events.capacity - count(registrations.id) filter (
            where registrations.status in ('pending', 'confirmed', 'checked_in', 'no_show')
          ),
          0
        )::integer as "seatsLeft"
      from events
      inner join categories on categories.id = events.category_id
      inner join organizers on organizers.id = events.organizer_id
      left join registrations on registrations.event_id = events.id
      where events.id = ${params.id}
        and events.status = 'published'
        and events.visibility = 'public'
      group by events.id, categories.name, organizers.name
    `);

    const event = result[0];
    if (!event) {
      set.status = 404;
      return { message: "Event not found" };
    }

    return { event };
  })
  .listen(3001);

console.log(
  `🦊 Elysia is running at ${app.server?.hostname}:${app.server?.port}`
);
