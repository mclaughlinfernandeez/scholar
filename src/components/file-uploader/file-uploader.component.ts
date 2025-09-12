import { ChangeDetectionStrategy, Component, output } from '@angular/core';

@Component({
  selector: 'app-file-uploader',
  templateUrl: './file-uploader.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class FileUploaderComponent {
  fileUploaded = output<File>();
  knowledgeUploaded = output<File>();

  onFileChange(event: Event, type: 'data' | 'knowledge'): void {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files.length > 0) {
      const file = input.files[0];
      if (type === 'data') {
        this.fileUploaded.emit(file);
      } else {
        this.knowledgeUploaded.emit(file);
      }
    }
  }
}
