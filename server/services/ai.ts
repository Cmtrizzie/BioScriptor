import { BioFileAnalysis, generateCRISPRGuides, simulatePCR, optimizeCodonUsage } from './bioinformatics';

interface BioinformaticsQuery {
  type: 'crispr' | 'pcr' | 'codon_optimization' | 'sequence_analysis' | 'general';
  parameters: Record<string, any>;
}

export async function processQuery(message: string, fileAnalysis?: BioFileAnalysis): Promise<string> {
  // Simple natural language processing to determine query type
  const query = parseQuery(message);
  
  try {
    switch (query.type) {
      case 'crispr':
        return await processCRISPRQuery(message, query.parameters, fileAnalysis);
      case 'pcr':
        return await processPCRQuery(message, query.parameters, fileAnalysis);
      case 'codon_optimization':
        return await processCodonOptimizationQuery(message, query.parameters, fileAnalysis);
      case 'sequence_analysis':
        return await processSequenceAnalysisQuery(message, fileAnalysis);
      default:
        return await processGeneralQuery(message, fileAnalysis);
    }
  } catch (error) {
    console.error('AI processing error:', error);
    return "I apologize, but I encountered an error processing your request. Please try rephrasing your question or check if your file format is supported.";
  }
}

function parseQuery(message: string): BioinformaticsQuery {
  const lowerMessage = message.toLowerCase();
  
  if (lowerMessage.includes('crispr') || lowerMessage.includes('guide rna') || lowerMessage.includes('cas9')) {
    return {
      type: 'crispr',
      parameters: {
        target: extractSequence(message) || extractGene(message),
      }
    };
  }
  
  if (lowerMessage.includes('pcr') || lowerMessage.includes('primer') || lowerMessage.includes('amplif')) {
    return {
      type: 'pcr',
      parameters: {
        template: extractSequence(message),
      }
    };
  }
  
  if (lowerMessage.includes('codon') || lowerMessage.includes('optimize') || lowerMessage.includes('expression')) {
    return {
      type: 'codon_optimization',
      parameters: {
        organism: extractOrganism(message) || 'ecoli',
      }
    };
  }
  
  if (lowerMessage.includes('sequence') || lowerMessage.includes('analyze') || lowerMessage.includes('dna') || lowerMessage.includes('rna')) {
    return { type: 'sequence_analysis', parameters: {} };
  }
  
  return { type: 'general', parameters: {} };
}

async function processCRISPRQuery(message: string, parameters: any, fileAnalysis?: BioFileAnalysis): Promise<string> {
  const targetGene = parameters.target || 'BRCA1';
  
  // Simulate CRISPR guide design
  const exampleSequence = "GCAGCTGAGCTTAGCTGTGCAGG"; // Example target sequence
  const guides = generateCRISPRGuides(exampleSequence);
  
  let response = `I'll design CRISPR guide RNAs for ${targetGene}. Here are the top guide RNA candidates:\n\n`;
  
  guides.slice(0, 3).forEach((guide, index) => {
    response += `**Guide RNA #${index + 1}**\n`;
    response += `Sequence: 5'-${guide.sequence}-3' (NGG)\n`;
    response += `Score: ${guide.score}/100\n`;
    response += `Off-targets: ${guide.offTargets} potential\n`;
    response += `Position: ${guide.position}\n\n`;
  });
  
  response += `\`\`\`python\n# CRISPR Guide RNA Design Script\nimport crispr_tools as ct\n\n`;
  response += `# Target sequence\ntarget_seq = "${exampleSequence}"\n\n`;
  response += `# Design guide RNAs\nguides = ct.design_guides(\n    target_seq, \n    pam_type="NGG",\n    scoring_method="doench2016"\n)\n\n`;
  response += `# Analyze off-targets\nfor guide in guides[:3]:\n    off_targets = ct.find_off_targets(\n        guide.sequence,\n        genome="hg38",\n        mismatch_threshold=3\n    )\n    print(f"Guide: {guide.sequence}")\n    print(f"Score: {guide.score}")\n    print(f"Off-targets: {len(off_targets)}")\n\`\`\`\n\n`;
  
  if (fileAnalysis) {
    response += `I've also analyzed your uploaded ${fileAnalysis.metadata?.format} file. `;
    if (fileAnalysis.type === 'sequence') {
      response += `It contains ${fileAnalysis.sequenceCount} sequence(s) with a total length of ${fileAnalysis.totalLength} bp.`;
    }
  }
  
  return response;
}

