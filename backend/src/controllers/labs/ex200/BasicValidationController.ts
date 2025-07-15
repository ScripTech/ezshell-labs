import { Socket } from "socket.io";
import { BasicValidationService } from "../../../services/ex200/BasicValidationService";
import { validationTrackingService, ValidationContext } from "../../../services/ValidationTrackingService";
import { AuthenticatedSocket } from "../../../middleware/socketAuth";
import { SocketUserService } from "../../../services/SocketUserService";

export class BasicValidationController {
  private service: BasicValidationService;

  constructor() {
    this.service = new BasicValidationService();
  }

  handleTarValidation = async (
    socket: Socket,
    questionId: string,
    userId?: string,
    labEnrollmentId?: string
  ) => {
    // If userId and labEnrollmentId are provided, use tracking service
    if (userId && labEnrollmentId) {
      return this.handleTarValidationWithTracking(socket, questionId, userId, labEnrollmentId);
    }

    // Fallback to original manual validation for backward compatibility
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

  handleFilePermissionsValidation = async (
    socket: Socket,
    questionId: string,
    userId?: string,
    labEnrollmentId?: string
  ) => {
    // If userId and labEnrollmentId are provided, use tracking service
    if (userId && labEnrollmentId) {
      return this.handleFilePermissionsWithTracking(socket, questionId, userId, labEnrollmentId);
    }

    // Fallback to original manual validation for backward compatibility
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

  /**
   * Example of using ValidationTrackingService for comprehensive task validation
   * This shows how to integrate attempt tracking, progressive scoring, and detailed validation steps
   */
  handleFilePermissionsWithTracking = async (
    socket: Socket,
    questionId: string,
    userId: string,
    labEnrollmentId: string
  ) => {
    const context: ValidationContext = {
      socket:socket,
      questionId,
      validationQuestionId: "",
      userId,
      labId: "ex200", // Assuming labId is known or can be derived
      labEnrollmentId,
    };

    // Create validation steps using the tracking service
    const validationSteps = [
      validationTrackingService.createValidationStep(
        'root-ownership',
        'File owned by root user and group',
        25,
        () => this.service.filePermissionsValidation_OwnedBy("root")
      ),
      validationTrackingService.createValidationStep(
        'not-executable',
        'File is not executable by anyone',
        25,
        () => this.service.filePermissionsValidation_NotExec()
      ),
      validationTrackingService.createValidationStep(
        'natasha-read-write',
        'User natasha can read and write',
        25,
        () => this.service.filePermissionsValidation_UserCanRead("natasha")
      ),
      validationTrackingService.createValidationStep(
        'others-read-only',
        'All other users can read only',
        25,
        () => this.service.filePermissionsValidation_UserCanRead("others")
      )
    ];

    // Execute validation with full tracking
    await validationTrackingService.executeValidationWithTracking(context, validationSteps);
  };

  /**
   * Example of using ValidationTrackingService for tar archive validation
   */
  handleTarValidationWithTracking = async (
    socket: Socket,
    questionId: string,
    userId: string,
    labEnrollmentId: string
  ) => {
    const context: ValidationContext = {
      socket,
      questionId,
      userId,
      labId: "ex200", // Assuming labId is known or can be derived
      labEnrollmentId,
      validationQuestionId: ""
    };

    const validationSteps = [
      validationTrackingService.createValidationStep(
        'tar-archive-created',
        'Create a tar archive with correct files',
        100,
        () => this.service.tarValidation()
      )
    ];

    await validationTrackingService.executeValidationWithTracking(context, validationSteps);
  };

  /**
   * Example of using ValidationTrackingService with authenticated socket
   * This method automatically extracts user information from the authenticated socket
   */
  handleFilePermissionsValidationAuthenticated = async (
    socket: AuthenticatedSocket,
    questionId: string,
    labId: string
  ) => {
    try {
      // Extract user context from authenticated socket
      const userContext = await SocketUserService.getUserContextWithLab(socket, labId);
      if (!userContext) {
        socket.emit(`validation-${questionId}-error`, {
          error: 'Authentication required',
          timestamp: new Date().toISOString()
        });
        return;
      }

      // If no lab enrollment found, handle gracefully
      if (!userContext.labEnrollmentId) {
        console.warn(`No lab enrollment found for user ${userContext.userId} in lab ${labId}`);
        // Fall back to basic validation without tracking
        return this.handleFilePermissionsValidation(socket, questionId);
      }

      const context: ValidationContext = {
        socket,
        questionId,
        validationQuestionId: "",
        labId: "ex200", // just a default value, assuming labId is known or can be derived
        userId: userContext.userId,
        labEnrollmentId: userContext.labEnrollmentId,
      };

      // Create validation steps using the tracking service
      const validationSteps = [
        validationTrackingService.createValidationStep(
          'root-ownership',
          'File owned by root user and group',
          25,
          () => this.service.filePermissionsValidation_OwnedBy("root")
        ),
        validationTrackingService.createValidationStep(
          'not-executable',
          'File is not executable by anyone',
          25,
          () => this.service.filePermissionsValidation_NotExec()
        ),
        validationTrackingService.createValidationStep(
          'natasha-read-write',
          'User natasha can read and write',
          25,
          () => this.service.filePermissionsValidation_UserCanRead("natasha")
        ),
        validationTrackingService.createValidationStep(
          'others-read-only',
          'All other users can read only',
          25,
          () => this.service.filePermissionsValidation_UserCanRead("others")
        )
      ];

      // Execute validation with full tracking
      await validationTrackingService.executeValidationWithTracking(context, validationSteps);

      console.log(`✅ Authenticated validation completed for user ${userContext.userInfo.email} on task ${questionId}`);
    } catch (error) {
      console.error('Authenticated validation error:', error);
      socket.emit(`validation-${questionId}-error`, {
        error: error instanceof Error ? error.message : 'Validation failed',
        timestamp: new Date().toISOString()
      });
    }
  };

  /**
   * Example of using ValidationTrackingService for tar validation with authentication
   */
  handleTarValidationAuthenticated = async (
    socket: AuthenticatedSocket,
    questionId: string,
    labId: string
  ) => {
    try {
      const userContext = await SocketUserService.getUserContextWithLab(socket, labId);
      if (!userContext) {
        socket.emit(`validation-${questionId}-error`, {
          error: 'Authentication required',
          timestamp: new Date().toISOString()
        });
        return;
      }

      if (!userContext.labEnrollmentId) {
        // Fall back to basic validation without tracking
        return this.handleTarValidation(socket, questionId);
      }

      const context: ValidationContext = {
        socket,
        questionId,
        validationQuestionId: "",
        labId: "ex200", // Assuming labId is known or can be derived
        userId: userContext.userId,
        labEnrollmentId: userContext.labEnrollmentId,
      };

      const validationSteps = [
        validationTrackingService.createValidationStep(
          'tar-archive-created',
          'Create a tar archive with correct files',
          100,
          () => this.service.tarValidation()
        )
      ];

      await validationTrackingService.executeValidationWithTracking(context, validationSteps);

      console.log(`✅ Authenticated tar validation completed for user ${userContext.userInfo.email} on task ${questionId}`);
    } catch (error) {
      console.error('Authenticated tar validation error:', error);
      socket.emit(`validation-${questionId}-error`, {
        error: error instanceof Error ? error.message : 'Validation failed',
        timestamp: new Date().toISOString()
      });
    }
  };
}
