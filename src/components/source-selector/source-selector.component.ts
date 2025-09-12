import { ChangeDetectionStrategy, Component, inject, input, model, output, signal, WritableSignal } from '@angular/core';
import { ResearchSource } from '../../models/types';
import { VoiceInteractionService } from '../../services/voice-interaction.service';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-source-selector',
  templateUrl: './source-selector.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SourceSelectorComponent {
  sources = input.required<ResearchSource[]>();
  generateReport = output<ResearchSource[]>();

  selectedSources: WritableSignal<Set<string>> = model(new Set<string>());

  // Voice Interaction State
  voiceService = inject(VoiceInteractionService);
  transcript = signal('');
  assistantMessage = signal("Try saying 'Select all', 'Clear selection', or 'Show me sources about lipid metabolism'.");
  private voiceSubscription: Subscription | null = null;

  toggleSource(sourceId: string): void {
    this.selectedSources.update(currentSet => {
      const newSet = new Set(currentSet);
      if (newSet.has(sourceId)) {
        newSet.delete(sourceId);
      } else {
        newSet.add(sourceId);
      }
      return newSet;
    });
  }

  toggleVoiceCommand(): void {
    if (this.voiceService.isListening()) {
      this.voiceService.stopListening();
      if(this.voiceSubscription) {
        this.voiceSubscription.unsubscribe();
        this.voiceSubscription = null;
      }
    } else {
      this.transcript.set('');
      this.assistantMessage.set('Listening...');
      this.voiceSubscription = this.voiceService.listen().subscribe(transcript => {
        this.transcript.set(`You said: "${transcript}"`);
        this.processVoiceCommand(transcript);
      });
    }
  }

  async processVoiceCommand(command: string): Promise<void> {
    const lowerCommand = command.toLowerCase().trim();
    const sources = this.sources();

    // Command: Clear all selections
    if (lowerCommand.includes('clear all') || lowerCommand.includes('clear selection') || lowerCommand.includes('deselect all')) {
        this.selectedSources.set(new Set());
        const message = "All selections have been cleared.";
        this.assistantMessage.set(message);
        await this.voiceService.speak(message);
        return;
    }

    // Command: Select all
    if (lowerCommand.includes('select all')) {
        this.selectedSources.set(new Set(sources.map(s => s.id)));
        const message = "Okay, I've selected all sources.";
        this.assistantMessage.set(message);
        await this.voiceService.speak(message);
        return;
    }
    
    // Command: Generate report
    if (lowerCommand.includes('generate') || lowerCommand.includes('continue') || lowerCommand.includes('next')) {
        if(this.selectedSources().size > 0) {
            const message = "Generating the report now.";
            this.assistantMessage.set(message);
            await this.voiceService.speak(message);
            this.onGenerateClick();
        } else {
            const message = "Please select at least one source before generating the report.";
            this.assistantMessage.set(message);
            await this.voiceService.speak(message);
        }
        return;
    }

    // Command: Find sources by keyword
    const findPrefixes = ['show me sources', 'find sources', 'which sources'];
    const findPrefixUsed = findPrefixes.find(p => lowerCommand.startsWith(p));
    
    if (findPrefixUsed) {
        let commandBody = lowerCommand.substring(findPrefixUsed.length).trim();
        const prepositions = ['with', 'about', 'on', 'mentioning'];
        const firstWord = commandBody.split(' ')[0];
        let keyword = commandBody;

        if (prepositions.includes(firstWord)) {
            keyword = commandBody.substring(firstWord.length).trim();
        }

        if (keyword) {
            const matchingSources: { source: ResearchSource, index: number }[] = [];
            sources.forEach((source, index) => {
                const content = [
                    source.title,
                    source.summary,
                    ...(source.markers || []),
                    ...(source.authors || [])
                ].join(' ').toLowerCase();
                
                if (content.includes(keyword)) {
                    matchingSources.push({ source, index });
                }
            });

            if (matchingSources.length > 0) {
                const numberToOrdinal: { [key: number]: string } = { 1: 'first', 2: 'second', 3: 'third', 4: 'fourth' };
                const ordinals = matchingSources.map(m => numberToOrdinal[m.index + 1] || `number ${m.index + 1}`).join(' and ');
                const message = `I found matches for "${keyword}" in the ${ordinals} source${matchingSources.length > 1 ? 's' : ''}.`;
                this.assistantMessage.set(message);
                await this.voiceService.speak(message);
            } else {
                const message = `Sorry, I couldn't find any sources mentioning "${keyword}".`;
                this.assistantMessage.set(message);
                await this.voiceService.speak(message);
            }
        } else {
            const message = "I can search for sources, but please tell me what to look for. For example, 'Show me sources about cardiovascular disease'.";
            this.assistantMessage.set(message);
            await this.voiceService.speak(message);
        }
        return;
    }

    // Commands that require a target source
    let targetSource: ResearchSource | null = null;
    const ordinals: { [key: string]: number } = { first: 1, second: 2, third: 3, fourth: 4, one: 1, two: 2, three: 3, four: 4 };
    for (const word in ordinals) {
        if (lowerCommand.includes(word)) {
            const index = ordinals[word] - 1;
            if(sources[index]) {
                targetSource = sources[index];
                break;
            }
        }
    }

    if (!targetSource) {
      for(const source of sources) {
        const titleWords = source.title.toLowerCase().split(' ');
        if(titleWords.some(w => lowerCommand.includes(w) && w.length > 3)) {
          targetSource = source;
          break;
        }
        const authorLastName = source.authors?.map(a => a.split(' ').pop()?.toLowerCase());
        if(authorLastName?.some(name => name && lowerCommand.includes(name))) {
            targetSource = source;
            break;
        }
      }
    }
    
    if (targetSource) {
        // Discuss
        if (lowerCommand.includes('discuss') || lowerCommand.includes('tell me about')) {
            const message = `Of course. Here is a summary of "${targetSource.title}": ${targetSource.summary}`;
            this.assistantMessage.set(message);
            await this.voiceService.speak(message);
            return;
        }
        // Select
        if (lowerCommand.includes('select') || lowerCommand.includes('add')) {
            if (!this.selectedSources().has(targetSource.id)) {
                this.toggleSource(targetSource.id);
            }
            const message = `Selected: "${targetSource.title}".`;
            this.assistantMessage.set(message);
            await this.voiceService.speak(message);
            return;
        }
        // Deselect
        if (lowerCommand.includes('deselect') || lowerCommand.includes('remove')) {
            if (this.selectedSources().has(targetSource.id)) {
                this.toggleSource(targetSource.id);
            }
            const message = `Deselected: "${targetSource.title}".`;
            this.assistantMessage.set(message);
            await this.voiceService.speak(message);
            return;
        }
    }
    
    // Fallback if no command was matched
    const message = "Sorry, I didn't understand that. You can say things like 'Select the first source', 'Clear all', or 'Show me sources about lipids'.";
    this.assistantMessage.set(message);
    await this.voiceService.speak(message);
  }

  onGenerateClick(): void {
    const selected = this.sources().filter(s => this.selectedSources().has(s.id));
    this.generateReport.emit(selected);
  }
}