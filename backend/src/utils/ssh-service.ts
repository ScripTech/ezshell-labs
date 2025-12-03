import { NodeSSH } from "node-ssh";

export const ssh = new NodeSSH();

export async function connectSSH() {
  try {

    await ssh.connect({
      host: process.env.LAB_SSH_HOST,
      port: 22,
      username: process.env.LAB_SSH_USERNAME ?? "lab-user",
      password: process.env.LAB_SSH_PASSWORD ?? "password",
    });

    // Set up OpenShift environment
    // Set KUBECONFIG environment variable
    // await executeCommand(
    //   "export KUBECONFIG=/opt/.kubeconf/kubeconfig-noingress"
    // );

    // // Login to OpenShift cluster
    // const loginResult = await executeCommand(
    //   `oc login -u ${process.env.OCP_USERNAME ?? "kubeadmin"} -p ${process.env.OCP_PASSWORD ?? "password"} ${process.env.OCP_SERVER ?? "https://api.emucanze.ezetsu.lab:6443"} --insecure-skip-tls-verify=true`
    // );

    // if (loginResult.includes("Login successful")) {
    //   console.log("Successfully logged into OpenShift cluster");
    // } else {
    //   throw new Error("Failed to login to OpenShift cluster");
    // }

  } catch (error) {
    console.error("Failed to connect and setup environment:", error);
    if (typeof error === "object" && error !== null) {
      console.error("Error details:", {
        message: (error as any).message,
        code: (error as any).code,
        level: (error as any).level
      });
    }
    throw error;
  }
}

export async function executeCommand(command: string) {
  try {
    console.log("Executing command:", command);
    const result = await ssh.execCommand(command, {
      execOptions: {
        env: {
          KUBECONFIG: '/etc/kubernetes/admin.conf',
          PATH: '/usr/local/bin:/usr/bin:/bin:/usr/local/sbin:/usr/sbin',
          NODE_ENV: "test"
        }
      }
    });

    console.log("Command result:", {
      code: result.code,
      stdout: result.stdout,
      stderr: result.stderr
    });

    if (result.code !== 0) {
      console.error("Command failed with code:", result.code);
      console.error("STDERR:", result.stderr);
      console.error("STDOUT:", result.stdout);
      throw new Error(`Command failed with exit code ${result.code}: ${result.stderr || result.stdout}`);
    }

    return result.stdout.trim();
  } catch (error) {
    if (error instanceof Error) {
      console.error("Error while executing command!", error.message);
    } else {
      console.error("Error while executing command!", error);
    }
    console.error("Command was:", command);
    return "Error executing command";
    // throw new Error(`Command execution failed: ${error instanceof Error ? error.message : String(error)}`);
  }
}

export async function validateFileExistence(
  username: string
): Promise<boolean> {
  try {
    const result = await ssh.execCommand(`test -f /home/${username}/python/mensagem`);
    return result.code === 0;
  } catch (error) {
    console.error("Exercise 1 - File not created:", error);
    return false;
  }
}

export async function validateFileContent(username: string): Promise<boolean> {
  try {
    const result = await ssh.execCommand(`cat /home/${username}/python/mensagem`);
    return result.stdout.trim() === "eKuroZetsu @ DevOps Automation";
  } catch (error) {
    console.error("Exercise 1 - Invalid content", error);
    return false;
  }
}

export async function testConnection(): Promise<{ success: boolean; message: string }> {
  try {
    if (!ssh.isConnected()) {
      console.log("SSH not connected, attempting to connect...");
      await connectSSH();
    }

    // Test basic command execution
    const result = await executeCommand("echo 'SSH connection test successful'");

    if (result.includes("SSH connection test successful")) {
      return { success: true, message: "SSH connection is working properly" };
    } else {
      return { success: false, message: "SSH connection test failed - unexpected response" };
    }
  } catch (error) {
    console.error("SSH connection test failed:", error);
    return {
      success: false,
      message: `SSH connection failed: ${error instanceof Error ? error.message : 'Unknown error'}`
    };
  }
}
