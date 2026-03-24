const grid = document.getElementById("grid");

const GRID_SIZE = 7;
const SIZE_MAP = {
  large: 3,
  medium: 2,
  small: 1,
};

function createBaseCells() {
  for (let row = 1; row <= GRID_SIZE; row += 1) {
    for (let col = 1; col <= GRID_SIZE; col += 1) {
      const cell = document.createElement("div");
      cell.className = "grid-cell";
      cell.style.gridColumn = col;
      cell.style.gridRow = row;
      grid.appendChild(cell);
    }
  }
}

function createItem(item, slot) {
  const element = document.createElement("div");
  element.className = "item";
  element.style.gridColumn = `${slot.col} / span ${slot.span}`;
  element.style.gridRow = `${slot.row} / span ${slot.span}`;
  element.style.backgroundImage = `url("${item.image_url}")`;
  grid.appendChild(element);
}

function shuffle(list) {
  const array = [...list];

  for (let i = array.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [array[i], array[j]] = [array[j], array[i]];
  }

  return array;
}

function canPlace(used, col, row, span) {
  for (let y = row; y < row + span; y += 1) {
    for (let x = col; x < col + span; x += 1) {
      if (used[y][x]) {
        return false;
      }
    }
  }

  return true;
}

function fillUsed(used, col, row, span) {
  for (let y = row; y < row + span; y += 1) {
    for (let x = col; x < col + span; x += 1) {
      used[y][x] = true;
    }
  }
}

function getRandomSlot(used, span) {
  const availableSlots = [];

  for (let row = 1; row <= GRID_SIZE - span + 1; row += 1) {
    for (let col = 1; col <= GRID_SIZE - span + 1; col += 1) {
      if (canPlace(used, col, row, span)) {
        availableSlots.push({ col, row, span });
      }
    }
  }

  return shuffle(availableSlots)[0] || null;
}

function buildGrid(items) {
  const used = Array.from({ length: GRID_SIZE + 1 }, () =>
    Array(GRID_SIZE + 1).fill(false),
  );

  createBaseCells();

  items.forEach((item) => {
    const span = SIZE_MAP[item.size] || SIZE_MAP.small;
    const slot = getRandomSlot(used, span);

    if (!slot) {
      return;
    }

    fillUsed(used, slot.col, slot.row, span);
    createItem(item, slot);
  });
}

fetch("../data.json")
  .then((response) => response.json())
  .then((items) => {
    const sorted = [...items].sort((a, b) => {
      const aSpan = SIZE_MAP[a.size] || SIZE_MAP.small;
      const bSpan = SIZE_MAP[b.size] || SIZE_MAP.small;

      if (aSpan === bSpan) {
        return a.rank - b.rank;
      }

      return bSpan - aSpan;
    });

    buildGrid(sorted);
  });
