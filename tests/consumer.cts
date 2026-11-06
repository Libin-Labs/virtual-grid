import { createVirtualGrid } from '@lp-labs/virtual-grid';

const grid = createVirtualGrid({ rows: [10, 20, 30], columns: [5, 15, 25] });
const window = grid.window({ x: 5, y: 10, width: 15, height: 20 });
if (window.cells.length !== 1 || window.cells[0]?.row !== 1) {
  throw new Error('Grid window failed');
}
grid.updateRow(0, 30);
if (grid.cell(1, 1).y !== 30) throw new Error('Metric update failed');

// @ts-expect-error invalid public API input must be rejected
createVirtualGrid({ rows: [10], columns: ['wide'] });
