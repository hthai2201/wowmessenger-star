/**
 * Input Handler - Simplified handler for the input.html form
 * This file handles the form submission and star generation for the simple input form
 */

// Cloud Function URL generator
function getCloudFunctionUrl(functionName) {
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

// Global variables
let cropModal = null;
let uploadedImageFile = null;
let uploadedImageUrl = null;
let uploadedImageElement = null;
let frameImage = null;
let imageScale = 1;
let originalImageElement = null;
let originalImageUrl = null;
let backgroundRemovedImageElement = null;
let backgroundRemovedImageUrl = null;
let useOriginalColor = false;
let processedImageUrl = null; // Final processed image URL for main.js

// Toast notification function
function showToast(message, type = "success", duration = 3000) {
  const toast = document.createElement("div");
  toast.style.cssText = `
    position: fixed;
    top: 20px;
    right: 20px;
    background: ${type === "error" ? "#ef4444" : "#10b981"};
    color: white;
    padding: 12px 24px;
    border-radius: 8px;
    box-shadow: 0 4px 12px rgba(0,0,0,0.15);
    z-index: 10000;
    font-family: system-ui, -apple-system, sans-serif;
    font-size: 14px;
    max-width: 300px;
  `;
  toast.textContent = message;
  document.body.appendChild(toast);

  setTimeout(() => {
    if (document.body.contains(toast)) {
      document.body.removeChild(toast);
    }
  }, duration);
}

// File upload handling
function handleFileUpload() {
  const fileInput = document.getElementById("imageFile");
  const fileStatus = document.getElementById("fileStatus");

  fileInput.addEventListener("change", function (event) {
    const file = event.target.files[0];
    if (!file) return;

    // Validate file type
    if (!file.type.match("image.*")) {
      showToast("Vui lòng chọn file hình ảnh (JPG, PNG, GIF)", "error");
      fileInput.value = "";
      return;
    }

    // Validate file size (5MB max)
    if (file.size > 5242880) {
      showToast("File quá lớn. Kích thước tối đa là 5MB", "error");
      fileInput.value = "";
      return;
    }

    // Clear URL input when file is selected
    document.getElementById("imageUrl").value = "";

    // Show crop modal if available
    if (cropModal && typeof cropModal.show === "function") {
      // Update status to show crop modal is loading
      fileStatus.textContent = "Đang mở công cụ cắt ảnh...";
      fileStatus.style.color = "#3b82f6";

      try {
        cropModal.show(file);
      } catch (error) {
        console.error("[Crop Modal] Error showing crop modal:", error);
        showToast("Lỗi khi mở công cụ cắt ảnh", "error");
        handleFileDirectly(file);
      }
    } else {
      // Fallback: direct file handling without crop
      handleFileDirectly(file);
    }
  });
}

// Handle file directly without crop modal (fallback)
function handleFileDirectly(file) {
  const fileStatus = document.getElementById("fileStatus");

  uploadedImageFile = file;
  fileStatus.textContent = `Đã chọn: ${file.name} (${(file.size / 1024).toFixed(
    1
  )} KB)`;
  fileStatus.style.color = "#10b981";

  // Update preview using the standardized updatePreview function
  updatePreview();

  showToast("Ảnh đã được tải lên thành công!", "success");
}

// URL input handling (no validation - manual input only)
function handleUrlInput() {
  const urlInput = document.getElementById("imageUrl");
  const fileStatus = document.getElementById("fileStatus");

  urlInput.addEventListener("input", function () {
    const url = this.value.trim();

    if (url) {
      // Clear file input when URL is entered
      document.getElementById("imageFile").value = "";
      uploadedImageFile = null;

      // Update file status (no validation, just show URL is set)
      fileStatus.textContent = "URL ảnh đã được nhập";
      fileStatus.style.color = "#10b981";
    } else {
      // Reset when URL is cleared
      fileStatus.textContent = "Chưa có ảnh nào được chọn";
      fileStatus.style.color = "";
    }
  });
} // URL validation removed - manual input only, no validation needed

// Form submission handling
function handleFormSubmission() {
  const form = document.getElementById("starForm");

  form.addEventListener("submit", async function (event) {
    event.preventDefault();

    try {
      // Gather form data
      const formData = {
        question: document.getElementById("question").value.trim(),
        answers: {
          answer1: document.getElementById("answer1").value.trim(),
          answer2: document.getElementById("answer2").value.trim(),
          answer3: document.getElementById("answer3").value.trim(),
          answer4: document.getElementById("answer4").value.trim(),
        },
        message: document.getElementById("message").value.trim(),
        imageUrl: document.getElementById("imageUrl").value.trim(),
        imageFile: uploadedImageFile,
      };

      // Debug: Log form data for validation
      console.log("[Form] Validation check:", {
        hasImageFile: !!formData.imageFile,
        hasImageUrl: !!formData.imageUrl,
        imageFileName: formData.imageFile ? formData.imageFile.name : "none",
        imageUrl: formData.imageUrl || "none",
        uploadedImageFile: !!uploadedImageFile,
        processedImageUrl: !!processedImageUrl,
      });

      // Validate required fields
      if (!formData.question) {
        showToast("Vui lòng nhập câu hỏi", "error");
        return;
      }

      if (
        !formData.answers.answer1 ||
        !formData.answers.answer2 ||
        !formData.answers.answer3 ||
        !formData.answers.answer4
      ) {
        showToast("Vui lòng nhập đầy đủ 4 đáp án", "error");
        return;
      }

      if (!formData.message) {
        showToast("Vui lòng nhập tin nhắn", "error");
        return;
      }

      if (!formData.imageFile && !formData.imageUrl) {
        console.log("[Form] Image validation failed - no file or URL provided");
        showToast("Vui lòng chọn ảnh từ file hoặc nhập URL ảnh", "error");
        return;
      }

      // If using file upload without URL, we need at least the uploaded file
      // (Cloud processing is optional - we can use local file as fallback)
      if (formData.imageFile && !formData.imageUrl) {
        console.log(
          "[Form] File upload detected, cloud processing status:",
          !!processedImageUrl
        );
        // This is OK - we have a file, processing status doesn't matter for validation
      }

      // Create star message data
      const messageData = WowMessenger.StarData.createStarMessage({
        sender_email: "user@example.com",
        sender_feeling: formData.message,
        msg_content: formData.question,
        answers: formData.answers,
      });

      // Determine the correct imageUrl to pass to main.js
      let finalImageUrl = formData.imageUrl; // Use URL input if provided

      // If we have uploaded and processed an image, use the processed URL
      if (formData.imageFile && processedImageUrl) {
        finalImageUrl = processedImageUrl;
        console.log("[Form] Using processed image URL:", finalImageUrl);
      } else if (
        formData.imageFile &&
        window.messageData &&
        window.messageData.image_config.uploaded_image.temp_url
      ) {
        finalImageUrl = window.messageData.image_config.uploaded_image.temp_url;
        console.log("[Form] Using messageData image URL:", finalImageUrl);
      } else if (formData.imageFile && uploadedImageUrl) {
        // Fallback to the object URL if processing not complete
        finalImageUrl = uploadedImageUrl;
        console.log("[Form] Using uploaded image URL:", finalImageUrl);
      } else if (formData.imageFile) {
        // Last resort: create object URL from the file
        finalImageUrl = URL.createObjectURL(formData.imageFile);
        console.log("[Form] Using object URL from file:", finalImageUrl);
      }

      if (!finalImageUrl) {
        showToast("Không thể tạo URL cho ảnh. Vui lòng thử lại.", "error");
        return;
      }

      // Convert answers object to array format expected by main.js
      const answersArray = [
        formData.answers.answer1,
        formData.answers.answer2,
        formData.answers.answer3,
        formData.answers.answer4,
      ];

      // Generate the result URL with encoded data
      const encodedData = btoa(
        encodeURIComponent(
          JSON.stringify({
            question: formData.question,
            answers: answersArray,
            message: formData.message,
            imageUrl: finalImageUrl,
            messageId: messageData.msg_id,
          })
        )
      );

      const generatedUrl = `${window.location.origin}/index.html?data=${encodedData}`;

      // Show result
      document.getElementById("generatedLink").value = generatedUrl;
      document.getElementById("resultSection").classList.add("show");
      document
        .getElementById("resultSection")
        .scrollIntoView({ behavior: "smooth" });

      showToast("Tạo link ngôi sao thành công!", "success");
    } catch (error) {
      console.error("Error creating star:", error);
      showToast("Có lỗi xảy ra khi tạo ngôi sao. Vui lòng thử lại.", "error");
    }
  });
}

// Copy to clipboard handling
function handleCopyButton() {
  const copyBtn = document.getElementById("copyBtn");

  copyBtn.addEventListener("click", function () {
    const linkTextarea = document.getElementById("generatedLink");
    linkTextarea.select();
    linkTextarea.setSelectionRange(0, 99999);

    navigator.clipboard
      .writeText(linkTextarea.value)
      .then(function () {
        const originalText = copyBtn.innerHTML;
        copyBtn.innerHTML = "✅ Đã sao chép!";
        copyBtn.classList.add("copied");

        setTimeout(function () {
          copyBtn.innerHTML = originalText;
          copyBtn.classList.remove("copied");
        }, 2000);

        showToast("Link đã được sao chép!", "success");
      })
      .catch(function (err) {
        document.execCommand("copy");
        showToast("Link đã được sao chép!", "success");
      });
  });
}

// Auto-resize textareas
function setupAutoResize() {
  document.querySelectorAll("textarea").forEach((textarea) => {
    textarea.addEventListener("input", function () {
      this.style.height = "auto";
      this.style.height = this.scrollHeight + "px";
    });

    // Initial resize
    textarea.style.height = "auto";
    textarea.style.height = textarea.scrollHeight + "px";
  });
}

// Interactive focus effects
function setupFocusEffects() {
  document
    .querySelectorAll("input:not(#generatedLink), textarea:not(#generatedLink)")
    .forEach((input) => {
      input.addEventListener("focus", function () {
        this.parentElement.style.transform = "scale(1.02)";
        this.parentElement.style.transition = "transform 0.3s ease";
      });

      input.addEventListener("blur", function () {
        this.parentElement.style.transform = "scale(1)";
      });
    });
}

// Initialize crop modal - using the same approach as star_handler.js
function initializeCropModal() {
  if (typeof CropModal !== "undefined") {
    console.log("[Input Handler] Creating CropModal...");
    cropModal = new CropModal({
      onCropComplete: function (croppedFile, cropData) {
        console.log("[Crop Modal] Crop completed:", croppedFile);

        // Use the processAndUploadImage approach from star_handler.js
        processAndUploadImage(croppedFile, cropData);
      },
      onCancel: function () {
        console.log("[Crop Modal] Crop cancelled");

        // Reset file input
        document.getElementById("imageFile").value = "";

        // Reset file status
        const fileStatus = document.getElementById("fileStatus");
        fileStatus.textContent = "Chưa có ảnh nào được chọn";
        fileStatus.style.color = "";

        // Hide image preview
        const imagePreview = document.getElementById("imagePreview");
        imagePreview.style.display = "none";
        imagePreview.src = "";

        uploadedImageFile = null;
        showToast("Đã hủy cắt ảnh", "info");
      },
    });
    console.log("[Crop Modal] Initialized successfully");
  } else {
    console.warn(
      "[Crop Modal] CropModal class not found - using fallback mode"
    );
  }
}

// Process and upload image - adapted from star_handler.js processAndUploadImage
async function processAndUploadImage(croppedFile, cropData) {
  const fileSizeKB = (croppedFile.size / 1024).toFixed(2);
  const fileSizeMB = (croppedFile.size / 1048576).toFixed(2);
  console.log(
    "[Upload] Cropped file size: " + fileSizeKB + " KB (" + fileSizeMB + " MB)"
  );

  // Store the cropped file so form validation recognizes it
  uploadedImageFile = croppedFile;
  console.log("[Upload] Stored cropped file for form validation");

  // Update UI to show crop success
  const fileStatus = document.getElementById("fileStatus");
  if (fileStatus) {
    fileStatus.textContent = `Đã cắt ảnh: ${croppedFile.name} (${fileSizeKB} KB) - Đang xử lý...`;
    fileStatus.style.color = "#3b82f6"; // Blue color for processing
  }

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

    // Only show slider if it exists (might not exist in input.html)
    if (scaleSliderContainer) {
      scaleSliderContainer.classList.remove("hidden");
    }
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

    // Update status if element exists
    if (uploadStatus) {
      uploadStatus.textContent = "Đang tải ảnh lên và xóa phông nền...";
      uploadStatus.classList.remove("text-green-600");
    }
    const formData = new FormData();
    formData.append("image", croppedFile);
    const uploadUrl = getCloudFunctionUrl("uploadImageAndRemoveBackground");
    console.log("[Upload] Uploading to:", uploadUrl);

    // Add timeout for the fetch request
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 30000); // 30 second timeout

    try {
      const response = await fetch(uploadUrl, {
        method: "POST",
        body: formData,
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      console.log("[Upload] Response status:", response.status);
      console.log("[Upload] Response ok:", response.ok);

      if (!response.ok) {
        const errorText = await response.text();
        console.error("[Upload] Server error response:", errorText);
        throw new Error(
          `Upload failed: ${response.status} ${response.statusText}`
        );
      }

      const result = await response.json();
      console.log("[Upload] Upload result:", result);

      if (!result.success) {
        console.error("[Upload] Cloud function returned error:", result.error);
        throw new Error(result.error || "Upload failed");
      }

      // Process successful result
      console.log("[Upload] Processing successful result:", result);

      // Update status if element exists
      if (uploadStatus) {
        uploadStatus.textContent = "Tải ảnh thành công!";
        uploadStatus.classList.add("text-green-600");
      }

      // Initialize messageData if it doesn't exist
      if (!window.messageData) {
        window.messageData = WowMessenger.StarData.createStarMessage({});
      }

      window.messageData.image_config.uploaded_image.temp_url = result.fileUrl;
      window.messageData.image_config.uploaded_image.temp_path =
        result.filePath;
      window.messageData.image_config.source = "uploaded";

      // Store processed image URL immediately for form validation
      processedImageUrl = result.fileUrl;
      console.log(
        "[Upload] Processed image URL stored immediately:",
        processedImageUrl
      );

      // Update file status immediately after upload success
      const fileStatus = document.getElementById("fileStatus");
      if (fileStatus) {
        fileStatus.textContent = `🎉 Upload thành công! Đang tải ảnh xử lý...`;
        fileStatus.style.color = "#3b82f6"; // Blue color for loading processed image
      }

      console.log(
        "[Upload] Loading processed image from Firebase URL:",
        result.fileUrl
      );

      // Use fetch to handle CORS issues with cloud-processed images
      const loadProcessedImage = async () => {
        try {
          console.log("[Upload] Fetching processed image via fetch...");
          const response = await fetch(result.fileUrl, {
            mode: "cors",
            credentials: "omit",
          });

          if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
          }

          const blob = await response.blob();
          const imageUrl = URL.createObjectURL(blob);

          const backgroundImage = new Image();
          backgroundImage.onload = function () {
            console.log(
              "[Upload] Firebase image loaded successfully:",
              backgroundImage.width,
              "x",
              backgroundImage.height
            );
            backgroundRemovedImageElement = backgroundImage;
            backgroundRemovedImageUrl = result.fileUrl;
            // Store the processed image URL for main.js
            processedImageUrl = result.fileUrl;
            console.log(
              "[Upload] Processed image URL stored:",
              processedImageUrl
            );

            // Update file status to show successful processing
            const fileStatus = document.getElementById("fileStatus");
            if (fileStatus) {
              fileStatus.textContent = `✅ Ảnh đã xử lý thành công: ${uploadedImageFile.name}`;
              fileStatus.style.color = "#10b981"; // Green color for success
            }

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

            // Clean up the object URL
            URL.revokeObjectURL(imageUrl);

            // Show success message
            showToast("Ảnh đã được cắt và xử lý thành công!", "success");
          };

          backgroundImage.onerror = function (error) {
            console.error("[Upload] Failed to load processed image:", error);
            URL.revokeObjectURL(imageUrl);
            handleImageLoadError();
          };

          backgroundImage.src = imageUrl;
        } catch (fetchError) {
          console.error(
            "[Upload] Fetch error for processed image:",
            fetchError
          );
          handleImageLoadError();
        }
      };

      const handleImageLoadError = () => {
        // Still show success since upload worked, just image preview failed
        if (fileStatus) {
          fileStatus.textContent = `✅ Ảnh đã upload thành công: ${uploadedImageFile.name} (preview error)`;
          fileStatus.style.color = "#10b981";
        }

        if (shimmerOverlay) {
          shimmerOverlay.classList.add("hidden");
          console.log("[Upload] Hiding shimmer overlay on error");
        }

        showToast("Upload thành công! (Có lỗi nhỏ khi tải preview)", "success");
      };

      // Add timeout for image loading
      let imageLoadTimeout = setTimeout(() => {
        console.warn("[Upload] Image loading timed out after 10 seconds");
        // Update status to show completion anyway
        if (fileStatus) {
          fileStatus.textContent = `✅ Ảnh đã xử lý thành công: ${uploadedImageFile.name} (timeout)`;
          fileStatus.style.color = "#10b981";
        }
        showToast("Ảnh đã được xử lý thành công!", "success");
      }, 10000);

      // Load the processed image
      loadProcessedImage().finally(() => {
        clearTimeout(imageLoadTimeout);
      });
    } catch (fetchError) {
      clearTimeout(timeoutId);
      if (fetchError.name === "AbortError") {
        console.error("[Upload] Request timed out after 30 seconds");
        throw new Error("Upload timed out - server may be busy");
      }
      console.error("[Upload] Fetch error:", fetchError);
      throw fetchError;
    }
  } catch (error) {
    console.error("[Upload] Error uploading image:", error);

    // Update file status to show error
    const fileStatus = document.getElementById("fileStatus");
    if (fileStatus) {
      fileStatus.textContent = `❌ Lỗi xử lý ảnh: ${error.message}`;
      fileStatus.style.color = "#ef4444"; // Red color for error
    }

    if (shimmerOverlay) {
      shimmerOverlay.classList.add("hidden");
      console.log("[Upload] Hiding shimmer overlay on error");
    }

    showToast("Lỗi khi xử lý ảnh: " + error.message, "error");
  }
  setUploadButtonLoading(false);
}

