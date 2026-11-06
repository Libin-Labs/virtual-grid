# @lp-labs/virtual-grid

Two-axis variable-metric virtual grid with prefix searches, updates and bounded cell windows.

Standalone original implementation with zero runtime, peer or sibling dependencies.
Library ID 445. ES2022, strict TypeScript, NodeNext ESM and CommonJS with declarations.

## Install

```bash
npm install @lp-labs/virtual-grid
```

CommonJS: `const { createVirtualGrid } = require('@lp-labs/virtual-grid')`.

## Quickstart

```js
import { createVirtualGrid } from '@lp-labs/virtual-grid';

const grid = createVirtualGrid({ rows: [10, 20, 30], columns: [5, 15, 25] });
const window = grid.window({ x: 5, y: 10, width: 15, height: 20 });
if (window.cells.length !== 1 || window.cells[0]?.row !== 1) {
  throw new Error('Grid window failed');
}
grid.updateRow(0, 30);
if (grid.cell(1, 1).y !== 30) throw new Error('Metric update failed');
```

## API, customization and contracts

`createVirtualGrid({ rows, columns, maxCells? })` copies independent size arrays and
builds prefix metrics. Each axis accepts at most 1000000 positive finite sizes; zero sizes,
nonfinite totals and additions that cannot advance floating-point prefixes are rejected.
Empty axes are allowed. maxCells defaults to 10000, integer 1..1000000.

`window({ x,y,width,height,overscanRows?,overscanColumns? })` accepts finite nonnegative
viewport values and finite right/bottom. Binary searches compute intersecting half-open
row/column ranges; cells ending at an offset or starting at viewport end are excluded.
Overscan is an integer count per axis, default zero, 0..1000000, clamped to available indices.
A zero-size or past-content axis stays empty even with overscan; its bounds are count/count.
The result contains end-exclusive row/column bounds, row-major detached cells and total
width/height. A cell count above maxCells throws RangeError instead of allocating or truncating.
`cell(row,column)` returns exact supplied-metric x/y/width/height and indices.
`updateRow(index,size)` and `updateColumn(index,size)` atomically rebuild the corresponding
axis prefix; invalid updates leave prior metrics intact. Cell indices are safe integers.

All malformed sizes, indices, viewport, overscan, precision overflow or cell-budget violations
throw RangeError. Construction O(rows+columns), updates O(axis length), cell lookup O(1),
window O(log rows + log columns + output cells), memory O(rows+columns+output cells).
This original two-dimensional implementation does not import virtual-surface (which explicitly
excludes grids). It does not measure nodes, support merged cells, fetch data, render spacers,
implement scrolling, infer row counts or provide a framework integration.

## Complete public declarations

```ts
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
  rows: {
    start: number;
    end: number;
  };
  columns: {
    start: number;
    end: number;
  };
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
export declare function createVirtualGrid(options: GridOptions): VirtualGrid;
```

## Scope and performance

Independent two-dimensional prefix geometry, not a virtual-surface wrapper, DOM grid, renderer or data source.

Complexities and bounds above assume ordinary JavaScript number arithmetic and Map/Set
average constant-time lookup. No runtime or peer dependencies, automatic browser adapters,
global registries or hidden services are included. Importing the module has no browser effects.

## Development

```bash
npm ci --offline --no-audit --no-fund
npm run build
npm run typecheck
npm test
npm run format:check
```

## Support

If this library is useful to you, consider supporting its maintenance with a [donation via PayPal](https://www.paypal.me/LibinPrasanth).

## Author

Created by [Libin Prasanth](https://www.linkedin.com/in/libinprasanth/). Connect on LinkedIn for updates and discussion.
