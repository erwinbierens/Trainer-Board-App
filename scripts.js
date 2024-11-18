const canvas = document.getElementById("trainingCanvas");
const ctx = canvas.getContext("2d");

let drawnObjects = []; // Objecten op het canvas
let selectedObjects = []; // Meerdere geselecteerde objecten
let currentTool = null; // Actieve tool
let isDragging = false; // Status voor slepen
let dragStart = null; // Startpositie voor slepen
let staticBackground = null; // Achtergrondafbeelding
let selectMode = false; // Selectiemodus (handje)
let isSelecting = false; // Status voor meervoudige selectie
let selectionStart = null; // Startpositie voor meervoudige selectie
let selectionBox = null; // Houdt de selectie-vak positie bij
let initialPositions = []; // Houdt de originele posities bij van geselecteerde objecten
let isDrawingLine = false; // Status voor het tekenen van een lijn
let lineStart = null; // Startpositie voor de lijn
let isDashedLine = false; // Status voor het tekenen van een stippellijn
let isDrawingCurve = false;
let curvePoints = []; // Array om punten voor de gebogen lijn op te slaan

let history = []; // Geschiedenis van acties voor undo-functionaliteit

const defaultBackground = 'img/grass.svg'; // Pad naar de default background SVG

const toolbar = document.querySelector(".toolbar");
toolbar.style.overflowY = "auto";
toolbar.style.maxHeight = "95vh";
// **Cache voor SVG-afbeeldingen**
const svgCache = new Map();


// **Canvas Initialiseren**
function resizeCanvas() {
  canvas.width = canvas.parentElement.clientWidth;
  canvas.height = canvas.parentElement.clientHeight;
  redrawCanvas();
}
window.addEventListener("resize", resizeCanvas);
resizeCanvas();

// **Actie Geschiedenis Opslaan**
function saveHistory() {
  history.push([...drawnObjects]);
  if (history.length > 20) {
    history.shift();
  }
}

// **Undo Functionaliteit**
function undo() {
  if (history.length > 0) {
    drawnObjects = history.pop();
    redrawCanvas();
  }
}

function saveAsPNG() {
  const link = document.createElement("a");
  // Maak een tijdelijk canvas om een PNG-afbeelding te maken
  const tempCanvas = document.createElement("canvas");
  const tempCtx = tempCanvas.getContext("2d");

  // Stel de afmetingen in op dezelfde afmetingen als het originele canvas
  tempCanvas.width = canvas.width;
  tempCanvas.height = canvas.height;

  // Teken de huidige canvas-inhoud op het tijdelijke canvas
  if (staticBackground) {
    tempCtx.drawImage(staticBackground, 0, 0, canvas.width, canvas.height);
  }

  drawnObjects.forEach((obj) => {
    if (obj.type === "svg") {
      let sizeFactor = (obj.sizePercentage / 100);
      obj.scaledWidth = obj.width * sizeFactor * (canvas.width / Math.min(canvas.width, canvas.height));
      obj.scaledHeight = obj.height * sizeFactor * (canvas.height / Math.min(canvas.width, canvas.height));
      tempCtx.drawImage(obj.svg, obj.x - obj.scaledWidth / 2, obj.y - obj.scaledHeight / 2, obj.scaledWidth, obj.scaledHeight);
    } else if (obj.type === "line" || obj.type === "curve") {
      tempCtx.strokeStyle = obj.type === "line" ? "black" : "red";
      tempCtx.lineWidth = 2;
      if (obj.isDashed) {
        tempCtx.setLineDash([5, 5]);
      } else {
        tempCtx.setLineDash([]);
      }
      tempCtx.beginPath();
      if (obj.type === "line") {
        tempCtx.moveTo(obj.startX, obj.startY);
        tempCtx.lineTo(obj.endX, obj.endY);
      } else if (obj.type === "curve") {
        tempCtx.moveTo(obj.points[0].x, obj.points[0].y);
        for (let i = 1; i < obj.points.length; i++) {
          tempCtx.lineTo(obj.points[i].x, obj.points[i].y);
        }
      }
      tempCtx.stroke();
      tempCtx.setLineDash([]);
    }
  });

  // Maak een PNG-URL van het tijdelijke canvas
  link.href = tempCanvas.toDataURL("image/png");
  link.download = "training.png";
  link.click();
}

