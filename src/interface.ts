export interface textValidationWarning {
  message: string,
  type: string,
  line: number,
  column: {
    start: number,
    end: number,
  },
}

export interface generateSyntaxResult {
  content: string,
  warnings: textValidationWarning[],
  count: number,
}
