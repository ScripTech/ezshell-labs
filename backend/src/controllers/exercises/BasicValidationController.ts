import { Socket } from "socket.io";
import { BasicValidationService } from "../../services/BasicValidationService";

export class BasicValidationController {
  private service: BasicValidationService;

  constructor() {
    this.service = new BasicValidationService();
  }

  handleTarValidation = async (socket: Socket, questionId: string) => {
    socket.emit(`validation-${questionId}-step`, {
      step: "Create a tar archive",
      status: "loading",
    });
    const isValid = await this.service.tarValidation();
    socket.emit(`validation-${questionId}-step`, {
      step: "Create a tar archive",
      status: isValid ? "success" : "failed",
    });
  };

  handleFilePermissionsValidation = async (socket: Socket, questionId: string) => {
    socket.emit(`validation-${questionId}-step`, {
      step: "Owned by the root user and group",
      status: "loading",
    });
    const rootown = await this.service.filePermissionsValidation_OwnedBy("root");
    socket.emit(`validation-${questionId}-step`, {
      step: "Owned by the root user and group",
      status: rootown ? "success" : "failed",
    });

    // ---
    socket.emit(`validation-${questionId}-step`, {
      step: "Not executable by anyone",
      status: "loading",
    });
    const noExec = await this.service.filePermissionsValidation_NotExec();
    socket.emit(`validation-${questionId}-step`, {
      step: "Not executable by anyone",
      status: noExec ? "success" : "failed",
    });

    // ---
    socket.emit(`validation-${questionId}-step`, {
      step: "User 'natasha' can read and write",
      status: "loading",
    });
    const u1Write = await this.service.filePermissionsValidation_UserCanRead(
      "natasha"
    );
    socket.emit(`validation-${questionId}-step`, {
      step: "User 'natasha' can read and write",
      status: u1Write ? "success" : "failed",
    });

    // ---
    socket.emit(`validation-${questionId}-step`, {
      step: "User 'harry' cannot read or write",
      status: "loading",
    });
    const u2Write = await this.service.filePermissionsValidation_UserCanRead(
      "harry"
    );
    socket.emit(`validation-${questionId}-step`, {
      step: "User 'harry' cannot read or write",
      status: u2Write ? "success" : "failed",
    });

    // ---
    socket.emit(`validation-${questionId}-step`, {
      step: "All other users (current or future) can read",
      status: "loading",
    });
    const allRead = await this.service.filePermissionsValidation_UserCanRead("others");
    socket.emit(`validation-${questionId}-step`, {
      step: "All other users (current or future) can read",
      status: allRead ? "success" : "failed",
    });
  };

  handleTimeSynchronizationValidation = async (socket: Socket, questionId: string) => {
    // ---
    socket.emit(`validation-${questionId}-step`, {
      step: "Time Synchronization",
      status: "loading",
    });
    const timeSync = await this.service.timeSynchronizationValidation();
    socket.emit(`validation-${questionId}-step`, {
      step: "Time Synchronization",
      status: timeSync ? "success" : "failed",
    });
  };

  handleStringSearchValidation = async (socket: Socket, questionId: string) => {
    // ---
    socket.emit(`validation-${questionId}-step`, {
      step: "Find all occurrences and copy the lines",
      status: "loading",
    });
    const searchStr = await this.service.stringSearchValidation();
    socket.emit(`validation-${questionId}-step`, {
      step: "Find all occurrences and copy the lines",
      status: searchStr ? "success" : "failed",
    });
  };

  handleTunedProfileValidation = async (socket: Socket, questionId: string) => {
    // ---
    socket.emit(`validation-${questionId}-step`, {
      step: "Recommended tuned profile",
      status: "loading",
    });
    const tunned = await this.service.tunedProfileValidation();
    socket.emit(`validation-${questionId}-step`, {
      step: "Recommended tuned profile",
      status: tunned ? "success" : "failed",
    });
  };
}
