export function serialize<T>(obj: T): T {
  return JSON.parse(JSON.stringify(obj));
}
