import { z } from 'zod';
import { insertConfigSchema, insertCommandSchema, botConfigs, commands } from './schema';

export const errorSchemas = {
  validation: z.object({ message: z.string(), field: z.string().optional() }),
  notFound: z.object({ message: z.string() }),
  internal: z.object({ message: z.string() }),
};

export const api = {
  config: {
    get: {
      method: 'GET' as const,
      path: '/api/config' as const,
      responses: {
        200: z.custom<typeof botConfigs.$inferSelect | null>(),
      }
    },
    update: {
      method: 'POST' as const,
      path: '/api/config' as const,
      input: insertConfigSchema.partial(),
      responses: {
        200: z.custom<typeof botConfigs.$inferSelect>(),
        400: errorSchemas.validation,
      }
    },
    toggle: {
      method: 'POST' as const,
      path: '/api/config/toggle' as const,
      input: z.object({ isActive: z.boolean() }),
      responses: {
        200: z.custom<typeof botConfigs.$inferSelect>(),
      }
    }
  },
  commands: {
    list: {
      method: 'GET' as const,
      path: '/api/commands' as const,
      responses: {
        200: z.array(z.custom<typeof commands.$inferSelect>()),
      }
    },
    create: {
      method: 'POST' as const,
      path: '/api/commands' as const,
      input: insertCommandSchema,
      responses: {
        201: z.custom<typeof commands.$inferSelect>(),
        400: errorSchemas.validation,
      }
    },
    update: {
      method: 'PUT' as const,
      path: '/api/commands/:id' as const,
      input: insertCommandSchema.partial(),
      responses: {
        200: z.custom<typeof commands.$inferSelect>(),
        400: errorSchemas.validation,
        404: errorSchemas.notFound,
      }
    },
    delete: {
      method: 'DELETE' as const,
      path: '/api/commands/:id' as const,
      responses: {
        204: z.void(),
        404: errorSchemas.notFound,
      }
    },
    test: {
      method: 'POST' as const,
      path: '/api/commands/:id/test' as const,
      responses: {
        200: z.object({ success: z.boolean(), message: z.string() }),
        404: errorSchemas.notFound,
      }
    }
  }
};

export function buildUrl(path: string, params?: Record<string, string | number>): string {
  let url = path;
  if (params) {
    Object.entries(params).forEach(([key, value]) => {
      if (url.includes(`:${key}`)) {
        url = url.replace(`:${key}`, String(value));
      }
    });
  }
  return url;
}

export type BotConfigResponse = z.infer<typeof api.config.get.responses[200]>;
export type CommandResponse = z.infer<typeof api.commands.create.responses[201]>;
export type CommandListResponse = z.infer<typeof api.commands.list.responses[200]>;