function updatePreview() {
  const previewCanvas = document.getElementById("previewStarImage");
  const previewMessage = document.getElementById("previewStarMessage");
  const starMessageElement = document.getElementById("starMessage");
  const starMessage = starMessageElement ? starMessageElement.value.trim() : "";
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

  // Match star_handler.js logic exactly - return early if not ready
  if (!previewCanvas || !frameImage || !frameImage.complete) {
    return void console.warn(
      "[Preview] Skipping preview - canvas or frame not ready"
    );
  }

  // Use the same rendering approach as star_handler.js
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

  // Determine which image to use based on useOriginalColor toggle
  let currentImageElement = uploadedImageElement;
  if (originalImageElement && backgroundRemovedImageElement) {
    currentImageElement = useOriginalColor
      ? originalImageElement
      : backgroundRemovedImageElement;
    console.log(
      "[Preview] Using",
      useOriginalColor ? "original" : "background-removed",
      "image"
    );
  }

  if (currentImageElement && currentImageElement.complete) {
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
      currentImageElement.width,
      "x",
      currentImageElement.height
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
      currentImageElement,
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

  if (previewMessage) {
    previewMessage.textContent =
      starMessage || "Lời bày tỏ của bạn sẽ hiển thị ở đây";
  }
}

// Simple image preview fallback

// Simple image preview fallback
function renderSimpleImagePreview() {
  console.log("[Preview] Using simple image preview fallback");
  const imagePreview = document.getElementById("imagePreview");
  if (!imagePreview) {
    console.warn("[Preview] imagePreview element not found");
    return;
  }

  if (uploadedImageElement && uploadedImageElement.complete) {
    // Check if this is a cloud URL that might have CORS issues
    const imageSrc = uploadedImageElement.src;
    if (
      imageSrc.includes("cloudfunctions.net") ||
      imageSrc.includes("googleapis.com")
    ) {
      console.log(
        "[Preview] Cloud URL detected, using fetch for CORS handling"
      );
      // Use fetch to handle potential CORS issues
      fetch(imageSrc, { mode: "cors", credentials: "omit" })
        .then((response) => response.blob())
        .then((blob) => {
          const objectUrl = URL.createObjectURL(blob);
          imagePreview.src = objectUrl;
          imagePreview.style.display = "block";
          console.log("[Preview] Showing processed image via fetch");
          // Clean up after a delay to allow the image to load
          setTimeout(() => URL.revokeObjectURL(objectUrl), 5000);
        })
        .catch((error) => {
          console.error("[Preview] Failed to fetch cloud image:", error);
          // Fallback to direct assignment
          imagePreview.src = imageSrc;
          imagePreview.style.display = "block";
          console.log("[Preview] Showing processed image (direct fallback)");
        });
    } else {
      // Local or blob URL, safe to use directly
      imagePreview.src = imageSrc;
      imagePreview.style.display = "block";
      console.log("[Preview] Showing processed image (local/blob URL)");
    }
  } else if (uploadedImageFile) {
    // Use the original file
    const reader = new FileReader();
    reader.onload = function (e) {
      imagePreview.src = e.target.result;
      imagePreview.style.display = "block";
      console.log("[Preview] Showing original file");
    };
    reader.readAsDataURL(uploadedImageFile);
  } else {
    // No image
    imagePreview.style.display = "none";
    console.log("[Preview] No image to show");
  }
}

function setUploadButtonLoading(isLoading) {
  const uploadButton = document.getElementById("uploadButton");
  const uploadButtonText = document.getElementById("uploadButtonText");
  const uploadButtonSpinner = document.getElementById("uploadButtonSpinner");

  // Only proceed if the elements exist (they might not exist in input.html)
  if (uploadButton) {
    uploadButton.disabled = isLoading;
  }

  if (uploadButtonText) {
    if (isLoading) {
      uploadButtonText.classList.add("hidden");
    } else {
      uploadButtonText.classList.remove("hidden");
    }
  }

  if (uploadButtonSpinner) {
    if (isLoading) {
      uploadButtonSpinner.classList.remove("hidden");
    } else {
      uploadButtonSpinner.classList.add("hidden");
    }
  }
}

// Enhanced preview rendering with canvas processing (from star_handler.js approach)
function renderPreviewWithCanvas(imageElement) {
  console.log("[Preview] Starting canvas rendering...");

  // Create high-quality canvas for image processing
  const canvas = document.createElement("canvas");
  const ctx = canvas.getContext("2d", {
    alpha: true,
    willReadFrequently: false,
  });

  // Calculate dimensions maintaining aspect ratio (enhanced from star_handler.js)
  const maxSize = 400; // Increased from 300 for better quality
  let { width, height } = imageElement;
  const originalAspectRatio = width / height;

  console.log(
    "[Preview] Original dimensions:",
    width,
    "x",
    height,
    "(ratio:",
    originalAspectRatio.toFixed(2) + ")"
  );

  if (width > height) {
    if (width > maxSize) {
      width = maxSize;
      height = width / originalAspectRatio;
    }
  } else {
    if (height > maxSize) {
      height = maxSize;
      width = height * originalAspectRatio;
    }
  }

  canvas.width = width;
  canvas.height = height;

  console.log("[Preview] Canvas dimensions:", width, "x", height);

  // Enhanced drawing with quality settings (from star_handler.js)
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = "high";

  // Clear canvas with transparent background
  ctx.clearRect(0, 0, width, height);

  // Draw image with anti-aliasing
  ctx.drawImage(imageElement, 0, 0, width, height);

  // Convert to high-quality data URL
  const dataUrl = canvas.toDataURL("image/png", 1.0); // Use PNG for better quality

  // Update preview image
  const imagePreview = document.getElementById("imagePreview");
  imagePreview.src = dataUrl;
  imagePreview.style.display = "block";

  // Add some styling for better presentation
  imagePreview.style.maxWidth = "100%";
  imagePreview.style.height = "auto";
  imagePreview.style.borderRadius = "8px";
  imagePreview.style.boxShadow = "0 4px 8px rgba(0,0,0,0.1)";

  console.log("[Preview] Canvas rendering completed successfully");
  console.log(
    "[Preview] Final preview size:",
    imagePreview.width,
    "x",
    imagePreview.height
  );
}

// Load frame image for moon shape
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
    // Update any existing preview
    if (uploadedImageElement) {
      updatePreview();
    }
  };
  frameImage.onerror = function (error) {
    console.error("[Frame] Error loading frame image:", error);
  };
  frameImage.src = "assets/images/moon_color_texture.jpg";
}

// Initialize when DOM is loaded
document.addEventListener("DOMContentLoaded", function () {
  console.log("[Input Handler] Initializing...");

  try {
    // Load frame image for preview
    loadFrameImage();

    // Wait a bit for other scripts to load, then initialize crop modal
    setTimeout(() => {
      initializeCropModal();
    }, 100);

    handleFileUpload();
    handleUrlInput();
    handleFormSubmission();
    handleCopyButton();
    setupAutoResize();
    setupFocusEffects();

    console.log("[Input Handler] All handlers initialized successfully");
    showToast("Trang đã sẵn sàng!", "success", 2000);
  } catch (error) {
    console.error("[Input Handler] Error during initialization:", error);
    showToast("Có lỗi khi khởi tạo trang", "error");
  }
});