function saveAsPDF() {
  const { jsPDF } = window.jspdf;
  const pdf = new jsPDF({ orientation: 'landscape' });
  const tempCanvas = document.createElement("canvas");
  const tempCtx = tempCanvas.getContext("2d");

  // Set the dimensions of the temporary canvas to match the original canvas
  tempCanvas.width = canvas.width;
  tempCanvas.height = canvas.height;

  // Draw the current canvas content onto the temporary canvas
  if (staticBackground) {
    tempCtx.drawImage(staticBackground, 0, 0, canvas.width, canvas.height);
  }

  drawnObjects.forEach((obj) => {
    if (obj.type === "svg") {
      let sizeFactor = (obj.sizePercentage / 100);
      obj.scaledWidth = obj.width * sizeFactor * (canvas.width / Math.min(canvas.width, canvas.height));
      obj.scaledHeight = obj.height * sizeFactor * (canvas.height / Math.min(canvas.width, canvas.height));
      tempCtx.drawImage(obj.svg, obj.x - obj.scaledWidth / 2, obj.y - obj.scaledHeight / 2, obj.scaledWidth, obj.scaledHeight);
    } else if (obj.type === "line" || obj.type === "curve") {
      tempCtx.strokeStyle = obj.type === "line" ? "black" : "red";
      tempCtx.lineWidth = 2;
      if (obj.isDashed) {
        tempCtx.setLineDash([5, 5]);
      } else {
        tempCtx.setLineDash([]);
      }
      tempCtx.beginPath();
      if (obj.type === "line") {
        tempCtx.moveTo(obj.startX, obj.startY);
        tempCtx.lineTo(obj.endX, obj.endY);
      } else if (obj.type === "curve") {
        tempCtx.moveTo(obj.points[0].x, obj.points[0].y);
        for (let i = 1; i < obj.points.length; i++) {
          tempCtx.lineTo(obj.points[i].x, obj.points[i].y);
        }
      }
      tempCtx.stroke();
      tempCtx.setLineDash([]);
    }
  });

  // Convert the temporary canvas to an image and add it to the PDF
  const imgData = tempCanvas.toDataURL("image/png");
  pdf.addImage(imgData, "PNG", 0, 0, pdf.internal.pageSize.getWidth(), pdf.internal.pageSize.getHeight());

  // Save the PDF
  pdf.save("training.pdf");
}

function newCanvas() {
  generateBackgroundSelector(); // Generate the available backgrounds
  const popup = document.getElementById("backgroundPopup");
  if (popup) {
    popup.style.display = "block"; // Show the popup
  } else {
    console.error("Popup element 'backgroundPopup' not found");
  }
}

function closeBackgroundPopup() {
  const popup = document.getElementById("backgroundPopup");
  if (popup) {
    popup.style.display = "none"; // Hide the popup
  }
}

function generateBackgroundSelector() {
  const popup = document.getElementById("backgroundPopup");
  const selector = document.getElementById("backgroundSelector");

  if (!selector) {
    console.error("Element 'backgroundSelector' niet gevonden");
    return;
  }

  selector.innerHTML = ""; // Verwijder oude opties

  availableBackgrounds.forEach((bg) => {
    const option = document.createElement("option");
    option.value = bg.id;
    option.textContent = bg.label;
    selector.appendChild(option);
  });

  popup.style.display = "block"; // Toon de popup voor achtergrondselectie
}

function setBackground() {
  const selector = document.getElementById("backgroundSelector");
  const selectedValue = selector ? selector.value : null;
  console.log("Geselecteerde waarde:", selectedValue);

  const selectedBackground = availableBackgrounds.find((bg) => bg.id === selectedValue);
  if (selectedBackground) {
    console.log("Geselecteerde achtergrond:", selectedBackground);
    loadBackground(selectedBackground.svgPath);
  } else {
    console.error("Geen geldige achtergrond geselecteerd.");
  }

  const popup = document.getElementById("backgroundPopup");
  if (popup) {
    popup.style.display = "none";
  }
}

function loadBackground(file) {
  console.log("Laadt achtergrond:", file);
  fetch(file)
    .then((response) => response.text())
    .then((svgText) => {
      const img = new Image();
      const svgBlob = new Blob([svgText], { type: "image/svg+xml" });
      const url = URL.createObjectURL(svgBlob);

      img.onload = () => {
        staticBackground = img;
        drawnObjects = []; // Wis bestaande objecten
        selectedObjects = []; // Wis selectie
        redrawCanvas(); // Herteken canvas
        console.log("Achtergrond geladen en canvas bijgewerkt.");
        URL.revokeObjectURL(url);
      };

      img.src = url;
    })
    .catch((error) => console.error("Fout bij het laden van de achtergrond:", error));
}

