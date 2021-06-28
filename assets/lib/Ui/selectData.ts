export function drawDataSelect(inputFiles: string[]) {
  const toolBar = document.getElementById("select-data");

  const fileList = document.createElement("div");
  fileList.id = "mySelect";
  toolBar.appendChild(fileList);

  inputFiles.forEach((file) => {
    const label = document.createElement("label");
    const checkbox = document.createElement("input");
    const filename = file.substring(file.lastIndexOf("/") + 1, file.length - 5);
    checkbox.setAttribute("type", "checkbox");
    checkbox.value = file;
    checkbox.name = filename;
    fileList.addEventListener("change", function (event) {
      console.log(file);
    });
    label.append(checkbox, filename);
    fileList.append(label);
  });

  // fileList.value = inputFiles[2];

  return fileList;
}
