export function getItemKey(item) {
  return `${item.isDirectory ? "directory" : "file"}:${item.id}`;
}