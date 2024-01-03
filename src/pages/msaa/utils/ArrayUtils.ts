export function toRecord(a: any, b: any) {
  a[b] = b
  return a
}
