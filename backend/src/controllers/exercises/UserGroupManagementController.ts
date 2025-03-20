import { Socket } from "socket.io";
import { UserGroupManagementService } from "../../services/UserGroupManagementService";

export class UserGroupManagementController {
  private service: UserGroupManagementService;

  constructor() {
    this.service = new UserGroupManagementService();
  }

  handleUserIDValidation = async (
    socket: Socket,
    questionId: string,
    data: {
      user: string;
      id: string;
    }
  ) => {
    socket.emit(`validation-${questionId}-step`, {
      step: `User ${data.user} exist?`,
      status: "loading",
    });
    const isValidUser = await this.service.validateUser(data.user);
    socket.emit(`validation-${questionId}-step`, {
      step: `User ${data.user} exist?`,
      status: isValidUser ? "success" : "failed",
    });

    // ---
    socket.emit(`validation-${questionId}-step`, {
      step: `UID ${data.id}`,
      status: "loading",
    });
    const userId = await this.service.validateUserID(data.user, data.id);
    socket.emit(`validation-${questionId}-step`, {
      step: `UID ${data.id}`,
      status: userId ? "success" : "failed",
    });
  };

  handleValidation = async (
    socket: Socket,
    questionId: string,
    data: {
      user: string;
      group: string;
    }
  ) => {
    socket.emit(`validation-${questionId}-step`, {
      step: `User ${data.user} exist?`,
      status: "loading",
    });
    const isValidUser = await this.service.validateUser(data.user);
    socket.emit(`validation-${questionId}-step`, {
      step: `User ${data.user} exist?`,
      status: isValidUser ? "success" : "failed",
    });

    socket.emit(`validation-${questionId}-step`, {
      step: `User ${data.user} exist?`,
      status: "loading",
    });
    const isValidGroup = await this.service.validateGroup(data.group);
    socket.emit(`validation-${questionId}-step`, {
      step: `User ${data.user} exist?`,
      status: isValidGroup ? "success" : "failed",
    });
  };

  handleUserValidation = async (
    socket: Socket,
    questionId: string,
    data: {
      user: string;
      group: string;
    }
  ) => {
    socket.emit(`validation-${questionId}-step`, {
      step: `User ${data.user} exist?`,
      status: "loading",
    });
    const isValidUser = await this.service.validateUser(data.user);
    socket.emit(`validation-${questionId}-step`, {
      step: `User ${data.user} exist?`,
      status: isValidUser ? "success" : "failed",
    });
  };

  handleGroupValidation = async (
    socket: Socket,
    questionId: string,
    data: {
      group: string;
    }
  ) => {
    socket.emit(`validation-${questionId}-step`, {
      step: `Group ${data.group} exist?`,
      status: "loading",
    });
    const isValidGroup = await this.service.validateGroup(data.group);
    socket.emit(`validation-${questionId}-step`, {
      step: `Group ${data.group} exist?`,
      status: isValidGroup ? "success" : "failed",
    });
  };

  handleUserGroupValidation = async (
    socket: Socket,
    questionId: string,
    data: {
      group: string;
      user: string;
    }
  ) => {
    socket.emit(`validation-${questionId}-step`, {
      step: `${data.user} belongs to ${data.group}`,
      status: "loading",
    });
    const isValidGroup = await this.service.validateUserGroup(
      data.user,
      data.group
    );
    socket.emit(`validation-${questionId}-step`, {
      step: `${data.user} belongs to ${data.group}`,
      status: isValidGroup ? "success" : "failed",
    });
  };

  private handleInteractiveShellValidation = async (
    socket: Socket,
    questionId: string,
    data: {
      group: string;
      user: string;
    }
  ) => {
    // [] - No interactive shell & not a member of sysadm group
    socket.emit(`validation-${questionId}-step`, {
      step: `[${data.user}] - No interactive shell & not a member of ${data.group} group`,
      status: "loading",
    });
    const noInteractiveShell = await this.service.validateNoInteractiveShell(
      data.user
    );
    const notMember = await this.service.validateUserGroup(
      data.user,
      data.group
    );
    socket.emit(`validation-${questionId}-step`, {
      step: `[${data.user}] - No interactive shell & not a member of ${data.group} group`,
      status: noInteractiveShell && !notMember ? "success" : "failed",
    });
  };

  private handleGroupRolesValidation = async (
    socket: Socket,
    questionId: string,
    data: {
      group: string;
      action: string;
    }
  ) => {
    socket.emit(`validation-${questionId}-step`, {
      step: `${data.group} group access to add users`,
      status: "loading",
    });
    const groupAddUsers = await this.service.validateGroupRoles(
      data.group,
      data.action
    );
    socket.emit(`validation-${questionId}-step`, {
      step: `${data.group} group access to add users`,
      status: groupAddUsers ? "success" : "failed",
    });
  };

  handleValidations = async (
    socket: Socket,
    id: string,
    data: {
      group: string;
      users: string[];
    }
  ) => {
    this.handleGroupValidation(socket, id, {
      group: "sysadm",
    });

    let group = setInterval(() => {
      this.handleUserValidation(socket, id, {
        user: "harry",
        group: "sysadm",
      });
      clearInterval(group);
    }, 1000);

    let user1 = setInterval(() => {
      this.handleUserValidation(socket, id, {
        user: "natasha",
        group: "sysadm",
      });
      clearInterval(user1);
    }, 1100);

    let user2 = setInterval(() => {
      this.handleUserValidation(socket, id, {
        user: "sarah",
        group: "sysadm",
      });
      clearInterval(user2);
    }, 1200);

    let grpU1 = setInterval(() => {
      this.handleUserGroupValidation(socket, id, {
        group: "sysadm",
        user: "harry",
      });
      clearInterval(grpU1);
    }, 1300);

    let grpU2 = setInterval(() => {
      this.handleUserGroupValidation(socket, id, {
        group: "sysadm",
        user: "natasha",
      });
      clearInterval(grpU2);
    }, 1301);

    let noShell = setInterval(() => {
      this.handleInteractiveShellValidation(socket, id, {
        group: "sysadm",
        user: "sarah",
      });
      clearInterval(noShell);
    }, 1301);

    let gAddUser = setInterval(() => {
      this.handleGroupRolesValidation(socket, id, {
        group: "sysadm",
        action: "/usr/sbin/useradd",
      });
      clearInterval(gAddUser);
    }, 1302);
  };
}
