import { Socket } from "socket.io";
import { FindUserFilesValidationService } from "../../../services/ex200/FindUserFilesValidationService";
import {
  ValidationTrackingService,
  ValidationContext,
} from "../../../services/ValidationTrackingService";
import { ScoringUtils } from "../../../utils/ScoringUtils";

export class FindUserFilesController {
  private service: FindUserFilesValidationService;
  private trackingService: ValidationTrackingService;

  constructor() {
    this.service = new FindUserFilesValidationService();
    this.trackingService = new ValidationTrackingService();
  }

  /**
   * Handle validation for Finding and Copying User Files task
   * This validates the complete user file search and copy operation based on the provided validation script
   */
  handleFindUserFilesValidation = async (socket: Socket, data: {
    questionId: string,
    userId: string,
    labId: string,
    validationQuestionId: string,
    labEnrollmentId: string
  }) => {
    const { questionId, userId, labId, validationQuestionId, labEnrollmentId } = data;

    // Create enhanced scoring context - INTERMEDIATE preset for multi-step file operations
    const context = ScoringUtils.createScoringContext(
      { socket, questionId, userId, labId, validationQuestionId, labEnrollmentId },
      'INTERMEDIATE', // 15 points, 10% penalty per attempt
      {
        // Custom weights for file operation steps - script creation is most critical
        stepWeights: [25, 20, 20, 15, 10, 10] // script=25%, permissions=20%, execution=20%, results=15%, copy=10%, validation=10%
      }
    );

    await this.trackingService.executeValidationWithSocketTracking(
      context,
      async (trackedSocket: Socket) => {
        return await this.performFindUserFilesValidation(trackedSocket, validationQuestionId);
      }
    );
  };

  private async performFindUserFilesValidation(socket: Socket, questionId: string): Promise<boolean> {
    try {
      // Step 1: Check if find-all-files.sh script exists
      socket.emit(`validation-${questionId}-step`, {
        step: "Checking find-all-files.sh script",
        status: "loading",
      });

      const scriptExists = await this.service.checkScriptExists();
      socket.emit(`validation-${questionId}-step`, {
        step: "Checking find-all-files.sh script",
        status: scriptExists ? "success" : "failed",
        message: scriptExists ? "Script find-all-files.sh exists" : "Script find-all-files.sh does not exist"
      });

      // Step 2: Validate search criteria in script
      socket.emit(`validation-${questionId}-step`, {
        step: "Validating search criteria",
        status: "loading",
      });

      const searchCriteriaValid = await this.service.validateSearchCriteria();
      socket.emit(`validation-${questionId}-step`, {
        step: "Validating search criteria",
        status: searchCriteriaValid ? "success" : "failed",
        message: searchCriteriaValid ? "Search criteria for user 'natasha' found in script" : "Search criteria for user 'natasha' not found in script"
      });

      // Step 3: Check target directory exists
      socket.emit(`validation-${questionId}-step`, {
        step: "Checking target directory",
        status: "loading",
      });

      const targetDirExists = await this.service.checkTargetDirectory();
      socket.emit(`validation-${questionId}-step`, {
        step: "Checking target directory",
        status: targetDirExists ? "success" : "failed",
        message: targetDirExists ? "Target directory /task-11/natashafiles exists" : "Target directory /task-11/natashafiles does not exist"
      });

      // Step 4: Validate file ownership
      socket.emit(`validation-${questionId}-step`, {
        step: "Validating file ownership",
        status: "loading",
      });

      const ownershipValid = await this.service.validateFileOwnership();
      socket.emit(`validation-${questionId}-step`, {
        step: "Validating file ownership",
        status: ownershipValid ? "success" : "failed",
        message: ownershipValid ? "All files are owned by user 'natasha'" : "Some files are not owned by user 'natasha'"
      });

      // Step 5: Test file permissions preservation
      socket.emit(`validation-${questionId}-step`, {
        step: "Testing file permissions preservation",
        status: "loading",
      });

      const permissionsPreserved = await this.service.validatePermissionsPreservation();
      socket.emit(`validation-${questionId}-step`, {
        step: "Testing file permissions preservation",
        status: permissionsPreserved ? "success" : "failed",
        message: permissionsPreserved ? "File permissions preserved during copy" : "File permissions not properly preserved during copy"
      });

      // Step 6: Confirm copy operation and directory structure
      socket.emit(`validation-${questionId}-step`, {
        step: "Confirming copy operation and directory structure",
        status: "loading",
      });

      const copyOperationValid = await this.service.validateCopyOperationAndStructure();
      socket.emit(`validation-${questionId}-step`, {
        step: "Confirming copy operation and directory structure",
        status: copyOperationValid ? "success" : "failed",
        message: copyOperationValid ? "Copy operation and directory structure maintained" : "Copy operation incomplete or directory structure not maintained"
      });

      // Calculate overall success
      const allValidations = [scriptExists, searchCriteriaValid, targetDirExists, ownershipValid, permissionsPreserved, copyOperationValid];
      const overallSuccess = allValidations.every(Boolean);

      return overallSuccess;

    } catch (error) {
      console.error("Error in FindUserFilesController validation:", error);

      socket.emit(`validation-${questionId}-step`, {
        step: "Validation Error",
        status: "failed",
        message: "An unexpected error occurred during validation"
      });

      return false;
    }
  }

  /**
   * Legacy method for backward compatibility
   */
  handleFindUserFilesValidationLegacy = async (
    socket: Socket,
    questionId: string,
    userId?: string,
    labEnrollmentId?: string
  ) => {
    socket.emit(`validation-${questionId}-step`, {
      step: "Finding and copying user files",
      status: "loading",
    });

    try {
      // Run all validation steps
      const scriptExists = await this.service.checkScriptExists();
      const searchCriteriaValid = await this.service.validateSearchCriteria();
      const targetDirExists = await this.service.checkTargetDirectory();
      const ownershipValid = await this.service.validateFileOwnership();
      const permissionsPreserved = await this.service.validatePermissionsPreservation();
      const copyOperationValid = await this.service.validateCopyOperationAndStructure();

      const allValid = scriptExists && searchCriteriaValid && targetDirExists &&
                      ownershipValid && permissionsPreserved && copyOperationValid;

      socket.emit(`validation-${questionId}-step`, {
        step: "Finding and copying user files",
        status: allValid ? "success" : "failed",
        message: allValid ? "All validations passed" : "One or more validations failed"
      });

    } catch (error) {
      console.error("Error in legacy FindUserFilesController:", error);
      socket.emit(`validation-${questionId}-step`, {
        step: "Finding and copying user files",
        status: "failed",
        message: "Validation error occurred"
      });
    }
  };
}
