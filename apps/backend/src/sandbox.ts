import "dotenv/config";
import { Sandbox } from "@e2b/code-interpreter";
import path from "path";


export type ProjectFiles = Record<string, string>;

/** Optional callback to stream log lines (e.g. for SSE). Still logs to console. */
export type SandboxLogCallback = (message: string) => void;

export async function createSandbox(
  project: ProjectFiles,
  onLog?: SandboxLogCallback
) {
  const log = (msg: string) => {
    console.log(msg);
    onLog?.(msg);
  };

  // Create sandbox
  const sbx = await Sandbox.create({
    timeoutMs: 3600_000 //1hr 
  });

  log(`Sandbox created: ${sbx.sandboxId}`);

  const uniqueDirs = new Set(
    Object.keys(project).map((filePath) => path.dirname(filePath))
  );

  const dirsToCreate = [...uniqueDirs].filter(
    (dir) => dir !== "." && dir !== "/"
  );

  if (dirsToCreate.length > 0) {
    await Promise.all(
      dirsToCreate.map((dir) =>
        sbx.commands.run(`mkdir -p ${dir}`)
      )
    );
  }

  //Write files to sandbox
  log("Writing project files to sandbox...");
  await Promise.all(
    Object.entries(project).map(([filePath, content]) => {
      log(`→ ${filePath} (${content.length} chars)`);
      return sbx.files.write(filePath, content);
    })
  );

  log("Installing dependencies...");
  await sbx.commands.run("npm install");

  //   Start dev server (background)
  log("Starting dev server...");
  await sbx.commands.run("npm run dev", { background: true });

  //Generate preview URL
  const port = 5173;
  const host = sbx.getHost(port);
  const url = `https://${host}`;

  log(`Preview running at: ${url}`);

  return {
    sandboxId: sbx.sandboxId,
    url,
  };
};

//check if sandbox is still live
export async function isSandboxAlive(sandboxId: string): Promise<boolean> {
  try {
    const sbx = await Sandbox.connect(sandboxId);
    //try running a simple cmd to verify weather responsive
    await sbx.commands.run("echo 'alive'", { timeoutMs: 5000 });
    return true;
  } catch (err) {
    console.log(`sandbox @: ${sandboxId} is not alive`, err);
    return false;
  }
}
// Resurrect a dead sandbox by creating a new one with the same files
export async function resurrectSandbox(files: ProjectFiles): Promise<{ sandboxId: string, url: string }> {
  console.log("Resurrecting sandbox with project files...");
  return createSandbox(files);
}

// Update files in an existing sandbox

export async function updateSandboxFiles(
  sandboxId: string,
  files: Record<string, string>
): Promise<void> {
  console.log(`Connecting to sandbox: ${sandboxId}`);

  // Connect to existing sandbox
  const sbx = await Sandbox.connect(sandboxId);

  console.log(`Updating ${Object.keys(files).length} files in sandbox...`);

  // Create any new directories that might be needed
  const uniqueDirs = new Set(
    Object.keys(files).map((filePath) => path.dirname(filePath))
  );

  const dirsToCreate = [...uniqueDirs].filter(
    (dir) => dir !== "." && dir !== "/"
  );

  if (dirsToCreate.length > 0) {
    await Promise.all(
      dirsToCreate.map((dir) =>
        sbx.commands.run(`mkdir -p ${dir}`)
      )
    );
  }

  // Write updated files
  await Promise.all(
    Object.entries(files).map(([filePath, content]) => {
      console.log(`→ Updating ${filePath}`);
      return sbx.files.write(filePath, content);
    })
  );

  // Check if dev server is running by checking if port 5173 is listening
  // Using lsof or netstat to check for actual port binding
  const checkResult = await sbx.commands.run("lsof -i :5173 2>/dev/null || netstat -tlnp 2>/dev/null | grep 5173 || echo 'port_not_open'");
  const isServerRunning = !checkResult.stdout.includes("port_not_open") && checkResult.stdout.trim().length > 0;

  console.log(`Port check result: ${isServerRunning ? 'running' : 'not running'}`);

  if (!isServerRunning) {
    console.log("Dev server not running, restarting...");
    // Reinstall dependencies in case package.json changed
    await sbx.commands.run("npm install");
    // Restart the dev server in background
    await sbx.commands.run("npm run dev", { background: true });
    // Wait for the server to start
    await new Promise((resolve) => setTimeout(resolve, 5000));
    console.log("Dev server restarted.");
  } else {
    console.log("Dev server is running. Files updated successfully.");
  }
}

///Temporarily update files in sandbox for validation (doesn't save to DB) */

export async function updateSandboxFilesTemporary(
  sandboxId: string,
  files: Record<string, string>
): Promise<void> {
  console.log(`Connecting to sandbox for temp update: ${sandboxId}`);

  const sbx = await Sandbox.connect(sandboxId);

  console.log(`Temporarily updating ${Object.keys(files).length} files in sandbox...`);

  // Create any new directories that might be needed
  const uniqueDirs = new Set(
    Object.keys(files).map((filePath) => path.dirname(filePath))
  );

  const dirsToCreate = [...uniqueDirs].filter(
    (dir) => dir !== "." && dir !== "/"
  );

  if (dirsToCreate.length > 0) {
    await Promise.all(
      dirsToCreate.map((dir) =>
        sbx.commands.run(`mkdir -p ${dir}`)
      )
    );
  }

  // Write updated files
  await Promise.all(
    Object.entries(files).map(([filePath, content]) => {
      console.log(`→ Temp updating ${filePath}`);
      return sbx.files.write(filePath, content);
    })
  );
}

///Validate sandbox build by running npm run build */

export async function validateSandboxBuild(
  sandboxId: string
): Promise<{ success: boolean; errors?: string }> {
  console.log(`Validating build in sandbox: ${sandboxId}`);

  const sbx = await Sandbox.connect(sandboxId);

  // Run vite build to check for errors
  const result = await sbx.commands.run("npm run build 2>&1", {
    timeoutMs: 60000, // 60 seconds timeout for build
  });

  console.log(`Build exit code: ${result.exitCode}`);

  if (result.exitCode !== 0) {
    const errors = result.stdout + (result.stderr || "");
    console.log(`Build failed with errors:\n${errors}`);
    return { success: false, errors };
  }

  console.log("Build validation successful");
  return { success: true };
}