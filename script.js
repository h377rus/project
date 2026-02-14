let field = document.querySelector('.field');
for (let i = 0; i < 450; i++) {
    let cell = document.createElement('div');
    cell.classList.add('cell');
    cell.setAttribute('data-index', `${i}`);
    field.appendChild(cell);
}

var CURRENT_COLOR = "rgb(200, 200, 200)";
var DEFAULT_COLOR = "rgb(200, 200, 200)";
var IS_CLICKED = false;
var FILL_MODE = false;

var COLOR_MAP = {
    "red": "rgb(255, 0, 0)",
    "green": "rgb(0, 128, 0)",
    "blue": "rgb(0, 0, 255)",
    "yellow": "rgb(255, 255, 0)",
    "skyblue": "rgb(135, 206, 235)"
};

function saveDrawingToLocalStorage() {
    const cells = document.querySelectorAll('.cell');
    const drawingData = [];
    for (let i = 0; i < cells.length; i++) {
        const cell = cells[i];
        const color = cell.style.backgroundColor || window.getComputedStyle(cell).backgroundColor;
        drawingData.push(color);
    }
    localStorage.setItem('pixelArtDrawing', JSON.stringify(drawingData));
    localStorage.setItem('pixelArtLastSave', new Date().toISOString());
}

function loadDrawingFromLocalStorage() {
    const savedData = localStorage.getItem('pixelArtDrawing');
    if (savedData) {
        try {
            const drawingData = JSON.parse(savedData);
            const cells = document.querySelectorAll('.cell');
            for (let i = 0; i < cells.length && i < drawingData.length; i++) {
                if (drawingData[i] && drawingData[i] !== 'rgb(214, 255, 148)') {
                    cells[i].style.backgroundColor = drawingData[i];
                }
            }
        } catch (error) {
            console.error('Error loading drawing:', error);
        }
    }
}

function clearSavedDrawing() {
    localStorage.removeItem('pixelArtDrawing');
    localStorage.removeItem('pixelArtLastSave');
}

function getCellIndex(cell) {
    return parseInt(cell.getAttribute('data-index'));
}

function getCellColor(cell) {
    return cell.style.backgroundColor || window.getComputedStyle(cell).backgroundColor;
}

function parseColor(colorStr) {
    const match = colorStr.match(/rgb\((\d+),\s*(\d+),\s*(\d+)\)/);
    if (match) {
        return {
            r: parseInt(match[1]),
            g: parseInt(match[2]),
            b: parseInt(match[3])
        };
    }
    return { r: 200, g: 200, b: 200 };
}

function animateFloodFillWave(startCell) {
    const startIndex = getCellIndex(startCell);
    const targetColor = getCellColor(startCell);
    if (targetColor === CURRENT_COLOR) return;

    const cols = 30;
    const rows = 15;
    const visited = new Set();
    const distanceMap = new Map();
    const queue = [{ index: startIndex, distance: 0 }];
    visited.add(startIndex);
    distanceMap.set(startIndex, 0);

    function checkAndAddNeighbor(currentIndex, currentDistance) {
        const neighbors = [
            { condition: Math.floor(currentIndex / cols) > 0, index: currentIndex - cols },
            { condition: Math.floor(currentIndex / cols) < rows - 1, index: currentIndex + cols },
            { condition: (currentIndex % cols) > 0, index: currentIndex - 1 },
            { condition: (currentIndex % cols) < cols - 1, index: currentIndex + 1 }
        ];
        neighbors.forEach(neighbor => {
            if (neighbor.condition && !visited.has(neighbor.index)) {
                const neighborCell = cells[neighbor.index];
                if (getCellColor(neighborCell) === targetColor) {
                    queue.push({ index: neighbor.index, distance: currentDistance + 1 });
                    visited.add(neighbor.index);
                    distanceMap.set(neighbor.index, currentDistance + 1);
                }
            }
        });
    }

    while (queue.length > 0) {
        const { index, distance } = queue.shift();
        checkAndAddNeighbor(index, distance);
    }

    const animationData = Array.from(distanceMap.entries()).map(([index, distance]) => ({
        element: cells[index],
        distance: distance
    }));
    animationData.sort((a, b) => a.distance - b.distance);

    animationData.forEach((item, i) => {
        anime({
            targets: item.element,
            backgroundColor: CURRENT_COLOR,
            duration: 300,
            delay: item.distance * 50,
            easing: 'easeOutSine',
            scale: [
                { value: 0.9, duration: 0 },
                { value: 1, duration: 300 }
            ],
            begin: function() {
                if (item.distance === 0) {
                    anime({
                        targets: startCell,
                        scale: [1, 1.2, 1],
                        duration: 300,
                        easing: 'easeInOutSine'
                    });
                }
            },
            complete: function() {
                saveDrawingToLocalStorage();
            }
        });
    });
}