// **SVG Laden en Cachen**
function loadSvgToCache(svgPath, callback) {
  if (svgCache.has(svgPath)) {
    callback(svgCache.get(svgPath));
    return;
  }

  fetch(svgPath)
    .then((response) => response.text())
    .then((svgText) => {
      const img = new Image();
      const svgBlob = new Blob([svgText], { type: "image/svg+xml" });
      const url = URL.createObjectURL(svgBlob);

      img.onload = () => {
        svgCache.set(svgPath, { img, width: img.width, height: img.height });
        callback(svgCache.get(svgPath));
        URL.revokeObjectURL(url);
      };

      img.src = url;
    })
    .catch((error) => console.error("Fout bij het laden van SVG:", error));
}

// **Dynamisch Tools Genereren**
function generateToolbar() {
  const toolbar = document.querySelector(".toolbar");
  toolbar.innerHTML = "<h3>Tools</h3>";

  // Voeg een knop toe voor de selectietool (handje)
  const selectButton = document.createElement("button");
  selectButton.classList.add("toolbar-button");
  selectButton.innerHTML = `
  <img src="img/icons/select.svg" alt="Select" title="Selecttool" width="24" height="24">
`;
  selectButton.title = "Selecteer en verplaats objecten";
  selectButton.onclick = () => {
    currentTool = null;
    selectMode = true;
    selectedObjects = [];
    redrawCanvas();
    updateToolDetails();
  };
  toolbar.appendChild(selectButton);

  // Voeg een knop toe voor de undo-functionaliteit
  const undoButton = document.createElement("button");
  undoButton.classList.add("toolbar-button");
  undoButton.innerHTML = `
  <img src="img/icons/undo.svg" alt="Undo" title="Actie ongedaan maken" width="24" height="24">
`;
  undoButton.title = "Actie ongedaan maken";
  undoButton.onclick = undo;
  toolbar.appendChild(undoButton);

  // Voeg een knop toe voor de lijntool
  const lineButton = document.createElement("button");
  lineButton.classList.add("toolbar-button");
  lineButton.innerHTML = `
  <img src="img/icons/line.svg" alt="Line" title="Line tool" width="24" height="24">
`;
  lineButton.title = "Teken een lijn met pijl";
  lineButton.onclick = () => {
    currentTool = { id: "line" };
    selectMode = false;
    selectedObjects = [];
    redrawCanvas();
    updateToolDetails();
  };
  toolbar.appendChild(lineButton);

  // Voeg een knop toe voor de gebogen lijn tool
  const curveButton = document.createElement("button");
  curveButton.classList.add("toolbar-button");
  curveButton.innerHTML = `
  <img src="img/icons/line-curved.svg" alt="Curve" title="Curve tool" width="24" height="24">
`;
  curveButton.title = "Teken een gebogen lijn";
  curveButton.onclick = () => {
    currentTool = { id: "curve" };
    selectMode = false;
    selectedObjects = [];
    redrawCanvas();
    updateToolDetails();
  };
  toolbar.appendChild(curveButton);

  availableObjects.forEach((obj) => {
    const button = document.createElement("button");
    button.classList.add("toolbar-button");

    loadSvgToCache(obj.svgPath, ({ img }) => {
      button.innerHTML = "";
      button.appendChild(img.cloneNode());
    });

    button.title = obj.label;
    button.onclick = () => {
      currentTool = availableObjects.find((o) => o.id === obj.id);
      selectMode = false;
      selectedObjects = [];
      redrawCanvas();
      updateToolDetails();
    };
    toolbar.appendChild(button);
  });
}

// **Object Plaatsen**
canvas.addEventListener("click", (e) => {
  if (selectMode || !currentTool) return;

  const rect = canvas.getBoundingClientRect();
  const x = e.clientX - rect.left;
  const y = e.clientY - rect.top;

  loadSvgToCache(currentTool.svgPath, ({ img, width, height }) => {
    let sizeFactor;

    // Controleer of de grootte als percentage is gedefinieerd
    if (typeof currentTool.sizePercentage === "number") {
      sizeFactor = (currentTool.sizePercentage / 100);
    } else {
      console.error("sizePercentage is niet gedefinieerd voor het object.");
      return;
    }

    const scaledWidth = width * sizeFactor * (canvas.width / Math.min(canvas.width, canvas.height));
    const scaledHeight = height * sizeFactor * (canvas.height / Math.min(canvas.width, canvas.height));

    saveHistory(); // Sla de huidige staat op voordat er een nieuw object wordt toegevoegd

    drawnObjects.push({
      id: `${currentTool.id}_${Date.now()}`,
      type: "svg",
      x,
      y,
      width,
      height,
      sizePercentage: currentTool.sizePercentage,
      scaledWidth,
      scaledHeight,
      svg: img,
      color: "#000000",
    });
    redrawCanvas();
  });
});

