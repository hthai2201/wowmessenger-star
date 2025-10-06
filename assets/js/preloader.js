// Anti-debugging and console protection (obfuscated code removed for clarity)
class PreLoader {
  constructor() {
    this.resources = [];
    this.loadedCount = 0;
    this.totalResources = 0;
    this.preloaderElement = null;
    this.progressBarElement = null;
    this.onComplete = null;
    this.isCompleted = false;
    window.PreloaderCache = window.PreloaderCache || {};
    window.PreloaderCache.textures = window.PreloaderCache.textures || {};
    window.PreloaderCache.base64Images =
      window.PreloaderCache.base64Images || {};
  }
  addResource(type, name, url) {
    return (
      this.resources.push({
        type: type,
        name: name,
        url: url,
        loaded: false,
      }),
      this.totalResources++,
      this
    );
  }
  addFont(fontName, fontUrl, options = null) {
    return (
      this.addResource("font", fontName, fontUrl),
      this.addCustomResource(
        fontName + "_loading",
        () =>
          new Promise((resolve, reject) => {
            if ("undefined" != typeof FontFaceObserver) {
              new FontFaceObserver(fontName, options)
                .load(null, 5000)
                .then(() => {
                  console.log("Font " + fontName + " loaded successfully");
                  resolve(fontName);
                })
                .catch((error) => {
                  console.warn(
                    "Font " + fontName + " could not be loaded:",
                    error
                  );
                  resolve(null);
                });
            } else {
              console.warn(
                "FontFaceObserver not available, skipping font loading check"
              );
              resolve(null);
            }
          })
      )
    );
  }
  preloadFonts(fonts) {
    return (
      this._ensureFontFaceObserver(),
      fonts.forEach((font) => {
        const preloadLink = document.createElement("link");
        preloadLink.rel = "preload";
        preloadLink.href = font.url;
        preloadLink.as = "style";
        document.head.appendChild(preloadLink);
        const styleLink = document.createElement("link");
        styleLink.rel = "stylesheet";
        styleLink.href = font.url;
        document.head.appendChild(styleLink);
        const fontStyle = document.createElement("style");
        fontStyle.textContent =
          "\n                @font-face {\n                    font-family: '" +
          font.name +
          "';\n                    font-style: normal;\n                    font-weight: 400;\n                    font-display: swap;\n                    src: url(https://fonts.gstatic.com/s/comfortaa/v40/1Pt_g8LJRfWJmhDAuUsSQamb1W0lwk4S4WjMDrMfJh1Zyc61YA.woff) format('woff');\n                    unicode-range: U+0102-0103, U+0110-0111, U+0128-0129, U+0168-0169, U+01A0-01A1, U+01AF-01B0, U+0300-0301, U+0303-0304, U+0308-0309, U+0323, U+0329, U+1EA0-1EF9, U+20AB;\n                }\n            ";
        document.head.appendChild(fontStyle);
        const testDiv = document.createElement("div");
        testDiv.className = "font-preloader";
        testDiv.style.position = "absolute";
        testDiv.style.visibility = "hidden";
        testDiv.style.fontFamily = "'" + font.name + "', sans-serif";
        testDiv.style.left = "-9999px";
        testDiv.style.fontSize = "20px";
        testDiv.style.lineHeight = "0";
        testDiv.innerHTML =
          "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789 áàảãạăắằẳẵặâấầẩẫậéèẻẽẹêếềểễệíìỉĩịóòỏõọôốồổỗộơớờởỡợúùủũụưứừửữựýỳỷỹỵđ ÁÀẢÃẠĂẮẰẲẴẶÂẤẦẨẪẬÉÈẺẼẸÊẾỀỂỄỆÍÌỈĨỊÓÒỎÕỌÔỐỒỔỖỘƠỚỜỞỠỢÚÙỦŨỤƯỨỪỬỮỰÝỲỶỸỴĐ";
        document.body.appendChild(testDiv);
        const options = font.options || {};
        options.testString || (options.testString = "nhiều đến thế");
        this.addFont(font.name, font.url, options);
      }),
      this
    );
  }
  _ensureFontFaceObserver() {
    if ("undefined" != typeof FontFaceObserver) {
      return;
    }
    console.log("Loading FontFaceObserver dynamically");
    const script = document.createElement("script");
    script.src =
      "https://cdnjs.cloudflare.com/ajax/libs/fontfaceobserver/2.3.0/fontfaceobserver.js";
    script.async = false;
    document.head.appendChild(script);
    script.readyState
      ? (script.onreadystatechange = function () {
          ("loaded" !== script.readyState &&
            "complete" !== script.readyState) ||
            ((script.onreadystatechange = null),
            console.log("FontFaceObserver loaded successfully"));
        })
      : (script.onload = function () {
          console.log("FontFaceObserver loaded successfully");
        });
  }
  addCustomResource(name, loader) {
    return this.addResource("custom", name, loader);
  }
  preloadThreeJS(options = {}) {
    const threeJsUrl =
        options.threeJsUrl ||
        "https://unpkg.com/three@0.158.0/build/three.module.js",
      addons = options.addons || [];
    return (
      this.addCustomResource(
        "threejs",
        () =>
          new Promise((resolve, reject) => {
            console.log("Preloading Three.js module...");
            import(threeJsUrl)
              .then((module) => {
                console.log("Three.js module loaded successfully");
                window["_preloadedTHREE"] = module;
                resolve(module);
              })
              .catch((error) => {
                console.error("Failed to load Three.js module:", error);
                reject(error);
              });
          })
      ),
      addons.forEach((addon) => {
        const addonUrl =
          "https://unpkg.com/three@0.158.0/examples/jsm/" + addon + ".js";
        this.addCustomResource(
          "threejs_" + addon,
          () =>
            new Promise((resolve, reject) => {
              console.log("Preloading Three.js addon: " + addon + "...");
              import(addonUrl)
                .then((module) => {
                  console.log("Three.js addon loaded successfully: " + addon);
                  resolve(module);
                })
                .catch((error) => {
                  console.error(
                    "Failed to load Three.js addon " + addon + ":",
                    error
                  );
                  reject(error);
                });
            })
        );
      }),
      this
    );
  }
  addTexture(name, url) {
    return this.addCustomResource(
      name,
      () =>
        new Promise((resolve, reject) => {
          const image = new Image();
          image.crossOrigin = "Anonymous";
          image.onload = () => {
            console.log("Texture " + name + " loaded successfully");
            window.PreloaderCache.textures[name] = image;
            resolve(image);
          };
          image.onerror = (error) => {
            console.error("Error loading texture " + name + ":", error);
            reject(error);
          };
          image.src = url;
        })
    );
  }
  addBase64Image(name, imageName, jsonPath = "../../assets/imagebase64.json") {
    return this.addCustomResource(name, () =>
      fetch(jsonPath)
        .then((response) => response.json())
        .then((data) => {
          if (data[imageName]) {
            return new Promise((resolve, reject) => {
              const image = new Image();
              image.onload = () => {
                window.PreloaderCache.base64Images[imageName] = data[imageName];
                window.PreloaderCache.textures[name] = image;
                console.log("Base64 image " + name + " loaded successfully");
                resolve(image);
              };
              image.onerror = (error) => {
                console.error(
                  "Error loading base64 image " + name + ":",
                  error
                );
                reject(error);
              };
              image.src = data[imageName];
            });
          }
          throw new Error(imageName + " not found in " + jsonPath);
        })
    );
  }
  addImageFromUrl(name, url) {
    return this.addCustomResource(
      name,
      () =>
        new Promise((resolve, reject) => {
          const image = new Image();
          image.crossOrigin = "anonymous";
          image.onload = () => {
            try {
              const canvas = document.createElement("canvas");
              canvas.width = image.width;
              canvas.height = image.height;
              canvas.getContext("2d").drawImage(image, 0, 0);
              const base64Data = canvas.toDataURL("image/png");
              window.PreloaderCache.textures[name] = image;
              window.PreloaderCache.base64Images[name] = base64Data;
              console.log(
                "Image from URL " +
                  name +
                  " loaded and converted to base64 successfully"
              );
              resolve(image);
            } catch (error) {
              console.error(
                "Error converting image to base64 for " + name + ":",
                error
              );
              window.PreloaderCache.textures[name] = image;
              window.PreloaderCache.base64Images[name] = url;
              console.warn("Stored URL directly for " + name);
              resolve(image);
            }
          };
          image.onerror = (error) => {
            console.error("Error loading image from URL " + name + ":", error);
            console.warn("Continuing without image: " + name);
            resolve(null);
          };
          image.src = url;
        })
    );
  }
  onAllResourcesLoaded(callback) {
    return (this.onComplete = callback), this;
  }
  _createUI() {
    if (
      ((this.preloaderElement = document.getElementById("preloader")),
      this.preloaderElement)
    ) {
      return (
        (this.progressBarElement = document.getElementById("progress-bar")),
        void console.log("Using existing preloader UI from HTML")
      );
    }
    console.log("Creating new preloader UI dynamically");
    this.preloaderElement = document.createElement("div");
    this.preloaderElement.className = "preloader";
    this.preloaderElement.style.cssText =
      "\n            position: fixed;\n            top: 0;\n            left: 0;\n            width: 100%;\n            height: 100%;\n            background-color: white;\n            display: flex;\n            flex-direction: column;\n            justify-content: center;\n            align-items: center;\n            z-index: 9999;\n            opacity: 1;\n            transition: opacity 2s ease;\n        ";
    const progressContainer = document.createElement("div");
    progressContainer.className = "progress-container";
    progressContainer.style.cssText =
      "\n            width: 100px;\n            margin-bottom: 8px;\n        ";
    const progressBackground = document.createElement("div");
    progressBackground.style.cssText =
      "\n            background-color: #e5e7eb;\n            height: 6px;\n            border-radius: 9999px;\n            overflow: hidden;\n        ";
    this.progressBarElement = document.createElement("div");
    this.progressBarElement.style.cssText =
      "\n            background: linear-gradient(to right, #4F200D, #3a1809);\n            height: 100%;\n            width: 0%;\n            border-radius: 9999px;\n            transition: width 0.3s ease;\n        ";
    progressBackground.appendChild(this.progressBarElement);
    progressContainer.appendChild(progressBackground);
    this.preloaderElement.appendChild(progressContainer);
    document.body.appendChild(this.preloaderElement);
  }
  _updateProgress() {
    const progress = Math.min(
      Math.round((this.loadedCount / this.totalResources) * 100),
      100
    );
    this.progressBarElement.style.width = progress + "%";
    this.loadedCount !== this.totalResources ||
      this.isCompleted ||
      ((this.isCompleted = true),
      "function" == typeof this.onComplete && this.onComplete());
  }
  dismiss(delay = 500, fadeOutDuration = 1000) {
    return new Promise((resolve) => {
      this.preloaderElement && this.preloaderElement.parentNode
        ? ((this.preloaderElement.style.transition =
            "opacity " + fadeOutDuration + "ms ease-out"),
          setTimeout(() => {
            this.preloaderElement.style.opacity = "0";
            setTimeout(() => {
              this.preloaderElement &&
                this.preloaderElement.parentNode &&
                this.preloaderElement.parentNode.removeChild(
                  this.preloaderElement
                );
              resolve();
            }, fadeOutDuration);
          }, delay))
        : resolve();
    });
  }
  _fadeOutAndRemove() {
    this.dismiss(1000, 2000);
  }
  _loadFont(resource) {
    const link = document.createElement("link");
    link.href = resource.url;
    link.rel = "stylesheet";
    link.onload = () => {
      if (
        (console.log("Font CSS loaded: " + resource.name),
        "undefined" != typeof FontFaceObserver)
      ) {
        console.log(
          "Using FontFaceObserver to ensure " +
            resource.name +
            " is fully loaded"
        );
        const testString = "nhiều đến thế ABCabc123",
          fontWeights = [300, 400, 500, 600, 700],
          testElements = fontWeights.map((weight) => {
            const testDiv = document.createElement("div");
            return (
              (testDiv.style.position = "absolute"),
              (testDiv.style.visibility = "hidden"),
              (testDiv.style.fontFamily =
                "'" + resource.name + "', sans-serif"),
              (testDiv.style.fontWeight = weight),
              (testDiv.style.fontSize = "20px"),
              (testDiv.style.left = "-9999px"),
              (testDiv.innerHTML = testString),
              document.body.appendChild(testDiv),
              testDiv
            );
          }),
          observers = fontWeights.map((weight) =>
            new FontFaceObserver(resource.name, { weight: weight }).load(
              testString,
              10000
            )
          );
        Promise.all(observers)
          .then(() => {
            console.log(
              "Font " +
                resource.name +
                " fully loaded with all weights (300-700)"
            );
            testElements.forEach((element) =>
              document.body.removeChild(element)
            );
            resource.loaded = true;
            this.loadedCount++;
            this._updateProgress();
          })
          .catch((error) => {
            console.warn(
              "Some font weights for " +
                resource.name +
                " could not be loaded:",
              error
            );
            testElements.forEach((element) =>
              document.body.removeChild(element)
            );
            resource.loaded = true;
            this.loadedCount++;
            this._updateProgress();
          });
      } else {
        console.log(
          "FontFaceObserver not available, using fallback for " + resource.name
        );
        const fallbackElements = [300, 400, 500, 600, 700].map((weight) => {
          const testDiv = document.createElement("div");
          return (
            (testDiv.style.fontFamily = "'" + resource.name + "', sans-serif"),
            (testDiv.style.fontWeight = weight),
            (testDiv.style.position = "absolute"),
            (testDiv.style.visibility = "hidden"),
            (testDiv.style.fontSize = "20px"),
            (testDiv.innerHTML = "nhiều đến thế"),
            document.body.appendChild(testDiv),
            testDiv
          );
        });
        setTimeout(() => {
          fallbackElements.forEach((element) =>
            document.body.removeChild(element)
          );
          resource.loaded = true;
          this.loadedCount++;
          this._updateProgress();
        }, 1500);
      }
    };
    link.onerror = () => {
      console.warn("Failed to load font CSS: " + resource.name);
      resource.loaded = true;
      this.loadedCount++;
      this._updateProgress();
    };
    document.head.appendChild(link);
  }
  _loadImage(resource) {
    const image = new Image();
    resource.url &&
      resource.url.includes("://") &&
      (image.crossOrigin = "Anonymous");
    image.onload = () => {
      resource.loaded = true;
      resource.element = image;
      this.loadedCount++;
      this._updateProgress();
    };
    image.onerror = () => {
      console.warn("Failed to load image: " + resource.name);
      resource.loaded = true;
      this.loadedCount++;
      this._updateProgress();
    };
    image.src = resource.url;
  }
  _loadCustom(resource) {
    if ("function" == typeof resource.url) {
      console.log("Loading custom resource: " + resource.name);
      const result = resource.url();
      result && "function" == typeof result.then
        ? result
            .then((data) => {
              console.log("Custom resource loaded: " + resource.name);
              resource.element = data;
              resource.loaded = true;
              this.loadedCount++;
              this._updateProgress();
            })
            .catch((error) => {
              console.error(
                "Error loading custom resource " + resource.name + ":",
                error
              );
              resource.loaded = true;
              this.loadedCount++;
              this._updateProgress();
            })
        : (console.error(
            "Custom loader for " + resource.name + " did not return a Promise"
          ),
          (resource.loaded = true),
          this.loadedCount++,
          this._updateProgress());
    } else {
      console.log("Custom resource registered (legacy): " + resource.name);
    }
  }
  start() {
    this._createUI();
    setTimeout(() => {
      if (0 === this.totalResources) {
        return (this.loadedCount = 0), void this._updateProgress();
      }
      this.resources.forEach((resource) => {
        switch (resource.type) {
          case "font":
            this._loadFont(resource);
            break;
          case "image":
            this._loadImage(resource);
            break;
          case "custom":
            this._loadCustom(resource);
            break;
          default:
            console.warn("Unknown resource type: " + resource.type),
              (resource.loaded = true),
              this.loadedCount++,
              this._updateProgress();
        }
      });
    }, 500);
  }
  getResource(name) {
    const resource = this.resources.find((res) => res.name === name);
    return resource && resource.loaded ? resource : null;
  }
  getTexture(name) {
    return window.PreloaderCache.textures[name] || null;
  }
  getBase64Image(name) {
    return window.PreloaderCache.base64Images[name] || null;
  }
}
