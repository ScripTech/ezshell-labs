import { NodeSSH } from "node-ssh";

export const ssh = new NodeSSH();

export async function connectSSH() {
  await ssh.connect({
    // host: "challenge-environment",
    host: "openssh-server",
    port: 2222,
    username: "lab-user",
    password: "password",
    // privateKey: "/path/to/validator_key",
  });
}

export async function validateFileExistence(
  username: string
): Promise<boolean> {
  try {
    const result = await ssh.execCommand(`test -f /home/${username}/filename`);
    return result.code === 0;
  } catch (error) {
    console.error("SSH execution error:", error);
    return false;
  }
}

export async function validateFileContent(username: string): Promise<boolean> {
  try {
    const result = await ssh.execCommand(`cat /home/${username}/filename`);
    return result.stdout.trim() === "hello world";
  } catch (error) {
    console.error("SSH execution error:", error);
    return false;
  }
}
