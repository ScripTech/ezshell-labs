import { NodeSSH } from "node-ssh";

export const ssh = new NodeSSH();

export async function connectSSH() {
  await ssh.connect({
    // host: "challenge-environment",
    host: process.env.LAB_SSH_HOST,
    port: 22,
    username: process.env.LAB_SSH_USERNAME ?? "lab-user",
    password: process.env.LAB_SSH_PASSWORD ?? "password",
    // privateKey: "/path/to/validator_key",
  });
}

export async function executeCommand(command: string) {
 try {
   const result = await ssh.execCommand(command);
   return result.stdout.trim();
 } catch (error: any) {
  console.error("Error while executing command!", error);
  return `Ups! Fatal error while executing command. Error: ${error}`;
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
