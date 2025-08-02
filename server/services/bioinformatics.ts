export type BioFileType = 'fasta' | 'genbank' | 'pdb' | 'csv' | 'vcf' | 'gtf' | 'gff' | 'fastq' | 'txt' | 'pdf' | 'docx' | 'md' | 'json' | 'xml';

export interface BioFileAnalysis {
  sequenceType: 'dna' | 'rna' | 'protein' | 'document' | 'data' | 'unknown';
  sequence: string;
  gcContent?: number;
  features?: string[];
  documentContent?: string;
  fileType: BioFileType;
  stats?: {
    length: number;
    composition: Record<string, number>;
    wordCount?: number;
    lineCount?: number;
  };
}

export async function analyzeBioFile(content: string, fileType: BioFileType): Promise<BioFileAnalysis> {
  try {
    let sequence = '';
    let sequenceType: 'dna' | 'rna' | 'protein' | 'document' | 'data' | 'unknown' = 'unknown';
    const features: string[] = [];
    let documentContent = '';

    switch (fileType) {
      case 'fasta':
        sequence = parseFastaSequence(content);
        sequenceType = determineSequenceType(sequence);
        break;

      case 'genbank':
        const gbResult = parseGenBankFile(content);
        sequence = gbResult.sequence;
        sequenceType = gbResult.type;
        features.push(...gbResult.features);
        break;

      case 'pdb':
        const pdbResult = parsePDBFile(content);
        sequence = pdbResult.sequence;
        sequenceType = 'protein';
        features.push(...pdbResult.features);
        break;

      case 'csv':
        // Handle CSV data files
        sequence = content.split('\n').slice(1).join(''); // Remove header
        sequenceType = 'data';
        features.push('tabular_data');
        documentContent = analyzeCSVContent(content);
        break;

      case 'vcf':
        const vcfResult = parseVCFFile(content);
        sequence = vcfResult.variants.join('');
        sequenceType = 'dna';
        features.push(...vcfResult.features);
        break;

      case 'fastq':
        sequence = parseFastqSequence(content);
        sequenceType = determineSequenceType(sequence);
        break;

      case 'txt':
      case 'md':
        sequenceType = 'document';
        documentContent = content;
        sequence = extractPotentialSequences(content);
        features.push('text_document');
        if (sequence) {
          features.push('contains_sequences');
        }
        break;

      case 'json':
        sequenceType = 'data';
        documentContent = content;
        sequence = extractSequencesFromJSON(content);
        features.push('json_data');
        break;

      case 'xml':
        sequenceType = 'data';
        documentContent = content;
        sequence = extractSequencesFromXML(content);
        features.push('xml_data');
        break;

      case 'pdf':
      case 'docx':
        sequenceType = 'document';
        documentContent = content; // Note: PDF/DOCX would need special parsing
        sequence = extractPotentialSequences(content);
        features.push('binary_document');
        break;

      default:
        sequence = content.substring(0, 1000);
        sequenceType = 'unknown';
    }

    const stats = {
      length: sequence.length || content.length,
      composition: calculateComposition(sequence || content)
    };

    // Add document-specific stats
    if (sequenceType === 'document' || sequenceType === 'data') {
      stats.wordCount = content.split(/\s+/).length;
      stats.lineCount = content.split('\n').length;
    }

    const analysis: BioFileAnalysis = {
      sequenceType,
      sequence: sequence.substring(0, 1000), // Limit for display
      fileType,
      stats
    };

    if (documentContent) {
      analysis.documentContent = documentContent.substring(0, 2000); // Limit for display
    }

    if (sequenceType === 'dna' || sequenceType === 'rna') {
      analysis.gcContent = calculateGCContent(sequence);
    }

    if (features.length > 0) {
      analysis.features = features;
    }

    return analysis;
  } catch (error) {
    console.error('Error analyzing bio file:', error);
    return {
      sequenceType: 'unknown',
      sequence: content.substring(0, 1000),
      fileType,
      stats: {
        length: content.length,
        composition: {}
      }
    };
  }
}

