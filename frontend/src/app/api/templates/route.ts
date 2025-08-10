import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import fs from 'fs/promises';
import path from 'path';
import { authOptions } from '@/lib/auth';

const TEMPLATES_DIR = path.join(process.cwd(), 'src/services/email/templates');

console.log(`Templates directory: ${TEMPLATES_DIR}`);

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || session.user?.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const templateName = searchParams.get('template');
    const format = searchParams.get('format') || 'html';

    console.log(`Get template name: ${templateName}`);
    console.log(`Get template format: ${format}`);
    if (!templateName) {
      // Return list of available templates
      const files = await fs.readdir(TEMPLATES_DIR);
      const templates = files
        .filter(file => file.endsWith('.html.hbs'))
        .map(file => file.replace('.html.hbs', ''));

      return NextResponse.json({ templates });
    }

    // Read specific template
    const extension = format === 'text' ? 'text.hbs' : 'html.hbs';
    const filePath = path.join(TEMPLATES_DIR, `${templateName}.${extension}`);

    try {
      const content = await fs.readFile(filePath, 'utf-8');
      return NextResponse.json({
        content,
        templateName,
        format,
        filePath: filePath.replace(process.cwd(), '')
      });
    } catch (error) {
      return NextResponse.json({
        error: 'Template not found',
        templateName,
        format
      }, { status: 404 });
    }

  } catch (error) {
    console.error('Template API error:', error);
    return NextResponse.json({
      error: 'Internal server error'
    }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || session.user?.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { templateName, format, content } = body;

    if (!templateName || !content) {
      return NextResponse.json({
        error: 'Template name and content are required'
      }, { status: 400 });
    }

    // Save template
    const extension = format === 'text' ? 'text.hbs' : 'html.hbs';
    const filePath = path.join(TEMPLATES_DIR, `${templateName}.${extension}`);

    // Create backup of existing file
    try {
      const existingContent = await fs.readFile(filePath, 'utf-8');
      const backupPath = path.join(TEMPLATES_DIR, `${templateName}.${extension}.backup`);
      await fs.writeFile(backupPath, existingContent);
    } catch (error) {
      // File doesn't exist, no backup needed
    }

    // Write new content
    await fs.writeFile(filePath, content, 'utf-8');

    return NextResponse.json({
      success: true,
      message: 'Template saved successfully',
      templateName,
      format,
      filePath: filePath.replace(process.cwd(), '')
    });

  } catch (error) {
    console.error('Template save error:', error);
    return NextResponse.json({
      error: 'Failed to save template'
    }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || session.user?.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { templateName, format, templateData } = body;

    if (!templateName || !templateData) {
      return NextResponse.json({
        error: 'Template name and data are required'
      }, { status: 400 });
    }

    // Read and render template for preview
    const extension = format === 'text' ? 'text.hbs' : 'html.hbs';
    const filePath = path.join(TEMPLATES_DIR, `${templateName}.${extension}`);

    try {
      const content = await fs.readFile(filePath, 'utf-8');

      // Enhanced template variable replacement for preview
      let renderedContent = content;

      // Replace simple variables {{variable}}
      Object.entries(templateData).forEach(([key, value]) => {
        const regex = new RegExp(`{{\\s*${key}\\s*}}`, 'g');
        renderedContent = renderedContent.replace(regex, String(value));
      });

      // Handle Handlebars helpers and conditionals for preview
      // Replace {{#if condition}} blocks with simple logic
      renderedContent = renderedContent.replace(/\{\{#if\s+(\w+)\}\}([\s\S]*?)\{\{\/if\}\}/g, (match, condition, content) => {
        if (templateData[condition]) {
          return content;
        }
        return '';
      });

      // Replace {{#unless condition}} blocks
      renderedContent = renderedContent.replace(/\{\{#unless\s+(\w+)\}\}([\s\S]*?)\{\{\/unless\}\}/g, (match, condition, content) => {
        if (!templateData[condition]) {
          return content;
        }
        return '';
      });

      // Handle else blocks in if statements
      renderedContent = renderedContent.replace(/\{\{#if\s+(\w+)\}\}([\s\S]*?)\{\{else\}\}([\s\S]*?)\{\{\/if\}\}/g, (match, condition, ifContent, elseContent) => {
        if (templateData[condition]) {
          return ifContent;
        }
        return elseContent;
      });

      // Replace custom helpers with fallback values
      renderedContent = renderedContent.replace(/\{\{formatDate\s+(\w+)\}\}/g, (match, dateVar) => {
        const date = templateData[dateVar];
        if (date) {
          return new Date(date).toLocaleDateString();
        }
        return 'Date formatting';
      });

      renderedContent = renderedContent.replace(/\{\{formatTime\s+(\w+)\}\}/g, (match, dateVar) => {
        const date = templateData[dateVar];
        if (date) {
          return new Date(date).toLocaleTimeString();
        }
        return 'Time formatting';
      });

      // Clean up any remaining handlebars syntax for preview
      renderedContent = renderedContent.replace(/\{\{[\s\S]*?\}\}/g, '[Template Variable]');

      return NextResponse.json({
        originalContent: content,
        renderedContent,
        templateName,
        format
      });
    } catch (error) {
      return NextResponse.json({
        error: 'Template not found',
        templateName,
        format
      }, { status: 404 });
    }

  } catch (error) {
    console.error('Template preview error:', error);
    return NextResponse.json({
      error: 'Failed to preview template'
    }, { status: 500 });
  }
}
