import { Socket } from "socket.io";
import { Client as SSHClient } from "ssh2";
import pty, { IPty } from "node-pty";

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
    password: string;
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
        .connect(options.sshConfig);
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
