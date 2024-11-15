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
    history.shift(); // Houd alleen de laatste 20 acties bij om geheugengebruik te beperken
  }
}

// **Undo Functionaliteit**
function undo() {
  if (history.length > 0) {
    drawnObjects = history.pop(); // Herstel de laatste opgeslagen staat
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

// **Popup Voor Nieuwe Canvas**
function newCanvas() {
  generateBackgroundSelector();
  document.getElementById("backgroundPopup").style.display = "block";
}

// **Achtergrond Selecteren**
function setBackground() {
  const selectedValue = document.getElementById("backgroundSelector").value;
  const selectedBackground = availableBackgrounds.find((bg) => bg.id === selectedValue);

  if (selectedBackground) {
    loadBackground(selectedBackground.svgPath);
  }

  document.getElementById("backgroundPopup").style.display = "none";
}

// **Achtergrond Laden**
function loadBackground(file) {
  fetch(file)
    .then((response) => response.text())
    .then((svgText) => {
      const img = new Image();
      const svgBlob = new Blob([svgText], { type: "image/svg+xml" });
      const url = URL.createObjectURL(svgBlob);

      img.onload = () => {
        staticBackground = img;
        drawnObjects = [];
        selectedObjects = [];
        redrawCanvas();
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
  selectButton.innerHTML = "🖐️"; // Handje-icoon
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
  undoButton.innerHTML = "↩️"; // Undo-icoon
  undoButton.title = "Actie ongedaan maken";
  undoButton.onclick = undo;
  toolbar.appendChild(undoButton);

  // Voeg een knop toe voor de lijntool
  const lineButton = document.createElement("button");
  lineButton.classList.add("toolbar-button");
  lineButton.innerHTML = "-->"; // Lijntool-icoon
  lineButton.title = "Teken een lijn met pijl";
  lineButton.onclick = () => {
    currentTool = { id: "line" };
    selectMode = false;
    selectedObjects = [];
    redrawCanvas();
    updateToolDetails();
  };
  toolbar.appendChild(lineButton);


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

// **Canvas Hertekenen**
function redrawCanvas() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  if (staticBackground) {
    ctx.drawImage(staticBackground, 0, 0, canvas.width, canvas.height);
  }

  drawnObjects.forEach((obj) => {
    if (obj.type === "svg") {
      let sizeFactor = (obj.sizePercentage / 100);
      obj.scaledWidth = obj.width * sizeFactor * (canvas.width / Math.min(canvas.width, canvas.height));
      obj.scaledHeight = obj.height * sizeFactor * (canvas.height / Math.min(canvas.width, canvas.height));
  
      ctx.drawImage(obj.svg, obj.x - obj.scaledWidth / 2, obj.y - obj.scaledHeight / 2, obj.scaledWidth, obj.scaledHeight);
    } else if (obj.type === "line") {
      ctx.strokeStyle = selectedObjects.includes(obj) ? "blue" : "black";
      ctx.lineWidth = 2;
      if (obj.isDashed) {
        ctx.setLineDash([5, 5]);
      } else {
        ctx.setLineDash([]);
      }
      ctx.beginPath();
      ctx.moveTo(obj.startX, obj.startY);
      ctx.lineTo(obj.endX, obj.endY);
      ctx.stroke();
      ctx.setLineDash([]);
  
      // Teken de pijl aan het einde van de lijn
      const angle = Math.atan2(obj.endY - obj.startY, obj.endX - obj.startX);
      const arrowLength = 10;
      ctx.beginPath();
      ctx.moveTo(obj.endX, obj.endY);
      ctx.lineTo(
        obj.endX - arrowLength * Math.cos(angle - Math.PI / 6),
        obj.endY - arrowLength * Math.sin(angle - Math.PI / 6)
      );
      ctx.moveTo(obj.endX, obj.endY);
      ctx.lineTo(
        obj.endX - arrowLength * Math.cos(angle + Math.PI / 6),
        obj.endY - arrowLength * Math.sin(angle + Math.PI / 6)
      );
      ctx.stroke();
    }
  });

  selectedObjects.forEach((obj) => {
    ctx.strokeStyle = "blue";
    ctx.lineWidth = 2;
    ctx.strokeRect(
      obj.x - obj.scaledWidth / 2,
      obj.y - obj.scaledHeight / 2,
      obj.scaledWidth,
      obj.scaledHeight
    );
  });
}



// **Start Selectie of Slepen**
canvas.addEventListener("mousedown", (e) => {
  const rect = canvas.getBoundingClientRect();
  const x = e.clientX - rect.left;
  const y = e.clientY - rect.top;

  if (currentTool && currentTool.id === "line") {
    // Start het tekenen van een lijn
    isDrawingLine = true;
    lineStart = { x, y };
  } else if (selectMode) {
    // Controleer of je een lijn selecteert
    const clickedLine = drawnObjects.find((obj) => {
      if (obj.type === "line") {
        const distanceToStart = Math.hypot(x - obj.startX, y - obj.startY);
        const distanceToEnd = Math.hypot(x - obj.endX, y - obj.endY);
        const lineLength = Math.hypot(obj.endX - obj.startX, obj.endY - obj.startY);
        const buffer = 5; // Pixel buffer om lijnen te detecteren

        // Controleer of de klik dicht bij de lijn is
        return (distanceToStart + distanceToEnd >= lineLength - buffer) && 
               (distanceToStart + distanceToEnd <= lineLength + buffer);
      }
      return false;
    });

    if (clickedLine) {
      selectedObjects = [clickedLine];
      updateToolDetails();
      redrawCanvas();
    } else {
      // Bestaande code voor selectie van SVG's of het starten van een selectie-vak
      const clickedObject = drawnObjects.find((obj) => {
        return (
          x >= obj.x - obj.scaledWidth / 2 &&
          x <= obj.x + obj.scaledWidth / 2 &&
          y >= obj.y - obj.scaledHeight / 2 &&
          y <= obj.y + obj.scaledHeight / 2
        );
      });

      if (clickedObject) {
        if (!selectedObjects.includes(clickedObject)) {
          selectedObjects = [clickedObject];
        }
        saveHistory(); // Sla de huidige staat op voordat er wordt gesleept
        isDragging = true;
        dragStart = { x, y };
        initialPositions = selectedObjects.map((obj) => ({
          obj: obj,
          startX: obj.x,
          startY: obj.y,
        }));
      } else {
        // Start een selectie-vak
        isSelecting = true;
        selectionStart = { x, y };
        selectionBox = { x, y, width: 0, height: 0 };
        selectedObjects = [];
      }

      updateToolDetails();
    }
  }
});



// **Object Verslepen of Meervoudige Selectie**
canvas.addEventListener("mousemove", (e) => {
  if (isDragging && selectedObjects.length > 0) {
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    // Bereken de relatieve verplaatsing ten opzichte van de vorige positie
    const dx = x - dragStart.x;
    const dy = y - dragStart.y;

    // Pas de verplaatsing toe op elk geselecteerd object
    selectedObjects.forEach((obj) => {
      obj.x += dx;
      obj.y += dy;
    });

    // Update de startpositie voor de volgende `mousemove` event
    dragStart = { x, y };

    // Herteken het canvas
    redrawCanvas();
  } else if (isSelecting) {
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    // Update het selectiegebied
    selectionBox.width = x - selectionStart.x;
    selectionBox.height = y - selectionStart.y;
    redrawCanvas();

    // Teken de selectie-vak
    ctx.strokeStyle = "red";
    ctx.lineWidth = 1;
    ctx.setLineDash([5, 3]);
    ctx.strokeRect(selectionStart.x, selectionStart.y, selectionBox.width, selectionBox.height);
    ctx.setLineDash([]);

    // Update de geselecteerde objecten op basis van het selectiegebied
    selectedObjects = drawnObjects.filter((obj) => {
      if (obj.type === "line") {
        return isLineInSelectionBox(obj, selectionStart, selectionBox);
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


// **Einde Slepen of Selectie**
canvas.addEventListener("mouseup", (e) => {
  if (isDrawingLine && lineStart) {
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    // Sla de huidige staat op voordat de lijn wordt toegevoegd
    saveHistory();

    // Voeg de lijn toe aan de lijst van getekende objecten
    drawnObjects.push({
      type: "line",
      startX: lineStart.x,
      startY: lineStart.y,
      endX: x,
      endY: y,
      isDashed: isDashedLine,
    });

    // Stop met tekenen van de lijn
    isDrawingLine = false;
    lineStart = null;

    // Herteken het canvas om de nieuwe lijn weer te geven
    redrawCanvas();
  }

  if (isDragging) {
    isDragging = false;
    dragStart = null;
    initialPositions = [];
  }

  if (isSelecting) {
    isSelecting = false;
    selectionBox = null;
    redrawCanvas();
  }
});


// **Object Verwijderen**
document.addEventListener("keydown", (e) => {
  if (e.key === "Backspace" && selectedObjects.length > 0) {
    drawnObjects = drawnObjects.filter((obj) => !selectedObjects.includes(obj));
    selectedObjects = [];
    updateToolDetails();
    redrawCanvas();
    e.preventDefault(); // Voorkom browseractie bij Backspace
  }
});

// **Tools Details Updaten**
function updateToolDetails() {
  const details = document.getElementById("toolDetails");

  if (selectedObjects.length === 1) {
    const selectedObject = selectedObjects[0];

    if (selectedObject.type === "line") {
      details.innerHTML = `
        <label for="dashedLineCheckbox">Stippellijn:</label>
        <input id="dashedLineCheckbox" type="checkbox" ${selectedObject.isDashed ? "checked" : ""} />
      `;

      document.getElementById("dashedLineCheckbox").addEventListener("change", (e) => {
        selectedObject.isDashed = e.target.checked;
        redrawCanvas();
      });
    } else if (selectedObject.type === "svg") {
      const matchingObject = availableObjects.find((obj) =>
        selectedObject.id.startsWith(obj.id)
      );

      if (!matchingObject) {
        details.innerHTML = "<p>Geen selectie</p>";
        return;
      }

      const resizable = matchingObject.resizable;

      details.innerHTML = `
        <label for="colorPicker">Kleur:</label>
        <input id="colorPicker" type="color" value="${selectedObject.color}" />
        ${resizable ? `
          <label for="sizeInput">Grootte:</label>
          <input id="sizeInput" type="number" value="${selectedObject.size}" />
        ` : ""}
      `;

      document.getElementById("colorPicker").addEventListener("input", (e) => {
        selectedObject.color = e.target.value;
        redrawCanvas();
      });

      if (resizable) {
        document.getElementById("sizeInput").addEventListener("input", (e) => {
          selectedObject.size = parseInt(e.target.value, 10);
          redrawCanvas();
        });
      }
    }
  } else {
    details.innerHTML = "<p>Meerdere objecten geselecteerd</p>";
  }
}

// **Initialisatie**
document.addEventListener("DOMContentLoaded", () => {
  generateToolbar();
  loadBackground(defaultBackground); // Laad de default achtergrond bij laden van de pagina
});