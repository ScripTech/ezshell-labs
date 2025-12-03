import { Socket } from "socket.io";
import { UserGroupManagementService } from "../../../services/ex200/UserGroupManagementService";
import { ValidationTrackingService } from "../../../services/ValidationTrackingService";

export class UserGroupManagementController {
  private service: UserGroupManagementService;
  private trackingService: ValidationTrackingService;

  constructor() {
    this.service = new UserGroupManagementService();
    this.trackingService = new ValidationTrackingService();
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

  // New socket tracking methods
  handleUserIDValidationWithSocketTracking = async (socket: Socket, data: { questionId: string, userId: string, labId: string, validationQuestionId: string, labEnrollmentId: string }, validationData: { user: string; id: string }) => {
    try {
      const { questionId, userId, labId, validationQuestionId, labEnrollmentId } = data;

      // Initialize service with user and lab context
      console.log(`🔧 Initializing UserGroupManagementController for user ${userId}, lab ${labId}`);
      await this.service.initialize(userId, labId);

      await this.trackingService.executeValidationWithSocketTracking(
        { socket, questionId, userId, labId, validationQuestionId, labEnrollmentId },
        async (trackedSocket: Socket) => {
          return await this.performUserIDValidation(trackedSocket, validationQuestionId, validationData);
        }
      );
    } catch (error) {
      console.error("Error in user ID validation:", error);
      socket.emit('validation-error', {
        questionId: data.questionId,
        error: error instanceof Error ? error.message : "Unknown error occurred"
      });
    }
  };

  private async performUserIDValidation(socket: Socket, questionId: string, data: { user: string; id: string }): Promise<boolean> {
    try {
      socket.emit(`validation-${questionId}-step`, {
        step: `User ${data.user} exists`,
        status: "loading",
      });
      const isValidUser = await this.service.validateUser(data.user);
      socket.emit(`validation-${questionId}-step`, {
        step: `User ${data.user} exists`,
        status: isValidUser ? "success" : "failed",
        message: isValidUser ? `User ${data.user} exists` : `User ${data.user} does not exist`
      });

      socket.emit(`validation-${questionId}-step`, {
        step: `UID ${data.id}`,
        status: "loading",
      });
      const userId = await this.service.validateUserID(data.user, data.id);
      socket.emit(`validation-${questionId}-step`, {
        step: `UID ${data.id}`,
        status: userId ? "success" : "failed",
        message: userId ? `User ${data.user} has correct UID ${data.id}` : `User ${data.user} does not have UID ${data.id}`
      });

      return isValidUser && userId;
    } catch (error) {
      console.error("Error in user ID validation:", error);
      const steps = [`User ${data.user} exists`, `UID ${data.id}`];
      steps.forEach(step => {
        socket.emit(`validation-${questionId}-step`, {
          step,
          status: "error",
          message: error instanceof Error ? error.message : "Unknown error occurred"
        });
      });
      return false;
    }
  }

  handleUserGroupValidationWithSocketTracking = async (socket: Socket, data: { questionId: string, userId: string, labId: string, validationQuestionId: string, labEnrollmentId: string }, validationData: { group: string; users: string[] }) => {
    try {
      const { questionId, userId, labId, validationQuestionId, labEnrollmentId } = data;

      // Initialize service with user and lab context
      console.log(`🔧 Initializing UserGroupManagementController for user ${userId}, lab ${labId}`);
      await this.service.initialize(userId, labId);

      await this.trackingService.executeValidationWithSocketTracking(
        { socket, questionId, userId, labId, validationQuestionId, labEnrollmentId },
        async (trackedSocket: Socket) => {
          return await this.performUserGroupValidation(trackedSocket, validationQuestionId, validationData);
        }
      );
    } catch (error) {
      console.error("Error in user group validation:", error);
      socket.emit('validation-error', {
        questionId: data.questionId,
        error: error instanceof Error ? error.message : "Unknown error occurred"
      });
    }
  };

  private async performUserGroupValidation(socket: Socket, questionId: string, data: { group: string; users: string[] }): Promise<boolean> {
    try {
      socket.emit(`validation-${questionId}-step`, {
        step: `Group ${data.group} exists`,
        status: "loading",
      });
      const isValidGroup = await this.service.validateGroup(data.group);
      socket.emit(`validation-${questionId}-step`, {
        step: `Group ${data.group} exists`,
        status: isValidGroup ? "success" : "failed",
        message: isValidGroup ? `Group ${data.group} exists` : `Group ${data.group} does not exist`
      });

      let allUsersValid = true;
      for (const user of data.users) {
        socket.emit(`validation-${questionId}-step`, {
          step: `User ${user} exists`,
          status: "loading",
        });
        const isValidUser = await this.service.validateUser(user);
        socket.emit(`validation-${questionId}-step`, {
          step: `User ${user} exists`,
          status: isValidUser ? "success" : "failed",
          message: isValidUser ? `User ${user} exists` : `User ${user} does not exist`
        });

        socket.emit(`validation-${questionId}-step`, {
          step: `User ${user} in group ${data.group}`,
          status: "loading",
        });

        const userInGroup = await this.service.validateUserGroup(user, data.group);

        if (user == "sarah") {
          socket.emit(`validation-${questionId}-step`, {
            step: `User ${user} in group ${data.group}`,
            status: !userInGroup ? "success" : "failed",
            message: !userInGroup
              ? `User ${user} is not a member of ${data.group} group`
              : `User ${user} is a member of ${data.group} group`,
          });
        } else {
          socket.emit(`validation-${questionId}-step`, {
            step: `User ${user} in group ${data.group}`,
            status: userInGroup ? "success" : "failed",
            message: userInGroup
              ? `User ${user} is in group ${data.group}`
              : `User ${user} is not in group ${data.group}`,
          });
        }

        if (!isValidUser || !userInGroup) {
          allUsersValid = false;
        }
      }

      return isValidGroup && allUsersValid;
    } catch (error) {
      console.error("Error in user group validation:", error);
      socket.emit(`validation-${questionId}-step`, {
        step: "User group validation",
        status: "error",
        message: error instanceof Error ? error.message : "Unknown error occurred"
      });
      return false;
    }
  }
}