function isLineInSelectionBox(line, selectionStart, selectionBox) {
  const { startX, startY, endX, endY } = line;

  // Bereken de grenzen van het selectiegebied
  const minX = Math.min(selectionStart.x, selectionStart.x + selectionBox.width);
  const maxX = Math.max(selectionStart.x, selectionStart.x + selectionBox.width);
  const minY = Math.min(selectionStart.y, selectionStart.y + selectionBox.height);
  const maxY = Math.max(selectionStart.y, selectionStart.y + selectionBox.height);

  // Controleer of beide uiteinden van de lijn binnen het selectiegebied vallen
  return (
    (startX >= minX && startX <= maxX && startY >= minY && startY <= maxY) &&
    (endX >= minX && endX <= maxX && endY >= minY && endY <= maxY)
  );
}


// Functie voor het hertekenen van het canvas
function redrawCanvas() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  if (staticBackground) {
      ctx.drawImage(staticBackground, 0, 0, canvas.width, canvas.height);
  }

  drawnObjects.forEach((obj) => {
      if (obj.type === "line") {
          ctx.strokeStyle = obj.color || "black";
          ctx.lineWidth = obj.lineWidth || 2;
          ctx.setLineDash(obj.isDashed ? [5, 5] : []);
          ctx.beginPath();
          ctx.moveTo(obj.startX, obj.startY);
          ctx.lineTo(obj.endX, obj.endY);
          ctx.stroke();
          ctx.setLineDash([]);
          drawArrow(ctx, obj.startX, obj.startY, obj.endX, obj.endY);
      } else if (obj.type === "curve") {
          if (obj.points.length > 1) {
              ctx.strokeStyle = obj.color || "black";
              ctx.lineWidth = obj.lineWidth || 2;
              ctx.setLineDash(obj.isDashed ? [5, 5] : []);
              ctx.beginPath();
              ctx.moveTo(obj.points[0].x, obj.points[0].y);
              
              // Gebruik `bezierCurveTo` voor een vloeiende curve
              for (let i = 1; i < obj.points.length - 2; i++) {
                  const cp = obj.points[i];
                  const next = obj.points[i + 1];
                  const ep = {
                      x: (cp.x + next.x) / 2,
                      y: (cp.y + next.y) / 2
                  };
                  ctx.quadraticCurveTo(cp.x, cp.y, ep.x, ep.y);
              }
              // Behandel de laatste twee punten om de curve af te maken
              const secondLast = obj.points[obj.points.length - 2];
              const last = obj.points[obj.points.length - 1];
              ctx.quadraticCurveTo(secondLast.x, secondLast.y, last.x, last.y);
              
              ctx.stroke();
              ctx.setLineDash([]);
              // Teken een pijl aan het einde van de curve
              const lastPoint = obj.points[obj.points.length - 1];
              const prevPoint = obj.points[obj.points.length - 2];
              drawArrow(ctx, prevPoint.x, prevPoint.y, lastPoint.x, lastPoint.y);
          }
      } else if (obj.type === "svg") {
          ctx.drawImage(obj.svg, obj.x - obj.scaledWidth / 2, obj.y - obj.scaledHeight / 2, obj.scaledWidth, obj.scaledHeight);
      }
  });

  // Teken selectie om geselecteerde objecten heen
  selectedObjects.forEach((obj) => {
      ctx.strokeStyle = "blue";
      ctx.lineWidth = 2;
      if (obj.type === "line") {
          ctx.beginPath();
          ctx.setLineDash([5, 5]);
          ctx.moveTo(obj.startX, obj.startY);
          ctx.lineTo(obj.endX, obj.endY);
          ctx.stroke();
          ctx.setLineDash([]);
      } else if (obj.type === "curve") {
          ctx.setLineDash([5, 5]);
          ctx.beginPath();
          ctx.moveTo(obj.points[0].x, obj.points[0].y);
          for (let i = 1; i < obj.points.length - 1; i++) {
              const cp = obj.points[i];
              const ep = obj.points[i + 1];
              ctx.quadraticCurveTo(cp.x, cp.y, ep.x, ep.y);
          }
          ctx.stroke();
          ctx.setLineDash([]);
      } else if (obj.type === "svg") {
          ctx.setLineDash([5, 5]);
          ctx.strokeRect(
              obj.x - obj.scaledWidth / 2,
              obj.y - obj.scaledHeight / 2,
              obj.scaledWidth,
              obj.scaledHeight
          );
          ctx.setLineDash([]);
      }
  });
}