async function processPCRQuery(message: string, parameters: any, fileAnalysis?: BioFileAnalysis): Promise<string> {
  const forwardPrimer = "GTGCCAGCATCTGTTGTTTGC";
  const reversePrimer = "CACCAGGTGCTCATTGATAG";
  const template = "GTGCCAGCATCTGTTGTTTGCCCCTCCCCCAGGTGCTCATTGATAG";
  
  const pcrResult = simulatePCR(forwardPrimer, reversePrimer, template);
  
  let response = "I'll simulate PCR amplification for you.\n\n";
  response += `**PCR Simulation Results**\n`;
  response += `Forward Primer Tm: ${pcrResult.tm.forward}°C\n`;
  response += `Reverse Primer Tm: ${pcrResult.tm.reverse}°C\n`;
  response += `Amplification: ${pcrResult.success ? 'Successful' : 'Failed'}\n`;
  
  if (pcrResult.success) {
    response += `Product Length: ${pcrResult.productLength} bp\n`;
  }
  
  if (pcrResult.warnings.length > 0) {
    response += `\n**Warnings:**\n`;
    pcrResult.warnings.forEach(warning => {
      response += `- ${warning}\n`;
    });
  }
  
  response += `\n\`\`\`python\n# PCR Simulation Script\nfrom Bio.SeqUtils import MeltingTemp as mt\nfrom Bio.Seq import Seq\n\n`;
  response += `forward_primer = "${forwardPrimer}"\nreverse_primer = "${reversePrimer}"\n\n`;
  response += `# Calculate melting temperatures\ntm_forward = mt.Tm_NN(Seq(forward_primer))\ntm_reverse = mt.Tm_NN(Seq(reverse_primer))\n\n`;
  response += `print(f"Forward Tm: {tm_forward:.1f}°C")\nprint(f"Reverse Tm: {tm_reverse:.1f}°C")\n\`\`\`\n`;
  
  return response;
}

async function processCodonOptimizationQuery(message: string, parameters: any, fileAnalysis?: BioFileAnalysis): Promise<string> {
  const organism = parameters.organism;
  const exampleSequence = "ATGAAATTTGGCACCCGGAAG"; // Example coding sequence
  
  const optimization = optimizeCodonUsage(exampleSequence, organism);
  
  let response = `I'll optimize codon usage for ${organism === 'ecoli' ? 'E. coli' : organism} expression.\n\n`;
  response += `**Codon Optimization Results**\n`;
  response += `Original sequence: ${exampleSequence}\n`;
  response += `Optimized sequence: ${optimization.optimizedSequence}\n`;
  response += `Improvements made: ${optimization.improvements} codon changes\n\n`;
  
  response += `\`\`\`python\n# Codon Optimization Script\nfrom codonoptimization import optimize_sequence\n\n`;
  response += `original_seq = "${exampleSequence}"\n`;
  response += `optimized_seq = optimize_sequence(\n    original_seq,\n    organism="${organism}",\n    avoid_patterns=["GAATTC", "AAGCTT"]  # EcoRI, HindIII sites\n)\n\n`;
  response += `print(f"Original:  {original_seq}")\nprint(f"Optimized: {optimized_seq}")\n\`\`\`\n`;
  
  if (fileAnalysis && fileAnalysis.type === 'sequence') {
    response += `\nI can also optimize the sequences from your uploaded file. `;
    response += `Your file contains ${fileAnalysis.sequenceCount} sequence(s) that could be optimized for ${organism} expression.`;
  }
  
  return response;
}

