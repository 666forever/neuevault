export class PipelineReport {
  errors = [];
  warnings = [];
  error(message) { this.errors.push(message); }
  warn(message) { this.warnings.push(message); }
  assertValid() {
    if (!this.errors.length) return;
    throw new Error(`Asset validation failed:\n${this.errors.map(message => `  - ${message}`).join('\n')}`);
  }
}
