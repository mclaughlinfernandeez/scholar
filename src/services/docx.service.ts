import { Injectable } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class DocxService {
  // This is a simplified version. A real implementation would use a library
  // like 'docx' to create a proper .docx file.
  // For this environment, we will generate a text file and name it .docx.
  // Word can usually open these simple text files.
  saveAsDocx(content: string, fileName: string = 'report.docx'): void {
    // A simple conversion of markdown-like headers to plain text with underlines
    const plainTextContent = content
      .replace(/^## (.*)/gm, '\n$1\n' + '='.repeat(80) + '\n')
      .replace(/^### (.*)/gm, '\n$1\n' + '-'.repeat(80) + '\n');

    const blob = new Blob([plainTextContent], { type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' });

    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = fileName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(link.href);
  }
}
