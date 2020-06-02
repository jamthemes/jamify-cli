export function arrayUnique<T>(array: T[], field: string): T[] {
  return [...new Set(array.map(array => (array as any)[field]))].map(value => {
    return array.find(el => (el as any)[field] === value);
  }) as T[];
}