function calculateComposition(sequence: string): Record<string, number> {
  const composition: Record<string, number> = {};

  for (const char of sequence.toUpperCase()) {
    composition[char] = (composition[char] || 0) + 1;
  }

  return composition;
}

// Helper function to analyze CSV content
function analyzeCSVContent(content: string): string {
  const lines = content.split('\n');
  const headers = lines[0]?.split(',') || [];
  const rowCount = lines.length - 1;

  return `CSV file with ${headers.length} columns and ${rowCount} rows. Headers: ${headers.slice(0, 5).join(', ')}${headers.length > 5 ? '...' : ''}`;
}

// Helper function to extract potential sequences from text
function extractPotentialSequences(content: string): string {
  // Look for DNA/RNA/protein sequences in text
  const sequencePatterns = [
    /[ATCGN]{20,}/gi, // DNA sequences
    /[AUCGN]{20,}/gi, // RNA sequences
    /[ACDEFGHIKLMNPQRSTVWY]{20,}/gi // Protein sequences
  ];

  const sequences: string[] = [];

  for (const pattern of sequencePatterns) {
    const matches = content.match(pattern);
    if (matches) {
      sequences.push(...matches.slice(0, 3)); // Limit to first 3 matches
    }
  }

  return sequences.join('\n');
}

// Helper function to extract sequences from JSON
function extractSequencesFromJSON(content: string): string {
  try {
    const data = JSON.parse(content);
    const sequences: string[] = [];

    function searchForSequences(obj: any): void {
      if (typeof obj === 'string' && /[ATCGN]{10,}/i.test(obj)) {
        sequences.push(obj);
      } else if (Array.isArray(obj)) {
        obj.forEach(searchForSequences);
      } else if (typeof obj === 'object' && obj !== null) {
        Object.values(obj).forEach(searchForSequences);
      }
    }

    searchForSequences(data);
    return sequences.slice(0, 5).join('\n'); // Limit to first 5 sequences
  } catch {
    return '';
  }
}

// Helper function to extract sequences from XML
function extractSequencesFromXML(content: string): string {
  // Simple XML sequence extraction
  const sequenceMatches = content.match(/<sequence[^>]*>([^<]+)<\/sequence>/gi);
  const seqMatches = content.match(/<seq[^>]*>([^<]+)<\/seq>/gi);

  const sequences: string[] = [];

  if (sequenceMatches) {
    sequences.push(...sequenceMatches.map(match => 
      match.replace(/<[^>]+>/g, '').trim()
    ));
  }

  if (seqMatches) {
    sequences.push(...seqMatches.map(match => 
      match.replace(/<[^>]+>/g, '').trim()
    ));
  }

  return sequences.slice(0, 5).join('\n');
}

function analyzeFasta(content: string): BioFileAnalysis {
  const sequences = content.split('>').filter(seq => seq.trim().length > 0);
  let totalLength = 0;
  let gcCount = 0;
  let totalBases = 0;

  sequences.forEach(seq => {
    const lines = seq.split('\n');
    const sequence = lines.slice(1).join('').replace(/\s/g, '').toUpperCase();
    totalLength += sequence.length;

    for (const base of sequence) {
      if (base === 'G' || base === 'C') gcCount++;
      if (['A', 'T', 'G', 'C'].includes(base)) totalBases++;
    }
  });

  const gcContent = totalBases > 0 ? (gcCount / totalBases) * 100 : 0;

  return {
    sequenceType: 'dna',
    sequence: content.substring(0, 1000),
    fileType: 'fasta',
    gcContent: Math.round(gcContent * 100) / 100,
    stats: {
      length: totalLength,
      composition: {
        A: 0,
        T: 0,
        G: 0,
        C: 0
      },
    }
  };
}

