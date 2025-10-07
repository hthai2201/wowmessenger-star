// Missing dependencies - adding them here for input.html functionality

// Cloud Function URL generator
function getCloudFunctionUrl(functionName) {
  // Firebase Cloud Functions base URL (replace with your actual project URL)
  // For development, you can use a local server or mock endpoints
  const baseUrl =
    window.CLOUD_FUNCTIONS_BASE_URL ||
    "https://asia-southeast1-wowmessenger-47f97.cloudfunctions.net";
  return `${baseUrl}/${functionName}`;
}

// WowMessenger object with required methods
window.WowMessenger = {
  StarData: {
    createStarMessage: function (data) {
      return {
        msg_id:
          "msg_" + Date.now() + "_" + Math.random().toString(36).substr(2, 9),
        msg_type: "star",
        msg_state: "draft",
        sender_name: data.sender_name || "",
        receiver_name: data.receiver_name || "",
        sender_email: data.sender_email || "",
        sender_feeling: data.sender_feeling || "",
        msg_content: data.msg_content || "",
        answers: data.answers || {
          answer1: "",
          answer2: "",
          answer3: "",
          answer4: "",
        },
        image_config: {
          source: "uploaded",
          uploaded_image: {
            temp_url: "",
            temp_path: "",
            upload_timestamp: "",
            file_name: "",
          },
          use_original_color: false,
        },
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };
    },
  },
  MessageData: {
    MessageState: {
      DRAFT: "draft",
      PENDING_PAYMENT: "pending_payment",
      PAID: "paid",
      PROCESSING: "processing",
      COMPLETED: "completed",
      FAILED: "failed",
    },
  },
};

