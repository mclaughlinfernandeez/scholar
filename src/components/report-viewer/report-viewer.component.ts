import { ChangeDetectionStrategy, Component, computed, inject, input, output } from '@angular/core';
import { DomSanitizer } from '@angular/platform-browser';
import { DocxService } from '../../services/docx.service';

@Component({
  selector: 'app-report-viewer',
  templateUrl: './report-viewer.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ReportViewerComponent {
  reportContent = input.required<string>();
  startOver = output();
  
  private docxService = inject(DocxService);
  // FIX: Explicitly type `sanitizer` as `DomSanitizer`. This resolves a type inference issue
  // where the compiler was treating the property as `unknown`, causing an error on `bypassSecurityTrustHtml`.
  private sanitizer: DomSanitizer = inject(DomSanitizer);

  // Simple markdown to HTML conversion to avoid external libraries
  private simpleMarkdownToHtml(markdown: string): string {
    return markdown
      .replace(/^## (.*$)/gim, '<h2 class="text-2xl font-bold mt-6 mb-3 text-sky-300">$1</h2>')
      .replace(/^### (.*$)/gim, '<h3 class="text-xl font-semibold mt-4 mb-2 text-sky-400">$1</h3>')
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
      .replace(/\*(.*?)\*/g, '<em>$1</em>')
      .replace(/`(.*?)`/g, '<code class="bg-slate-700 text-amber-300 px-1 py-0.5 rounded">$1</code>')
      .replace(/\n/g, '<br>');
  }

  reportHtml = computed(() => {
    const rawHtml = this.simpleMarkdownToHtml(this.reportContent());
    return this.sanitizer.bypassSecurityTrustHtml(rawHtml);
  });

  downloadDocx(): void {
    this.docxService.saveAsDocx(this.reportContent(), 'Genomic_Analysis_Report.docx');
  }

  onStartOver(): void {
    this.startOver.emit();
  }
}