function analyzeGenBank(content: string): BioFileAnalysis {
  const features: Array<{ type: string; location: string; description: string }> = [];
  const lines = content.split('\n');

  let inFeatures = false;
  let sequenceLength = 0;

  for (const line of lines) {
    if (line.startsWith('FEATURES')) {
      inFeatures = true;
      continue;
    }

    if (line.startsWith('ORIGIN')) {
      inFeatures = false;
      continue;
    }

    if (inFeatures && line.trim().startsWith('CDS')) {
      const match = line.match(/CDS\s+(.+)/);
      if (match) {
        features.push({
          type: 'CDS',
          location: match[1],
          description: 'Coding sequence'
        });
      }
    }

    if (line.match(/^\s*\d+/)) {
      const sequence = line.replace(/[^ATGC]/gi, '');
      sequenceLength += sequence.length;
    }
  }

  return {
    sequenceType: 'dna',
    sequence: content.substring(0, 1000),
    fileType: 'genbank',
    stats: {
      length: sequenceLength,
      composition: {
        A: 0,
        T: 0,
        G: 0,
        C: 0
      },
    }
  };
}

function analyzePDB(content: string): BioFileAnalysis {
  const lines = content.split('\n');
  const chains = new Set<string>();
  let atomCount = 0;
  let residueCount = 0;

  for (const line of lines) {
    if (line.startsWith('ATOM') || line.startsWith('HETATM')) {
      atomCount++;
      const chainId = line.charAt(21);
      chains.add(chainId);

      const resNum = parseInt(line.substring(22, 26).trim());
      if (resNum > residueCount) residueCount = resNum;
    }
  }

  return {
    sequenceType: 'protein',
    sequence: content.substring(0, 1000),
    fileType: 'pdb',
    stats: {
      length: atomCount,
      composition: {
        A: 0,
        T: 0,
        G: 0,
        C: 0
      },
    }
  };
}

function parseFastaSequence(content: string): string {
  const sequences = content.split('>').filter(seq => seq.trim().length > 0);
  return sequences.map(seq => seq.split('\n').slice(1).join('').replace(/\s/g, '').toUpperCase()).join('');
}

function determineSequenceType(sequence: string): 'dna' | 'rna' | 'protein' | 'unknown' {
  const isDNA = /^[ATCGN]+$/.test(sequence);
  const isRNA = /^[AUCGN]+$/.test(sequence);
  const isProtein = /^[ACDEFGHIKLMNPQRSTVWY]+$/.test(sequence);

  if (isDNA) return 'dna';
  if (isRNA) return 'rna';
  if (isProtein) return 'protein';
  return 'unknown';
}

function parseGenBankFile(content: string): { sequence: string; type: 'dna' | 'rna' | 'unknown'; features: string[] } {
  let sequence = '';
  let type: 'dna' | 'rna' | 'unknown' = 'unknown';
  const features: string[] = [];

  // Simplified parsing logic
  const originIndex = content.indexOf('ORIGIN');
  if (originIndex > -1) {
    sequence = content.substring(originIndex + 6).replace(/[^ATGC]/gi, '').trim();
    type = determineSequenceType(sequence);
  }

  return { sequence, type, features };
}

function parsePDBFile(content: string): { sequence: string; features: string[] } {
  const lines = content.split('\n');
  let sequence = '';
  const features: string[] = [];

  for (const line of lines) {
    if (line.startsWith('SEQRES')) {
      const residues = line.split('   ').slice(1);
      sequence += residues.join('');
    }
  }

  return { sequence, features };
}

function parseVCFFile(content: string): { variants: string[]; features: string[] } {
  const lines = content.split('\n');
  const variants: string[] = [];
  const features: string[] = [];

  for (const line of lines) {
    if (!line.startsWith('#')) {
      const columns = line.split('\t');
      if (columns.length > 4) {
        variants.push(columns[4]);
        features.push(columns[7] || 'variant');
      }
    }
  }

  return { variants, features };
}

function parseFastqSequence(content: string): string {
  const lines = content.split('\n');
  let sequence = '';

  for (let i = 1; i < lines.length; i += 4) {
    if (lines[i]) {
      sequence += lines[i].trim();
    }
  }

  return sequence;
}

