import { EmailService } from './EmailService';
import { EmailTemplate, EmailRecipient } from './types/EmailTypes';
import { User } from '@/types/enrollment-management';

/**
 * EmailNotificationService - High-level service for sending contextual email notifications
 * Integrates with the application's business logic to send appropriate emails
 */
export class EmailNotificationService {
  private static instance: EmailNotificationService;
  private emailService: EmailService;

  private constructor() {
    this.emailService = new EmailService();
  }

  public static getInstance(): EmailNotificationService {
    if (!EmailNotificationService.instance) {
      EmailNotificationService.instance = new EmailNotificationService();
    }
    return EmailNotificationService.instance;
  }

  /**
   * Helper method to convert User to EmailRecipient
   */
  private userToRecipient(user: User): EmailRecipient {
    if (!user.email) {
      throw new Error('User email is required for sending notifications');
    }
    return {
      email: user.email,
      name: user.name || undefined,
      userId: user.id
    };
  }

  /**
   * Send account validation email to new users
   */
  async sendAccountValidation(user: User, verificationToken: string, verificationUrl: string) {
    const templateData = {
      userName: user.name || 'User',
      companyName: 'EZShell Labs',
      supportEmail: 'support@ezshell-labs.com',
      currentYear: new Date().getFullYear().toString(),
      verificationUrl,
      verificationToken,
      expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000) // 24 hours
    };

