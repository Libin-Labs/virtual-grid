import test from 'node:test';
import assert from 'node:assert/strict';
import { createVirtualGrid } from '../dist/esm/index.js';

test('variable metrics yield exact intersecting half-open cell window', () => {
  const g = createVirtualGrid({ rows: [10, 20, 30], columns: [5, 15, 25] });
  assert.deepEqual(g.window({ x: 5, y: 10, width: 15, height: 20 }), {
    rows: { start: 1, end: 2 },
    columns: { start: 1, end: 2 },
    cells: [{ row: 1, column: 1, x: 5, y: 10, width: 15, height: 20 }],
    totalWidth: 45,
    totalHeight: 60,
  });
});
test('partial intersections and bounded overscan are independent across axes', () => {
  const g = createVirtualGrid({ rows: [10, 20, 30], columns: [5, 15, 25] });
  const w = g.window({ x: 6, y: 11, width: 1, height: 1, overscanRows: 1, overscanColumns: 0 });
  assert.deepEqual(w.rows, { start: 0, end: 3 });
  assert.deepEqual(w.columns, { start: 1, end: 2 });
  assert.deepEqual(
    w.cells.map((c) => [c.row, c.column]),
    [
      [0, 1],
      [1, 1],
      [2, 1],
    ],
  );
});
test('zero viewport or exhausted axis produces no cells even with overscan', () => {
  const g = createVirtualGrid({ rows: [10], columns: [20] });
  assert.deepEqual(g.window({ x: 0, y: 0, width: 0, height: 10, overscanColumns: 1 }).cells, []);
  assert.deepEqual(g.window({ x: 20, y: 0, width: 10, height: 10 }).cells, []);
  assert.deepEqual(
    createVirtualGrid({ rows: [], columns: [20] }).window({ x: 0, y: 0, width: 10, height: 10 })
      .cells,
    [],
  );
});
test('updates rebuild prefix positions and failed update is atomic', () => {
  const g = createVirtualGrid({ rows: [10, 20], columns: [5, 15] });
  g.updateRow(0, 30);
  g.updateColumn(0, 25);
  assert.deepEqual(g.cell(1, 1), { row: 1, column: 1, x: 25, y: 30, width: 15, height: 20 });
  assert.throws(() => g.updateRow(0, 0), RangeError);
  assert.throws(() => g.updateColumn(9, 1), RangeError);
  assert.equal(g.cell(1, 1).y, 30);
});
test('input metric arrays and returned geometry are detached', () => {
  const rows = [10, 20],
    columns = [5, 15];
  const g = createVirtualGrid({ rows, columns });
  rows[0] = 900;
  columns[0] = 900;
  g.cell(0, 0).width = 999;
  const w = g.window({ x: 0, y: 0, width: 1, height: 1 });
  w.cells[0].height = 999;
  assert.equal(g.cell(1, 1).x, 5);
  assert.equal(g.cell(1, 1).y, 10);
});
test('cell budget rejects oversized window rather than silently truncating', () => {
  const g = createVirtualGrid({ rows: [10, 10], columns: [10, 10], maxCells: 3 });
  assert.throws(() => g.window({ x: 0, y: 0, width: 20, height: 20 }), RangeError);
  assert.equal(g.window({ x: 0, y: 0, width: 10, height: 20 }).cells.length, 2);
});
test('invalid bounds dimensions indices and overflow are rejected', () => {
  for (const rows of [[0], [-1], [NaN], [Number.MAX_VALUE, Number.MAX_VALUE], [1e20, 1]])
    assert.throws(() => createVirtualGrid({ rows, columns: [1] }), RangeError);
  assert.throws(() => createVirtualGrid({ rows: [], columns: [], maxCells: 0 }), RangeError);
  const g = createVirtualGrid({ rows: [1], columns: [1] });
  assert.throws(() => g.cell(0.5, 0), RangeError);
  assert.throws(() => g.cell(1, 0), RangeError);
  assert.throws(() => g.window({ x: -1, y: 0, width: 1, height: 1 }), RangeError);
  assert.throws(() => g.window({ x: 0, y: 0, width: 1, height: 1, overscanRows: -1 }), RangeError);
});
test('viewport beyond content returns empty axis bounds and exact totals', () => {
  const g = createVirtualGrid({ rows: [10, 20], columns: [5, 15] });
  const w = g.window({ x: 999, y: 999, width: 10, height: 10, overscanRows: 5 });
  assert.deepEqual(w.rows, { start: 2, end: 2 });
  assert.deepEqual(w.columns, { start: 2, end: 2 });
  assert.equal(w.totalWidth, 20);
  assert.equal(w.totalHeight, 30);
});

test('deterministic viewport sweep agrees with direct two-axis intersection oracle', () => {
  const rows = [4, 7, 3, 11, 5],
    columns = [3, 6, 9, 2];
  const grid = createVirtualGrid({ rows, columns });
  for (let y = 0; y < 36; y += 3) {
    for (let x = 0; x < 25; x += 2) {
      const actual = grid.window({ x, y, width: 4, height: 6 }).cells;
      const expected = [];
      for (let row = 0; row < rows.length; row++) {
        for (let column = 0; column < columns.length; column++) {
          const cell = grid.cell(row, column);
          if (
            cell.x + cell.width > x &&
            cell.x < x + 4 &&
            cell.y + cell.height > y &&
            cell.y < y + 6
          )
            expected.push(cell);
        }
      }
      assert.deepEqual(actual, expected);
    }
  }
});
