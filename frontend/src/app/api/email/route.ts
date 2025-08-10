import { NextRequest, NextResponse } from 'next/server';
import { EmailService } from '@/services/email/EmailService';
import { EmailTemplate } from '@/services/email/types/EmailTypes';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

// Initialize email service
const emailService = new EmailService();

export async function POST(req: NextRequest) {
  try {
    // Get session for authentication
    const session = await getServerSession(authOptions);

    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const {
      templateType,
      recipients,
      templateData,
      subject,
      priority = 'medium',
      scheduledFor
    } = body;

    // Validate required fields
    if (!templateType || !recipients || !templateData) {
      return NextResponse.json(
        { error: 'Missing required fields: templateType, recipients, templateData' },
        { status: 400 }
      );
    }

    // Validate template type
    const validTemplates: EmailTemplate[] = [
      'account-validation',
      'lab-provisioning',
      'lab-ready',
      'lab-completion',
      'lab-expiration',
      'general-notification',
      'campaign',
      'instructor-assignment'
    ];

    if (!validTemplates.includes(templateType)) {
      return NextResponse.json(
        { error: `Invalid template type. Must be one of: ${validTemplates.join(', ')}` },
        { status: 400 }
      );
    }

    // Validate recipients format
    const recipientArray = Array.isArray(recipients) ? recipients : [recipients];
    for (const recipient of recipientArray) {
      if (!recipient.email || typeof recipient.email !== 'string') {
        return NextResponse.json(
          { error: 'Invalid recipient format. Each recipient must have an email address' },
          { status: 400 }
        );
      }
    }

    // Send email(s)
    let result;
    if (recipientArray.length === 1) {
      // Single email
      result = await emailService.send({
        template: templateType,
        recipient: recipientArray[0],
        data: templateData,
        subject,
        priority: priority === 'medium' ? 'normal' : (priority as 'low' | 'normal' | 'high')
      });
    } else {
      // Bulk email
      result = await emailService.sendBulk(
        templateType,
        recipientArray,
        templateData
      );
    }

    return NextResponse.json({
      success: true,
      messageId: Array.isArray(result) ? 'bulk-email' : result.messageId || 'single-email',
      sent: recipientArray.length,
      message: 'Email sent successfully'
    });

  } catch (error) {
    console.error('Email API error:', error);

    return NextResponse.json(
      {
        error: 'Failed to send email',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

export async function GET(req: NextRequest) {
  try {
    // Get session for authentication
    const session = await getServerSession(authOptions);

    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if user has admin permissions for email service access
    // Note: Adjust role checking based on your auth implementation
    if (!session.user) {
      return NextResponse.json({ error: 'User information not available' }, { status: 403 });
    }

    const { searchParams } = new URL(req.url);
    const action = searchParams.get('action');

    switch (action) {
      case 'templates':
        // Return available email templates
        const templates = [
          {
            type: 'account-validation',
            name: 'Account Validation',
            description: 'Email verification and account activation'
          },
          {
            type: 'lab-provisioning',
            name: 'Lab Provisioning',
            description: 'Lab environment setup in progress'
          },
          {
            type: 'lab-ready',
            name: 'Lab Ready',
            description: 'Lab environment is ready to use'
          },
          {
            type: 'lab-completion',
            name: 'Lab Completion',
            description: 'Lab completed with results and certificate'
          },
          {
            type: 'lab-expiration',
            name: 'Lab Expiration',
            description: 'Lab session expiring soon warning'
          },
          {
            type: 'general-notification',
            name: 'General Notification',
            description: 'Generic notification template'
          },
          {
            type: 'campaign',
            name: 'Campaign',
            description: 'Marketing and promotional emails'
          },
          {
            type: 'instructor-assignment',
            name: 'Instructor Assignment',
            description: 'New student assignment for instructors'
          }
        ];

        return NextResponse.json({ templates });

      case 'preview':
        // Preview email template - simplified version
        const templateType = searchParams.get('template') as EmailTemplate;

        if (!templateType) {
          return NextResponse.json({ error: 'Template type required' }, { status: 400 });
        }

        const sampleData = getSampleTemplateData(templateType);
        if (!sampleData) {
          return NextResponse.json({ error: 'Invalid template type' }, { status: 400 });
        }

        return NextResponse.json({
          preview: {
            html: `Preview for ${templateType} template`,
            text: `Text preview for ${templateType} template`,
            data: sampleData
          }
        });

      case 'health':
        // Check email service health - simplified version
        return NextResponse.json({
          health: {
            status: 'healthy',
            timestamp: new Date().toISOString(),
            service: 'email'
          }
        });      default:
        return NextResponse.json({ error: 'Invalid action parameter' }, { status: 400 });
    }

  } catch (error) {
    console.error('Email API GET error:', error);

    return NextResponse.json(
      {
        error: 'Email service error',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

// Helper function to generate sample data for template previews
function getSampleTemplateData(templateType: EmailTemplate): any {
  const baseData = {
    userName: 'John Doe',
    companyName: 'EZShell Labs',
    supportEmail: 'support@ezshell-labs.com',
    currentYear: new Date().getFullYear().toString()
  };

  switch (templateType) {
    case 'account-validation':
      return {
        ...baseData,
        verificationUrl: 'https://app.ezshell-labs.com/verify?token=sample123',
        verificationToken: 'VER-123-456-789',
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000)
      };

    case 'lab-provisioning':
      return {
        ...baseData,
        labName: 'AWS EC2 Fundamentals',
        labDescription: 'Learn the basics of Amazon EC2 instances',
        estimatedTime: '15-20 minutes',
        provisioningSteps: [
          'Creating VPC and subnets',
          'Launching EC2 instances',
          'Configuring security groups',
          'Setting up SSH access'
        ]
      };

    case 'lab-ready':
      return {
        ...baseData,
        labName: 'AWS EC2 Fundamentals',
        labDescription: 'Learn the basics of Amazon EC2 instances',
        accessUrl: 'https://lab.ezshell-labs.com/access/12345',
        duration: '2 hours',
        expiresAt: new Date(Date.now() + 2 * 60 * 60 * 1000)
      };

    case 'lab-completion':
      return {
        ...baseData,
        labName: 'AWS EC2 Fundamentals',
        labDescription: 'Learn the basics of Amazon EC2 instances',
        score: 95,
        timeSpent: '1h 45m',
        tasksCompleted: '8/8',
        achievements: ['Perfect Score', 'Speed Learner', 'First Completion'],
        certificate: {
          downloadUrl: 'https://certs.ezshell-labs.com/download/cert123'
        },
        feedback: 'Excellent work on the EC2 lab! Your understanding of instance types and security groups is outstanding.',
        nextRecommendedLab: 'AWS S3 Storage Fundamentals',
        dashboardUrl: 'https://app.ezshell-labs.com/dashboard'
      };

    case 'lab-expiration':
      return {
        ...baseData,
        labName: 'AWS EC2 Fundamentals',
        expiresAt: new Date(Date.now() + 30 * 60 * 1000),
        timeRemaining: '30 minutes',
        accessUrl: 'https://lab.ezshell-labs.com/access/12345',
        canExtend: true,
        extendUrl: 'https://lab.ezshell-labs.com/extend/12345',
        maxExtensions: 2
      };

    case 'general-notification':
      return {
        ...baseData,
        subject: 'Platform Maintenance Scheduled',
        priority: 'medium' as const,
        previewText: 'We will be performing scheduled maintenance this weekend',
        message: 'We wanted to inform you about upcoming platform maintenance that will enhance your learning experience.',
        actionButton: {
          text: 'View Details',
          url: 'https://status.ezshell-labs.com'
        },
        highlights: [
          {
            title: 'Maintenance Window',
            description: 'Saturday 2:00 AM - 6:00 AM EST Sunday',
            url: 'https://status.ezshell-labs.com'
          }
        ]
      };

    case 'campaign':
      return {
        ...baseData,
        campaignName: 'New Cloud Certification Track',
        subtitle: 'Master AWS, Azure, and GCP with hands-on labs',
        content: 'We\'re excited to announce our new Cloud Certification Track with 50+ hands-on labs!',
        heroImage: 'https://images.ezshell-labs.com/campaigns/cloud-cert-hero.jpg',
        primaryCTA: {
          title: 'Start Your Cloud Journey',
          description: 'Get access to all certification tracks',
          buttonText: 'Enroll Now',
          url: 'https://app.ezshell-labs.com/certifications',
          note: 'Limited time offer - 40% off first month'
        },
        features: [
          {
            icon: '☁️',
            title: 'Multi-Cloud',
            description: 'AWS, Azure, and GCP coverage'
          },
          {
            icon: '🏆',
            title: 'Certification Ready',
            description: 'Aligned with official exams'
          }
        ]
      };

    case 'instructor-assignment':
      return {
        ...baseData,
        instructorName: 'Dr. Sarah Johnson',
        assignmentType: 'Lab Cohort',
        cohortName: 'Cloud Fundamentals - Spring 2024',
        studentCount: 25,
        startDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        duration: '4 weeks',
        labType: 'AWS Fundamentals',
        dashboardUrl: 'https://instructor.ezshell-labs.com/dashboard',
        students: [
          { name: 'Alice Smith', email: 'alice@example.com', status: 'enrolled' },
          { name: 'Bob Wilson', email: 'bob@example.com', status: 'pending' }
        ],
        responsibilities: [
          'Monitor student progress and provide guidance',
          'Answer questions in the lab environment',
          'Grade lab submissions and provide feedback'
        ]
      };

    default:
      return null;
  }
}
