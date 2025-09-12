import { Injectable } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class FileService {

  async readFileContent(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (event) => {
        if (event.target?.result) {
          let content = event.target.result as string;
          // Pretend to decompress if it's a gz file
          if (file.name.endsWith('.gz')) {
            console.log('Decompressing GZ file (mock)...');
            // Mock decompression: just return the content as is for this example
            // In a real app, you'd use a library like pako.js
            resolve(content.substring(0, 5000)); // Limit size for analysis
          } else {
            resolve(content.substring(0, 5000)); // Limit size for analysis
          }
        } else {
          reject(new Error('Failed to read file.'));
        }
      };
      reader.onerror = (error) => reject(error);
      reader.readAsText(file);
    });
  }

  async readJsonFile(file: File): Promise<any> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (event) => {
        try {
          if (event.target?.result) {
            const json = JSON.parse(event.target.result as string);
            resolve(json);
          } else {
            reject(new Error('Failed to read JSON file.'));
          }
        } catch (e) {
          reject(new Error('Invalid JSON file.'));
        }
      };
      reader.onerror = (error) => reject(error);
      reader.readAsText(file);
    });
  }
}
