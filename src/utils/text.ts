export function toPlainText(source: string) {
  return source
    .replace(/<[^>]+>/g, ' ')
    .replace(/[-#>*_`~[\]()!]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}
