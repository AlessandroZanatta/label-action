import * as core from "@actions/core";
import { Octokit } from "@octokit/rest";
import * as github from "@actions/github";

async function run(): Promise<void> {
  try {
    const githubToken: string = core.getInput("github_token");
    const [owner, repo] = core.getInput("repo").split("/");

    const issue_number: number =
      core.getInput("number") === ""
        ? github.context.issue.number
        : Number(core.getInput("number", { required: true }));

    const toAdd: string[] = core
      .getInput("add")
      .split(",")
      .map((part) => part.trim());
    const toRemove: string[] = core
      .getInput("remove")
      .split(",")
      .map((part) => part.trim());

    const octokit = new Octokit({
      auth: githubToken,
      baseUrl: process.env.GITHUB_API_URL || "https://api.github.com",
    });

    const currentLabels = await octokit.issues.listLabelsOnIssue({
      owner,
      repo,
      issue_number,
    });

    const currentLabelNames: string[] = currentLabels.data.map(
      (label) => label.name,
    );

    toRemove.forEach(async (label) => {
      if (currentLabelNames.includes(label)) {
        await octokit.issues.removeLabel({
          owner,
          repo,
          issue_number,
          name: label,
        });
        core.info(`Removed label '${label}' correctly`);
      } else {
        core.info(
          `Label '${label}' not set on issue/PR #${issue_number}, skipping removal`,
        );
      }
    });

    await octokit.issues.addLabels({
      owner,
      repo,
      issue_number,
      labels: toAdd,
    });

    toAdd.forEach(async (label) => {
      if (!currentLabelNames.includes(label)) {
        await octokit.issues.addLabels({
          owner,
          repo,
          issue_number,
          labels: [label],
        });
        core.info(`Added label '${label}' correctly`);
      } else {
        core.info(
          `Label '${label}' was already present on issue/PR #${issue_number}, skipping addition`,
        );
      }
    });
  } catch (error: any) {
    core.error(`Failed: ${error.message}`);
    throw new Error(`Failed: ${error.message}`);
  }
}

// Call the main function
run();
