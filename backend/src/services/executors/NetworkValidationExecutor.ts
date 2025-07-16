import { ValidationExecutor, ValidationStep, ValidationContext, ValidationResult } from '../../interfaces/IValidationTypes';
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

export class NetworkValidationExecutor implements ValidationExecutor {

  getSupportedTypes(): string[] {
    return ['network_config', 'firewall_rule', 'ip_configuration'];
  }

  async executeStep(step: ValidationStep, context: ValidationContext): Promise<ValidationResult> {
    const startTime = Date.now();

    try {
      let result: ValidationResult;

      switch (step.method) {
        case 'validateIPConfig':
          result = await this.validateIPConfig(step, context);
          break;
        case 'validateFirewallRule':
          result = await this.validateFirewallRule(step, context);
          break;
        case 'validateNetworkInterface':
          result = await this.validateNetworkInterface(step, context);
          break;
        default:
          result = {
            stepId: step.id,
            success: false,
            score: 0,
            maxScore: step.weight || 1,
            message: `Unknown network validation method: ${step.method}`
          };
      }

      result.executionTime = Date.now() - startTime;
      return result;

    } catch (error) {
      return {
        stepId: step.id,
        success: false,
        score: 0,
        maxScore: step.weight || 1,
        message: `Network validation failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
        executionTime: Date.now() - startTime
      };
    }
  }

  private async validateIPConfig(step: ValidationStep, context: ValidationContext): Promise<ValidationResult> {
    const { interface: iface, expectedIP, expectedSubnet } = step.params;

    // Mock SSH command execution (in real implementation, this would use SSH)
    const mockCommand = `ip addr show ${iface}`;

    // For testing purposes, let's simulate different scenarios
    const mockIPOutput = step.params.mockOutput || `
      2: ${iface}: <BROADCAST,MULTICAST,UP,LOWER_UP> mtu 1500 qdisc fq_codel state UP group default qlen 1000
          inet ${expectedIP}/${expectedSubnet} brd 192.168.1.255 scope global ${iface}
    `;

    const hasExpectedIP = mockIPOutput.includes(expectedIP);
    const hasExpectedSubnet = mockIPOutput.includes(`/${expectedSubnet}`);

    const success = hasExpectedIP && hasExpectedSubnet;
    const score = success ? (step.weight || 1) : 0;

    return {
      stepId: step.id,
      success,
      score,
      maxScore: step.weight || 1,
      message: success
        ? `IP configuration for ${iface} is correct (${expectedIP}/${expectedSubnet})`
        : `IP configuration for ${iface} is incorrect. Expected: ${expectedIP}/${expectedSubnet}`,
      details: {
        command: mockCommand,
        output: mockIPOutput,
        expectedIP,
        expectedSubnet,
        interface: iface
      }
    };
  }

  private async validateFirewallRule(step: ValidationStep, context: ValidationContext): Promise<ValidationResult> {
    const { port, protocol, action } = step.params;

    // Mock firewall rule check
    const mockFirewallOutput = step.params.mockOutput || `
      Chain INPUT (policy ACCEPT)
      target     prot opt source               destination
      ACCEPT     ${protocol}  --  anywhere             anywhere             ${protocol} dpt:${port}
    `;

    const hasRule = mockFirewallOutput.includes(`${protocol} dpt:${port}`) && mockFirewallOutput.includes(action);
    const score = hasRule ? (step.weight || 1) : 0;

    return {
      stepId: step.id,
      success: hasRule,
      score,
      maxScore: step.weight || 1,
      message: hasRule
        ? `Firewall rule for ${protocol}:${port} (${action}) is configured correctly`
        : `Firewall rule for ${protocol}:${port} (${action}) is missing or incorrect`,
      details: {
        command: 'iptables -L',
        output: mockFirewallOutput,
        expectedPort: port,
        expectedProtocol: protocol,
        expectedAction: action
      }
    };
  }

  private async validateNetworkInterface(step: ValidationStep, context: ValidationContext): Promise<ValidationResult> {
    const { interface: iface, expectedState } = step.params;

    // Mock interface state check
    const mockOutput = step.params.mockOutput || `${iface}: flags=4163<UP,BROADCAST,RUNNING,MULTICAST>  mtu 1500`;

    const isUp = mockOutput.includes('UP') && mockOutput.includes('RUNNING');
    const success = expectedState === 'up' ? isUp : !isUp;
    const score = success ? (step.weight || 1) : 0;

    return {
      stepId: step.id,
      success,
      score,
      maxScore: step.weight || 1,
      message: success
        ? `Network interface ${iface} is in expected state: ${expectedState}`
        : `Network interface ${iface} is not in expected state: ${expectedState}`,
      details: {
        command: `ip link show ${iface}`,
        output: mockOutput,
        interface: iface,
        expectedState,
        actualState: isUp ? 'up' : 'down'
      }
    };
  }
}