// Functie om een pijl te tekenen aan het einde van een lijn of curve
function drawArrow(context, fromX, fromY, toX, toY) {
  const headLength = 10; // Lengte van de pijlpunt
  const angle = Math.atan2(toY - fromY, toX - fromX);
  context.beginPath();
  context.moveTo(toX, toY);
  context.lineTo(
    toX - headLength * Math.cos(angle - Math.PI / 6),
    toY - headLength * Math.sin(angle - Math.PI / 6)
  );
  context.lineTo(
    toX - headLength * Math.cos(angle + Math.PI / 6),
    toY - headLength * Math.sin(angle + Math.PI / 6)
  );
  context.lineTo(toX, toY);
  context.closePath();
  context.fillStyle = context.strokeStyle;
  context.fill();
}

// Mouse event listeners voor interactie
canvas.addEventListener("mousedown", (e) => {
  const rect = canvas.getBoundingClientRect();
  const x = e.clientX - rect.left;
  const y = e.clientY - rect.top;

  if (currentTool && currentTool.id === "curve") {
    if (!isDrawingCurve) {
      isDrawingCurve = true;
      curvePoints = [{ x, y }];
    } else {
      curvePoints.push({ x, y });
    }
    redrawCanvas();
  } else if (currentTool && currentTool.id === "line") {
    isDrawingLine = true;
    lineStart = { x, y };
  } else if (selectMode) {
    let clickedObject = drawnObjects.find((obj) => {
      if (obj.type === "line") {
        const distanceToStart = Math.hypot(x - obj.startX, y - obj.startY);
        const distanceToEnd = Math.hypot(x - obj.endX, y - obj.endY);
        const lineLength = Math.hypot(obj.endX - obj.startX, obj.endY - obj.startY);
        const buffer = 5;
        return (
          distanceToStart + distanceToEnd >= lineLength - buffer &&
          distanceToStart + distanceToEnd <= lineLength + buffer
        );
      } else if (obj.type === "curve") {
        const buffer = 5;
        for (let i = 0; i < obj.points.length - 1; i++) {
          const pointA = obj.points[i];
          const pointB = obj.points[i + 1];
          const distance = pointToSegmentDistance(x, y, pointA, pointB);
          if (distance <= buffer) {
            return true;
          }
        }
        return false;
      } else if (obj.type === "svg") {
        return (
          x >= obj.x - obj.scaledWidth / 2 &&
          x <= obj.x + obj.scaledWidth / 2 &&
          y >= obj.y - obj.scaledHeight / 2 &&
          y <= obj.y + obj.scaledHeight / 2
        );
      }
      return false;
    });

    if (clickedObject) {
      if (!selectedObjects.includes(clickedObject)) {
        selectedObjects.push(clickedObject);
      }
      dragStart = { x, y };  // Opslaan van startpunt voor slepen
      isDragging = true;  // Start het slepen
      updateToolDetails();
      redrawCanvas();
    } else {
      isSelecting = true;
      selectionStart = { x, y };
      selectionBox = { x, y, width: 0, height: 0 };
      selectedObjects = [];
    }
  }
});