async function processSequenceAnalysisQuery(message: string, fileAnalysis?: BioFileAnalysis): Promise<string> {
  if (!fileAnalysis) {
    return "I'd be happy to analyze your sequences! Please upload a FASTA, GenBank, or PDB file and I'll provide detailed analysis including:\n\n- Sequence composition and statistics\n- GC content analysis\n- Feature annotation (for GenBank files)\n- Structural information (for PDB files)\n- Potential restriction sites\n- Codon usage patterns\n\nWhat specific analysis would you like me to perform?";
  }
  
  let response = `I've analyzed your ${fileAnalysis.metadata?.format} file:\n\n`;
  
  if (fileAnalysis.type === 'sequence') {
    response += `**Sequence Statistics:**\n`;
    response += `- Number of sequences: ${fileAnalysis.sequenceCount}\n`;
    response += `- Total length: ${fileAnalysis.totalLength?.toLocaleString()} bp\n`;
    if (fileAnalysis.gcContent) {
      response += `- GC content: ${fileAnalysis.gcContent}%\n`;
    }
    if (fileAnalysis.metadata?.averageLength) {
      response += `- Average length: ${fileAnalysis.metadata.averageLength} bp\n`;
    }
    
    if (fileAnalysis.features && fileAnalysis.features.length > 0) {
      response += `\n**Features Found:**\n`;
      fileAnalysis.features.slice(0, 5).forEach(feature => {
        response += `- ${feature.type} at ${feature.location}: ${feature.description}\n`;
      });
    }
  } else if (fileAnalysis.type === 'structure') {
    response += `**Structure Information:**\n`;
    response += `- Atom count: ${fileAnalysis.metadata?.atomCount}\n`;
    response += `- Chain count: ${fileAnalysis.metadata?.chainCount}\n`;
    response += `- Residue count: ${fileAnalysis.metadata?.residueCount}\n`;
  } else if (fileAnalysis.type === 'data') {
    response += `**Data Summary:**\n`;
    response += `- Rows: ${fileAnalysis.metadata?.rowCount}\n`;
    response += `- Columns: ${fileAnalysis.metadata?.columnCount}\n`;
    if (fileAnalysis.metadata?.headers) {
      response += `- Headers: ${fileAnalysis.metadata.headers.slice(0, 5).join(', ')}\n`;
    }
  }
  
  response += `\nWhat specific analysis would you like me to perform on this data?`;
  
  return response;
}

async function processGeneralQuery(message: string, fileAnalysis?: BioFileAnalysis): Promise<string> {
  // Handle general bioinformatics questions
  const lowerMessage = message.toLowerCase();
  
  if (lowerMessage.includes('protein') && lowerMessage.includes('structure')) {
    return "I can help you analyze protein structures! You can:\n\n- Upload PDB files for 3D visualization\n- Analyze protein sequences for secondary structure prediction\n- Compare protein structures\n- Identify binding sites and functional domains\n\nWould you like me to show you a 3D visualization of a specific protein, or do you have a PDB file to analyze?";
  }
  
  if (lowerMessage.includes('blast') || lowerMessage.includes('homology')) {
    return "For sequence similarity searches, I can help you:\n\n- Format sequences for BLAST searches\n- Interpret BLAST results\n- Find homologous sequences\n- Analyze phylogenetic relationships\n\nPlease upload your query sequence in FASTA format, and I'll help you design an effective search strategy.";
  }
  
  if (lowerMessage.includes('molecular') && lowerMessage.includes('cloning')) {
    return "I can assist with molecular cloning workflows:\n\n- Restriction enzyme analysis\n- Vector selection\n- Insert design and optimization\n- Gibson Assembly planning\n- Golden Gate cloning strategies\n\nWhat specific cloning project are you working on? Please share your target sequence or vector information.";
  }
  
  // Default response for general queries
  return `I'm BioScriptor, your AI-powered bioinformatics assistant! I can help you with:

**Sequence Analysis:**
- DNA/RNA/protein sequence analysis
- FASTA and GenBank file processing
- GC content and composition analysis

**Molecular Biology Tools:**
- CRISPR guide RNA design
- PCR primer design and simulation
- Codon optimization for expression systems
- Restriction enzyme analysis

**Structural Biology:**
- 3D protein structure visualization
- PDB file analysis
- Structure-function relationships

**File Support:**
- FASTA (.fasta)
- GenBank (.gb)
- Protein Data Bank (.pdb)
- CSV data files (.csv)

What would you like to explore today? You can ask me questions like:
- "Design CRISPR guides for BRCA1"
- "Optimize this sequence for E. coli expression"
- "Analyze the protein structure in PDB 1ABC"
- "What's the GC content of my sequences?"`;
}

// Helper functions
function extractSequence(message: string): string | null {
  const seqPattern = /[ATGC]{10,}/gi;
  const match = message.match(seqPattern);
  return match ? match[0] : null;
}

function extractGene(message: string): string | null {
  const genePattern = /\b([A-Z]{2,}[0-9]*)\b/g;
  const match = message.match(genePattern);
  return match ? match[0] : null;
}

function extractOrganism(message: string): 'ecoli' | 'yeast' | 'human' | null {
  const lowerMessage = message.toLowerCase();
  if (lowerMessage.includes('e.coli') || lowerMessage.includes('ecoli') || lowerMessage.includes('coli')) {
    return 'ecoli';
  }
  if (lowerMessage.includes('yeast') || lowerMessage.includes('saccharomyces')) {
    return 'yeast';
  }
  if (lowerMessage.includes('human') || lowerMessage.includes('mammalian')) {
    return 'human';
  }
  return null;
}