let cells = document.querySelectorAll('.cell');
for (let i = 0; i < cells.length; i++) {
    let cell = cells[i];

    const saveAndPaint = (action) => {
        return function() {
            action.call(this);
            saveDrawingToLocalStorage();
        };
    };

    cell.addEventListener('click', saveAndPaint(function() {
        if (!FILL_MODE) {
            this.style.backgroundColor = CURRENT_COLOR;
        }
    }));

    cell.addEventListener('mouseover', saveAndPaint(function() {
        if (IS_CLICKED && !FILL_MODE) {
            this.style.backgroundColor = CURRENT_COLOR;
        }
    }));

    cell.addEventListener('mousedown', saveAndPaint(function() {
        if (FILL_MODE) {
            animateFloodFillWave(this);
        } else {
            this.style.backgroundColor = CURRENT_COLOR;
        }
    }));
}

let color_cells = document.querySelectorAll('.color-cell');
for (let i = 0; i < color_cells.length; i++) {
    let color_cell = color_cells[i];
    color_cell.addEventListener('click', function() {
        let colorClass = "";
        if (color_cell.classList.contains("red")) colorClass = "red";
        else if (color_cell.classList.contains("green")) colorClass = "green";
        else if (color_cell.classList.contains("blue")) colorClass = "blue";
        else if (color_cell.classList.contains("yellow")) colorClass = "yellow";
        else if (color_cell.classList.contains("skyblue")) colorClass = "skyblue";

        CURRENT_COLOR = COLOR_MAP[colorClass];
        FILL_MODE = false;
        document.querySelector('.selected').classList.remove('selected');
        color_cell.classList.add('selected');
    });
}

document.addEventListener('mousedown', function() {
    IS_CLICKED = true;
});
document.addEventListener('mouseup', function() {
    IS_CLICKED = false;
});

cells.forEach(cell => {
    cell.style.backgroundColor = DEFAULT_COLOR;
});

document.querySelector('.eraser').addEventListener('click', function() {
    CURRENT_COLOR = DEFAULT_COLOR;
    FILL_MODE = false;
    document.querySelector('.selected').classList.remove('selected');
    this.classList.add('selected');
});

document.querySelector('.fill-tool').addEventListener('click', function() {
    FILL_MODE = true;
    document.querySelector('.selected').classList.remove('selected');
    this.classList.add('selected');
});

const downloadBtn = document.createElement('button');
downloadBtn.textContent = "Скачать картинку";
downloadBtn.classList.add('download-Bnt');

function addDownloadButton() {
    const fieldContainer = document.querySelector('.field-conteiner');
    if (fieldContainer) {
        const fieldWrapper = document.createElement('div');
        fieldWrapper.className = 'field-wrapper';
        fieldWrapper.style.cssText = 'display: flex; flex-direction: column; align-items: center; width: 60vw; max-width: 800px;';

        const field = document.querySelector('.field');
        const buttonContainer = document.createElement('div');
        buttonContainer.className = 'download-button-container';
        buttonContainer.style.cssText = 'text-align: center; margin-top: 20px; width: 100%; display: flex; justify-content: center; gap: 10px; flex-wrap: wrap;';

        downloadBtn.style.cssText = 'background: linear-gradient(45deg, #3780ED, #614BA6); color: white; border: none; padding: 12px 25px; border-radius: 25px; font-family: "Changa One", sans-serif; font-size: 1rem; cursor: pointer; transition: all 0.3s ease; box-shadow: 0 4px 12px rgba(55, 128, 237, 0.3);';

        const clearBtn = document.createElement('button');
        clearBtn.textContent = "Очистить";
        clearBtn.style.cssText = 'background: #ff6b6b; color: white; border: none; padding: 12px 25px; border-radius: 25px; font-family: "Changa One", sans-serif; font-size: 1rem; cursor: pointer; transition: all 0.3s ease; box-shadow: 0 4px 12px rgba(255, 107, 107, 0.3);';
        clearBtn.addEventListener('click', function() {
            if (confirm('Очистить весь рисунок?')) {
                cells.forEach(cell => {
                    cell.style.backgroundColor = DEFAULT_COLOR;
                });
                clearSavedDrawing();
                saveDrawingToLocalStorage();
            }
        });

        buttonContainer.appendChild(downloadBtn);
        buttonContainer.appendChild(clearBtn);
        fieldWrapper.appendChild(field);
        fieldWrapper.appendChild(buttonContainer);

        const colorPalette = fieldContainer.querySelector('.color-palette');
        fieldContainer.innerHTML = '';
        if (colorPalette) fieldContainer.appendChild(colorPalette);
        fieldContainer.appendChild(fieldWrapper);

        fieldContainer.style.cssText = 'width: 100%; max-width: 1200px; height: auto; display: flex; align-items: flex-start; justify-content: center; gap: 30px; padding: 30px; background: white; border-radius: 20px; box-shadow: 0 20px 50px rgba(0, 0, 0, 0.2);';

        downloadBtn.addEventListener('mouseenter', function() {
            this.style.transform = 'translateY(-2px)';
            this.style.boxShadow = '0 6px 18px rgba(55, 128, 237, 0.4)';
        });
        downloadBtn.addEventListener('mouseleave', function() {
            this.style.transform = 'translateY(0)';
            this.style.boxShadow = '0 4px 12px rgba(55, 128, 237, 0.3)';
        });
        clearBtn.addEventListener('mouseenter', function() {
            this.style.transform = 'translateY(-2px)';
            this.style.boxShadow = '0 6px 18px rgba(255, 107, 107, 0.4)';
        });
        clearBtn.addEventListener('mouseleave', function() {
            this.style.transform = 'translateY(0)';
            this.style.boxShadow = '0 4px 12px rgba(255, 107, 107, 0.3)';
        });
    }
}