// // Anti-debugging protection (simplified)
// const debugProtection = (function () {
//   let firstCall = true;
//   return function (context, fn) {
//     const handler = firstCall
//       ? function () {
//           if (fn) {
//             const result = fn.apply(context, arguments);
//             fn = null;
//             return result;
//           }
//         }
//       : function () {};
//     firstCall = false;
//     return handler;
//   };
// })();
// const antiDebug = debugProtection(this, function () {
//   return antiDebug
//     .toString()
//     .search("(((.+)+)+)+$")
//     .toString()
//     .constructor(antiDebug)
//     .search("(((.+)+)+)+$");
// });
// antiDebug();
// const consoleProtection = (function () {
//   let initialized = true;
//   return function (context, callback) {
//     const wrapper = initialized
//       ? function () {
//           if (callback) {
//             const result = callback.apply(context, arguments);
//             callback = null;
//             return result;
//           }
//         }
//       : function () {};
//     initialized = false;
//     return wrapper;
//   };
// })();
// const setupConsoleProtection = consoleProtection(this, function () {
//   let globalObject;
//   try {
//     const getGlobal = Function(
//       'return (function() {}.constructor("return this")( ));'
//     );
//     globalObject = getGlobal();
//   } catch (error) {
//     globalObject = window;
//   }
//   const console = (globalObject.console = globalObject.console || {});
//   const methods = [
//     "log",
//     "warn",
//     "info",
//     "error",
//     "exception",
//     "table",
//     "trace",
//   ];
//   for (let i = 0; i < methods.length; i++) {
//     const wrapper =
//       consoleProtection.constructor.prototype.bind(consoleProtection);
//     const methodName = methods[i];
//     const originalMethod = console[methodName] || wrapper;
//     wrapper.__proto__ = consoleProtection.bind(consoleProtection);
//     wrapper.toString = originalMethod.toString.bind(originalMethod);
//     console[methodName] = wrapper;
//   }
// });
// setupConsoleProtection();
let currentStep = 1;
let paymentPollingInterval = null;
let cropModal = null;
let uploadedImageUrl = null;
let uploadedImageElement = null;
let frameImage = null;
let imageScale = 1;
let originalImageElement = null;
let originalImageUrl = null;
let backgroundRemovedImageElement = null;
let backgroundRemovedImageUrl = null;
let useOriginalColor = false;
function initializeMessageData() {
  console.log("[Debug] Initializing message data...");
  console.log("[Debug] WowMessenger object:", window.WowMessenger);

  try {
    window.messageData = WowMessenger.StarData.createStarMessage({
      sender_name: "",
      receiver_name: "",
      sender_email: "trantrungjava@gmail.com",
      sender_feeling: "",
      msg_content: "",
      answers: {
        answer1: "",
        answer2: "",
        answer3: "",
        answer4: "",
      },
    });
    window.messageData.image_config.source = "uploaded";
    console.log(
      "[Init] Message data initialized successfully:",
      window.messageData
    );
  } catch (error) {
    console.error("[Init] Error initializing message data:", error);
  }
}
function setupNavigation() {
  const nextBtn = document.getElementById("nextBtn");
  const prevBtn = document.getElementById("prevBtn");
  nextBtn.addEventListener("click", async function () {
    if ((await validateStep(currentStep)) && currentStep < 3) {
      currentStep++;
      showStep(currentStep);
      updateProgress();
      updateNavigation();
      if (3 === currentStep) {
        await preparePaymentStep();
      }
    }
  });
  prevBtn.addEventListener("click", function () {
    if (currentStep > 1) {
      if (3 === currentStep) {
        stopPaymentStatusPolling();
      }
      currentStep--;
      showStep(currentStep);
      updateProgress();
      updateNavigation();
    }
  });
}
function showStep(stepNumber) {
  document
    .querySelectorAll(".step")
    .forEach((step) => step.classList.remove("active"));
  document.getElementById("step" + stepNumber).classList.add("active");
  setTimeout(() => {
    if (stepNumber > 1) {
      const stepElement = document.getElementById("step" + stepNumber);
      if (stepElement) {
        const offset =
          stepElement.offsetTop - (window.innerWidth <= 768 ? 20 : 40);
        window.scrollTo({
          top: offset,
          behavior: "smooth",
        });
      }
    } else {
      window.scrollTo({
        top: 0,
        behavior: "smooth",
      });
    }
  }, 200);
}
function updateProgress() {
  const percentage = (currentStep / 3) * 100;
  document.getElementById("progressBar").style.width = percentage + "%";
  document.getElementById("progressText").textContent =
    Math.round(percentage) + "% hoàn thành";
}
function updateNavigation() {
  const prevBtn = document.getElementById("prevBtn");
  const nextBtn = document.getElementById("nextBtn");
  const nextBtnText = document.getElementById("nextBtnText");
  prevBtn.style.display = 1 === currentStep ? "none" : "block";
  if (3 === currentStep) {
    nextBtn.style.display = "none";
  } else {
    nextBtn.style.display = "block";
    nextBtnText.textContent = "Tiếp theo";
  }
}
async function validateStep(stepNumber) {
  const emailInput = document.getElementById("email");
  const emailError = document.getElementById("emailError");
  if (1 === stepNumber) {
    const questionText = document.getElementById("questionText").value.trim();
    const answer1 = document.getElementById("answer1").value.trim();
    const answer2 = document.getElementById("answer2").value.trim();
    const answer3 = document.getElementById("answer3").value.trim();
    const answer4 = document.getElementById("answer4").value.trim();
    const email = emailInput.value.trim();
    if (!questionText) {
      showToast("Vui lòng nhập câu hỏi", "error");
      return false;
    }
    if (!(answer1 && answer2 && answer3 && answer4)) {
      showToast("Vui lòng nhập đầy đủ 4 đáp án", "error");
      return false;
    }
    return email && /^[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,}$/i.test(email)
      ? (emailError.classList.add("hidden"),
        (window.messageData.msg_content = questionText),
        (window.messageData.answers = {
          answer1: answer1,
          answer2: answer2,
          answer3: answer3,
          answer4: answer4,
        }),
        (window.messageData.sender_email = email),
        (window.messageData.updated_at = new Date().toISOString()),
        console.log("[Step1] Message data updated:", {
          msg_content: window.messageData.msg_content,
          answers: window.messageData.answers,
          sender_email: window.messageData.sender_email,
        }),
        true)
      : (emailError.classList.remove("hidden"), emailInput.focus(), false);
  }
  if (2 === stepNumber) {
    const starMessage = document.getElementById("starMessage").value.trim();
    if (
      !uploadedImageUrl &&
      !window.messageData.image_config.uploaded_image.temp_url
    ) {
      showToast("Vui lòng tải lên hình ảnh ngôi sao", "error");
      return false;
    }
    if (!starMessage) {
      showToast("Vui lòng nhập lời bày tỏ", "error");
      return false;
    }
    window.messageData.sender_feeling = starMessage;
    window.messageData.image_config.use_original_color = useOriginalColor;
    setNextButtonLoading(true);
    try {
      await uploadMergedImageAndCreateMessage();
      setNextButtonLoading(false);
      return true;
    } catch (error) {
      console.error("[Step2] Error uploading merged image:", error);
      showToast("Lỗi khi tải ảnh. Vui lòng thử lại.", "error");
      setNextButtonLoading(false);
      return false;
    }
  }
  return true;
}
function loadFrameImage() {
  frameImage = new Image();
  frameImage.crossOrigin = "anonymous";
  frameImage.onload = function () {
    console.log(
      "[Frame] Frame image loaded:",
      frameImage.width,
      "x",
      frameImage.height
    );
    updatePreview();
  };
  frameImage.onerror = function (error) {
    console.error("[Frame] Failed to load frame image:", error);
    console.log("[Frame] Creating fallback canvas frame...");
    createFallbackFrame();
  };
  frameImage.src = "assets/images/moon_color_texture.jpg";
  console.log("[Frame] Loading frame from:", frameImage.src);
}

