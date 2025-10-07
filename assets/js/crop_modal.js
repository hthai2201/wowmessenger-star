/**
 * CropModal - Interactive Image Cropping Modal Component
 * Provides a modal interface for cropping images with drag and resize functionality
 */
class CropModal {
  constructor(options = {}) {
    this.onCropComplete = options.onCropComplete || function () {};
    this.onCancel = options.onCancel || function () {};
    this.modal = null;
    this.cropContainer = null;
    this.cropImage = null;
    this.cropOverlay = null;
    this.cropBox = null;
    this.imageFile = null;
    this.imageUrl = null;
    this.isDragging = false;
    this.isResizing = false;
    this.dragStartX = 0;
    this.dragStartY = 0;
    this.cropBoxStartX = 0;
    this.cropBoxStartY = 0;
    this.cropBoxStartSize = 0;
    this.resizeHandle = null;
    this.init();
  }
  init() {
    if (document.getElementById("cropModalComponent")) {
      this.modal = document.getElementById("cropModalComponent");
      return void this.setupElements();
    }
    this.createModal();
    this.setupElements();
    this.attachEventListeners();
  }
  createModal() {
    if (!document.getElementById("cropModalStyles")) {
      document.head.insertAdjacentHTML(
        "beforeend",
        "\n            <style id=\"cropModalStyles\">\n                .crop-modal-component {\n                    position: fixed;\n                    top: 0;\n                    left: 0;\n                    right: 0;\n                    bottom: 0;\n                    z-index: 9999;\n                    display: flex;\n                    align-items: center;\n                    justify-content: center;\n                }\n                \n                .crop-modal-backdrop {\n                    position: absolute;\n                    top: 0;\n                    left: 0;\n                    right: 0;\n                    bottom: 0;\n                    background-color: rgba(0, 0, 0, 0.8);\n                }\n                \n                .crop-modal-dialog {\n                    position: relative;\n                    background-color: #fff;\n                    border-radius: 8px;\n                    width: 90%;\n                    max-width: 600px;\n                    max-height: 90vh;\n                    display: flex;\n                    flex-direction: column;\n                    box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);\n                }\n                \n                .crop-modal-header {\n                    display: flex;\n                    justify-content: space-between;\n                    align-items: center;\n                    padding: 16px 20px;\n                    border-bottom: 1px solid #e5e7eb;\n                }\n                \n                .crop-modal-title {\n                    font-size: 18px;\n                    font-weight: 600;\n                    color: #1f2937;\n                    margin: 0;\n                }\n                \n                .crop-modal-close {\n                    background: none;\n                    border: none;\n                    font-size: 28px;\n                    color: #6b7280;\n                    cursor: pointer;\n                    padding: 0;\n                    width: 32px;\n                    height: 32px;\n                    display: flex;\n                    align-items: center;\n                    justify-content: center;\n                    line-height: 1;\n                }\n                \n                .crop-modal-close:hover {\n                    color: #374151;\n                }\n                \n                .crop-modal-body {\n                    padding: 20px;\n                    overflow: auto;\n                    flex: 1;\n                }\n                \n                .crop-image-container {\n                    position: relative;\n                    width: 100%;\n                    height: 480px;\n                    background-color: #1f2937;\n                    border-radius: 4px;\n                    overflow: hidden;\n                    display: flex;\n                    align-items: center;\n                    justify-content: center;\n                }\n                \n                .crop-modal-image {\n                    max-width: 100%;\n                    max-height: 100%;\n                    display: block;\n                    user-select: none;\n                    -webkit-user-select: none;\n                }\n                \n                .crop-overlay {\n                    position: absolute;\n                    top: 0;\n                    left: 0;\n                    right: 0;\n                    bottom: 0;\n                    cursor: move;\n                }\n                \n                .crop-box {\n                    position: absolute;\n                    border: 1px solid #fff;\n                    box-shadow: 0 0 0 9999px rgba(0, 0, 0, 0.5);\n                    cursor: move;\n                }\n                \n                .crop-box::before,\n                .crop-box::after {\n                    content: '';\n                    position: absolute;\n                    background: rgba(255, 255, 255, 0.5);\n                    pointer-events: none;\n                }\n                \n                /* Vertical gridlines */\n                .crop-box::before {\n                    left: 33.33%;\n                    top: 0;\n                    bottom: 0;\n                    width: 1px;\n                }\n                \n                .crop-box::after {\n                    left: 66.66%;\n                    top: 0;\n                    bottom: 0;\n                    width: 1px;\n                }\n                \n                /* Horizontal gridlines - using separate divs approach */\n                .crop-box .crop-horizontal-line-1,\n                .crop-box .crop-horizontal-line-2 {\n                    position: absolute;\n                    left: 0;\n                    right: 0;\n                    height: 1px;\n                    background: rgba(255, 255, 255, 0.5);\n                    pointer-events: none;\n                }\n                \n                .crop-box .crop-horizontal-line-1 {\n                    top: 33.33%;\n                }\n                \n                .crop-box .crop-horizontal-line-2 {\n                    top: 66.66%;\n                }\n                \n                .crop-resize-handle {\n                    position: absolute;\n                    width: 20px;\n                    height: 20px;\n                    background-color: #fff;\n                    border: 2px solid #3b82f6;\n                    border-radius: 50%;\n                    cursor: nwse-resize;\n                    right: -10px;\n                    bottom: -10px;\n                    z-index: 10;\n                }\n                \n                .crop-modal-footer {\n                    display: flex;\n                    justify-content: flex-end;\n                    gap: 12px;\n                    padding: 16px 20px;\n                    border-top: 1px solid #e5e7eb;\n                }\n                \n                .crop-btn {\n                    padding: 8px 16px;\n                    border-radius: 6px;\n                    font-weight: 500;\n                    font-size: 14px;\n                    cursor: pointer;\n                    transition: all 0.2s;\n                    border: none;\n                }\n                \n                .crop-btn-cancel {\n                    background-color: #f3f4f6;\n                    color: #374151;\n                }\n                \n                .crop-btn-cancel:hover {\n                    background-color: #e5e7eb;\n                }\n                \n                .crop-btn-apply {\n                    background-color: #3b82f6;\n                    color: white;\n                }\n                \n                .crop-btn-apply:hover {\n                    background-color: #2563eb;\n                }\n                \n                @media (max-width: 640px) {\n                    .crop-image-container {\n                        height: 360px;\n                    }\n                }\n            </style>\n        "
      );
    }
    document.body.insertAdjacentHTML(
      "beforeend",
      '\n            <div id="cropModalComponent" class="crop-modal-component" style="display: none;">\n                <div class="crop-modal-backdrop"></div>\n                <div class="crop-modal-dialog">\n                    <div class="crop-modal-header">\n                        <h3 class="crop-modal-title">Cắt ảnh</h3>\n                        <button class="crop-modal-close" id="cropModalClose">&times;</button>\n                    </div>\n                    <div class="crop-modal-body">\n                        <div class="crop-image-container" id="cropImageContainer">\n                            <img id="cropModalImage" class="crop-modal-image" src="" alt="Crop">\n                            <div class="crop-overlay" id="cropOverlay">\n                                <div class="crop-box" id="cropBox">\n                                    <div class="crop-horizontal-line-1"></div>\n                                    <div class="crop-horizontal-line-2"></div>\n                                    <div class="crop-resize-handle" id="cropResizeHandle"></div>\n                                </div>\n                            </div>\n                        </div>\n                    </div>\n                    <div class="crop-modal-footer">\n                        <button class="crop-btn crop-btn-cancel" id="cropModalCancelBtn">Hủy</button>\n                        <button class="crop-btn crop-btn-apply" id="cropModalApplyBtn">Áp dụng</button>\n                    </div>\n                </div>\n            </div>\n        '
    );
  }
  setupElements() {
    this.modal = document.getElementById("cropModalComponent");
    this.cropContainer = document.getElementById("cropImageContainer");
    this.cropImage = document.getElementById("cropModalImage");
    this.cropOverlay = document.getElementById("cropOverlay");
    this.cropBox = document.getElementById("cropBox");
    this.resizeHandle = document.getElementById("cropResizeHandle");
  }
  attachEventListeners() {
    document
      .getElementById("cropModalClose")
      .addEventListener("click", () => this.hide());
    document
      .getElementById("cropModalCancelBtn")
      .addEventListener("click", () => {
        this.hide();
        this.onCancel();
      });
    document
      .getElementById("cropModalApplyBtn")
      .addEventListener("click", () => {
        this.applyCrop();
      });
    this.modal
      .querySelector(".crop-modal-backdrop")
      .addEventListener("click", () => this.hide());
    this.cropBox.addEventListener("mousedown", (event) => {
      if (event.target !== this.resizeHandle) {
        this.startDrag(event);
      }
    });
    document.addEventListener("mousemove", (event) => this.onDrag(event));
    document.addEventListener("mouseup", () => this.endDrag());
    this.cropBox.addEventListener("touchstart", (event) => {
      if (event.target !== this.resizeHandle) {
        this.startDrag(event);
      }
    });
    document.addEventListener("touchmove", (event) => this.onDrag(event));
    document.addEventListener("touchend", () => this.endDrag());
    this.resizeHandle.addEventListener("mousedown", (event) =>
      this.startResize(event)
    );
    this.resizeHandle.addEventListener("touchstart", (event) =>
      this.startResize(event)
    );
    this.cropImage.addEventListener("load", () => {
      this.initializeCropBox();
    });
  }
  show(imageFile) {
    this.imageFile = imageFile;
    if (this.imageUrl) {
      URL.revokeObjectURL(this.imageUrl);
    }
    this.imageUrl = URL.createObjectURL(imageFile);
    this.cropImage.src = this.imageUrl;
    this.modal.style.display = "flex";
  }
  hide() {
    this.modal.style.display = "none";
    if (this.imageUrl) {
      URL.revokeObjectURL(this.imageUrl);
      this.imageUrl = null;
    }
    this.imageFile = null;
    this.cropImage.src = "";
  }
  initializeCropBox() {
    const cropImage = this.cropImage;
    const cropContainer = this.cropContainer;
    const imageRect = cropImage.getBoundingClientRect();
    const containerRect = cropContainer.getBoundingClientRect();
    const aspectRatio = imageRect.width / imageRect.height;
    let cropSize;
    cropSize =
      aspectRatio < 0.95
        ? (2 * imageRect.width) / 3
        : aspectRatio >= 0.95 && aspectRatio <= 1.05
        ? imageRect.width
        : (1 * imageRect.width) / 2;
    cropSize = Math.min(cropSize, imageRect.height);
    const cropLeft = (containerRect.width - cropSize) / 2;
    const cropTop = (containerRect.height - cropSize) / 2;
    this.cropBox.style.width = cropSize + "px";
    this.cropBox.style.height = cropSize + "px";
    this.cropBox.style.left = cropLeft + "px";
    this.cropBox.style.top = cropTop + "px";
  }
  startDrag(event) {
    event.preventDefault();
    const clientX = event.type.includes("touch")
      ? event.touches[0].clientX
      : event.clientX;
    const clientY = event.type.includes("touch")
      ? event.touches[0].clientY
      : event.clientY;
    this.isDragging = true;
    this.dragStartX = clientX;
    this.dragStartY = clientY;
    const cropRect = this.cropBox.getBoundingClientRect();
    this.cropBoxStartX = cropRect.left;
    this.cropBoxStartY = cropRect.top;
  }
  onDrag(event) {
    if (this.isDragging) {
      event.preventDefault();
      const currentX = event.type.includes("touch")
        ? event.touches[0].clientX
        : event.clientX;
      const currentY = event.type.includes("touch")
        ? event.touches[0].clientY
        : event.clientY;
      const deltaX = currentX - this.dragStartX;
      const deltaY = currentY - this.dragStartY;
      const containerRect = this.cropContainer.getBoundingClientRect();
      const cropRect = this.cropBox.getBoundingClientRect();
      let newLeft = this.cropBoxStartX + deltaX - containerRect.left;
      let newTop = this.cropBoxStartY + deltaY - containerRect.top;
      newLeft = Math.max(
        0,
        Math.min(containerRect.width - cropRect.width, newLeft)
      );
      newTop = Math.max(
        0,
        Math.min(containerRect.height - cropRect.height, newTop)
      );
      this.cropBox.style.left = newLeft + "px";
      this.cropBox.style.top = newTop + "px";
    }
    if (this.isResizing) {
      event.preventDefault();
      this.onResize(event);
    }
  }
  endDrag() {
    this.isDragging = false;
    this.isResizing = false;
  }
  startResize(event) {
    event.preventDefault();
    event.stopPropagation();
    const clientX = event.type.includes("touch")
      ? event.touches[0].clientX
      : event.clientX;
    const clientY = event.type.includes("touch")
      ? event.touches[0].clientY
      : event.clientY;
    this.isResizing = true;
    this.dragStartX = clientX;
    this.dragStartY = clientY;
    const cropRect = this.cropBox.getBoundingClientRect();
    this.cropBoxStartX = cropRect.left;
    this.cropBoxStartY = cropRect.top;
    this.cropBoxStartSize = cropRect.width;
  }
  onResize(event) {
    if (!this.isResizing) {
      return;
    }
    const currentX = event.type.includes("touch")
      ? event.touches[0].clientX
      : event.clientX;
    const currentY = event.type.includes("touch")
      ? event.touches[0].clientY
      : event.clientY;
    const deltaX = currentX - this.dragStartX;
    const deltaY = currentY - this.dragStartY;
    const resizeDelta = Math.max(deltaX, deltaY);
    let newSize = this.cropBoxStartSize + resizeDelta;
    const containerRect = this.cropContainer.getBoundingClientRect();
    this.cropImage.getBoundingClientRect();
    const cropLeft = parseFloat(this.cropBox.style.left);
    const cropTop = parseFloat(this.cropBox.style.top);
    newSize = Math.max(50, newSize);
    const maxWidthFromLeft = containerRect.width - cropLeft;
    const maxHeightFromTop = containerRect.height - cropTop;
    const maxSize = Math.min(maxWidthFromLeft, maxHeightFromTop);
    newSize = Math.min(newSize, maxSize);
    this.cropBox.style.width = newSize + "px";
    this.cropBox.style.height = newSize + "px";
  }
  applyCrop() {
    const canvas = document.createElement("canvas");
    const context = canvas.getContext("2d");
    const cropImage = this.cropImage;
    const imageRect = cropImage.getBoundingClientRect();
    this.cropContainer.getBoundingClientRect();
    const cropRect = this.cropBox.getBoundingClientRect();
    const scaleX = cropImage.naturalWidth / imageRect.width;
    const scaleY = cropImage.naturalHeight / imageRect.height;
    const cropX = (cropRect.left - imageRect.left) * scaleX;
    const cropY = (cropRect.top - imageRect.top) * scaleY;
    const cropWidth = cropRect.width * scaleX;
    const cropHeight = cropRect.height * scaleY;
    canvas.width = cropWidth;
    canvas.height = cropHeight;
    context.drawImage(
      cropImage,
      cropX,
      cropY,
      cropWidth,
      cropHeight,
      0,
      0,
      cropWidth,
      cropHeight
    );
    canvas.toBlob(
      (blob) => {
        const croppedFile = new File([blob], this.imageFile.name, {
          type: this.imageFile.type,
          lastModified: Date.now(),
        });
        this.hide();
        this.onCropComplete(croppedFile, canvas);
      },
      this.imageFile.type,
      0.95
    );
  }
}
window.CropModal = CropModal;