canvas.addEventListener("mousemove", (e) => {
  const rect = canvas.getBoundingClientRect();
  const x = e.clientX - rect.left;
  const y = e.clientY - rect.top;

  if (isDragging && selectedObjects.length > 0) {
    // Bereken de verplaatsing
    const dx = x - dragStart.x;
    const dy = y - dragStart.y;

    // Pas de verplaatsing toe op elk geselecteerd object
    selectedObjects.forEach((obj) => {
      if (obj.type === "svg") {
        obj.x += dx;
        obj.y += dy;
      } else if (obj.type === "line") {
        obj.startX += dx;
        obj.startY += dy;
        obj.endX += dx;
        obj.endY += dy;
      } else if (obj.type === "curve") {
        obj.points.forEach((point) => {
          point.x += dx;
          point.y += dy;
        });
      }
    });

    // Update de startpositie voor de volgende verplaatsing
    dragStart = { x, y };

    redrawCanvas(); // Herteken het canvas om de wijzigingen weer te geven
  } else if (isDrawingLine) {
    redrawCanvas();
    // Teken visuele preview van de lijn
    ctx.strokeStyle = "#888";
    ctx.lineWidth = 2;
    ctx.setLineDash([5, 5]);
    ctx.beginPath();
    ctx.moveTo(lineStart.x, lineStart.y);
    ctx.lineTo(x, y);
    ctx.stroke();
    ctx.setLineDash([]);
  } else if (isDrawingCurve && currentTool && currentTool.id === "curve") {
    redrawCanvas();
    // Teken visuele preview van de curve
    ctx.strokeStyle = "#888";
    ctx.lineWidth = 2;
    ctx.setLineDash([5, 5]);
    ctx.beginPath();
    ctx.moveTo(curvePoints[0].x, curvePoints[0].y);
    for (let i = 1; i < curvePoints.length; i++) {
      ctx.lineTo(curvePoints[i].x, curvePoints[i].y);
    }
    ctx.lineTo(x, y); // Voeg het huidige punt toe als visuele preview
    ctx.stroke();
    ctx.setLineDash([]);
  } else if (isSelecting) {
    selectionBox.width = x - selectionStart.x;
    selectionBox.height = y - selectionStart.y;
    redrawCanvas();
    // Teken het selectievak
    ctx.strokeStyle = "red";
    ctx.lineWidth = 1;
    ctx.setLineDash([5, 3]);
    ctx.strokeRect(selectionStart.x, selectionStart.y, selectionBox.width, selectionBox.height);
    ctx.setLineDash([]);

    // Update geselecteerde objecten op basis van het selectiegebied
    selectedObjects = drawnObjects.filter((obj) => {
      if (obj.type === "line" || obj.type === "curve") {
        return isLineOrCurveInSelectionBox(obj, selectionStart, selectionBox);
      } else {
        return (
          obj.x >= Math.min(selectionStart.x, selectionStart.x + selectionBox.width) &&
          obj.x <= Math.max(selectionStart.x, selectionStart.x + selectionBox.width) &&
          obj.y >= Math.min(selectionStart.y, selectionStart.y + selectionBox.height) &&
          obj.y <= Math.max(selectionStart.y, selectionStart.y + selectionBox.height)
        );
      }
    });
  }
});


canvas.addEventListener("mouseup", (e) => {
  if (isDrawingLine) {
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    saveHistory();
    drawnObjects.push({
      type: "line",
      startX: lineStart.x,
      startY: lineStart.y,
      endX: x,
      endY: y,
      isDashed: isDashedLine,
      color: "#000000",
      lineWidth: 2,
    });
    isDrawingLine = false;
    updateToolDetails();
    redrawCanvas();
  } else if (isDragging) {
    isDragging = false; // Stop het slepen
    dragStart = null; // Reset het startpunt voor slepen
    saveHistory(); // Sla de huidige staat op
  } else if (isSelecting) {
    isSelecting = false;
    selectionBox = null;
    updateToolDetails();
    redrawCanvas();
  }
});

canvas.addEventListener("dblclick", (e) => {
  if (isDrawingCurve && currentTool && currentTool.id === "curve") {
    saveHistory();
    drawnObjects.push({
      type: "curve",
      points: [...curvePoints],
      isDashed: isDashedLine,
      lineWidth: 2,
      color: "#000000",
    });
    isDrawingCurve = false;
    curvePoints = [];
    updateToolDetails();
    redrawCanvas();
  }
});

// Hulpfunctie om de afstand tussen een punt en een lijnsegment te berekenen
function pointToSegmentDistance(px, py, pointA, pointB) {
  const x1 = pointA.x;
  const y1 = pointA.y;
  const x2 = pointB.x;
  const y2 = pointB.y;
  const A = px - x1;
  const B = py - y1;
  const C = x2 - x1;
  const D = y2 - y1;

  const dot = A * C + B * D;
  const len_sq = C * C + D * D;
  let param = -1;
  if (len_sq !== 0) {
    param = dot / len_sq;
  }

  let xx, yy;

  if (param < 0) {
    xx = x1;
    yy = y1;
  } else if (param > 1) {
    xx = x2;
    yy = y2;
  } else {
    xx = x1 + param * C;
    yy = y1 + param * D;
  }

  const dx = px - xx;
  const dy = py - yy;
  return Math.sqrt(dx * dx + dy * dy);
}

