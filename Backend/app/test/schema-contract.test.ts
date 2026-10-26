import { describe, expect, test } from "bun:test";

type Schema = {
  $ref?: string;
  type?: string;
  nullable?: boolean;
  allOf?: Schema[];
  required?: string[];
  properties?: Record<string, Schema>;
  items?: Schema;
  enum?: unknown[];
  minLength?: number;
  maxLength?: number;
  pattern?: string;
};

type OpenApiDocument = {
  paths: Record<string, Record<string, unknown>>;
  components: { schemas: Record<string, Schema> };
};

const document = Bun.YAML.parse(
  await Bun.file(new URL("../openapi/index.yaml", import.meta.url)).text(),
) as OpenApiDocument;

test("OpenAPI statuses match the existing dev database", () => {
  const schemas = document.components.schemas;
  expect(schemas.EventStatus.enum).toEqual([
    "draft",
    "published",
    "cancelled",
    "completed",
  ]);
  expect(schemas.RegistrationStatus.enum).toContain("pending");
  expect(schemas.RegistrationStatus.enum).toContain("checked_in");
  expect(schemas.RegistrationStatus.enum).not.toContain("attended");
});

test("event editing documents a required expectedVersion and conflict response", () => {
  expect(document.components.schemas.EventUpdateRequest.required).toContain(
    "expectedVersion",
  );
  const patch = document.paths["/events/{eventId}"].patch as {
    responses: Record<string, unknown>;
  };
  expect(patch.responses["409"]).toBeDefined();
  const detail = document.components.schemas.Event.allOf?.[1];
  expect(detail?.properties?.applicationDeadline.nullable).toBe(true);
  expect(detail?.required).toContain("version");
});

const resolveSchema = (schema: Schema): Schema => {
  if (!schema.$ref) return schema;
  const parts = schema.$ref.split("/");
  const name = parts[parts.length - 1];
  if (!name || !document.components.schemas[name])
    throw new Error(`Unknown schema: ${schema.$ref}`);
  return document.components.schemas[name];
};

const validate = (
  value: unknown,
  inputSchema: Schema,
  path = "$",
): string[] => {
  const schema = resolveSchema(inputSchema);
  if (value === null)
    return schema.nullable ? [] : [`${path} must not be null`];
  if (schema.allOf)
    return schema.allOf.flatMap((part) => validate(value, part, path));
  if (schema.enum && !schema.enum.includes(value))
    return [`${path} is not in enum`];

  if (schema.type === "object") {
    if (typeof value !== "object" || Array.isArray(value))
      return [`${path} must be an object`];
    const record = value as Record<string, unknown>;
    const errors = (schema.required ?? [])
      .filter((name) => !(name in record))
      .map((name) => `${path}.${name} is required`);
    for (const [name, propertySchema] of Object.entries(
      schema.properties ?? {},
    )) {
      if (name in record)
        errors.push(
          ...validate(record[name], propertySchema, `${path}.${name}`),
        );
    }
    return errors;
  }
  if (schema.type === "array") {
    if (!Array.isArray(value)) return [`${path} must be an array`];
    return schema.items
      ? value.flatMap((item, index) =>
          validate(item, schema.items!, `${path}[${index}]`),
        )
      : [];
  }
  if (schema.type === "string") {
    if (typeof value !== "string") return [`${path} must be a string`];
    if (schema.minLength !== undefined && value.length < schema.minLength)
      return [`${path} is too short`];
    if (schema.maxLength !== undefined && value.length > schema.maxLength)
      return [`${path} is too long`];
    if (schema.pattern && !new RegExp(schema.pattern).test(value))
      return [`${path} has invalid format`];
  }
  if (schema.type === "integer" && !Number.isInteger(value))
    return [`${path} must be an integer`];
  if (schema.type === "boolean" && typeof value !== "boolean")
    return [`${path} must be a boolean`];
  return [];
};

describe("OpenAPI request contracts", () => {
  test("profile fields can explicitly be cleared", () => {
    expect(
      validate(
        { fullName: null, profileText: null, avatarUrl: null },
        document.components.schemas.ProfileUpdateRequest,
      ),
    ).toEqual([]);
  });

  test("organizer PATCH accepts partial updates and nullable fields", () => {
    expect(
      validate(
        { name: "New Name" },
        document.components.schemas.OrganizerUpdateRequest,
      ),
    ).toEqual([]);
    expect(
      validate(
        { description: null, websiteUrl: null, contactEmail: null },
        document.components.schemas.OrganizerUpdateRequest,
      ),
    ).toEqual([]);
  });
});

describe("OpenAPI response contracts", () => {
  test("auth response documents the 15 minute access token", () => {
    const expiresIn =
      document.components.schemas.AuthResponse.properties?.data.properties
        ?.expiresIn;
    expect(expiresIn).toMatchObject({ type: "integer", example: 900 });
  });

  test("registration event includes all required EventListItem fields", () => {
    const event = {
      id: crypto.randomUUID(),
      title: "Workshop",
      summary: null,
      format: "online",
      venueName: null,
      startAt: "2030-01-01T10:00:00Z",
      endAt: "2030-01-01T12:00:00Z",
      category: { id: crypto.randomUUID(), name: "Web", slug: "web" },
      organizer: {
        id: crypto.randomUUID(),
        name: "NexTech",
        slug: "nextech",
        status: "active",
      },
      tags: [],
      capacity: 20,
      confirmedCount: 10,
      waitlistCount: 2,
      registrationStatus: "confirmed",
    };
    expect(validate(event, document.components.schemas.EventListItem)).toEqual(
      [],
    );
    const { confirmedCount: _confirmedCount, ...invalidEvent } = event;
    expect(
      validate(invalidEvent, document.components.schemas.EventListItem),
    ).toContain("$.confirmedCount is required");
  });

  test("logout is documented as idempotent without required authentication", () => {
    const logout = document.paths["/auth/logout"]?.post as {
      security?: unknown[];
      responses?: Record<string, unknown>;
    };
    expect(logout.security).toEqual([]);
    expect(logout.responses?.["204"]).toBeDefined();
    expect(logout.responses?.["401"]).toBeUndefined();
  });
});
