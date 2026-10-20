import { sqlClient } from ".";

if ((process.env.NODE_ENV ?? "development") === "production") {
  throw new Error("Seed is disabled in production");
}

const adminEmail = process.env.SEED_ADMIN_EMAIL ?? "admin@example.com";
const adminPassword = process.env.SEED_ADMIN_PASSWORD ?? "development-admin-password";
const userPassword = process.env.SEED_USER_PASSWORD ?? "development-user-password";
const adminHash = await Bun.password.hash(adminPassword, "argon2id");
const userHash = await Bun.password.hash(userPassword, "argon2id");

await sqlClient.begin(async (tx) => {
  const [admin] = await tx`INSERT INTO users (email,password_hash,display_name)
    VALUES (${adminEmail},${adminHash},'NexTech Admin') ON CONFLICT (lower(email))
    DO UPDATE SET display_name=EXCLUDED.display_name RETURNING id`;
  const [organizerUser] = await tx`INSERT INTO users (email,password_hash,display_name)
    VALUES ('organizer@example.com',${userHash},'Sample Organizer') ON CONFLICT (lower(email))
    DO UPDATE SET display_name=EXCLUDED.display_name RETURNING id`;
  const [participant] = await tx`INSERT INTO users (email,password_hash,display_name)
    VALUES ('participant@example.com',${userHash},'Sample Participant') ON CONFLICT (lower(email))
    DO UPDATE SET display_name=EXCLUDED.display_name RETURNING id`;
  await tx`INSERT INTO user_roles (user_id,role_code) VALUES
    (${admin.id},'participant'),(${admin.id},'admin'),(${organizerUser.id},'participant'),
    (${organizerUser.id},'organizer'),(${participant.id},'participant') ON CONFLICT DO NOTHING`;

  const [organizer] = await tx`INSERT INTO organizers (owner_user_id,name,slug,description,contact_email)
    VALUES (${organizerUser.id},'NexTech Community','nextech-community','開発者向けコミュニティ','organizer@example.com')
    ON CONFLICT (slug) DO UPDATE SET name=EXCLUDED.name RETURNING id`;
  await tx`INSERT INTO organizer_members (organizer_id,user_id,member_role)
    VALUES (${organizer.id},${organizerUser.id},'owner') ON CONFLICT DO NOTHING`;

  const categoryRows = [
    ["Web Development", "web-development", 10], ["AI / ML", "ai-ml", 20],
    ["Cloud / DevOps", "cloud-devops", 30], ["Mobile", "mobile", 40],
  ] as const;
  for (const [name, slug, order] of categoryRows) {
    await tx`INSERT INTO categories (name,slug,display_order,created_by) VALUES (${name},${slug},${order},${admin.id}) ON CONFLICT (slug) DO NOTHING`;
  }
  for (const [name, slug] of [["TypeScript","typescript"],["Bun","bun"],["PostgreSQL","postgresql"],["Next.js","nextjs"]]) {
    await tx`INSERT INTO tags (name,slug,created_by) VALUES (${name},${slug},${admin.id}) ON CONFLICT (slug) DO NOTHING`;
  }
  const [category] = await tx`SELECT id FROM categories WHERE slug='web-development'`;
  await tx`INSERT INTO events (
    organizer_id,category_id,created_by,title,summary,description,format,venue_name,address,
    online_url,timezone,start_at,end_at,capacity,waitlist_enabled,application_deadline,status,published_at
  ) SELECT ${organizer.id},${category.id},${organizerUser.id},'Bun + Elysia Workshop',
    'BunでAPIを構築するハンズオン','NexTechのサンプルイベントです。','hybrid','NexTech Hall','Tokyo',
    'https://example.test/meeting','Asia/Tokyo',now()+interval '30 days',now()+interval '30 days 2 hours',30,true,now()+interval '29 days','published',now()
    WHERE NOT EXISTS (SELECT 1 FROM events WHERE title='Bun + Elysia Workshop')`;
});

console.log("Development seed completed");
await sqlClient.close();