function calculateGCContent(sequence: string): number {
  const gcCount = (sequence.match(/[GC]/gi) || []).length;
  return sequence.length > 0 ? (gcCount / sequence.length) * 100 : 0;
}

export function generateCRISPRGuides(targetSequence: string, pamType: string = 'NGG'): Array<{
  sequence: string;
  position: number;
  score: number;
  offTargets: number;
}> {
  const guides = [];
  const guideLength = 20;

  // Simple CRISPR guide generation (in reality, this would use more sophisticated algorithms)
  for (let i = 0; i <= targetSequence.length - guideLength - 3; i++) {
    const guide = targetSequence.substring(i, i + guideLength);
    const pam = targetSequence.substring(i + guideLength, i + guideLength + 3);

    if (pam === pamType) {
      // Simple scoring based on GC content and avoiding runs of same nucleotides
      let score = 50;
      const gcContent = (guide.match(/[GC]/g) || []).length / guide.length;
      score += (gcContent >= 0.4 && gcContent <= 0.6) ? 20 : 0;

      // Penalize runs of 4+ same nucleotides
      if (!/(.)\1{3,}/.test(guide)) score += 20;

      // Simulate off-target count (would be calculated against genome)
      const offTargets = Math.floor(Math.random() * 5);

      guides.push({
        sequence: guide,
        position: i,
        score: Math.min(100, score),
        offTargets,
      });
    }
  }

  return guides.sort((a, b) => b.score - a.score).slice(0, 5);
}

export function simulatePCR(primerForward: string, primerReverse: string, template: string): {
  success: boolean;
  productLength?: number;
  tm: { forward: number; reverse: number };
  warnings: string[];
} {
  const warnings = [];

  // Calculate melting temperatures (simplified)
  const calculateTm = (seq: string): number => {
    const gc = (seq.match(/[GC]/g) || []).length;
    const at = seq.length - gc;
    return 64.9 + 41 * (gc - 16.4) / seq.length;
  };

  const tmForward = calculateTm(primerForward);
  const tmReverse = calculateTm(primerReverse);

  // Check if primers can bind to template
  const forwardMatch = template.includes(primerForward);
  const reverseMatch = template.includes(reverseComplement(primerReverse));

  if (Math.abs(tmForward - tmReverse) > 5) {
    warnings.push('Primer melting temperatures differ by more than 5°C');
  }

  if (primerForward.length < 18 || primerReverse.length < 18) {
    warnings.push('Primers should be at least 18 nucleotides long');
  }

  return {
    success: forwardMatch && reverseMatch,
    productLength: forwardMatch && reverseMatch ? Math.abs(template.indexOf(primerForward) - template.lastIndexOf(reverseComplement(primerReverse))) : undefined,
    tm: { forward: Math.round(tmForward), reverse: Math.round(tmReverse) },
    warnings,
  };
}

function reverseComplement(sequence: string): string {
  const complement: Record<string, string> = { 'A': 'T', 'T': 'A', 'G': 'C', 'C': 'G' };
  return sequence.split('').reverse().map(base => complement[base] || base).join('');
}