function createFallbackFrame() {
  // Create a canvas-based circular frame as fallback
  const canvas = document.createElement("canvas");
  canvas.width = 512;
  canvas.height = 512;
  const ctx = canvas.getContext("2d");

  // Create a circular mask
  ctx.fillStyle = "#ffffff";
  ctx.fillRect(0, 0, 512, 512);

  // Create circular cutout
  ctx.globalCompositeOperation = "destination-out";
  ctx.beginPath();
  ctx.arc(256, 256, 200, 0, Math.PI * 2);
  ctx.fill();

  ctx.globalCompositeOperation = "source-over";

  // Convert canvas to image
  frameImage = new Image();
  frameImage.onload = function () {
    console.log("[Frame] Fallback frame created successfully");
    updatePreview();
  };
  frameImage.src = canvas.toDataURL();
}

function setupScaleSlider() {
  const scaleSlider = document.getElementById("imageScaleSlider");
  const scaleValue = document.getElementById("scaleValue");
  if (scaleSlider) {
    scaleSlider.addEventListener("input", function () {
      imageScale = parseFloat(this.value);
      scaleValue.textContent = imageScale.toFixed(2);
      updatePreview();
    });
  }
}
function setupOriginalColorToggle() {
  const colorToggle = document.getElementById("useOriginalColorToggle");
  if (colorToggle) {
    colorToggle.addEventListener("change", function () {
      useOriginalColor = this.checked;
      console.log("[Toggle] Use original color changed to:", useOriginalColor);
      if (useOriginalColor && originalImageElement) {
        console.log("[Toggle] Switching to original image");
        uploadedImageElement = originalImageElement;
        uploadedImageUrl = originalImageUrl;
      } else if (!useOriginalColor && backgroundRemovedImageElement) {
        console.log("[Toggle] Switching to background-removed image");
        uploadedImageElement = backgroundRemovedImageElement;
        uploadedImageUrl = backgroundRemovedImageUrl;
      } else if (!useOriginalColor && originalImageElement) {
        console.log(
          "[Toggle] Background-removed image not ready, using original"
        );
        uploadedImageElement = originalImageElement;
        uploadedImageUrl = originalImageUrl;
      }
      updatePreview();
    });
  }
}
function setupImageUpload() {
  const imageUploadInput = document.getElementById("imageUpload");
  document
    .getElementById("uploadButton")
    .addEventListener("click", function () {
      imageUploadInput.click();
    });
  imageUploadInput.addEventListener("change", function (event) {
    const file = event.target.files[0];
    if (!file) {
      return;
    }
    const fileSizeKB = (file.size / 1024).toFixed(2);
    const fileSizeMB = (file.size / 1048576).toFixed(2);
    console.log("[Upload] File selected: " + file.name);
    console.log(
      "[Upload] File size: " + fileSizeKB + " KB (" + fileSizeMB + " MB)"
    );
    console.log("[Upload] File type: " + file.type);
    return file.type.match("image.*")
      ? file.size > 5242880
        ? (showToast("File quá lớn. Kích thước tối đa là 5MB", "error"),
          void (imageUploadInput.value = ""))
        : void cropModal.show(file)
      : (showToast("Vui lòng chọn file hình ảnh (JPG, PNG, GIF)", "error"),
        void (imageUploadInput.value = ""));
  });
}
async function processAndUploadImage(croppedFile, cropData) {
  const fileSizeKB = (croppedFile.size / 1024).toFixed(2);
  const fileSizeMB = (croppedFile.size / 1048576).toFixed(2);
  console.log(
    "[Upload] Cropped file size: " + fileSizeKB + " KB (" + fileSizeMB + " MB)"
  );
  setUploadButtonLoading(true);
  const shimmerOverlay = document.getElementById("shimmerOverlay");
  if (shimmerOverlay) {
    shimmerOverlay.classList.remove("hidden");
    console.log("[Upload] Showing shimmer overlay");
  }
  const objectUrl = URL.createObjectURL(croppedFile);
  try {
    const uploadStatus = document.getElementById("uploadStatus");
    const scaleSliderContainer = document.getElementById(
      "scaleSliderContainer"
    );
    const originalColorToggleContainer = document.getElementById(
      "originalColorToggleContainer"
    );
    scaleSliderContainer.classList.remove("hidden");
    originalImageElement = new Image();
    originalImageElement.crossOrigin = "anonymous";
    originalImageElement.onload = function () {
      console.log(
        "[Upload] Original image loaded for preview:",
        originalImageElement.width,
        "x",
        originalImageElement.height
      );
      originalImageUrl = objectUrl;
      uploadedImageElement = originalImageElement;
      uploadedImageUrl = originalImageUrl;
      updatePreview();
    };
    originalImageElement.onerror = function (error) {
      console.error("[Upload] Failed to load original image:", error);
    };
    originalImageElement.src = objectUrl;
    console.log("[Upload] Loading original image from objectUrl");
    uploadStatus.textContent = "Đang tải ảnh lên và xóa phông nền...";
    uploadStatus.classList.remove("text-green-600");
    const formData = new FormData();
    formData.append("image", croppedFile);
    const uploadUrl = getCloudFunctionUrl("uploadImageAndRemoveBackground");
    console.log("[Upload] Uploading to:", uploadUrl);
    const response = await fetch(uploadUrl, {
      method: "POST",
      body: formData,
    });
    if (!response.ok) {
      throw new Error("Upload failed");
    }
    const result = await response.json();
    console.log("[Upload] Upload result:", result);
    if (!result.success) {
      throw new Error(result.error || "Upload failed");
    }
    {
      uploadStatus.textContent = "Tải ảnh thành công!";
      uploadStatus.classList.add("text-green-600");
      window.messageData.image_config.uploaded_image.temp_url = result.fileUrl;
      window.messageData.image_config.uploaded_image.temp_path =
        result.filePath;
      window.messageData.image_config.source = "uploaded";
      console.log(
        "[Upload] Creating new image element for Firebase URL:",
        result.fileUrl
      );
      const backgroundImage = new Image();
      backgroundImage.crossOrigin = "anonymous";
      backgroundImage.onload = function () {
        console.log(
          "[Upload] Firebase image loaded successfully:",
          backgroundImage.width,
          "x",
          backgroundImage.height
        );
        backgroundRemovedImageElement = backgroundImage;
        backgroundRemovedImageUrl = result.fileUrl;
        if (useOriginalColor) {
          console.log("[Upload] Toggle is ON, keeping original image");
        } else {
          console.log(
            "[Upload] Toggle is OFF, switching to background-removed image"
          );
          uploadedImageElement = backgroundRemovedImageElement;
          uploadedImageUrl = backgroundRemovedImageUrl;
          updatePreview();
        }
        if (shimmerOverlay) {
          shimmerOverlay.classList.add("hidden");
          console.log("[Upload] Hiding shimmer overlay");
        }
      };
      backgroundImage.onerror = function (error) {
        console.error("[Upload] Failed to load Firebase image:", error);
        console.error("[Upload] Image URL was:", result.fileUrl);
        if (shimmerOverlay) {
          shimmerOverlay.classList.add("hidden");
          console.log("[Upload] Hiding shimmer overlay on error");
        }
      };
      backgroundImage.src = result.fileUrl;
      if (result.backgroundRemoved) {
        showToast("Tải ảnh và xóa phông nền thành công!", "success");
        originalColorToggleContainer.classList.remove("hidden");
        console.log(
          "[Upload] Showing toggle - background removed successfully"
        );
      } else {
        showToast("Tải ảnh thành công!", "success");
      }
      setUploadButtonLoading(false);
    }
  } catch (error) {
    console.error("Error uploading image:", error);
    showToast("Lỗi khi tải ảnh. Vui lòng thử lại.", "error");
    const errorShimmerOverlay = document.getElementById("shimmerOverlay");
    if (errorShimmerOverlay) {
      errorShimmerOverlay.classList.add("hidden");
      console.log("[Upload] Hiding shimmer overlay on error");
    }
    setUploadButtonLoading(false);
    if (originalImageUrl) {
      window.messageData.image_config.uploaded_image.temp_url =
        originalImageUrl;
      window.messageData.image_config.source = "uploaded";
    }
    backgroundRemovedImageElement = null;
    backgroundRemovedImageUrl = null;
    if (originalImageElement) {
      uploadedImageElement = originalImageElement;
      uploadedImageUrl = originalImageUrl;
    }
  }
}
function resetImageUpload() {
  const imageUpload = document.getElementById("imageUpload");
  const uploadStatus = document.getElementById("uploadStatus");
  const scaleSliderContainer = document.getElementById("scaleSliderContainer");
  const originalColorToggleContainer = document.getElementById(
    "originalColorToggleContainer"
  );
  const imageScaleSlider = document.getElementById("imageScaleSlider");
  const useOriginalColorToggle = document.getElementById(
    "useOriginalColorToggle"
  );
  imageUpload.value = "";
  uploadStatus.textContent = "Chưa có ảnh nào được chọn";
  uploadStatus.classList.remove("text-green-600");
  scaleSliderContainer.classList.add("hidden");
  originalColorToggleContainer.classList.add("hidden");
  imageScale = 1;
  imageScaleSlider.value = 1;
  document.getElementById("scaleValue").textContent = "1.00";
  if (useOriginalColorToggle) {
    useOriginalColorToggle.checked = false;
  }
  useOriginalColor = false;
  originalImageElement = null;
  originalImageUrl = null;
  backgroundRemovedImageElement = null;
  backgroundRemovedImageUrl = null;
  uploadedImageElement = null;
  uploadedImageUrl = null;
  if (window.messageData) {
    window.messageData.image_config.uploaded_image = {};
    window.messageData.image_config.source = "uploaded";
  }
}
function setupPreviewUpdates() {
  document.getElementById("starMessage").addEventListener("input", function () {
    updatePreview();
  });
  addStarsToPreview();
}
function addStarsToPreview() {
  const previewCard = document.querySelector(".preview-card");
  if (!previewCard) {
    return void console.error("[Stars] Preview card not found");
  }
  console.log("[Stars] Preview card found:", previewCard);
  console.log("[Stars] Preview card dimensions:", {
    width: previewCard.offsetWidth,
    height: previewCard.offsetHeight,
    position: window.getComputedStyle(previewCard).position,
  });
  console.log("[Stars] Adding 60 static stars to preview card");
  for (let i = 0; i < 60; i++) {
    const star = document.createElement("div");
    star.className = "preview-star";
    const size = 1 + 2 * Math.random();
    star.style.width = size + "px";
    star.style.height = size + "px";
    const posX = 100 * Math.random();
    const posY = 100 * Math.random();
    star.style.left = posX + "%";
    star.style.top = posY + "%";
    const opacity = 0.3 + 0.7 * Math.random();
    star.style.opacity = opacity;
    if (opacity > 0.7) {
      star.style.boxShadow = "0 0 2px rgba(255, 255, 255, 0.8)";
    }
    if (i < 5) {
      console.log("[Stars] Star " + i + ":", {
        size: size.toFixed(2) + "px",
        posX: posX.toFixed(2) + "%",
        posY: posY.toFixed(2) + "%",
        opacity: opacity.toFixed(2),
        hasGlow: opacity > 0.7,
      });
    }
    previewCard.appendChild(star);
  }
  const allStars = previewCard.querySelectorAll(".preview-star");
  console.log(
    "[Stars] Successfully added stars. Total count:",
    allStars.length
  );
  if (allStars.length > 0) {
    const firstStar = allStars[0];
    const computedStyle = window.getComputedStyle(firstStar);
    console.log("[Stars] First star computed styles:", {
      position: computedStyle.position,
      left: computedStyle.left,
      top: computedStyle.top,
      width: computedStyle.width,
      height: computedStyle.height,
      opacity: computedStyle.opacity,
      background: computedStyle.background,
      backgroundColor: computedStyle.backgroundColor,
      borderRadius: computedStyle.borderRadius,
      zIndex: computedStyle.zIndex,
      display: computedStyle.display,
    });
  }
}
function updatePreview() {
  const previewCanvas = document.getElementById("previewStarImage");
  const previewMessage = document.getElementById("previewStarMessage");
  const starMessage = document.getElementById("starMessage").value.trim();
  console.log("[Preview] updatePreview called");
  console.log("[Preview] Canvas exists:", !!previewCanvas);
  console.log("[Preview] Frame image exists:", !!frameImage);
  console.log(
    "[Preview] Frame image complete:",
    frameImage ? frameImage.complete : "N/A"
  );
  console.log("[Preview] Uploaded image exists:", !!uploadedImageElement);
  console.log(
    "[Preview] Uploaded image complete:",
    uploadedImageElement ? uploadedImageElement.complete : "N/A"
  );
  console.log("[Preview] Current scale:", imageScale);
  if (!previewCanvas || !frameImage || !frameImage.complete) {
    return void console.warn(
      "[Preview] Skipping preview - canvas or frame not ready"
    );
  }
  const ctx = previewCanvas.getContext("2d", {
    alpha: true,
  });
  previewCanvas.width = 512;
  previewCanvas.height = 512;
  previewCanvas.style.width = "180px";
  previewCanvas.style.height = "180px";
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = "high";
  ctx.clearRect(0, 0, 512, 512);
  if (uploadedImageElement && uploadedImageElement.complete) {
    console.log("[Preview] Compositing uploaded image with frame");
    const tempCanvas = document.createElement("canvas");
    tempCanvas.width = frameImage.width;
    tempCanvas.height = frameImage.height;
    const tempCtx = tempCanvas.getContext("2d", {
      alpha: true,
    });
    tempCtx.clearRect(0, 0, tempCanvas.width, tempCanvas.height);
    const scaledWidth = frameImage.width * imageScale;
    const scaledHeight = frameImage.height * imageScale;
    const xOffset = (frameImage.width - scaledWidth) / 2;
    console.log(
      "[Preview] Step 1: Image dimensions - original:",
      uploadedImageElement.width,
      "x",
      uploadedImageElement.height
    );
    console.log(
      "[Preview] Step 1: Frame dimensions:",
      frameImage.width,
      "x",
      frameImage.height
    );
    console.log("[Preview] Step 1: Scale ratio:", imageScale);
    console.log(
      "[Preview] Step 1: Target dimensions:",
      scaledWidth,
      "x",
      scaledHeight
    );
    console.log("[Preview] Step 1: Image position:", xOffset, 0);
    const opacity = useOriginalColor ? 1 : 0.5;
    console.log(
      "[Preview] Step 2: Drawing uploaded image with opacity",
      opacity,
      "(useOriginalColor:",
      useOriginalColor + ")"
    );
    tempCtx.globalAlpha = opacity;
    tempCtx.drawImage(
      uploadedImageElement,
      xOffset,
      0,
      scaledWidth,
      scaledHeight
    );
    tempCtx.globalAlpha = 1;
    console.log(
      "[Preview] Step 3: Applying frame as alpha mask with destination-in"
    );
    tempCtx.globalCompositeOperation = "destination-in";
    tempCtx.drawImage(frameImage, 0, 0);
    console.log("[Preview] Step 4: Drawing frame behind masked image");
    tempCtx.globalCompositeOperation = "destination-over";
    tempCtx.drawImage(frameImage, 0, 0);
    tempCtx.globalCompositeOperation = "source-over";
    console.log(
      "[Preview] Scaling from",
      tempCanvas.width,
      "x",
      tempCanvas.height,
      "to",
      512,
      "x",
      512
    );
    ctx.drawImage(tempCanvas, 0, 0, 512, 512);
    console.log("[Preview] Composite complete");
  } else {
    console.log("[Preview] No uploaded image, drawing frame only");
    ctx.drawImage(frameImage, 0, 0, 512, 512);
  }
  previewMessage.textContent =
    starMessage || "Lời bày tỏ của bạn sẽ hiển thị ở đây";
}
function setUploadButtonLoading(isLoading) {
  const uploadButton = document.getElementById("uploadButton");
  const uploadButtonText = document.getElementById("uploadButtonText");
  const uploadButtonSpinner = document.getElementById("uploadButtonSpinner");
  if (isLoading) {
    uploadButton.disabled = true;
    uploadButtonText.classList.add("hidden");
    uploadButtonSpinner.classList.remove("hidden");
  } else {
    uploadButton.disabled = false;
    uploadButtonText.classList.remove("hidden");
    uploadButtonSpinner.classList.add("hidden");
  }
}
function setNextButtonLoading(isLoading) {
  const nextButton = document.getElementById("nextBtn");
  const nextButtonText = document.getElementById("nextBtnText");
  const nextButtonSpinner = document.getElementById("nextBtnSpinner");
  if (isLoading) {
    nextButton.disabled = true;
    nextButtonText.classList.add("hidden");
    nextButtonSpinner.classList.remove("hidden");
  } else {
    nextButton.disabled = false;
    nextButtonText.classList.remove("hidden");
    nextButtonSpinner.classList.add("hidden");
  }
}
async function uploadMergedImageAndCreateMessage() {
  console.log("[Upload] Starting merged image upload and message creation");
  console.log("[Upload] Using original color:", useOriginalColor);
  const previewCanvas = document.getElementById("previewStarImage");
  if (!previewCanvas) {
    throw new Error("Preview canvas not found");
  }
  const exportCanvas = document.createElement("canvas");
  exportCanvas.width = previewCanvas.width;
  exportCanvas.height = previewCanvas.height;
  const exportCtx = exportCanvas.getContext("2d", {
    alpha: true,
    willReadFrequently: false,
  });
  exportCtx.clearRect(0, 0, exportCanvas.width, exportCanvas.height);
  exportCtx.drawImage(previewCanvas, 0, 0);
  console.log("[Upload] Created transparent canvas:", {
    width: exportCanvas.width,
    height: exportCanvas.height,
    useOriginalColor: useOriginalColor,
  });
  const blob = await new Promise((resolve) => {
    exportCanvas.toBlob(resolve, "image/png", 1);
  });
  console.log("[Upload] Canvas converted to blob:", {
    size: (blob.size / 1024).toFixed(2) + " KB",
    type: blob.type,
  });
  const formData = new FormData();
  formData.append("image", blob, "merged-star-image.png");
  const uploadUrl = getCloudFunctionUrl("uploadImage");
  console.log("[Upload] Uploading to:", uploadUrl);
  const response = await fetch(uploadUrl, {
    method: "POST",
    body: formData,
  });
  if (!response.ok) {
    throw new Error("Failed to upload merged image");
  }
  const result = await response.json();
  console.log("[Upload] Upload successful:", result);
  if (!result.success) {
    throw new Error(result.error || "Upload failed");
  }
  window.messageData.image_config.uploaded_image.temp_url = result.fileUrl;
  window.messageData.image_config.uploaded_image.temp_path = result.filePath;
  window.messageData.image_config.uploaded_image.upload_timestamp =
    new Date().toISOString();
  window.messageData.image_config.uploaded_image.file_name =
    "merged-star-image.png";
  window.messageData.image_config.use_original_color = useOriginalColor;
  window.messageData.msg_state =
    WowMessenger.MessageData.MessageState.PENDING_PAYMENT;
  window.messageData.created_at = new Date().toISOString();
  window.messageData.updated_at = new Date().toISOString();
  console.log("[Message] Message data updated:", {
    msg_id: window.messageData.msg_id,
    msg_state: window.messageData.msg_state,
    msg_type: window.messageData.msg_type,
    created_at: window.messageData.created_at,
    sender_email: window.messageData.sender_email,
    sender_feeling: window.messageData.sender_feeling,
    msg_content: window.messageData.msg_content,
    answers: window.messageData.answers,
    temp_image_url: window.messageData.image_config.uploaded_image.temp_url,
    temp_image_path: window.messageData.image_config.uploaded_image.temp_path,
    use_original_color: window.messageData.image_config.use_original_color,
  });
  const createMessageUrl = getCloudFunctionUrl("createMessage");
  console.log("[Message] Creating message on backend:", createMessageUrl);
  console.log(
    "[Message] Full message data being sent:",
    JSON.stringify(window.messageData, null, 2)
  );
  const createResponse = await fetch(createMessageUrl, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(window.messageData),
  });
  if (!createResponse.ok) {
    const errorData = await createResponse.json();
    console.error("[Message] Create message failed:", errorData);
    throw new Error(errorData.error || "Failed to create message");
  }
  const createResult = await createResponse.json();
  console.log("[Message] Message created successfully:", createResult);
  console.log(
    "[Message] Response data:",
    JSON.stringify(createResult, null, 2)
  );
  showToast("Tạo tin nhắn thành công!", "success");
}
async function preparePaymentStep() {
  try {
    const qrCodeUrl =
      "https://img.vietqr.io/image/970423-29911236899-compact2.jpg?amount=19000&addInfo=" +
      window.messageData.msg_id +
      "&accountName=Tran Trung";
    document.getElementById("qrCodeImage").src = qrCodeUrl;
    document.getElementById("transferContent").textContent =
      window.messageData.msg_id;
    document.getElementById("senderEmailDisplay").textContent =
      window.messageData.sender_email;
    document
      .getElementById("downloadQrButton")
      .addEventListener("click", function () {
        const downloadLink = document.createElement("a");
        downloadLink.href = qrCodeUrl;
        downloadLink.download =
          "qr-payment-" + window.messageData.msg_id + ".jpg";
        downloadLink.click();
      });
    startPaymentStatusPolling(window.messageData.msg_id);
  } catch (error) {
    console.error("Error preparing payment step:", error);
    showToast("Lỗi khi chuẩn bị thanh toán. Vui lòng thử lại.", "error");
  }
}
function startPaymentStatusPolling(messageId) {
  if (paymentPollingInterval) {
    clearInterval(paymentPollingInterval);
  }
  console.log("Starting payment status polling for message:", messageId);
  paymentPollingInterval = setInterval(() => {
    checkPaymentStatus(messageId);
  }, 5000);
}
function stopPaymentStatusPolling() {
  if (paymentPollingInterval) {
    clearInterval(paymentPollingInterval);
    paymentPollingInterval = null;
    console.log("Payment status polling stopped");
  }
}
function checkPaymentStatus(messageId) {
  const checkUrl = getCloudFunctionUrl("checkPaymentStatus");
  fetch(checkUrl, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      msg_id: messageId,
    }),
  })
    .then((response) => response.json())
    .then((data) => {
      console.log("Payment status:", data);
      if ("success" === data.status && data.paid) {
        stopPaymentStatusPolling();
        handlePaymentSuccess();
      } else if (data.error) {
        showToast(data.error, "error");
      }
    })
    .catch((error) => {
      console.error("Error checking payment status:", error);
    });
}
function handlePaymentSuccess() {
  let messageData = window.messageData;
  messageData.msg_state = WowMessenger.MessageData.MessageState.PAID;
  messageData.created_at = new Date().toISOString();
  saveMessageToLocalStorage(messageData);
  showToast("Thanh toán thành công!", "success", 3000, () => {
    window.location.href = "../msg_history.html";
  });
}
function saveMessageToLocalStorage(messageData) {
  let messages = [];
  const storedMessages = localStorage.getItem("wowMessengerMessages");
  if (storedMessages) {
    try {
      messages = JSON.parse(storedMessages);
      if (!Array.isArray(messages)) {
        messages = [];
      }
    } catch (error) {
      console.error("Error parsing stored messages:", error);
      messages = [];
    }
  }
  messages.unshift(messageData);
  localStorage.setItem("wowMessengerMessages", JSON.stringify(messages));
  console.log("Message saved to localStorage:", messageData);
}
function showToast(
  message,
  type = "success",
  duration = 3000,
  callback = null
) {
  let bgColor = "bg-green-500";
  let icon =
    '<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">\n                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path>\n            </svg>';
  if ("error" === type) {
    bgColor = "bg-red-500";
    icon =
      '<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">\n                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>\n            </svg>';
  } else if ("info" === type) {
    bgColor = "bg-blue-500";
    icon =
      '<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">\n                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>\n            </svg>';
  }
  const toast = document.createElement("div");
  toast.className =
    "fixed top-4 right-4 " +
    bgColor +
    " text-white px-6 py-3 rounded-lg shadow-lg z-50 flex items-center space-x-2";
  toast.innerHTML = icon + "<span>" + message + "</span>";
  document.body.appendChild(toast);
  setTimeout(() => {
    if (document.body.contains(toast)) {
      document.body.removeChild(toast);
    }
    if (callback && "function" == typeof callback) {
      callback();
    }
  }, duration);
}
document.addEventListener("DOMContentLoaded", function () {
  console.log("[Debug] DOMContentLoaded event fired");

  try {
    console.log("[Debug] Calling initializeMessageData...");
    initializeMessageData();

    console.log("[Debug] Calling updateProgress...");
    updateProgress();

    console.log("[Debug] Calling updateNavigation...");
    updateNavigation();

    console.log("[Debug] Calling loadFrameImage...");
    loadFrameImage();

    console.log("[Debug] Setting up auto-resize textareas...");
    document.querySelectorAll(".auto-resize").forEach((textarea) => {
      textarea.style.height = "auto";
      textarea.style.height = textarea.scrollHeight + "px";
      if (!textarea.getAttribute("data-initialized")) {
        textarea.setAttribute("data-initialized", "true");
        textarea.addEventListener("input", function () {
          this.style.height = "auto";
          this.style.height = this.scrollHeight + "px";
        });
      }
    });

    console.log("[Debug] Creating CropModal...");
    cropModal = new CropModal({
      onCropComplete: function (croppedFile, cropData) {
        processAndUploadImage(croppedFile, cropData);
      },
      onCancel: function () {
        document.getElementById("imageUpload").value = "";
      },
    });

    console.log("[Debug] Setting up components...");
    setupImageUpload();
    setupPreviewUpdates();
    setupScaleSlider();
    setupOriginalColorToggle();
    setupNavigation();

    console.log("[Debug] All initialization complete!");
  } catch (error) {
    console.error("[Debug] Error during initialization:", error);
  }
});
window.addEventListener("beforeunload", function () {
  stopPaymentStatusPolling();
});
document.addEventListener("visibilitychange", function () {
  if (document.hidden && 3 === currentStep) {
    stopPaymentStatusPolling();
  } else {
    if (!document.hidden && 3 === currentStep) {
      const messageData = window.messageData;
      if (messageData && messageData.msg_id) {
        startPaymentStatusPolling(messageData.msg_id);
      }
    }
  }
});
