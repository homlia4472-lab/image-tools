const byID = (id) => document.getElementById(id);
const canvas = byID("imageCanvas");

const ctx = canvas.getContext("2d");
let img = new Image();
let ratio = 1;
let originalSize = Number();

const styleAfterOnload = () => {
  previewPlaceholder.hidden = true;
  canvas.hidden = false;
  formatSelect.disabled = false;
  widthInput.disabled = false;
  heightInput.disabled = false;
  maintainAspectRatio.disabled = false;
  qualityRange.disabled = false;
  processButton.disabled = false;
  byID("status").innerHTML = 'Select the settings and click "Process image".';
  resultWeight.innerHTML = "—";
  previewDimensions.innerHTML = "—";
};

const styleSettingsСhanging = () => {
  byID("status").innerHTML = 'Select the settings and click "Process image".';
  resultWeight.innerHTML = "—";
  previewDimensions.innerHTML = "—";
};

const mahtSize = function (bits, a = 1) {
  weightDifference(bits, a);
  if (bits > 100000) {
    let mb = bits / 1000000;
    return mb.toFixed(2) + " MB";
  } else {
    let kb = bits / 1000;
    return kb.toFixed(2) + " KB";
  }
};



function weightDifference(size, a) {
  if (a === "original") {
    originalSize = size;
  } else {
    let difference = (100 - 100 * (+size / +originalSize)).toFixed(1);
    if (difference >= 0) {
      byID("status").innerHTML = `Файл стал меньше на: ${difference} %`;
    } else {
      byID("status").innerHTML = `Файл стал больше на: ${difference * -1} %`;
    }
  }
  a = null;
}

byID("imageInput").addEventListener("change", function (event) {
  // получаем файл из input
  const file = event.target.files[0];

  //   проверка на наличие файла
  if (!file) return;
  originalWeight.innerHTML = mahtSize(file.size, "original");
  //   создаем URL для изображения
  const imgUrl = URL.createObjectURL(file);

  img.onload = function () {
    canvas.width = img.naturalWidth;
    canvas.height = img.naturalHeight;

    ratio = img.naturalWidth / img.naturalHeight;
    ctx.drawImage(img, 0, 0);

    widthInput.value = canvas.width;
    heightInput.value = canvas.height;

    //   Стили после загрузки изображения
    styleAfterOnload();
  };
  img.src = imgUrl;
});


// события для форм
formatSelect.addEventListener("input", function () {
  styleSettingsСhanging();
  if (formatSelect.value === "image/png") {
    qualityRange.hidden = true;
    qualityValue.hidden = true;
  } else {
    qualityRange.hidden = false;
    qualityValue.hidden = false;
  }
});

qualityRange.addEventListener("input", function () {
  styleSettingsСhanging();
  qualityValue.innerHTML = qualityRange.value;
});

formatSelect.addEventListener('input', function() {
  styleSettingsСhanging();
})

// изменение размеров
widthInput.addEventListener("input", function () {
  styleSettingsСhanging();
  const width = Number(widthInput.value);
  if (!Number.isInteger(width) || width <= 0) return;

  canvas.width = width;

  if (maintainAspectRatio.checked) {
    aspectRatio("width", width);
  }
  ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
});

heightInput.addEventListener("input", function () {
  styleSettingsСhanging();
  const height = Number(heightInput.value);
  if (!Number.isInteger(height) || height <= 0) return;

  canvas.height = height;

  if (maintainAspectRatio.checked) {
    aspectRatio("height", height);
  }
  ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
});

// соотношение сторон
function aspectRatio(side, value) {
  if (side === "width") {
    const h = Math.max(1, Math.round(value / ratio));
    canvas.height = h;
    heightInput.value = canvas.height;
  }

  if (side === "height") {
    const w = Math.max(1, Math.round(value * ratio));
    canvas.width = w;
    widthInput.value = canvas.width;
  }
}

// обработчик фотографии
processButton.addEventListener("click", async function () {
  processButton.disabled = true;
  const blob = await imgToBlob();
  processButton.disabled = false;

  resultWeight.innerHTML = mahtSize(blob.size);
  previewDimensions.innerHTML = canvas.width + "px x " + canvas.height + "px";

  // удаляю прошлою и добавляю измененную картинку в canvas
  const resultUrl = URL.createObjectURL(blob);
  const resultImg = new Image();

  resultImg.onload = function () {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(resultImg, 0, 0);

    URL.revokeObjectURL(resultUrl);
  };

  resultImg.src = resultUrl;
});

// Преобразование в данные
function imgToBlob() {
  const quality = Number(qualityRange.value) / 100;

  // Каждый раз начинать с исходного изображения
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

  return new Promise(function (resolve, reject) {
    canvas.toBlob(
      function (blob) {
        if (!blob) {
          reject(new Error("Не удалось создать изображение"));
          return;
        }
        resolve(blob);
      },
      formatSelect.value,
      quality,
    );
  });
};



