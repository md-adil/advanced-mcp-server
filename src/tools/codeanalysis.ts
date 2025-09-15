import { ASTNode } from "../types.ts";

export const codeAnalysisTools = [
  {
    name: "analyze_javascript",
    description: "Analyze JavaScript/TypeScript code",
    inputSchema: {
      type: "object",
      properties: {
        code: { type: "string", description: "JavaScript/TypeScript code to analyze" },
        language: { type: "string", enum: ["javascript", "typescript"], default: "javascript" },
        includeMetrics: { type: "boolean", description: "Include code metrics", default: true },
      },
      required: ["code"],
    },
  },
  {
    name: "extract_functions",
    description: "Extract function definitions from code",
    inputSchema: {
      type: "object",
      properties: {
        code: { type: "string", description: "Source code" },
        language: { type: "string", enum: ["javascript", "typescript", "python", "rust"], default: "javascript" },
      },
      required: ["code"],
    },
  },
  {
    name: "count_lines_of_code",
    description: "Count lines of code, comments, and blank lines",
    inputSchema: {
      type: "object",
      properties: {
        code: { type: "string", description: "Source code" },
        language: { type: "string", enum: ["javascript", "typescript", "python", "rust", "go"], default: "javascript" },
      },
      required: ["code"],
    },
  },
  {
    name: "detect_code_smells",
    description: "Detect common code smells and anti-patterns",
    inputSchema: {
      type: "object",
      properties: {
        code: { type: "string", description: "Source code to analyze" },
        language: { type: "string", enum: ["javascript", "typescript", "python"], default: "javascript" },
        severity: { type: "string", enum: ["low", "medium", "high"], default: "medium" },
      },
      required: ["code"],
    },
  },
  {
    name: "extract_imports",
    description: "Extract import/require statements from code",
    inputSchema: {
      type: "object",
      properties: {
        code: { type: "string", description: "Source code" },
        language: { type: "string", enum: ["javascript", "typescript", "python", "rust", "go"], default: "javascript" },
      },
      required: ["code"],
    },
  },
  {
    name: "calculate_complexity",
    description: "Calculate cyclomatic complexity of code",
    inputSchema: {
      type: "object",
      properties: {
        code: { type: "string", description: "Source code" },
        language: { type: "string", enum: ["javascript", "typescript", "python"], default: "javascript" },
      },
      required: ["code"],
    },
  },
];

interface CodeMetrics {
  totalLines: number;
  codeLines: number;
  commentLines: number;
  blankLines: number;
  functions: number;
  classes: number;
  complexity: number;
}

interface FunctionInfo {
  name: string;
  startLine: number;
  endLine: number;
  parameters: string[];
  isAsync: boolean;
  isExported: boolean;
}

interface CodeSmell {
  type: string;
  line: number;
  message: string;
  severity: "low" | "medium" | "high";
  suggestion: string;
}

export class CodeAnalysisHandler {
  async analyzeJavaScript(args: { code: string; language?: string; includeMetrics?: boolean }) {
    const code = args.code;
    const metrics = args.includeMetrics ? this.calculateMetrics(code, args.language) : null;
    const ast = this.parseSimpleAST(code);
    const functions = this.extractFunctions(code, args.language || "javascript");
    const imports = this.extractImports(code, args.language || "javascript");

    return {
      metrics,
      ast: ast.slice(0, 50), // Limit AST nodes for response size
      functions,
      imports,
      language: args.language || "javascript",
      analysisTime: new Date().toISOString(),
    };
  }

