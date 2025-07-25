
# BioScriptor
**Smart. Professional. Purpose-Built for Bioinformatics.**  
*(Bio + Scripting + Guidance)*

---

## 🧠 What Is BioScriptor?
BioScriptor is a powerful AI-driven assistant designed for molecular biology, bioinformatics, and computational biology. It analyzes data, writes code, simulates lab protocols, and assists in project planning from bench to pipeline.

---

## 🧰 Key Capabilities

### 1. Bioinformatics Intelligence
- DNA/RNA/protein sequence parsing and functional annotation
- gRNA design with off-target prediction
- Primer design + PCR simulation, with product prediction
- Genomic variant parsing and classification from .vcf files
- Multiple sequence alignment + phylogenetic tree construction

### 2. Programming Assistant
- Writes code in Python, R, Perl, Bash
- Fast parsers for FASTA, GTF, VCF, PDB, BAM formats
- Visualization with matplotlib, seaborn, ggplot2
- Code explanation and improvement
- Pipeline building in Nextflow, Snakemake, or Galaxy

### 3. Project Planning & Workflow Design
- Suggestions for folder structures, naming schemes, and versioning
- Auto-generates documentation:
  - README.md
  - Doc templates
  - Unit tests
- Helps with task breakdowns and agile planning

### 4. Multi-Provider AI Backend
- Resilient fallback logic to guarantee response quality

---

## 🧩 Recent Improvements
- **Conversation History Bug Fix**: Saved chats now load properly.
- **State updates**: Panel view function as expected.
- **Full message content retrieval**: No longer limited to metadata.

---

## 📌 Example Prompts BioScriptor Understands
- "Write a Python script to compute GC content from a FASTA and save as CSV."
- "Will these primers amplify this gene? Simulate the PCR."
- "Design gRNA for a CRISPR edit in E. coli. Check off-targets."
- "Parse this VCF. Show nonsynonymous SNPs only."

---

## ✍️ How BioScriptor Formats Chat Replies
- **Headings**:
  ```markdown
  # Heading 1
  ## Heading 2
  ### Heading 3
  ```
- **Bold, Italic, Emojis**:
  - `**bold**`, `*italic*`, `🧬 Emoji`
- **Code Blocks**:
  ```python
  def calculate_gc(seq):
      return (seq.count("G") + seq.count("C")) / len(seq) * 100
  ```
- **Inline Code**: Use the `calculate_gc()` function to compute GC content.
- **Checklists**:
  - `- ✅ Feature complete`
  - `- ❌ Needs refactor`
- **Tables**:
  | Tool     | Function            |
  |----------|---------------------|
  | Primer3  | Primer design       |
  | BLAST    | Sequence alignment  |

---

## 💬 Chat Input Design
Minimal, intuitive layout supporting attachments and quick messaging:
```
+----------------------------------------------------------+
| 📎 | Type your message here...                   |   ➤   |
+----------------------------------------------------------+
```

## 🧠 Chat Input Behavior
| Action         | Behavior                            |
|----------------|-------------------------------------|
| Enter          | Sends message                       |
| Shift+Enter    | Adds newline                        |
| 📎             | Opens file upload dialog            |
| Autoclear      | Clears input after send             |
| Autoscroll     | New messages scroll into view       |
| Paste support   | Preserves formatting                |

---

## 🛠️ Bonus: React Autoscroll + Markdown Rendering
**React Markdown**:
```javascript
import ReactMarkdown from 'react-markdown';

<ReactMarkdown>{responseText}</ReactMarkdown>
```

**Autoscroll Logic**:
```javascript
import { useRef, useEffect } from 'react';

function ChatWindow({ messages }) {
  const bottomRef = useRef();

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  return (
    <div style={{ maxHeight: '400px', overflowY: 'auto' }}>
      {messages.map((msg, i) => <div key={i}>{msg}</div>)}
      <div ref={bottomRef} />
    </div>
  );
}
```

---

## Architecture Overview

BioScriptor is built with a fault-tolerant, full-stack architecture:

- **Frontend**: React with TypeScript, Tailwind CSS, and shadcn/ui components
- **Backend**: Express.js with TypeScript and PostgreSQL
- **AI System**: Multi-provider fallback (Groq → Together → OpenRouter → Cohere)
- **Authentication**: Firebase Auth with Google OAuth
- **Security**: Military-grade input sanitization and threat detection
- **Deployment**: Optimized for Replit with auto-scaling capabilities

## Getting Started

1. **Clone and Setup**:
   ```bash
   git clone <repository-url>
   npm install
   ```

2. **Configure Environment**:
   - Set up your AI provider API keys
   - Configure Firebase authentication
   - Set up PostgreSQL database connection

3. **Run Development Server**:
   ```bash
   npm run dev
   ```

4. **Access the Application**:
   - Open your browser to `http://localhost:5000`
   - Sign in with Google OAuth
   - Start your bioinformatics analysis!

---

*BioScriptor - Your always-available AI developer partner for molecular biology and computational analysis.*
