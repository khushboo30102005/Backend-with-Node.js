const fileInput = document.getElementById("fileInput");

fileInput.addEventListener("change", (event) => {
  const file = event.target.files[0];
  console.log(file)
  const reader = new FileReader();
  console.log(reader)
  reader.addEventListener("load", function (e) {
    console.log(e)
    const arrayBuffer = e.target.result;
    console.log(arrayBuffer);
  });

  reader.readAsArrayBuffer(file);
});
