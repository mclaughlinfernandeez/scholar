import { ChangeDetectionStrategy, Component, inject, signal, WritableSignal } from '@angular/core';
import { CommonModule } from '@angular/common';

import { FileUploaderComponent } from './components/file-uploader/file-uploader.component';
import { SourceSelectorComponent } from './components/source-selector/source-selector.component';
import { ReportViewerComponent } from './components/report-viewer/report-viewer.component';

import { FileService } from './services/file.service';
import { GeminiService } from './services/gemini.service';
import { ApiService } from './services/api.service';
import { GenomeService } from './services/genome.service';

import { AppState, ResearchSource } from './models/types';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule, FileUploaderComponent, SourceSelectorComponent, ReportViewerComponent],
  templateUrl: './app.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AppComponent {
  private fileService = inject(FileService);
  private geminiService = inject(GeminiService);
  private apiService = inject(ApiService);
  private genomeService = inject(GenomeService);

  state: WritableSignal<AppState> = signal({ status: 'initial' });
  
  private dataFileContent: WritableSignal<string> = signal('');
  private knowledgeJson: WritableSignal<any> = signal({});

  async onDataFileUploaded(file: File) {
    this.state.set({ status: 'comparing', fileName: file.name });
    try {
      const content = await this.fileService.readFileContent(file);
      this.dataFileContent.set(content);

      const comparisonResult = await this.genomeService.compareAndCompress(content, file.name);
      
      this.state.set({
        status: 'comparisonReady',
        fileName: file.name,
        comparisonFile: { blob: comparisonResult.blob, name: comparisonResult.fileName }
      });

    } catch (error) {
      console.error(error);
      this.state.set({ status: 'error', message: 'Failed to read or compare the uploaded file.' });
    }
  }

  onContinueToAnalysis() {
    const currentState = this.state();
    if (currentState.status !== 'comparisonReady') return;

    const fileName = currentState.fileName;
    const content = this.dataFileContent();
    
    this.state.set({ status: 'analyzing', fileName });
    
    this.geminiService.analyzeContent(content).subscribe({
      next: analysis => {
        this.state.set({ status: 'fetchingSources', fileName: fileName, analysis });
        this.apiService.fetchSources(analysis).subscribe(sources => {
          this.state.set({ status: 'sourcesReady', fileName: fileName, analysis, sources });
        });
      },
      error: err => {
          console.error(err);
          this.state.set({ status: 'error', message: 'Failed to analyze file content.' });
      }
    });
  }
  
  downloadComparisonFile() {
    const currentState = this.state();
    if (currentState.status !== 'comparisonReady') return;

    const { blob, name } = currentState.comparisonFile;
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = name;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(link.href);
  }

  async onKnowledgeFileUploaded(file: File) {
    try {
        const json = await this.fileService.readJsonFile(file);
        this.knowledgeJson.set(json);
        console.log("Knowledge JSON loaded successfully.");
    } catch (error) {
        console.error(error);
        this.state.set({ status: 'error', message: 'Failed to read or parse knowledge JSON file.' });
    }
  }

  onGenerateReport(selectedSources: ResearchSource[]) {
    this.state.set({ status: 'generatingReport', selectedSources });
    this.geminiService.generateReport(this.dataFileContent(), this.knowledgeJson(), selectedSources)
      .subscribe({
        next: report => {
          this.state.set({ status: 'reportReady', report });
        },
        error: err => {
          console.error(err);
          this.state.set({ status: 'error', message: 'Failed to generate the report.' });
        }
    });
  }
  
  onStartOver() {
    this.dataFileContent.set('');
    this.knowledgeJson.set({});
    this.state.set({ status: 'initial' });
  }
}