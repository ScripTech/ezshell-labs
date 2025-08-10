'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Eye, Edit, Save, RefreshCw, ArrowLeft } from "lucide-react";
import Link from 'next/link';

interface TemplateInfo {
  name: string;
  displayName: string;
  description: string;
  variables: string[];
}

const TEMPLATE_TYPES: TemplateInfo[] = [
  {
    name: 'account-validation',
    displayName: 'Account Validation',
    description: 'Email sent to validate new user accounts',
    variables: ['userName', 'verificationUrl', 'verificationToken', 'expiresAt', 'companyName', 'supportEmail']
  },
  {
    name: 'lab-provisioning',
    displayName: 'Lab Provisioning',
    description: 'Notification that lab is being set up',
    variables: ['userName', 'labName', 'estimatedTime', 'companyName', 'supportEmail']
  },
  {
    name: 'lab-ready',
    displayName: 'Lab Ready',
    description: 'Notification that lab is ready to access',
    variables: ['userName', 'labName', 'labDescription', 'accessUrl', 'duration', 'expiresAt', 'companyName', 'supportEmail']
  },
  {
    name: 'lab-completion',
    displayName: 'Lab Completion',
    description: 'Congratulations on completing a lab',
    variables: ['userName', 'labName', 'completionTime', 'score', 'certificateUrl', 'nextLabUrl', 'companyName', 'supportEmail']
  },
  {
    name: 'lab-expiration',
    displayName: 'Lab Expiration',
    description: 'Warning that lab access is expiring',
    variables: ['userName', 'labName', 'expiresAt', 'accessUrl', 'companyName', 'supportEmail']
  },
  {
    name: 'general-notification',
    displayName: 'General Notification',
    description: 'General purpose notification template',
    variables: ['userName', 'title', 'message', 'actionUrl', 'actionText', 'companyName', 'supportEmail']
  },
  {
    name: 'campaign',
    displayName: 'Marketing Campaign',
    description: 'Marketing and promotional emails',
    variables: ['userName', 'campaignTitle', 'campaignMessage', 'ctaUrl', 'ctaText', 'companyName', 'supportEmail']
  },
  {
    name: 'instructor-assignment',
    displayName: 'Instructor Assignment',
    description: 'Notification to instructors about new assignments',
    variables: ['instructorName', 'labName', 'studentCount', 'assignmentDate', 'dueDate', 'accessUrl', 'companyName', 'supportEmail']
  },
  {
    name: 'user-enrollment',
    displayName: 'User Enrollment',
    description: 'Notification to users when enrolled by admin/instructor',
    variables: ['userName', 'labName', 'labDescription', 'enrolledBy', 'enrollmentDate', 'accessUrl', 'duration', 'dueDate', 'companyName', 'supportEmail']
  }
];

