export interface GridOptions {
  rows: readonly number[];
  columns: readonly number[];
  maxCells?: number;
}
export interface GridViewport {
  x: number;
  y: number;
  width: number;
  height: number;
  overscanRows?: number;
  overscanColumns?: number;
}
export interface CellRect {
  row: number;
  column: number;
  x: number;
  y: number;
  width: number;
  height: number;
}
export interface GridWindow {
  rows: { start: number; end: number };
  columns: { start: number; end: number };
  cells: CellRect[];
  totalWidth: number;
  totalHeight: number;
}
export interface VirtualGrid {
  window(viewport: GridViewport): GridWindow;
  cell(row: number, column: number): CellRect;
  updateRow(index: number, size: number): void;
  updateColumn(index: number, size: number): void;
}
function prefixes(sizes: readonly number[]): number[] {
  if (sizes.length > 1000000) throw new RangeError('Axis exceeds 1000000 entries');
  const result = [0];
  for (const size of sizes) {
    if (!Number.isFinite(size) || size <= 0) throw new RangeError('Sizes must be positive finite');
    const sum = result.at(-1)! + size;
    if (!Number.isFinite(sum) || sum <= result.at(-1)!)
      throw new RangeError('Axis precision overflow');
    result.push(sum);
  }
  return result;
}
function range(
  prefix: number[],
  offset: number,
  size: number,
  overscan: number,
): { start: number; end: number } {
  const count = prefix.length - 1;
  if (!count || size === 0 || offset >= prefix[count]!) return { start: count, end: count };
  let low = 0,
    high = count;
  while (low < high) {
    const mid = Math.floor((low + high) / 2);
    if (prefix[mid + 1]! <= offset) low = mid + 1;
    else high = mid;
  }
  const start = low;
  low = start;
  high = count;
  const endOffset = offset + size;
  while (low < high) {
    const mid = Math.floor((low + high) / 2);
    if (prefix[mid]! < endOffset) low = mid + 1;
    else high = mid;
  }
  return { start: Math.max(0, start - overscan), end: Math.min(count, low + overscan) };
}
export function createVirtualGrid(options: GridOptions): VirtualGrid {
  let rows = [...options.rows],
    columns = [...options.columns];
  let rp = prefixes(rows),
    cp = prefixes(columns);
  const max = options.maxCells ?? 10000;
  if (!Number.isSafeInteger(max) || max < 1 || max > 1000000)
    throw new RangeError('Invalid cell budget');
  function cell(row: number, column: number): CellRect {
    if (
      !Number.isSafeInteger(row) ||
      !Number.isSafeInteger(column) ||
      row < 0 ||
      column < 0 ||
      row >= rows.length ||
      column >= columns.length
    )
      throw new RangeError('Cell out of bounds');
    return {
      row,
      column,
      x: cp[column]!,
      y: rp[row]!,
      width: columns[column]!,
      height: rows[row]!,
    };
  }
  return {
    cell,
    updateRow(index, size) {
      if (!Number.isSafeInteger(index) || index < 0 || index >= rows.length)
        throw new RangeError('Row out of bounds');
      const next = [...rows];
      next[index] = size;
      const prefix = prefixes(next);
      rows = next;
      rp = prefix;
    },
    updateColumn(index, size) {
      if (!Number.isSafeInteger(index) || index < 0 || index >= columns.length)
        throw new RangeError('Column out of bounds');
      const next = [...columns];
      next[index] = size;
      const prefix = prefixes(next);
      columns = next;
      cp = prefix;
    },
    window(viewport) {
      const { x, y, width, height } = viewport;
      const or = viewport.overscanRows ?? 0,
        oc = viewport.overscanColumns ?? 0;
      if (
        ![x, y, width, height, x + width, y + height].every((n) => Number.isFinite(n) && n >= 0) ||
        ![or, oc].every((n) => Number.isSafeInteger(n) && n >= 0 && n <= 1000000)
      )
        throw new RangeError('Invalid viewport');
      const r = range(rp, y, height, or),
        c = range(cp, x, width, oc);
      if ((r.end - r.start) * (c.end - c.start) > max)
        throw new RangeError('Cell window exceeds budget');
      const cells: CellRect[] = [];
      for (let row = r.start; row < r.end; row++) {
        for (let column = c.start; column < c.end; column++) cells.push(cell(row, column));
      }
      return { rows: r, columns: c, cells, totalWidth: cp.at(-1)!, totalHeight: rp.at(-1)! };
    },
  };
}
