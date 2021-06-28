export function drawMapGrid(mapGridID: string, mapData: string[]) {
  const grid = document.getElementById(mapGridID);
  let templateColumns;
  if (mapData.length === 1) {
    templateColumns = "1fr";
  } else if (mapData.length > 1 && mapData.length <= 5 && mapData.length != 3) {
    templateColumns = "1fr 1fr";
  } else {
    templateColumns = "1fr 1fr 1fr";
  }
  grid.style.gridTemplateColumns = templateColumns;

  mapData.forEach((test) => {
    const map = document.createElement("div");
    const name = test.slice(test.lastIndexOf("/") + 1, -5);
    map.id = name;
    map.className = "map";
    grid.appendChild(map);
  });
}
