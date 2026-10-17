import { z } from "zod";

/**
 * Defensive schema for GitHub repository payload found in webhook events.
 */
export const githubRepoSchema = z.object({
  id: z.union([z.number(), z.string(), z.bigint()]).transform((val) => BigInt(val)),
  name: z.string(),
  full_name: z.string(),
  description: z.string().nullable().optional(),
  language: z.string().nullable().optional(),
  stargazers_count: z.number().optional().default(0),
  forks_count: z.number().optional().default(0),
  open_issues_count: z.number().optional().default(0),
  private: z.boolean().optional().default(false),
  archived: z.boolean().optional().default(false),
  default_branch: z.string().optional().default("main"),
  html_url: z.string(),
  pushed_at: z
    .union([z.number(), z.string()])
    .nullable()
    .optional()
    .transform((val) => (val ? new Date(val) : null)),
});

export type GithubRepoPayload = z.infer<typeof githubRepoSchema>;

/**
 * Push event commit item schema
 */
export const pushCommitSchema = z.object({
  id: z.string(), // sha
  message: z.string().default("No commit message"),
  timestamp: z.string().optional(),
  url: z.string().optional(),
  author: z
    .object({
      name: z.string().optional().default("Unknown"),
      email: z.string().optional(),
      username: z.string().optional(),
    })
    .optional(),
});

export const pushEventSchema = z.object({
  ref: z.string(),
  before: z.string().optional(),
  after: z.string().optional(),
  created: z.boolean().optional().default(false),
  deleted: z.boolean().optional().default(false),
  forced: z.boolean().optional().default(false),
  repository: githubRepoSchema,
  commits: z.array(pushCommitSchema).optional().default([]),
  head_commit: pushCommitSchema.nullable().optional(),
  pusher: z
    .object({
      name: z.string().optional(),
      email: z.string().optional(),
    })
    .optional(),
  sender: z
    .object({
      login: z.string().optional(),
      avatar_url: z.string().optional(),
    })
    .optional(),
});

export type PushEventPayload = z.infer<typeof pushEventSchema>;

/**
 * Pull request event schema
 */
export const pullRequestEventSchema = z.object({
  action: z.string(),
  number: z.number(),
  pull_request: z.object({
    id: z.union([z.number(), z.string(), z.bigint()]).transform((val) => BigInt(val)),
    number: z.number(),
    title: z.string().default("Untitled PR"),
    state: z.string().default("open"),
    merged: z.boolean().optional().default(false),
    user: z
      .object({
        login: z.string().optional().default("unknown"),
      })
      .optional(),
    html_url: z.string(),
    created_at: z.string().transform((val) => new Date(val)),
    updated_at: z.string().transform((val) => new Date(val)),
    closed_at: z
      .string()
      .nullable()
      .optional()
      .transform((val) => (val ? new Date(val) : null)),
  }),
  repository: githubRepoSchema,
});

export type PullRequestEventPayload = z.infer<typeof pullRequestEventSchema>;

/**
 * Issues event schema
 */
export const issuesEventSchema = z.object({
  action: z.string(),
  issue: z.object({
    id: z.union([z.number(), z.string(), z.bigint()]).transform((val) => BigInt(val)),
    number: z.number(),
    title: z.string().default("Untitled Issue"),
    state: z.string().default("open"),
    user: z
      .object({
        login: z.string().optional().default("unknown"),
      })
      .optional(),
    labels: z
      .array(
        z.union([
          z.string(),
          z.object({
            name: z.string(),
          }),
        ]),
      )
      .optional()
      .default([])
      .transform((labels) => labels.map((l) => (typeof l === "string" ? l : l.name))),
    html_url: z.string(),
    created_at: z.string().transform((val) => new Date(val)),
    updated_at: z.string().transform((val) => new Date(val)),
    closed_at: z
      .string()
      .nullable()
      .optional()
      .transform((val) => (val ? new Date(val) : null)),
  }),
  repository: githubRepoSchema,
});

export type IssuesEventPayload = z.infer<typeof issuesEventSchema>;

/**
 * Workflow run event schema
 */
export const workflowRunEventSchema = z.object({
  action: z.string(),
  workflow_run: z.object({
    id: z.union([z.number(), z.string(), z.bigint()]).transform((val) => BigInt(val)),
    name: z.string().nullable().optional().default("Workflow"),
    head_branch: z.string().nullable().optional(),
    status: z.string().default("queued"),
    conclusion: z.string().nullable().optional(),
    html_url: z.string(),
    run_started_at: z
      .string()
      .nullable()
      .optional()
      .transform((val) => (val ? new Date(val) : null)),
    updated_at: z.string().transform((val) => new Date(val)),
  }),
  repository: githubRepoSchema,
});

export type WorkflowRunEventPayload = z.infer<typeof workflowRunEventSchema>;

/**
 * Repository event schema (create, delete, archived, unarchived, renamed)
 */
export const repositoryEventSchema = z.object({
  action: z.string(),
  repository: githubRepoSchema,
});

export type RepositoryEventPayload = z.infer<typeof repositoryEventSchema>;

/**
 * Create/delete branch or tag event schema
 */
export const createDeleteRefEventSchema = z.object({
  ref_type: z.string(), // branch or tag
  ref: z.string(),
  repository: githubRepoSchema,
  sender: z
    .object({
      login: z.string().optional(),
    })
    .optional(),
});

export type CreateDeleteRefEventPayload = z.infer<typeof createDeleteRefEventSchema>;
