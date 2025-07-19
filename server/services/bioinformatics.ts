export interface BioFileAnalysis {
  type: 'sequence' | 'structure' | 'data';
  sequenceCount?: number;
  totalLength?: number;
  gcContent?: number;
  features?: Array<{
    type: string;
    location: string;
    description: string;
  }>;
  metadata?: Record<string, any>;
}

export async function analyzeBioFile(content: string, fileType: 'fasta' | 'gb' | 'pdb' | 'csv'): Promise<BioFileAnalysis> {
  switch (fileType) {
    case 'fasta':
      return analyzeFasta(content);
    case 'gb':
      return analyzeGenBank(content);
    case 'pdb':
      return analyzePDB(content);
    case 'csv':
      return analyzeCSV(content);
    default:
      throw new Error(`Unsupported file type: ${fileType}`);
  }
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
    type: 'sequence',
    sequenceCount: sequences.length,
    totalLength,
    gcContent: Math.round(gcContent * 100) / 100,
    metadata: {
      format: 'FASTA',
      averageLength: Math.round(totalLength / sequences.length),
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
    type: 'sequence',
    sequenceCount: 1,
    totalLength: sequenceLength,
    features,
    metadata: {
      format: 'GenBank',
      featureCount: features.length,
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
    type: 'structure',
    metadata: {
      format: 'PDB',
      atomCount,
      chainCount: chains.size,
      residueCount,
      chains: Array.from(chains),
    }
  };
}

function analyzeCSV(content: string): BioFileAnalysis {
  const lines = content.split('\n').filter(line => line.trim().length > 0);
  const headers = lines[0] ? lines[0].split(',').map(h => h.trim()) : [];
  
  return {
    type: 'data',
    metadata: {
      format: 'CSV',
      rowCount: lines.length - 1,
      columnCount: headers.length,
      headers,
    }
  };
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
