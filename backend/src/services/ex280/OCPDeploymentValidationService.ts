import { IValidationResult, IValidationService } from '../../interfaces/IValidationService';
import { connectSSH, ssh, executeCommand } from "../../utils/ssh-service";

export class OCPDeploymentValidationService implements IValidationService {
  private readonly validationSteps = [
    'OpenShift Cluster Status',
    'Project Configuration',
    'Application Deployment',
    'Route Configuration',
    'Service Configuration'
  ];

  async validate(): Promise<IValidationResult> {
    if (!ssh.isConnected()) {
      await connectSSH();
    }
    try {
      // Example validation for OCP deployment
      const clusterStatus = await executeCommand('oc status');
      const projectStatus = await executeCommand('oc get project');

      return {
        success: true,
        details: {
          clusterStatus,
          projectStatus
        }
      };
    } catch (error: any) {
      return {
        success: false,
        message: `Validation failed: ${error.message}`
      };
    }
  }

  getSteps(): string[] {
    return this.validationSteps;
  }
}