function showSaveNotification(message = "Изображение сохранено!") {
    const existingNotification = document.querySelector('.save-notification');
    if (existingNotification) existingNotification.remove();

    const notification = document.createElement('div');
    notification.className = 'save-notification';
    notification.innerHTML = `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M9 16.17L4.83 12L3.41 13.41L9 19L21 7L19.59 5.59L9 16.17Z" fill="white"/></svg><span>${message}</span>`;
    document.body.appendChild(notification);

    setTimeout(() => notification.classList.add('show'), 10);
    setTimeout(() => {
        notification.classList.remove('show');
        setTimeout(() => notification.remove(), 300);
    }, 3000);
}

function saveImage() {
    try {
        const cells = document.querySelectorAll('.cell');
        if (!cells || cells.length === 0) {
            showSaveNotification("Нет данных для сохранения!");
            return;
        }

        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        const cols = 30;
        const rows = 15;
        const cellSize = 20;
        canvas.width = cols * cellSize;
        canvas.height = rows * cellSize;

        ctx.fillStyle = 'rgb(214, 255, 148)';
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        for (let i = 0; i < cells.length; i++) {
            const cell = cells[i];
            const row = Math.floor(i / cols);
            const col = i % cols;
            let color = cell.style.backgroundColor;
            if (!color || color === '') {
                color = window.getComputedStyle(cell).backgroundColor;
            }
            const computedColor = window.getComputedStyle(cell).backgroundColor;
            const bgColor = 'rgb(214, 255, 148)';
            if (color !== bgColor && computedColor !== bgColor) {
                ctx.fillStyle = color || computedColor;
                ctx.fillRect(col * cellSize, row * cellSize, cellSize, cellSize);
                ctx.strokeStyle = 'rgba(0, 0, 0, 0.1)';
                ctx.lineWidth = 0.5;
                ctx.strokeRect(col * cellSize, row * cellSize, cellSize, cellSize);
            }
        }

        const link = document.createElement('a');
        const timestamp = new Date().getTime();
        link.download = `pixel-art-${timestamp}.png`;
        link.href = canvas.toDataURL('image/png');
        document.body.appendChild(link);
        link.click();
        setTimeout(() => document.body.removeChild(link), 100);
        showSaveNotification("Изображение сохранено!");
    } catch (error) {
        console.error('Ошибка при сохранении:', error);
        showSaveNotification("Ошибка при сохранении!");
    }
}

const saveTool = document.querySelector('.save-tool');
if (saveTool) {
    saveTool.addEventListener('click', function() {
        FILL_MODE = false;
        document.querySelector('.selected').classList.remove('selected');
        this.classList.add('selected');
        saveImage();
    });
}

if (downloadBtn) downloadBtn.addEventListener('click', saveImage);

document.addEventListener('keydown', function(event) {
    if ((event.ctrlKey || event.metaKey) && event.key === 's') {
        event.preventDefault();
        saveImage();
    }
    if (event.key === 'f' || event.key === 'а') {
        const fillTool = document.querySelector('.fill-tool');
        if (fillTool) fillTool.click();
    }
    if (event.key === 'e' || event.key === 'у') {
        const eraser = document.querySelector('.eraser');
        if (eraser) eraser.click();
    }
    if (event.key >= '1' && event.key <= '5') {
        const colorIndex = parseInt(event.key) - 1;
        const colorCells = document.querySelectorAll('.color-cell');
        if (colorCells[colorIndex]) colorCells[colorIndex].click();
    }
});

function addHotkeyLabels() {
    const tools = {
        '.fill-tool': 'F',
        '.eraser': 'E',
        '.save-tool': 'Ctrl+S',
        '.color-cell.red': '1',
        '.color-cell.green': '2',
        '.color-cell.blue': '3',
        '.color-cell.yellow': '4',
        '.color-cell.skyblue': '5'
    };
    Object.entries(tools).forEach(([selector, hotkey]) => {
        const toolElements = document.querySelectorAll(selector);
        toolElements.forEach(tool => {
            const label = document.createElement('div');
            label.className = 'hotkey-label';
            label.textContent = hotkey;
            tool.appendChild(label);
        });
    });
}

document.addEventListener('DOMContentLoaded', function() {
    addDownloadButton();
    loadDrawingFromLocalStorage();
    setInterval(saveDrawingToLocalStorage, 5000);
    setTimeout(addHotkeyLabels, 500);
});