function isLineOrCurveInSelectionBox(lineOrCurve, selectionStart, selectionBox) {
  const minX = Math.min(selectionStart.x, selectionStart.x + selectionBox.width);
  const maxX = Math.max(selectionStart.x, selectionStart.x + selectionBox.width);
  const minY = Math.min(selectionStart.y, selectionStart.y + selectionBox.height);
  const maxY = Math.max(selectionStart.y, selectionStart.y + selectionBox.height);

  if (lineOrCurve.type === "line") {
    return (
      (lineOrCurve.startX >= minX && lineOrCurve.startX <= maxX && lineOrCurve.startY >= minY && lineOrCurve.startY <= maxY) ||
      (lineOrCurve.endX >= minX && lineOrCurve.endX <= maxX && lineOrCurve.endY >= minY && lineOrCurve.endY <= maxY)
    );
  } else if (lineOrCurve.type === "curve") {
    for (let i = 0; i < lineOrCurve.points.length; i++) {
      const point = lineOrCurve.points[i];
      if (point.x >= minX && point.x <= maxX && point.y >= minY && point.y <= maxY) {
        return true;
      }
    }
  }
  return false;
}

// Functie om de details van de geselecteerde tool bij te werken
// Functie om de details van de geselecteerde tool bij te werken
function updateToolDetails() {
  const details = document.getElementById("toolDetails");

  if (selectedObjects.length === 1) {
    const selectedObject = selectedObjects[0];

    if (selectedObject.type === "line" || selectedObject.type === "curve") {
      details.innerHTML = `
              <label for="dashedLineCheckbox">Stippellijn:</label>
              <input id="dashedLineCheckbox" type="checkbox" ${selectedObject.isDashed ? "checked" : ""} />
              <label for="lineWidthInput">Lijnbreedte:</label>
              <input id="lineWidthInput" type="number" value="${selectedObject.lineWidth}" min="1" max="10" />
              <label for="lineColorPicker">Kleur:</label>
              <input id="lineColorPicker" type="color" value="${selectedObject.color || "#000000"}" />
          `;

      document.getElementById("dashedLineCheckbox").addEventListener("change", (e) => {
        selectedObject.isDashed = e.target.checked;
        redrawCanvas();
      });

      document.getElementById("lineWidthInput").addEventListener("input", (e) => {
        selectedObject.lineWidth = parseInt(e.target.value, 10);
        redrawCanvas();
      });

      document.getElementById("lineColorPicker").addEventListener("input", (e) => {
        selectedObject.color = e.target.value;
        redrawCanvas();
      });
    } else if (selectedObject.type === "svg") {
      details.innerHTML = `
              <label for="colorPicker">Kleur:</label>
              <input id="colorPicker" type="color" value="${selectedObject.color}" />
          `;

      document.getElementById("colorPicker").addEventListener("input", (e) => {
        selectedObject.color = e.target.value;
        redrawCanvas();
      });
    }
  } else if (selectedObjects.length > 1) {
    details.innerHTML = `
          <p>Meerdere objecten geselecteerd</p>
          <button id="alignLeftButton" class="align-button">
              <img src="img/icons/align-left.svg" alt="Uitlijnen Links" title="Uitlijnen Links" />
          </button>
          <button id="alignRightButton" class="align-button">
              <img src="img/icons/align-right.svg" alt="Uitlijnen Rechts" title="Uitlijnen Rechts" />
          </button>
          <button id="alignTopButton" class="align-button">
              <img src="img/icons/align-top.svg" alt="Uitlijnen Boven" title="Uitlijnen Boven" />
          </button>
          <button id="alignBottomButton" class="align-button">
              <img src="img/icons/align-bottom.svg" alt="Uitlijnen Onder" title="Uitlijnen Onder" />
          </button>
          <button id="alignCenterButton" class="align-button">
              <img src="img/icons/align-center.svg" alt="Horizontaal Centreren" title="Horizontaal Centreren" />
          </button>
      `;

    document.getElementById("alignLeftButton").addEventListener("click", () => alignSelectedObjects("left"));
    document.getElementById("alignRightButton").addEventListener("click", () => alignSelectedObjects("right"));
    document.getElementById("alignTopButton").addEventListener("click", () => alignSelectedObjects("top"));
    document.getElementById("alignBottomButton").addEventListener("click", () => alignSelectedObjects("bottom"));
    document.getElementById("alignCenterButton").addEventListener("click", () => alignSelectedObjects("center"));
  } else {
    details.innerHTML = "<p>Geen selectie</p>";
  }
}

