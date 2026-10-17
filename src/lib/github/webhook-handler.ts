import {
  upsertRepository,
  upsertCommit,
  upsertPullRequest,
  upsertIssue,
  upsertWorkflowRun,
  recordWebhookDelivery,
  isDeliveryProcessed,
  prisma,
} from "@/lib/db";
import { broadcast } from "@/lib/realtime";
import {
  pushEventSchema,
  pullRequestEventSchema,
  issuesEventSchema,
  workflowRunEventSchema,
  repositoryEventSchema,
  createDeleteRefEventSchema,
} from "./schemas";

export interface WebhookProcessResult {
  status: number;
  message: string;
  ignored?: boolean;
  duplicate?: boolean;
}

/**
 * Handles incoming GitHub webhook events with idempotency and real-time broadcasting.
 */
export async function processWebhookEvent(
  event: string,
  deliveryId: string | null,
  rawJson: unknown,
): Promise<WebhookProcessResult> {
  // 1. Idempotency check with deliveryId
  if (deliveryId) {
    const alreadyProcessed = await isDeliveryProcessed(deliveryId);
    if (alreadyProcessed) {
      return {
        status: 200,
        message: "Delivery already processed (idempotent)",
        duplicate: true,
      };
    }
  }

  // 2. Handle ping event
  if (event === "ping") {
    if (deliveryId) {
      await recordWebhookDelivery(deliveryId, event);
    }
    return { status: 200, message: "Pong" };
  }

  // 3. Dispatch to specific event handler
  switch (event) {
    case "push": {
      const parsed = pushEventSchema.safeParse(rawJson);
      if (!parsed.success) {
        return { status: 400, message: "Invalid push payload schema" };
      }

      const payload = parsed.data;
      const repo = payload.repository;

      // Ensure repository is upserted with current pushedAt
      const repoPushedAt = repo.pushed_at ?? new Date();
      await upsertRepository({
        id: repo.id,
        name: repo.name,
        fullName: repo.full_name,
        description: repo.description,
        language: repo.language,
        stars: repo.stargazers_count,
        forks: repo.forks_count,
        openIssues: repo.open_issues_count,
        isPrivate: repo.private,
        isArchived: repo.archived,
        defaultBranch: repo.default_branch,
        htmlUrl: repo.html_url,
        pushedAt: repoPushedAt,
      });

      // If branch deletion, don't attempt to store commits
      if (payload.deleted) {
        broadcast("activity.new", {
          type: "branch.deleted",
          ref: payload.ref,
          repoFullName: repo.full_name,
        });
      } else {
        // Save commits (limit to reasonable max e.g. 50 to avoid overloading)
        const branch = payload.ref.replace("refs/heads/", "");
        const commitsToSave = payload.commits.slice(0, 50);

        for (const c of commitsToSave) {
          const committedAt = c.timestamp ? new Date(c.timestamp) : new Date();
          const savedCommit = await upsertCommit({
            sha: c.id,
            repoId: repo.id,
            message: c.message,
            authorName: c.author?.name ?? payload.pusher?.name ?? "Unknown",
            authorLogin: c.author?.username ?? payload.sender?.login ?? null,
            authorAvatar: payload.sender?.avatar_url ?? null,
            url: c.url ?? `${repo.html_url}/commit/${c.id}`,
            branch,
            committedAt,
          });

          // Broadcast each new commit
          broadcast("commit.new", {
            sha: savedCommit.sha,
            repoId: savedCommit.repoId.toString(),
            repoFullName: repo.full_name,
            message: savedCommit.message,
            authorName: savedCommit.authorName,
            authorLogin: savedCommit.authorLogin,
            authorAvatar: savedCommit.authorAvatar,
            branch: savedCommit.branch,
            committedAt: savedCommit.committedAt.toISOString(),
            url: savedCommit.url,
          });
        }
      }

      broadcast("repo.updated", {
        repoId: repo.id.toString(),
        fullName: repo.full_name,
        pushedAt: repoPushedAt.toISOString(),
      });

      break;
    }

    case "pull_request": {
      const parsed = pullRequestEventSchema.safeParse(rawJson);
      if (!parsed.success) {
        return { status: 400, message: "Invalid pull_request payload schema" };
      }

      const { pull_request: pr, repository: repo } = parsed.data;

      // Ensure repository exists
      await upsertRepository({
        id: repo.id,
        name: repo.name,
        fullName: repo.full_name,
        description: repo.description,
        language: repo.language,
        stars: repo.stargazers_count,
        forks: repo.forks_count,
        openIssues: repo.open_issues_count,
        isPrivate: repo.private,
        isArchived: repo.archived,
        defaultBranch: repo.default_branch,
        htmlUrl: repo.html_url,
        pushedAt: repo.pushed_at,
      });

      const savedPr = await upsertPullRequest({
        id: pr.id,
        repoId: repo.id,
        number: pr.number,
        title: pr.title,
        state: pr.state,
        merged: pr.merged,
        author: pr.user?.login ?? "unknown",
        url: pr.html_url,
        createdAt: pr.created_at,
        updatedAt: pr.updated_at,
        closedAt: pr.closed_at,
      });

      broadcast("pr.updated", {
        id: savedPr.id.toString(),
        repoId: savedPr.repoId.toString(),
        repoFullName: repo.full_name,
        number: savedPr.number,
        title: savedPr.title,
        state: savedPr.state,
        merged: savedPr.merged,
        author: savedPr.author,
        url: savedPr.url,
        updatedAt: savedPr.updatedAt.toISOString(),
      });

      break;
    }

    case "issues": {
      const parsed = issuesEventSchema.safeParse(rawJson);
      if (!parsed.success) {
        return { status: 400, message: "Invalid issues payload schema" };
      }

      const { issue, repository: repo } = parsed.data;

      // Ensure repository exists
      await upsertRepository({
        id: repo.id,
        name: repo.name,
        fullName: repo.full_name,
        description: repo.description,
        language: repo.language,
        stars: repo.stargazers_count,
        forks: repo.forks_count,
        openIssues: repo.open_issues_count,
        isPrivate: repo.private,
        isArchived: repo.archived,
        defaultBranch: repo.default_branch,
        htmlUrl: repo.html_url,
        pushedAt: repo.pushed_at,
      });

      const savedIssue = await upsertIssue({
        id: issue.id,
        repoId: repo.id,
        number: issue.number,
        title: issue.title,
        state: issue.state,
        author: issue.user?.login ?? "unknown",
        labels: JSON.stringify(issue.labels),
        url: issue.html_url,
        createdAt: issue.created_at,
        updatedAt: issue.updated_at,
        closedAt: issue.closed_at,
      });

      broadcast("issue.updated", {
        id: savedIssue.id.toString(),
        repoId: savedIssue.repoId.toString(),
        repoFullName: repo.full_name,
        number: savedIssue.number,
        title: savedIssue.title,
        state: savedIssue.state,
        author: savedIssue.author,
        labels: issue.labels,
        url: savedIssue.url,
        updatedAt: savedIssue.updatedAt.toISOString(),
      });

      break;
    }

    case "workflow_run": {
      const parsed = workflowRunEventSchema.safeParse(rawJson);
      if (!parsed.success) {
        return { status: 400, message: "Invalid workflow_run payload schema" };
      }

      const { workflow_run: run, repository: repo } = parsed.data;

      // Ensure repository exists
      await upsertRepository({
        id: repo.id,
        name: repo.name,
        fullName: repo.full_name,
        description: repo.description,
        language: repo.language,
        stars: repo.stargazers_count,
        forks: repo.forks_count,
        openIssues: repo.open_issues_count,
        isPrivate: repo.private,
        isArchived: repo.archived,
        defaultBranch: repo.default_branch,
        htmlUrl: repo.html_url,
        pushedAt: repo.pushed_at,
      });

      const savedRun = await upsertWorkflowRun({
        id: run.id,
        repoId: repo.id,
        name: run.name ?? "Workflow",
        branch: run.head_branch,
        status: run.status,
        conclusion: run.conclusion,
        url: run.html_url,
        startedAt: run.run_started_at,
        updatedAt: run.updated_at,
      });

      broadcast("workflow.updated", {
        id: savedRun.id.toString(),
        repoId: savedRun.repoId.toString(),
        repoFullName: repo.full_name,
        name: savedRun.name,
        branch: savedRun.branch,
        status: savedRun.status,
        conclusion: savedRun.conclusion,
        url: savedRun.url,
        updatedAt: savedRun.updatedAt.toISOString(),
      });

      break;
    }

    case "repository": {
      const parsed = repositoryEventSchema.safeParse(rawJson);
      if (!parsed.success) {
        return { status: 400, message: "Invalid repository payload schema" };
      }

      const { action, repository: repo } = parsed.data;

      if (action === "deleted") {
        await prisma.repository.deleteMany({ where: { id: repo.id } });
      } else {
        await upsertRepository({
          id: repo.id,
          name: repo.name,
          fullName: repo.full_name,
          description: repo.description,
          language: repo.language,
          stars: repo.stargazers_count,
          forks: repo.forks_count,
          openIssues: repo.open_issues_count,
          isPrivate: repo.private,
          isArchived: repo.archived,
          defaultBranch: repo.default_branch,
          htmlUrl: repo.html_url,
          pushedAt: repo.pushed_at,
        });
      }

      broadcast("repo.updated", {
        repoId: repo.id.toString(),
        fullName: repo.full_name,
        action,
      });

      break;
    }

    case "create":
    case "delete": {
      const parsed = createDeleteRefEventSchema.safeParse(rawJson);
      if (parsed.success) {
        const { ref_type, ref, repository: repo, sender } = parsed.data;
        broadcast("activity.new", {
          type: `${event}.${ref_type}`,
          ref,
          repoFullName: repo.full_name,
          author: sender?.login,
        });
      }
      break;
    }

    default: {
      // Ignored event, return 200 without processing
      return { status: 200, message: `Event '${event}' ignored`, ignored: true };
    }
  }

  // Record delivery for idempotency
  if (deliveryId) {
    await recordWebhookDelivery(deliveryId, event);
  }

  return { status: 200, message: "Event processed successfully" };
}
