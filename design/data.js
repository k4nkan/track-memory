const grid = document.getElementById("grid");
const monthSelect = document.getElementById("month-select");

const GRID_SIZE = 7;
const MAX_RETRIES = 200;
const SIZE_MAP = {
  large: 3,
  medium: 2,
  small: 1,
};

function createItem(item, slot) {
  const element = document.createElement("a");
  element.className = "item";
  element.href = item.spotify_url;
  element.target = "_blank";
  element.rel = "noopener noreferrer";
  element.setAttribute("aria-label", `${item.title} - ${item.artist}`);
  element.style.gridColumn = `${slot.col} / span ${slot.span}`;
  element.style.gridRow = `${slot.row} / span ${slot.span}`;
  element.style.backgroundImage = `url("${item.image_url}")`;
  return element;
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
      if (span === 3 && col === 3 && row === 3) {
        continue;
      }

      if (canPlace(used, col, row, span)) {
        availableSlots.push({ col, row, span });
      }
    }
  }

  return shuffle(availableSlots)[0] || null;
}

function getPlacements(items) {
  const used = Array.from({ length: GRID_SIZE + 1 }, () =>
    Array(GRID_SIZE + 1).fill(false),
  );
  const placements = [];

  for (const item of items) {
    const span = SIZE_MAP[item.size] || SIZE_MAP.small;
    const slot = getRandomSlot(used, span);

    if (!slot) {
      return null;
    }

    fillUsed(used, slot.col, slot.row, span);
    placements.push({ item, slot });
  }

  return placements;
}

function buildGrid(items) {
  grid.replaceChildren();

  for (let i = 0; i < MAX_RETRIES; i += 1) {
    const placements = getPlacements(items);

    if (!placements) {
      continue;
    }

    placements.forEach(({ item, slot }) => {
      grid.appendChild(createItem(item, slot));
    });

    return;
  }

  console.warn("Could not place all items in the grid.");
}

function updateData(filename) {
  // Fetch from the 'datas' folder inside the 'design' directory
  fetch(`datas/${filename}`)
    .then((response) => {
      if (!response.ok) {
        throw new Error(`Failed to load ${filename}`);
      }

      return response.json();
    })
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
    })
    .catch((error) => {
      console.error(error);
    });
}

// Initial load
updateData(monthSelect.value);

// Listen for changes
monthSelect.addEventListener("change", (e) => {
  updateData(e.target.value);
});
