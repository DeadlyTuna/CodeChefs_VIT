import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import { notesService } from './notesService';

class ExportService {
    /**
     * Export a note to PDF
     */
    async exportNoteToPDF(noteId: string, userId: string): Promise<void> {
        const notes = await notesService.getNotes(userId);
        const note = notes.find((n) => n.id === noteId);

        if (!note) {
            throw new Error('Note not found');
        }

        const pdf = new jsPDF('p', 'mm', 'a4');
        const pageWidth = pdf.internal.pageSize.getWidth();
        const margin = 15;
        const maxWidth = pageWidth - 2 * margin;

        // Add title
        pdf.setFontSize(20);
        pdf.setFont('helvetica', 'bold');
        pdf.text(note.title, margin, 20);

        // Add metadata
        pdf.setFontSize(10);
        pdf.setFont('helvetica', 'normal');
        const date = new Date(note.updatedAt).toLocaleDateString();
        pdf.text(`Last updated: ${date}`, margin, 30);

        // Add content
        pdf.setFontSize(12);
        const contentLines = pdf.splitTextToSize(this.stripHTML(note.content), maxWidth);
        pdf.text(contentLines, margin, 40);

        // Download
        pdf.save(`${note.title.replace(/[^a-z0-9]/gi, '_')}.pdf`);
    }

    /**
     * Export note to Markdown
     */
    async exportNoteToMarkdown(noteId: string, userId: string): Promise<void> {
        const notes = await notesService.getNotes(userId);
        const note = notes.find((n) => n.id === noteId);

        if (!note) {
            throw new Error('Note not found');
        }

        const markdown = this.htmlToMarkdown(note.content);
        const content = `# ${note.title}\n\n*Last updated: ${new Date(note.updatedAt).toLocaleDateString()}*\n\n${markdown}`;

        // Create download
        const blob = new Blob([content], { type: 'text/markdown' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${note.title.replace(/[^a-z0-9]/gi, '_')}.md`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    }

    /**
     * Export all notes as a ZIP (future enhancement)
     */
    async exportAllNotes(userId: string, format: 'pdf' | 'markdown' = 'markdown'): Promise<void> {
        const notes = await notesService.getNotes(userId);

        for (const note of notes) {
            if (format === 'pdf') {
                await this.exportNoteToPDF(note.id, userId);
            } else {
                await this.exportNoteToMarkdown(note.id, userId);
            }
            // Add delay to avoid overwhelming browser
            await new Promise((resolve) => setTimeout(resolve, 500));
        }
    }

    /**
     * Export canvas/drawing to image
     */
    async exportCanvasToImage(canvasElement: HTMLCanvasElement, filename: string): Promise<void> {
        canvasElement.toBlob((blob) => {
            if (!blob) return;
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `${filename}.png`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
        });
    }

    /**
     * Export DOM element to PDF
     */
    async exportElementToPDF(element: HTMLElement, filename: string): Promise<void> {
        const canvas = await html2canvas(element);
        const imgData = canvas.toDataURL('image/png');

        const pdf = new jsPDF('p', 'mm', 'a4');
        const pdfWidth = pdf.internal.pageSize.getWidth();
        const pdfHeight = pdf.internal.pageSize.getHeight();
        const imgWidth = canvas.width;
        const imgHeight = canvas.height;
        const ratio = Math.min(pdfWidth / imgWidth, pdfHeight / imgHeight);
        const imgX = (pdfWidth - imgWidth * ratio) / 2;
        const imgY = 15;

        pdf.addImage(imgData, 'PNG', imgX, imgY, imgWidth * ratio, imgHeight * ratio);
        pdf.save(`${filename}.pdf`);
    }

    // Helper methods
    private stripHTML(html: string): string {
        const tmp = document.createElement('DIV');
        tmp.innerHTML = html;
        return tmp.textContent || tmp.innerText || '';
    }

    private htmlToMarkdown(html: string): string {
        // Simple HTML to Markdown conversion
        let markdown = html;

        // Headers
        markdown = markdown.replace(/<h1[^>]*>(.*?)<\/h1>/gi, '# $1\n\n');
        markdown = markdown.replace(/<h2[^>]*>(.*?)<\/h2>/gi, '## $1\n\n');
        markdown = markdown.replace(/<h3[^>]*>(.*?)<\/h3>/gi, '### $1\n\n');

        // Bold and Italic
        markdown = markdown.replace(/<strong[^>]*>(.*?)<\/strong>/gi, '**$1**');
        markdown = markdown.replace(/<b[^>]*>(.*?)<\/b>/gi, '**$1**');
        markdown = markdown.replace(/<em[^>]*>(.*?)<\/em>/gi, '*$1*');
        markdown = markdown.replace(/<i[^>]*>(.*?)<\/i>/gi, '*$1*');

        // Links
        markdown = markdown.replace(/<a[^>]*href="([^"]*)"[^>]*>(.*?)<\/a>/gi, '[$2]($1)');

        // Lists
        markdown = markdown.replace(/<ul[^>]*>(.*?)<\/ul>/gis, (match, content) => {
            return content.replace(/<li[^>]*>(.*?)<\/li>/gi, '- $1\n');
        });
        markdown = markdown.replace(/<ol[^>]*>(.*?)<\/ol>/gis, (match, content) => {
            let index = 1;
            return content.replace(/<li[^>]*>(.*?)<\/li>/gi, () => `${index++}. $1\n`);
        });

        // Paragraphs
        markdown = markdown.replace(/<p[^>]*>(.*?)<\/p>/gi, '$1\n\n');
        markdown = markdown.replace(/<br\s*\/?>/gi, '\n');

        // Code
        markdown = markdown.replace(/<code[^>]*>(.*?)<\/code>/gi, '`$1`');
        markdown = markdown.replace(/<pre[^>]*>(.*?)<\/pre>/gis, '```\n$1\n```\n\n');

        // Remove remaining HTML tags
        markdown = markdown.replace(/<[^>]+>/g, '');

        // Clean up multiple newlines
        markdown = markdown.replace(/\n{3,}/g, '\n\n');

        return markdown.trim();
    }
}

export const exportService = new ExportService();