export function optimizeCodonUsage(sequence: string, organism: 'ecoli' | 'yeast' | 'human'): {
  optimizedSequence: string;
  improvements: number;
  codonUsage: Record<string, number>;
} {
  // Simplified codon optimization (in reality, this would use actual codon usage tables)
  const codonTables: Record<string, Record<string, string[]>> = {
    ecoli: {
      'F': ['TTT', 'TTC'], 'L': ['TTA', 'TTG', 'CTT', 'CTC', 'CTA', 'CTG'],
      'S': ['TCT', 'TCC', 'TCA', 'TCG', 'AGT', 'AGC'], 'Y': ['TAT', 'TAC'],
      'C': ['TGT', 'TGC'], 'W': ['TGG'], 'P': ['CCT', 'CCC', 'CCA', 'CCG'],
      'H': ['CAT', 'CAC'], 'Q': ['CAA', 'CAG'], 'R': ['CGT', 'CGC', 'CGA', 'CGG', 'AGA', 'AGG'],
      'I': ['ATT', 'ATC', 'ATA'], 'M': ['ATG'], 'T': ['ACT', 'ACC', 'ACA', 'ACG'],
      'N': ['AAT', 'AAC'], 'K': ['AAA', 'AAG'], 'V': ['GTT', 'GTC', 'GTA', 'GTG'],
      'A': ['GCT', 'GCC', 'GCA', 'GCG'], 'D': ['GAT', 'GAC'], 'E': ['GAA', 'GAG'],
      'G': ['GGT', 'GGC', 'GGA', 'GGG'], '*': ['TAA', 'TAG', 'TGA']
    },
    yeast: {
      // Simplified - would have actual yeast codon preferences
      'F': ['TTC', 'TTT'], 'L': ['CTG', 'TTG', 'CTC', 'CTT', 'TTA', 'CTA'],
      // ... other codons
    },
    human: {
      // Simplified - would have actual human codon preferences  
      'F': ['TTC', 'TTT'], 'L': ['CTG', 'CTC', 'TTG', 'CTT', 'CTA', 'TTA'],
      // ... other codons
    }
  };

  let optimizedSequence = '';
  let improvements = 0;
  const codonUsage: Record<string, number> = {};

  // Process sequence in codons (groups of 3)
  for (let i = 0; i < sequence.length; i += 3) {
    const codon = sequence.substring(i, i + 3);
    if (codon.length === 3) {
      // Find amino acid for this codon
      const aminoAcid = getAminoAcid(codon);
      if (aminoAcid && codonTables[organism][aminoAcid]) {
        // Use preferred codon for this organism
        const preferredCodon = codonTables[organism][aminoAcid][0];
        optimizedSequence += preferredCodon;

        if (preferredCodon !== codon) improvements++;
        codonUsage[preferredCodon] = (codonUsage[preferredCodon] || 0) + 1;
      } else {
        optimizedSequence += codon;
      }
    }
  }

  return {
    optimizedSequence,
    improvements,
    codonUsage,
  };
}

function getAminoAcid(codon: string): string | null {
  const geneticCode: Record<string, string> = {
    'TTT': 'F', 'TTC': 'F', 'TTA': 'L', 'TTG': 'L',
    'TCT': 'S', 'TCC': 'S', 'TCA': 'S', 'TCG': 'S',
    'TAT': 'Y', 'TAC': 'Y', 'TAA': '*', 'TAG': '*',
    'TGT': 'C', 'TGC': 'C', 'TGA': '*', 'TGG': 'W',
    'CTT': 'L', 'CTC': 'L', 'CTA': 'L', 'CTG': 'L',
    'CCT': 'P', 'CCC': 'P', 'CCA': 'P', 'CCG': 'P',
    'CAT': 'H', 'CAC': 'H', 'CAA': 'Q', 'CAG': 'Q',
    'CGT': 'R', 'CGC': 'R', 'CGA': 'R', 'CGG': 'R',
    'ATT': 'I', 'ATC': 'I', 'ATA': 'I', 'ATG': 'M',
    'ACT': 'T', 'ACC': 'T', 'ACA': 'T', 'ACG': 'T',
    'AAT': 'N', 'AAC': 'N', 'AAA': 'K', 'AAG': 'K',
    'AGT': 'S', 'AGC': 'S', 'AGA': 'R', 'AGG': 'R',
    'GTT': 'V', 'GTC': 'V', 'GTA': 'V', 'GTG': 'V',
    'GCT': 'A', 'GCC': 'A', 'GCA': 'A', 'GCG': 'A',
    'GAT': 'D', 'GAC': 'D', 'GAA': 'E', 'GAG': 'E',
    'GGT': 'G', 'GGC': 'G', 'GGA': 'G', 'GGG': 'G',
  };

  return geneticCode[codon.toUpperCase()] || null;
}