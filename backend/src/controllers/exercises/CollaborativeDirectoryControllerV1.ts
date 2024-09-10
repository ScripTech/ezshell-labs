import { Socket } from "socket.io";
import { CollaborativeDirectoryServiceV1 } from "../../services/CollaborativeDirectoryServiceV1";

export class CollaborativeDirectoryControllerV1 {
  private service: CollaborativeDirectoryServiceV1;

  constructor() {
    this.service = new CollaborativeDirectoryServiceV1();
  }

  handleValidation = async (socket: Socket, questionId: string) => {
    socket.emit(`validation-${questionId}-step`, {
      step: "Directory exist",
      status: "loading",
    });
    const dirExist = await this.service.validateDir("/shared/sysadm");
    socket.emit(`validation-${questionId}-step`, {
      step: "Directory exist",
      status: dirExist ? "success" : "failed",
    });


    socket.emit(`validation-${questionId}-step`, {
      step: "Group ownership is sysadm",
      status: "loading",
    });
    const gOwnership = await this.service.validateGroupOwnership("/shared/sysadm", "sysadm");
    socket.emit(`validation-${questionId}-step`, {
      step: "Group ownership is sysadm",
      status: gOwnership ? "success" : "failed",
    });

    socket.emit(`validation-${questionId}-step`, {
      step: "Members of sysadm only",
      status: "loading",
    });
    const gMemberPermission = await this.service.validateDirPermission(
      "/shared/sysadm",
      "sysadm"
    );
    socket.emit(`validation-${questionId}-step`, {
      step: "Members of sysadm only",
      status: gMemberPermission ? "success" : "failed",
    });

    socket.emit(`validation-${questionId}-step`, {
      step: "Automatically have group ownership",
      status: "loading",
    });
    const gDirPermission = await this.service.validateDirPermission(
      "/shared/sysadm",
      "sysadm"
    );
    socket.emit(`validation-${questionId}-step`, {
      step: "Automatically have group ownership",
      status: gDirPermission ? "success" : "failed",
    });
  }
}