  async extractFunctions(code: string, language: string): Promise<FunctionInfo[]> {
    const functions: FunctionInfo[] = [];
    const lines = code.split("\n");

    if (language === "javascript" || language === "typescript") {
      // Simple regex patterns for function detection
      const patterns = [
        /^\s*function\s+(\w+)\s*\(([^)]*)\)/,
        /^\s*(?:export\s+)?(?:async\s+)?function\s+(\w+)\s*\(([^)]*)\)/,
        /^\s*(?:const|let|var)\s+(\w+)\s*=\s*(?:async\s+)?\([^)]*\)\s*=>/,
        /^\s*(\w+)\s*:\s*(?:async\s+)?\([^)]*\)\s*=>/,
      ];

      lines.forEach((line, index) => {
        for (const pattern of patterns) {
          const match = line.match(pattern);
          if (match) {
            const name = match[1];
            const params = match[2] ? match[2].split(",").map(p => p.trim()) : [];
            functions.push({
              name,
              startLine: index + 1,
              endLine: index + 1, // Simplified - would need proper parsing for actual end
              parameters: params,
              isAsync: line.includes("async"),
              isExported: line.includes("export"),
            });
            break;
          }
        }
      });
    } else if (language === "python") {
      const pattern = /^\s*def\s+(\w+)\s*\(([^)]*)\)/;
      lines.forEach((line, index) => {
        const match = line.match(pattern);
        if (match) {
          functions.push({
            name: match[1],
            startLine: index + 1,
            endLine: index + 1,
            parameters: match[2] ? match[2].split(",").map(p => p.trim()) : [],
            isAsync: line.includes("async def"),
            isExported: true, // Python doesn't have explicit exports
          });
        }
      });
    }

    return functions;
  }

  async countLinesOfCode(args: { code: string; language?: string }) {
    return this.calculateMetrics(args.code, args.language);
  }

  async detectCodeSmells(args: { code: string; language?: string; severity?: string }): Promise<CodeSmell[]> {
    const smells: CodeSmell[] = [];
    const lines = args.code.split("\n");
    const minSeverity = args.severity || "medium";

    lines.forEach((line, index) => {
      const lineNum = index + 1;

      // Long lines
      if (line.length > 120) {
        smells.push({
          type: "long_line",
          line: lineNum,
          message: `Line is too long (${line.length} characters)`,
          severity: "low",
          suggestion: "Consider breaking this line into multiple lines",
        });
      }

      // TODO comments
      if (line.includes("TODO") || line.includes("FIXME")) {
        smells.push({
          type: "todo_comment",
          line: lineNum,
          message: "TODO/FIXME comment found",
          severity: "low",
          suggestion: "Complete the TODO or create a proper issue",
        });
      }

      // console.log (for JavaScript)
      if (line.includes("console.log") && (args.language === "javascript" || args.language === "typescript")) {
        smells.push({
          type: "debug_statement",
          line: lineNum,
          message: "Debug statement found",
          severity: "medium",
          suggestion: "Remove debug statements from production code",
        });
      }

      // Magic numbers
      const magicNumberPattern = /(?<!\w)(?:0[xX][0-9a-fA-F]+|\d{3,})(?!\w)/g;
      if (magicNumberPattern.test(line) && !line.includes("//") && !line.includes("*")) {
        smells.push({
          type: "magic_number",
          line: lineNum,
          message: "Magic number detected",
          severity: "medium",
          suggestion: "Consider extracting magic numbers into named constants",
        });
      }

      // Deeply nested code
      const indentation = line.match(/^\s*/)?.[0].length || 0;
      if (indentation > 20) {
        smells.push({
          type: "deep_nesting",
          line: lineNum,
          message: "Deeply nested code",
          severity: "high",
          suggestion: "Consider extracting nested code into separate functions",
        });
      }
    });

    // Filter by severity
    const severityLevels = { low: 1, medium: 2, high: 3 };
    const minLevel = severityLevels[minSeverity as keyof typeof severityLevels];

    return smells.filter(smell => severityLevels[smell.severity] >= minLevel);
  }

  async extractImports(code: string, language: string) {
    const imports: Array<{ type: string; module: string; imports?: string[]; line: number }> = [];
    const lines = code.split("\n");

    if (language === "javascript" || language === "typescript") {
      lines.forEach((line, index) => {
        // ES6 imports
        const esImportMatch = line.match(/^import\s+(?:(.+)\s+from\s+)?['"]([^'"]+)['"]/);
        if (esImportMatch) {
          imports.push({
            type: "es6",
            module: esImportMatch[2],
            imports: esImportMatch[1] ? [esImportMatch[1]] : [],
            line: index + 1,
          });
        }

        // CommonJS require
        const requireMatch = line.match(/(?:const|let|var)\s+(.+)\s*=\s*require\(['"]([^'"]+)['"]\)/);
        if (requireMatch) {
          imports.push({
            type: "commonjs",
            module: requireMatch[2],
            imports: [requireMatch[1]],
            line: index + 1,
          });
        }
      });
    } else if (language === "python") {
      lines.forEach((line, index) => {
        // Python imports
        const importMatch = line.match(/^import\s+(.+)/);
        if (importMatch) {
          imports.push({
            type: "python",
            module: importMatch[1],
            line: index + 1,
          });
        }

        const fromImportMatch = line.match(/^from\s+(.+)\s+import\s+(.+)/);
        if (fromImportMatch) {
          imports.push({
            type: "python_from",
            module: fromImportMatch[1],
            imports: fromImportMatch[2].split(",").map(i => i.trim()),
            line: index + 1,
          });
        }
      });
    }

    return imports;
  }

  async calculateComplexity(args: { code: string; language?: string }) {
    const code = args.code;
    let complexity = 1; // Base complexity

    // Count decision points
    const decisionPatterns = [
      /\bif\b/g,
      /\belse\b/g,
      /\bwhile\b/g,
      /\bfor\b/g,
      /\bswitch\b/g,
      /\bcase\b/g,
      /\bcatch\b/g,
      /\b&&\b/g,
      /\b\|\|\b/g,
      /\?\s*.*\s*:/g, // Ternary operator
    ];

    decisionPatterns.forEach(pattern => {
      const matches = code.match(pattern);
      if (matches) {
        complexity += matches.length;
      }
    });

    return {
      cyclomaticComplexity: complexity,
      riskLevel: complexity <= 10 ? "low" : complexity <= 20 ? "medium" : "high",
      suggestion: complexity > 10 ? "Consider breaking this into smaller functions" : "Complexity is acceptable",
    };
  }


  private calculateMetrics(code: string, language?: string): CodeMetrics {
    const lines = code.split("\n");
    let codeLines = 0;
    let commentLines = 0;
    let blankLines = 0;
    let functions = 0;
    let classes = 0;

    lines.forEach(line => {
      const trimmed = line.trim();

      if (!trimmed) {
        blankLines++;
      } else if (this.isComment(trimmed, language)) {
        commentLines++;
      } else {
        codeLines++;

        if (this.isFunction(trimmed, language)) {
          functions++;
        }

        if (this.isClass(trimmed, language)) {
          classes++;
        }
      }
    });

    const complexity = this.calculateSimpleComplexity(code);

    return {
      totalLines: lines.length,
      codeLines,
      commentLines,
      blankLines,
      functions,
      classes,
      complexity,
    };
  }

  private isComment(line: string, language?: string): boolean {
    if (language === "python") {
      return line.startsWith("#") || line.startsWith('"""') || line.startsWith("'''");
    }
    return line.startsWith("//") || line.startsWith("/*") || line.startsWith("*");
  }

  private isFunction(line: string, language?: string): boolean {
    if (language === "python") {
      return /^\s*def\s+\w+/.test(line);
    }
    return /^\s*function\s+\w+/.test(line) || /^\s*\w+\s*[=:]\s*(?:async\s+)?\([^)]*\)\s*=>/.test(line);
  }

  private isClass(line: string, language?: string): boolean {
    return /^\s*class\s+\w+/.test(line);
  }

  private calculateSimpleComplexity(code: string): number {
    const patterns = [/\bif\b/g, /\bwhile\b/g, /\bfor\b/g, /\bswitch\b/g, /\bcatch\b/g];
    let complexity = 1;

    patterns.forEach(pattern => {
      const matches = code.match(pattern);
      if (matches) {
        complexity += matches.length;
      }
    });

    return complexity;
  }

  private parseSimpleAST(code: string): ASTNode[] {
    // Simplified AST parsing - in real implementation, you'd use a proper parser
    const nodes: ASTNode[] = [];
    const lines = code.split("\n");

    lines.forEach((line, index) => {
      const trimmed = line.trim();
      if (trimmed.startsWith("function")) {
        nodes.push({
          type: "FunctionDeclaration",
          name: trimmed.match(/function\s+(\w+)/)?.[1],
          start: index,
          end: index,
        });
      } else if (trimmed.startsWith("class")) {
        nodes.push({
          type: "ClassDeclaration",
          name: trimmed.match(/class\s+(\w+)/)?.[1],
          start: index,
          end: index,
        });
      } else if (trimmed.includes("=") && !trimmed.startsWith("//")) {
        nodes.push({
          type: "VariableDeclaration",
          start: index,
          end: index,
        });
      }
    });

    return nodes;
  }
}