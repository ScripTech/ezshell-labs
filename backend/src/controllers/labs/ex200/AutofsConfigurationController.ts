import { Socket } from "socket.io";
import { AutofsConfigurationService } from "../../../services/ex200/AutofsConfigurationService";

export class AutofsConfigurationController {
  private service: AutofsConfigurationService;
  constructor() {
    this.service = new AutofsConfigurationService();
  }

  handleValidation = async (socket: Socket, questionId: string) => {
    socket.emit(`validation-${questionId}-step`, {
      step: "nfsuser home directory",
      status: "loading",
    });
    const nfsuser = await this.service.validateNFSDir("nfsuser");
    socket.emit(`validation-${questionId}-step`, {
      step: "nfsuser home directory",
      status: nfsuser ? "success" : "failed",
    });

    socket.emit(`validation-${questionId}-step`, {
      step: "NFS-exports directory",
      status: "loading",
    });
    const nfsExports = await this.service.validateNFSexports("nfsuser");
    socket.emit(`validation-${questionId}-step`, {
      step: "NFS-exports directory",
      status: nfsExports ? "success" : "failed",
    });

    socket.emit(`validation-${questionId}-step`, {
      step: "Home directories is writable",
      status: "loading",
    });
    const homeWritable = await this.service.validateHomeWritable("nfsuser");
    socket.emit(`validation-${questionId}-step`, {
      step: "Home directories is writable",
      status: homeWritable ? "success" : "failed",
    });
  };
}
