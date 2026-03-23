const grid = document.getElementById("grid");

fetch("../data.json")
  .then((response) => response.json())
  .then((items) => {
    grid.innerHTML = items
      .map(
        (item) => `
          <article class="card">
            <img class="cover" src="${item.image_url}" alt="${item.title}" />
            <div class="card-body">
              <p class="rank">#${item.rank}</p>
              <h2>${item.title}</h2>
              <p class="artist">${item.artist}</p>
              <p class="meta">${item.plays} plays</p>
            </div>
          </article>
        `,
      )
      .join("");
  })
  .catch(() => {
    grid.innerHTML = '<p class="empty">data.json could not be loaded.</p>';
  });
