import { Injectable } from '@angular/core';
import { of, delay } from 'rxjs';
import { AnalysisResult, ResearchSource } from '../models/types';

@Injectable({ providedIn: 'root' })
export class ApiService {

  // Mock fetching sources based on analysis keywords
  fetchSources(analysis: AnalysisResult) {
    const mockSources: ResearchSource[] = [
      {
        id: 'gwas1',
        type: 'GWAS',
        title: `GWAS Catalog: ${analysis.phenotypes[0] || 'Cardiovascular Disease'} and ${analysis.markers[0] || 'rs12345'}`,
        summary: `A large-scale genome-wide association study identifies novel loci for ${analysis.phenotypes[0] || 'Cardiovascular Disease'}. The study highlights the role of the ${analysis.markers[0] || 'rs12345'} variant.`,
        link: 'https://www.ebi.ac.uk/gwas/',
        markers: [analysis.markers[0] || 'rs12345', 'rs67890', 'rs112233']
      },
      {
        id: 'ss1',
        type: 'Semantic Scholar',
        title: `The Genetic Architecture of ${analysis.phenotypes[1] || 'Type 2 Diabetes'}`,
        summary: `This review covers recent advances in understanding the genetic basis of ${analysis.phenotypes[1] || 'Type 2 Diabetes'}, including findings from major GWAS consortia.`,
        link: 'https://www.semanticscholar.org/',
        authors: ['J. Doe', 'A. Smith', 'M. Johnson']
      },
      {
        id: 'gwas2',
        type: 'GWAS',
        title: `GWAS of ${analysis.research_areas[0] || 'Lipid Metabolism'} in 1.2 Million Individuals`,
        summary: `Discovery of 500 new loci influencing lipid levels, providing new insights into the biology of lipid metabolism and its relationship with human disease.`,
        link: 'https://www.ebi.ac.uk/gwas/',
        markers: ['rs98765', 'rs54321']
      },
      {
        id: 'ss2',
        type: 'Semantic Scholar',
        title: `Polygenic risk scores for ${analysis.phenotypes[0] || 'Cardiovascular Disease'} prediction`,
        summary: `An evaluation of the clinical utility of polygenic risk scores (PRS) for predicting cardiovascular events, discussing the current limitations and future potential.`,
        link: 'https://www.semanticscholar.org/',
        authors: ['C. Brown', 'D. White']
      }
    ];

    // Simulate network delay
    return of(mockSources).pipe(delay(1500));
  }
}