export default function TemplateEditor() {
  const [selectedTemplate, setSelectedTemplate] = useState<string>('account-validation');
  const [selectedFormat, setSelectedFormat] = useState<'html' | 'text'>('html');
  const [templateContent, setTemplateContent] = useState<string>('');
  const [previewContent, setPreviewContent] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);
  const [previewData, setPreviewData] = useState<Record<string, any>>({});
  const [showPreview, setShowPreview] = useState(false);
  const [showRawHtml, setShowRawHtml] = useState(false);

  const currentTemplate = TEMPLATE_TYPES.find(t => t.name === selectedTemplate);

  // Auto-resize iframe function
  const handleIframeLoad = (iframe: HTMLIFrameElement) => {
    try {
      const iframeDoc = iframe.contentDocument || iframe.contentWindow?.document;
      if (iframeDoc) {
        const height = Math.max(
          iframeDoc.body.scrollHeight,
          iframeDoc.documentElement.scrollHeight,
          400 // minimum height
        );
        iframe.style.height = `${Math.min(height + 20, 600)}px`; // max height 600px
      }
    } catch (e) {
      // Cross-origin restriction, use default height
      iframe.style.height = '400px';
    }
  };

  useEffect(() => {
    loadTemplate();
    // Clear preview when changing templates
    setPreviewContent('');
    setShowPreview(false);
  }, [selectedTemplate, selectedFormat]);

  useEffect(() => {
    // Generate sample data for preview
    const sampleData = generateSampleData();
    setPreviewData(sampleData);
  }, [selectedTemplate]);

  const loadTemplate = async () => {
    setIsLoading(true);
    try {
      const response = await fetch(`/api/templates?template=${selectedTemplate}&format=${selectedFormat}`);
      if (response.ok) {
        const data = await response.json();
        setTemplateContent(data.content || '');
      } else {
        const error = await response.json();
        setTemplateContent(`<!-- Template not found: ${error.error} -->`);
      }
    } catch (error) {
      console.error('Failed to load template:', error);
      setTemplateContent('<!-- Failed to load template -->');
    } finally {
      setIsLoading(false);
    }
  };

  const saveTemplate = async () => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/templates', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          templateName: selectedTemplate,
          format: selectedFormat,
          content: templateContent
        })
      });

      if (response.ok) {
        const result = await response.json();
        alert('Template saved successfully!');
      } else {
        const error = await response.json();
        alert(`Failed to save template: ${error.error}`);
      }
    } catch (error) {
      console.error('Failed to save template:', error);
      alert('Failed to save template');
    } finally {
      setIsLoading(false);
    }
  };

  const previewTemplate = async () => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/templates', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          templateName: selectedTemplate,
          format: selectedFormat,
          templateData: previewData
        })
      });

      if (response.ok) {
        const result = await response.json();
        // Update preview content with rendered template
        setPreviewContent(result.renderedContent);
        setShowPreview(true);
      } else {
        const error = await response.json();
        alert(`Preview failed: ${error.error}`);
      }
    } catch (error) {
      console.error('Failed to preview template:', error);
      alert('Preview failed');
    } finally {
      setIsLoading(false);
    }
  };

  const generateSampleData = () => {
    const baseData = {
      userName: 'John Doe',
      companyName: 'EZShell Labs',
      supportEmail: 'support@ezshell-labs.com',
      currentYear: new Date().getFullYear().toString()
    };

    switch (selectedTemplate) {
      case 'account-validation':
        return {
          ...baseData,
          verificationUrl: 'https://app.ezshell-labs.com/verify?token=abc123',
          verificationToken: 'ABC-123-XYZ',
          expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000)
        };
      case 'lab-ready':
        return {
          ...baseData,
          labName: 'RHCSA Lab - System Administration Fundamentals',
          labDescription: 'Learn the basics of System Administration Fundamentals',
          accessUrl: 'https://lab.ezshell-labs.com/access/123',
          duration: '2 hours',
          expiresAt: new Date(Date.now() + 2 * 60 * 60 * 1000)
        };
      case 'lab-expiration':
        return {
          ...baseData,
          labName: 'RHCSA Lab - System Administration Fundamentals',
          expiresAt: new Date(Date.now() + 30 * 60 * 1000), // 30 minutes from now
          accessUrl: 'https://lab.ezshell-labs.com/access/123'
        };
      case 'lab-completion':
        return {
          ...baseData,
          labName: 'RHCSA Lab - System Administration Fundamentals',
          completionTime: '1 hour 45 minutes',
          score: '95%',
          certificateUrl: 'https://certs.ezshell-labs.com/cert123',
          nextLabUrl: 'https://app.ezshell-labs.com/labs/aws-s3'
        };
      case 'lab-provisioning':
        return {
          ...baseData,
          labName: 'RHCSA Lab - System Administration Fundamentals',
          estimatedTime: '3-5 minutes'
        };
      case 'general-notification':
        return {
          ...baseData,
          title: 'System Maintenance Notice',
          message: 'We will be performing scheduled maintenance on our systems.',
          actionUrl: 'https://status.ezshell-labs.com',
          actionText: 'View Status Page'
        };
      case 'campaign':
        return {
          ...baseData,
          campaignTitle: 'New Lab Series: Advanced AWS',
          campaignMessage: 'Discover our new advanced AWS certification prep labs.',
          ctaUrl: 'https://app.ezshell-labs.com/aws-advanced',
          ctaText: 'Explore Now'
        };
      case 'instructor-assignment':
        return {
          ...baseData,
          instructorName: 'Eng. Edilson Mucanze',
          labName: 'RHCSA Lab - System Administration Fundamentals',
          cohortName: "RHCSA Cohort 1",
          studentCount: 10,
          assignmentType: `Hands-on Lab Course`,
          assignmentDate: new Date().toLocaleDateString(),
          duration: '2 hours',
          labType: 'Hands-on',
          startDate: new Date(Date.now() + 2 * 60 * 60 * 1000),
          endDate: new Date(Date.now() + 2 * 60 * 60 * 1000),
          dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toLocaleDateString(),
          accessUrl: '#accessUrl',
          labAccessUrl: '#labs/rhcsa-lab-1'
        };
      case 'user-enrollment':
        return {
          ...baseData,
          labName: 'RHCSA Lab - System Administration Fundamentals',
          labDescription: 'Master the essential skills for Red Hat Certified System Administrator (RHCSA) certification',
          enrolledBy: 'Eng. Edilson Mucanze',
          enrollmentDate: new Date().toLocaleDateString(),
          accessUrl: 'https://app.ezshell-labs.com/labs/rhcsa-fundamentals',
          duration: '2 hours',
          dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toLocaleDateString()
        };
      default:
        return baseData;
    }
  };

  return (
    <div className="container mx-auto py-6 px-4">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center space-x-3 mb-2">
          <Link href="/admin" className="text-muted-foreground hover:text-primary">
            <ArrowLeft className="h-5 w-5" />
          </Link>
          <Edit className="h-5 w-5 text-primary" />
          <h1 className="text-2xl font-bold tracking-tight">Email Template Editor</h1>
        </div>
        <p className="text-lg text-muted-foreground">
          Edit and preview your email templates
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Template Selection */}
        <div className="lg:col-span-1">
          <Card className='shadow-none rounded-md'>
            <CardHeader>
              <CardTitle className="text-lg">Templates</CardTitle>
              <CardDescription>
                Select a template to edit
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {TEMPLATE_TYPES.map((template) => (
                  <div
                    key={template.name}
                    className={`p-3 rounded-lg cursor-pointer border transition-colors ${
                      selectedTemplate === template.name
                        ? 'bg-primary text-primary-foreground'
                        : 'hover:bg-muted'
                    }`}
                    onClick={() => setSelectedTemplate(template.name)}
                  >
                    <div className="font-medium text-sm">{template.displayName}</div>
                    <div className="text-xs opacity-75 mt-1">{template.description}</div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Template Editor */}
        <div className="lg:col-span-3">
          <Card className='shadow-none rounded-md'>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center space-x-2">
                    <span>{currentTemplate?.displayName}</span>
                    <Badge variant="outline">{selectedFormat.toUpperCase()}</Badge>
                  </CardTitle>
                  <CardDescription>
                    {currentTemplate?.description}
                  </CardDescription>
                </div>
                <div className="flex items-center space-x-2">
                  <Select value={selectedFormat} onValueChange={(value: 'html' | 'text') => setSelectedFormat(value)}>
                    <SelectTrigger className="w-24">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="html">HTML</SelectItem>
                      <SelectItem value="text">Text</SelectItem>
                    </SelectContent>
                  </Select>
                  <Button variant="outline" size="sm" onClick={previewTemplate} disabled={isLoading}>
                    <Eye className="h-4 w-4 mr-1" />
                    Preview
                  </Button>
                  <Button size="sm" onClick={saveTemplate} disabled={isLoading}>
                    {isLoading ? (
                      <RefreshCw className="h-4 w-4 mr-1 animate-spin" />
                    ) : (
                      <Save className="h-4 w-4 mr-1" />
                    )}
                    Save
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <Tabs value={showPreview ? "preview" : "edit"} onValueChange={(v) => setShowPreview(v === "preview")}>
                <TabsList>
                  <TabsTrigger value="edit">Edit Template</TabsTrigger>
                  <TabsTrigger value="preview">Preview</TabsTrigger>
                </TabsList>

                <TabsContent value="edit" className="space-y-4">
                  <div>
                    <h3 className="font-medium mb-2">Available Variables:</h3>
                    <div className="flex flex-wrap gap-1 mb-4">
                      {currentTemplate?.variables.map((variable) => (
                        <Badge key={variable} variant="secondary" className="text-xs">
                          {`{{${variable}}}`}
                        </Badge>
                      ))}
                    </div>
                  </div>

                  <Textarea
                    value={templateContent}
                    onChange={(e) => setTemplateContent(e.target.value)}
                    placeholder="Template content..."
                    className="min-h-96 font-mono text-sm"
                  />
                </TabsContent>

                <TabsContent value="preview" className="space-y-4">
                  <div className="border rounded-lg p-4 bg-muted/10">
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="font-medium">Template Preview</h3>
                      {previewContent && selectedFormat === 'html' && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setShowRawHtml(!showRawHtml)}
                        >
                          {showRawHtml ? 'Show Rendered' : 'Show Raw HTML'}
                        </Button>
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground mb-4">
                      This shows how the template will look with sample data. HTML templates are rendered in an isolated frame to prevent style conflicts. Click "Preview" button to render with latest changes.
                    </p>
                    <div className="bg-white border rounded overflow-hidden">
                      {previewContent ? (
                        selectedFormat === 'html' ? (
                          showRawHtml ? (
                            <div className="p-4 max-h-96 overflow-auto">
                              <pre className="whitespace-pre-wrap text-sm bg-gray-50 p-3 rounded">
                                {previewContent}
                              </pre>
                            </div>
                          ) : (
                            <iframe
                              srcDoc={previewContent}
                              className="w-full border-0"
                              sandbox="allow-same-origin"
                              title="Email Template Preview"
                              style={{
                                backgroundColor: 'white',
                                minHeight: '400px',
                                maxHeight: '600px'
                              }}
                              onLoad={(e) => handleIframeLoad(e.currentTarget)}
                            />
                          )
                        ) : (
                          <div className="p-4 max-h-96 overflow-auto">
                            <pre className="whitespace-pre-wrap text-sm">
                              {previewContent}
                            </pre>
                          </div>
                        )
                      ) : (
                        <div className="text-center py-8 text-muted-foreground">
                          <Eye className="h-8 w-8 mx-auto mb-2" />
                          <p>Click the "Preview" button to render the template with sample data</p>
                        </div>
                      )}
                    </div>
                    {previewContent && (
                      <div className="mt-4 p-3 bg-blue-50 rounded text-sm">
                        <h4 className="font-medium text-blue-800 mb-1">Sample Data Used:</h4>
                        <pre className="text-xs text-blue-600 overflow-x-auto">
                          {JSON.stringify(previewData, null, 2)}
                        </pre>
                      </div>
                    )}
                  </div>
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
