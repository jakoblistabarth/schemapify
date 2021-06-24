export function drawMapGrid(files: string[]): void {
  const grid = document.getElementById("map-grid");
  let templateColumns;
  if (files.length === 1) {
    templateColumns = "1fr";
  } else if (files.length > 1 && files.length <= 5 && files.length != 3) {
    templateColumns = "1fr 1fr";
  } else {
    templateColumns = "1fr 1fr 1fr";
  }
  grid.style.gridTemplateColumns = templateColumns;

  files.forEach((file) => {
    const map = document.createElement("div");
    const name = file.slice(file.lastIndexOf("/") + 1, -5);
    map.id = name;
    map.className = "map";
    grid.appendChild(map);
  });
}
