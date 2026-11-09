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
    ["UI / UX", "ui-ux", 50],
  ] as const;
  for (const [name, slug, order] of categoryRows) {
    await tx`INSERT INTO categories (name,slug,display_order,created_by) VALUES (${name},${slug},${order},${admin.id}) ON CONFLICT (slug) DO NOTHING`;
  }
  for (const [name, slug] of [["TypeScript","typescript"],["Bun","bun"],["PostgreSQL","postgresql"],["Next.js","nextjs"],["Figma","figma"],["Docker","docker"]]) {
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

  // Stable IDs associate these development fixtures with local participant cover images.
  const demoEvents = [
    {
      id: "43af73f7-1aba-4ae7-8d13-018b22a3e001",
      category: "web-development",
      title: "TypeScriptでつくる小さなWeb API",
      summary: "ブラウザから使えるイベント検索APIをつくる入門ハンズオン",
      description: "TypeScriptとBunを使って、イベント検索APIをゼロから作ります。入力検証からエラーレスポンス、テストまで一通り実装します。Node.jsやBunが動くPCをご用意ください。",
      format: "offline",
      venue: "NexTech Hall",
      address: "東京都千代田区（デモ会場）",
      onlineUrl: null,
      daysUntil: 6,
      capacity: 24,
      tags: ["typescript", "bun"],
    },
    {
      id: "43af73f7-1aba-4ae7-8d13-018b22a3e002",
      category: "ui-ux",
      title: "Figmaで学ぶ UIデザイン実践会",
      summary: "イベントカードを題材に、情報の優先順位と余白を設計する",
      description: "イベント一覧を題材に、情報の優先順位、余白、配色を整理します。最後に参加者同士で画面を見比べ、改善点を持ち帰ります。Figmaの基本操作ができる方向けです。",
      format: "online",
      venue: null,
      address: null,
      onlineUrl: "https://example.test/demo-ui",
      daysUntil: 12,
      capacity: 48,
      tags: ["figma"],
    },
    {
      id: "43af73f7-1aba-4ae7-8d13-018b22a3e003",
      category: "cloud-devops",
      title: "Dockerではじめる開発環境づくり",
      summary: "アプリとデータベースをComposeで一緒に動かす",
      description: "Docker ComposeでアプリとPostgreSQLを立ち上げます。環境変数とヘルスチェックの使い方を学び、チームで再現できる開発環境を整えます。",
      format: "hybrid",
      venue: "NexTech Studio",
      address: "東京都渋谷区（デモ会場）",
      onlineUrl: "https://example.test/demo-cloud",
      daysUntil: 19,
      capacity: 12,
      tags: ["docker", "postgresql"],
    },
  ] as const;
  for (const demo of demoEvents) {
    const [inserted] = await tx`INSERT INTO events (
      id,organizer_id,category_id,created_by,title,summary,description,format,venue_name,address,
      online_url,timezone,start_at,end_at,capacity,waitlist_enabled,application_deadline,status,published_at
    ) SELECT ${demo.id},${organizer.id},c.id,${organizerUser.id},${demo.title},${demo.summary},
      ${demo.description},${demo.format},${demo.venue},${demo.address},${demo.onlineUrl},'Asia/Tokyo',
      schedule.start_at,schedule.start_at+interval '2 hours',${demo.capacity},true,
      schedule.start_at-interval '1 day','published',now()
    FROM categories c
    CROSS JOIN LATERAL (
      SELECT (((now() AT TIME ZONE 'Asia/Tokyo')::date + ${demo.daysUntil}::int) + time '19:00')
        AT TIME ZONE 'Asia/Tokyo' AS start_at
    ) schedule
    WHERE c.slug=${demo.category}
    ON CONFLICT (id) DO NOTHING RETURNING id`;
    if (!inserted) continue;
    for (const tag of demo.tags) {
      await tx`INSERT INTO event_tags (event_id,tag_id)
        SELECT ${demo.id},id FROM tags WHERE slug=${tag} ON CONFLICT DO NOTHING`;
    }
  }
});

console.log("Development seed completed");
await sqlClient.close();
