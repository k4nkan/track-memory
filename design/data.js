const months = document.getElementById("months");
const fadeObserver = new IntersectionObserver((entries, observer) => {
  entries.forEach(({ target, isIntersecting }) => {
    if (isIntersecting) {
      target.classList.add("is-visible");
      observer.unobserve(target);
    }
  });
}, { threshold: 0.5 });

fadeObserver.observe(document.querySelector(".page-header"));

const GRID_SIZE = 7;
const MAX_RETRIES = 200;
const SIZE_MAP = {
  large: 3,
  medium: 2,
  small: 1,
};

function formatMonthLabel(year, month) {
  return `${year}年${month}月`;
}

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

function buildGrid(grid, items) {
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

async function updateData(filename, grid) {
  try {
    const response = await fetch(`datas/${filename}`);
    if (!response.ok) throw new Error(`Failed to load ${filename}`);

    const items = await response.json();
    items.sort((a, b) => {
      const aSpan = SIZE_MAP[a.size] || SIZE_MAP.small;
      const bSpan = SIZE_MAP[b.size] || SIZE_MAP.small;
      return aSpan === bSpan ? a.rank - b.rank : bSpan - aSpan;
    });
    buildGrid(grid, items);
  } catch (error) {
    console.error(error);
  }
}

async function load() {
  try {
    const response = await fetch("datas/index.json");
    if (!response.ok) throw new Error("Failed to load month index");

    const entries = await response.json();
    if (!entries.length) throw new Error("Month index is empty");

    months.innerHTML = entries.map((month) => `
      <section>
        <h3>${month.label || formatMonthLabel(month.year, month.month)}</h3>
        <div class="grid"></div>
      </section>`).join("");

    entries.forEach((month, index) => {
      const section = months.children[index];
      fadeObserver.observe(section);
      updateData(month.filename, section.querySelector(".grid"));
    });
  } catch (error) {
    console.error(error);
  }
}

load();