    return this.emailService.send({
      template: 'account-validation',
      recipient: this.userToRecipient(user),
      data: templateData,
      subject: 'Verify Your EZShell Labs Account',
      priority: 'high'
    });
  }

  /**
   * Send lab provisioning notification
   */
  async sendLabProvisioning(user: User, labInfo: {
    name: string;
    description?: string;
    estimatedTime?: string;
    provisioningSteps?: string[];
  }) {
    const templateData = {
      userName: user.name || 'User',
      companyName: 'EZShell Labs',
      supportEmail: 'support@ezshell-labs.com',
      currentYear: new Date().getFullYear().toString(),
      labName: labInfo.name,
      labDescription: labInfo.description,
      estimatedTime: labInfo.estimatedTime || '10-15 minutes',
      provisioningSteps: labInfo.provisioningSteps || [
        'Initializing AWS environment',
        'Setting up lab resources',
        'Configuring access permissions',
        'Preparing lab materials'
      ]
    };

    return this.emailService.send({
      template: 'lab-provisioning',
      recipient: this.userToRecipient(user),
      data: templateData,
      subject: `Lab Setup in Progress: ${labInfo.name}`,
      priority: 'normal'
    });
  }

  /**
   * Send lab ready notification
   */
  async sendLabReady(user: User, labInfo: {
    name: string;
    description?: string;
    accessUrl: string;
    duration?: string;
    expiresAt?: Date;
  }) {
    const templateData = {
      userName: user.name || 'User',
      companyName: 'EZShell Labs',
      supportEmail: 'support@ezshell-labs.com',
      currentYear: new Date().getFullYear().toString(),
      labName: labInfo.name,
      labDescription: labInfo.description,
      accessUrl: labInfo.accessUrl,
      duration: labInfo.duration || '2 hours',
      expiresAt: labInfo.expiresAt
    };

    return this.emailService.send({
      template: 'lab-ready',
      recipient: this.userToRecipient(user),
      data: templateData,
      subject: `🚀 Your Lab is Ready: ${labInfo.name}`,
      priority: 'high'
    });
  }

  /**
   * Send lab completion notification
   */
  async sendLabCompletion(user: User, labResult: {
    name: string;
    description?: string;
    score?: number;
    timeSpent?: string;
    tasksCompleted?: string;
    achievements?: string[];
    certificate?: { downloadUrl: string };
    feedback?: string;
    nextRecommendedLab?: string;
    dashboardUrl: string;
  }) {
    const templateData = {
      userName: user.name || 'User',
      companyName: 'EZShell Labs',
      supportEmail: 'support@ezshell-labs.com',
      currentYear: new Date().getFullYear().toString(),
      labName: labResult.name,
      labDescription: labResult.description,
      score: labResult.score,
      timeSpent: labResult.timeSpent,
      tasksCompleted: labResult.tasksCompleted,
      achievements: labResult.achievements,
      certificate: labResult.certificate,
      feedback: labResult.feedback,
      nextRecommendedLab: labResult.nextRecommendedLab,
      dashboardUrl: labResult.dashboardUrl
    };

    return this.emailService.send({
      template: 'lab-completion',
      recipient: this.userToRecipient(user),
      data: templateData,
      subject: `🎉 Lab Completed: ${labResult.name}`,
      priority: 'normal'
    });
  }

  /**
   * Send lab expiration warning
   */
  async sendLabExpiration(user: User, labInfo: {
    name: string;
    expiresAt: Date;
    timeRemaining?: string;
    accessUrl: string;
    canExtend?: boolean;
    extendUrl?: string;
    maxExtensions?: number;
  }) {
    const templateData = {
      userName: user.name || 'User',
      companyName: 'EZShell Labs',
      supportEmail: 'support@ezshell-labs.com',
      currentYear: new Date().getFullYear().toString(),
      labName: labInfo.name,
      expiresAt: labInfo.expiresAt,
      timeRemaining: labInfo.timeRemaining,
      accessUrl: labInfo.accessUrl,
      canExtend: labInfo.canExtend,
      extendUrl: labInfo.extendUrl,
      maxExtensions: labInfo.maxExtensions
    };

    return this.emailService.send({
      template: 'lab-expiration',
      recipient: this.userToRecipient(user),
      data: templateData,
      subject: `⏰ Lab Expiring Soon: ${labInfo.name}`,
      priority: 'high'
    });
  }

  /**
   * Send instructor assignment notification
   */
  async sendInstructorAssignment(instructor: User, assignment: {
    assignmentType: string;
    cohortName?: string;
    labName?: string;
    studentCount: number;
    startDate?: Date;
    endDate?: Date;
    duration?: string;
    labType?: string;
    dashboardUrl: string;
    labAccessUrl?: string;
    students?: Array<{ name: string; email: string; status: string }>;
    responsibilities?: string[];
    resources?: Array<{ name: string; url: string }>;
  }) {
    const templateData = {
      userName: instructor.name || 'Instructor',
      companyName: 'EZShell Labs',
      supportEmail: 'support@ezshell-labs.com',
      currentYear: new Date().getFullYear().toString(),
      instructorName: instructor.name || 'Instructor',
      assignmentType: assignment.assignmentType,
      cohortName: assignment.cohortName,
      labName: assignment.labName,
      studentCount: assignment.studentCount,
      startDate: assignment.startDate,
      endDate: assignment.endDate,
      duration: assignment.duration,
      labType: assignment.labType,
      dashboardUrl: assignment.dashboardUrl,
      labAccessUrl: assignment.labAccessUrl,
      students: assignment.students,
      responsibilities: assignment.responsibilities,
      resources: assignment.resources
    };

    return this.emailService.send({
      template: 'instructor-assignment',
      recipient: this.userToRecipient(instructor),
      data: templateData,
      subject: `👨‍🏫 New Assignment: ${assignment.cohortName || assignment.labName}`,
      priority: 'normal'
    });
  }

  /**
   * Send general notification
   */
  async sendGeneralNotification(user: User, notification: {
    subject: string;
    priority?: 'low' | 'medium' | 'high' | 'info';
    previewText?: string;
    message: string;
    actionButton?: { text: string; url: string };
    highlights?: Array<{ title: string; description: string; url?: string }>;
    listItems?: string[];
    attachments?: Array<{ name: string; url: string; size?: string }>;
    customFooterMessage?: string;
    unsubscribeUrl?: string;
  }) {
    const templateData = {
      userName: user.name || 'User',
      companyName: 'EZShell Labs',
      supportEmail: 'support@ezshell-labs.com',
      currentYear: new Date().getFullYear().toString(),
      subject: notification.subject,
      priority: notification.priority || 'medium',
      previewText: notification.previewText,
      message: notification.message,
      actionButton: notification.actionButton,
      highlights: notification.highlights,
      listItems: notification.listItems,
      attachments: notification.attachments,
      customFooterMessage: notification.customFooterMessage,
      unsubscribeUrl: notification.unsubscribeUrl
    };

    const emailPriority = notification.priority === 'medium' ? 'normal' :
                         notification.priority === 'info' ? 'normal' :
                         (notification.priority || 'normal');

    return this.emailService.send({
      template: 'general-notification',
      recipient: this.userToRecipient(user),
      data: templateData,
      subject: notification.subject,
      priority: emailPriority as 'low' | 'normal' | 'high'
    });
  }

  /**
   * Send bulk notifications to multiple users
   */
  async sendBulkNotification(users: User[], notification: {
    template: EmailTemplate;
    subject: string;
    priority?: 'low' | 'medium' | 'high' | 'info';
    templateData: any;
  }) {
    const recipients = users.map(user => {
      if (!user.email) {
        throw new Error(`User ${user.id} has no email address`);
      }
      return {
        email: user.email,
        name: user.name || undefined,
        userId: user.id
      };
    });

    const fullTemplateData = {
      companyName: 'EZShell Labs',
      supportEmail: 'support@ezshell-labs.com',
      currentYear: new Date().getFullYear().toString(),
      ...notification.templateData
    };

    const emailPriority = notification.priority === 'medium' ? 'normal' :
                         notification.priority === 'info' ? 'normal' :
                         (notification.priority || 'normal');

    return this.emailService.sendBulk(
      notification.template,
      recipients,
      fullTemplateData
    );
  }

  /**
   * Send campaign email to multiple users
   */
  async sendCampaign(users: User[], campaign: {
    campaignName: string;
    subtitle?: string;
    content: string;
    heroImage?: string;
    primaryCTA?: {
      title: string;
      description?: string;
      buttonText: string;
      url: string;
      note?: string;
    };
    features?: Array<{ icon: string; title: string; description: string }>;
    statistics?: Array<{ value: string; label: string }>;
    testimonial?: { text: string; author: string; title?: string };
    secondaryCTA?: { text: string; url: string };
    socialLinks?: Array<{ platform: string; url: string; icon: string }>;
    unsubscribeUrl?: string;
    preferencesUrl?: string;
  }) {
    const recipients = users.map(user => {
      if (!user.email) {
        throw new Error(`User ${user.id} has no email address`);
      }
      return {
        email: user.email,
        name: user.name || undefined,
        userId: user.id
      };
    });

    const templateData = {
      companyName: 'EZShell Labs',
      supportEmail: 'support@ezshell-labs.com',
      currentYear: new Date().getFullYear().toString(),
      campaignName: campaign.campaignName,
      subtitle: campaign.subtitle,
      content: campaign.content,
      heroImage: campaign.heroImage,
      primaryCTA: campaign.primaryCTA,
      features: campaign.features,
      statistics: campaign.statistics,
      testimonial: campaign.testimonial,
      secondaryCTA: campaign.secondaryCTA,
      socialLinks: campaign.socialLinks,
      unsubscribeUrl: campaign.unsubscribeUrl,
      preferencesUrl: campaign.preferencesUrl
    };

    return this.emailService.sendBulk(
      'campaign',
      recipients,
      templateData
    );
  }
}

// Export singleton instance
export const emailNotificationService = EmailNotificationService.getInstance();
