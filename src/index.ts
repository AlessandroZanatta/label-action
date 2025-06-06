import * as core from "@actions/core";
import { Octokit } from "@octokit/rest";
import * as github from "@actions/github";

async function run(): Promise<void> {
  try {
    const githubToken: string = core.getInput("github_token");
    const [owner, repo] = core.getInput("repo").split("/");
    const gitea: boolean = core.getInput("gitea") === "true";

    const issue_number: number =
      core.getInput("number") === ""
        ? github.context.issue.number
        : Number(core.getInput("number", { required: true }));

    const toAdd: string[] = core
      .getInput("add")
      .split(",")
      .map((part) => part.trim())
      .filter((part) => part !== "");

    const toRemove: string[] = core
      .getInput("remove")
      .split(",")
      .map((part) => part.trim())
      .filter((part) => part !== "");

    const octokit = new Octokit({
      auth: githubToken,
      baseUrl: process.env.GITHUB_API_URL || "https://api.github.com",
    });

    const currentLabelsResponse = await octokit.issues.listLabelsOnIssue({
      owner,
      repo,
      issue_number,
    });

    const currentLabelMap: { [name: string]: number } = {};
    currentLabelsResponse.data.forEach((label) => {
      if (label.name && label.id) {
        currentLabelMap[label.name] = label.id;
      }
    });

    const currentLabelNames: string[] = Object.keys(currentLabelMap);

    await Promise.all(
      toRemove.map(async (label) => {
        if (currentLabelNames.includes(label)) {
          const labelId = currentLabelMap[label];
          if (!gitea) {
            await octokit.issues.removeLabel({
              owner,
              repo,
              issue_number,
              name: label,
            });
            core.info(`Removed label '${label}' correctly`);
          } else if (labelId) {
            const giteaRemoveLabelPath = `/repos/${owner}/${repo}/issues/${issue_number}/labels/${labelId}`;
            await octokit.request({
              method: "DELETE",
              url: giteaRemoveLabelPath,
            });
            core.info(`Removed label '${label}' correctly`);
          } else {
            core.info(
              `Label '${label}' found in list but ID not mapped, skipping removal`,
            );
          }
        } else {
          core.info(
            `Label '${label}' not set on #${issue_number}, skipping removal`,
          );
        }
      }),
    );

    await Promise.all(
      toAdd.map(async (label) => {
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
      }),
    );
  } catch (error: any) {
    core.error(`Failed: ${error.message}`);
    throw new Error(`Failed: ${error.message}`);
  }
}

run();
