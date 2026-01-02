import { Component, EventEmitter, Input, Output, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { animate, style, transition, trigger } from '@angular/animations';

@Component({
  selector: 'app-photo-upload',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './photo-upload.component.html',
  styleUrls: ['./photo-upload.component.css'],
  animations: [
    trigger('fadeIn', [
      transition(':enter', [
        style({ opacity: 0, transform: 'scale(0.95)' }),
        animate('300ms ease-out', style({ opacity: 1, transform: 'scale(1)' }))
      ])
    ])
  ]
})
export class PhotoUploadComponent {
  @Input() existingPhotos: string[] = [];
  @Output() filesChange = new EventEmitter<File[]>();

  previews = signal<string[]>([]);
  selectedFiles = signal<File[]>([]);

  onFilesSelected(event: Event) {
    const input = event.target as HTMLInputElement;
    if (!input.files?.length) return;

    const newFiles = Array.from(input.files);
    this.selectedFiles.update(current => [...current, ...newFiles]);

    newFiles.forEach(file => {
      const reader = new FileReader();
      reader.onload = () => {
        if (typeof reader.result === 'string') {
          this.previews.update(prev => [...prev, reader.result as string]);
        }
      };
      reader.readAsDataURL(file);
    });

    this.filesChange.emit(this.selectedFiles());
  }

  removePreview(index: number) {
    this.previews.update(prev => {
      const updated = [...prev];
      updated.splice(index, 1);
      return updated;
    });

    this.selectedFiles.update(files => {
      const updated = [...files];
      updated.splice(index, 1);
      return updated;
    });

    this.filesChange.emit(this.selectedFiles());
  }
}
