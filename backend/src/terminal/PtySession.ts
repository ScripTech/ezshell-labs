import { Socket } from "socket.io";
import { Client as SSHClient } from "ssh2";
import pty, { IPty } from "node-pty";
import fs from "fs";

export type PtyType = "local" | "ssh";

export interface PtySessionOptions {
  type: PtyType;
  cols: number;
  rows: number;
  cwd?: string;
  sshConfig?: {
    host: string;
    port: number;
    username: string;
    password?: string;
    privateKeyPath?: string;
  };
}

export class PtySession {
  private ptyProcess?: IPty;
  private sshStream?: any;
  private sshConn?: SSHClient;
  private socket: Socket;

  constructor(socket: Socket, options: PtySessionOptions) {
    this.socket = socket;
    if (options.type === "local") {
      this.ptyProcess = pty.spawn("bash", [], {
        name: "xterm-color",
        cols: options.cols,
        rows: options.rows,
        cwd: options.cwd || process.env.HOME,
        env: process.env,
      });
      this.ptyProcess.onData((data) => {
        this.socket.emit("stdout", data);
      });
      this.socket.on("command", (msg) => {
        this.ptyProcess?.write(msg.data);
      });
      this.socket.on("resize", ({ cols, rows }) => {
        console.log("Resize has been called")
        alert("testing")
        this.ptyProcess?.resize(cols, rows);
      });
    } else if (options.type === "ssh" && options.sshConfig) {
      this.sshConn = new SSHClient();

      // Prepare connection options
      const connectOptions: any = {
        host: options.sshConfig.host,
        port: options.sshConfig.port,
        username: options.sshConfig.username,
        tryKeyboard: false,
        readyTimeout: 30000, // 30 second timeout
      };

      // Use private key if provided, otherwise fall back to password
      if (options.sshConfig.privateKeyPath) {
        console.log(`Checking private key path: "${options.sshConfig.privateKeyPath}"`);
        console.log(`Private key file exists: ${fs.existsSync(options.sshConfig.privateKeyPath)}`);

        if (fs.existsSync(options.sshConfig.privateKeyPath)) {
          try {
            const privateKey = fs.readFileSync(options.sshConfig.privateKeyPath);
            connectOptions.privateKey = privateKey;
            console.log(`✅ Using private key authentication for ${options.sshConfig.host} (key size: ${privateKey.length} bytes)`);
          } catch (error) {
            console.error(`❌ Failed to read private key from ${options.sshConfig.privateKeyPath}:`, error);
            if (options.sshConfig.password) {
              connectOptions.password = options.sshConfig.password;
              console.log(`🔄 Falling back to password authentication for ${options.sshConfig.host}`);
            } else {
              this.socket.emit("stdout", "*** SSH KEY ERROR: Cannot read private key and no password provided ***\r\n");
              return;
            }
          }
        } else {
          console.warn(`⚠️ Private key file does not exist: ${options.sshConfig.privateKeyPath}`);
          if (options.sshConfig.password) {
            connectOptions.password = options.sshConfig.password;
            console.log(`🔄 Falling back to password authentication for ${options.sshConfig.host}`);
          } else {
            this.socket.emit("stdout", "*** SSH KEY ERROR: Private key file not found and no password provided ***\r\n");
            return;
          }
        }
      } else if (options.sshConfig.password) {
        connectOptions.password = options.sshConfig.password;
        console.log(`Using password authentication for ${options.sshConfig.host}`);
      } else {
        this.socket.emit("stdout", "*** SSH AUTH ERROR: No private key or password provided ***\r\n");
        return;
      }

      this.sshConn
        .on("ready", () => {
          this.sshConn!.shell(
            {
              cols: options.cols,
              rows: options.rows,
              term: "xterm-color",
            },
            (err, stream) => {
              if (err) {
                this.socket.emit("stdout", "*** SSH SHELL ERROR: " + err.message + " ***\r\n");
                return;
              }
              this.sshStream = stream;
              stream.on("data", (data: Buffer) => {
                this.socket.emit("stdout", data.toString("utf-8"));
              });
              this.socket.on("command", (msg) => {
                stream.write(msg.data);
              });
              this.socket.on("resize", ({ cols, rows }) => {
                stream.setWindow(rows, cols, 600, 800);
              });
              stream.on("close", () => {
                this.sshConn?.end();
              });
            }
          );
        })
        .on("error", (err) => {
          console.error("SSH connection error:", err);
          this.socket.emit("stdout", `*** SSH CONNECTION ERROR: ${err.message} ***\r\n`);
        })
        .connect(connectOptions);
    }
  }

  dispose() {
    if (this.ptyProcess) {
      this.ptyProcess.kill();
    }
    if (this.sshConn) {
      this.sshConn.end();
    }
  }
}