// Functie voor het uitlijnen van geselecteerde objecten
function alignSelectedObjects(alignment) {
  if (selectedObjects.length < 2) return;

  // Bereken de minimale en maximale posities van de geselecteerde objecten
  let minX = Math.min(...selectedObjects.map(obj => obj.type === "line" || obj.type === "curve" ? Math.min(obj.startX, ...(obj.points || []).map(p => p.x)) : obj.x));
  let maxX = Math.max(...selectedObjects.map(obj => obj.type === "line" || obj.type === "curve" ? Math.max(obj.endX, ...(obj.points || []).map(p => p.x)) : obj.x));
  let minY = Math.min(...selectedObjects.map(obj => obj.type === "line" || obj.type === "curve" ? Math.min(obj.startY, ...(obj.points || []).map(p => p.y)) : obj.y));
  let maxY = Math.max(...selectedObjects.map(obj => obj.type === "line" || obj.type === "curve" ? Math.max(obj.endY, ...(obj.points || []).map(p => p.y)) : obj.y));

  selectedObjects.forEach((obj) => {
    switch (alignment) {
      case "left":
        if (obj.type === "svg") {
          obj.x = minX;
        } else if (obj.type === "line" || obj.type === "curve") {
          const dx = minX - Math.min(obj.startX, ...(obj.points || []).map(p => p.x));
          obj.startX += dx;
          obj.endX += dx;
          if (obj.points) {
            obj.points.forEach(p => p.x += dx);
          }
        }
        break;
      case "right":
        if (obj.type === "svg") {
          obj.x = maxX;
        } else if (obj.type === "line" || obj.type === "curve") {
          const dx = maxX - Math.max(obj.endX, ...(obj.points || []).map(p => p.x));
          obj.startX += dx;
          obj.endX += dx;
          if (obj.points) {
            obj.points.forEach(p => p.x += dx);
          }
        }
        break;
      case "top":
        if (obj.type === "svg") {
          obj.y = minY;
        } else if (obj.type === "line" || obj.type === "curve") {
          const dy = minY - Math.min(obj.startY, ...(obj.points || []).map(p => p.y));
          obj.startY += dy;
          obj.endY += dy;
          if (obj.points) {
            obj.points.forEach(p => p.y += dy);
          }
        }
        break;
      case "bottom":
        if (obj.type === "svg") {
          obj.y = maxY;
        } else if (obj.type === "line" || obj.type === "curve") {
          const dy = maxY - Math.max(obj.endY, ...(obj.points || []).map(p => p.y));
          obj.startY += dy;
          obj.endY += dy;
          if (obj.points) {
            obj.points.forEach(p => p.y += dy);
          }
        }
        break;
      case "center":
        if (obj.type === "svg") {
          obj.x = (minX + maxX) / 2;
        } else if (obj.type === "line" || obj.type === "curve") {
          const dx = (minX + maxX) / 2 - (obj.startX + obj.endX) / 2;
          obj.startX += dx;
          obj.endX += dx;
          if (obj.points) {
            obj.points.forEach(p => p.x += dx);
          }
        }
        break;
    }
  });

  // Herteken het canvas na het uitlijnen
  redrawCanvas();
}
// **Object Verwijderen**
document.addEventListener("keydown", (e) => {
  if (e.key === "Backspace" && selectedObjects.length > 0) {
    drawnObjects = drawnObjects.filter((obj) => !selectedObjects.includes(obj));
    selectedObjects = [];
    redrawCanvas();
    e.preventDefault();
  }
});


// **Initialisatie**
document.addEventListener("DOMContentLoaded", () => {
  generateToolbar();
  loadBackground(defaultBackground); // Laad de default achtergrond bij laden van de pagina
});

// **Helperfunctie voor afstand berekenen**
function pointToSegmentDistance(px, py, pointA, pointB) {
  const x1 = pointA.x;
  const y1 = pointA.y;
  const x2 = pointB.x;
  const y2 = pointB.y;
  const A = px - x1;
  const B = py - y1;
  const C = x2 - x1;
  const D = y2 - y1;

  const dot = A * C + B * D;
  const len_sq = C * C + D * D;
  let param = -1;
  if (len_sq !== 0) {
    param = dot / len_sq;
  }

  let xx, yy;

  if (param < 0) {
    xx = x1;
    yy = y1;
  } else if (param > 1) {
    xx = x2;
    yy = y2;
  } else {
    xx = x1 + param * C;
    yy = y1 + param * D;
  }

  const dx = px - xx;
  const dy = py - yy;
  return Math.sqrt(dx * dx + dy * dy);
}