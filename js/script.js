import translations from "./translations.js";


const language = document.documentElement.lang;
const texts = translations[language] || translations.de;


const byID = (id) => document.getElementById(id);
const canvas = byID("imageCanvas");

const ctx = canvas.getContext("2d");
let img = new Image();
let ratio = 1;
let originalSize = Number();
let resultBlob = null;

const styleAfterOnload = () => {
  previewPlaceholder.hidden = true;
  canvas.hidden = false;
  formatSelect.disabled = false;
  widthInput.disabled = false;
  heightInput.disabled = false;
  maintainAspectRatio.disabled = false;
  qualityRange.disabled = false;
  processButton.disabled = false;
  byID("status").innerHTML = texts.selectOptions; //1
  resultWeight.innerHTML = "—";
  previewDimensions.innerHTML = "—";
  resultBlob = null;
  downloadButton.disabled = true;
};

const styleSettingsСhanging = () => {
  byID("status").innerHTML = texts.selectOptions; //1
  resultWeight.innerHTML = "—";
  previewDimensions.innerHTML = "—";
  resultBlob = null;
  downloadButton.disabled = true;
};

const setProcessing = (isProcessing) => {
  byID("imageInput").disabled = isProcessing;
  formatSelect.disabled = isProcessing;
  widthInput.disabled = isProcessing;
  heightInput.disabled = isProcessing;
  maintainAspectRatio.disabled = isProcessing;
  qualityRange.disabled = isProcessing;
  processButton.disabled = isProcessing;
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
      byID("status").innerHTML = texts.fileSizeReduced + difference + " %"; // 2
    } else {
      byID("status").innerHTML =
        texts.fileSizeIncreased + difference * -1 + " %"; // 3
    }
  }
  a = null;
}

byID("imageInput").addEventListener("change", function (event) {
  // Получаю файл из input
  const file = event.target.files[0];

  //   Проверка на наличие файла
  if (!file) return;
  styleSettingsСhanging();
  setProcessing(true);
  byID("status").textContent = texts.imageLoading; //4
  originalWeight.innerHTML = mahtSize(file.size, "original");
  //   Создаю URL для изображения
  const imgUrl = URL.createObjectURL(file);

  img.onload = function () {
    setProcessing(false);
    canvas.width = img.naturalWidth;
    canvas.height = img.naturalHeight;

    ratio = img.naturalWidth / img.naturalHeight;
    ctx.drawImage(img, 0, 0);

    widthInput.value = canvas.width;
    heightInput.value = canvas.height;

    // Освобождаю адресс исходника
    URL.revokeObjectURL(imgUrl);
    //   Стили после загрузки изображения
    styleAfterOnload();
  };
  img.onerror = function () {
    setProcessing(false);
    URL.revokeObjectURL(imgUrl);

    styleSettingsСhanging();
    processButton.disabled = true;
    widthInput.disabled = true;
    heightInput.disabled = true;
    maintainAspectRatio.disabled = true;

    byID("status").textContent = texts.imageLoadError; //5
  };
  img.src = imgUrl;
});

// События для форм
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

// Изменение размеров
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

// Соотношение сторон
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

// Обработчик фотографии
processButton.addEventListener("click", async function () {
  setProcessing(true);
  styleSettingsСhanging();
  byID("status").textContent = texts.imageProcessing; // 6

  try {
    // Преобразование и показ результата
    const blob = await imgToBlob();

    resultWeight.innerHTML = mahtSize(blob.size);
    previewDimensions.innerHTML = canvas.width + "px x " + canvas.height + "px";

    // Удаляю прошлою и добавляю измененную картинку в canvas
    const resultUrl = URL.createObjectURL(blob);
    const resultImg = new Image();

    try {
      await new Promise(function (resolve, reject) {
        resultImg.onload = resolve;

        resultImg.onerror = function () {
          reject(new Error(texts.resultDisplayError)); // 7
        };

        resultImg.src = resultUrl;
      });

      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(resultImg, 0, 0);
    } finally {
      URL.revokeObjectURL(resultUrl);
    }
    resultBlob = blob;
    downloadButton.disabled = false;
  } catch (error) {
    // Сообщение об ошибке
    byID("status").textContent = texts.imageProcessingError; // 8

    console.error(error);
  } finally {
    setProcessing(false);
  }
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
          reject(new Error(texts.imageCreationError)); // 9
          return;
        }
        resolve(blob);
      },
      formatSelect.value,
      quality,
    );
  });
}

downloadButton.addEventListener("click", function () {
  if (!resultBlob) {
    return;
  }

  const url = URL.createObjectURL(resultBlob);
  const link = document.createElement("a");

  const extensions = {
    "image/jpeg": "jpg",
    "image/png": "png",
    "image/webp": "webp",
  };
  const extension = extensions[resultBlob.type];

  link.href = url;
  link.download = `result.${extension}`;

  link.click();

  // Освобажаю временный адресс
  setTimeout(function () {
    URL.revokeObjectURL(url);
  }, 1000);
});
