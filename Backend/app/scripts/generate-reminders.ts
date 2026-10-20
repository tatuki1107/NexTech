import { sqlClient } from "../src/db";
import { generateEventReminders } from "../src/services/notifications";

try {
  console.log(JSON.stringify({ generated: await generateEventReminders() }));
} finally {
  await sqlClient.close();
}
