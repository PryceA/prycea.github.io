const organismsDataRed = [];
const organismsDataGreen = [];
const organismsDataBlue = [];

const foodSourcesDataRed = [];
const foodSourcesDataGreen = [];
const foodSourcesDataBlue = [];

function drawLine(ctx, startX, startY, endX, endY, color) {
    ctx.beginPath();
    ctx.moveTo(startX, startY);
    ctx.lineTo(endX, endY);
    ctx.strokeStyle = color;
    ctx.stroke();
}

function drawGraph(ctx, data, color, yMin, yMax, padding) {
    const stepX = (ctx.canvas.width - 2 * padding) / (data.length - 1);
    const stepY = (ctx.canvas.height - 2 * padding) / (yMax - yMin);

    for (let i = 0; i < data.length - 1; i++) {
        const startX = padding + i * stepX;
        const startY = ctx.canvas.height - padding - (data[i] - yMin) * stepY;
        const endX = padding + (i + 1) * stepX;
        const endY = ctx.canvas.height - padding - (data[i + 1] - yMin) * stepY;

        drawLine(ctx, startX, startY, endX, endY, color);
    }
}

function drawYAxisLabels(ctx, yMin, yMax, padding, numTicks) {
    const stepY = (ctx.canvas.height - 2 * padding) / (yMax - yMin);
    const tickStep = (yMax - yMin) / numTicks;
    ctx.fillStyle = "black";
    ctx.font = "12px Arial";
    ctx.textAlign = "right";
    ctx.textBaseline = "middle";

    for (let i = 0; i <= numTicks; i++) {
        const value = yMin + i * tickStep;
        const xPos = padding - 5;
        const yPos = ctx.canvas.height - padding - (value - yMin) * stepY;
        ctx.fillText(value.toFixed(1), xPos, yPos);
    }
}


function drawStats(canvas, dataRed, dataGreen, dataBlue) {
    const ctx = canvas.getContext("2d");
    const padding = 40; // Increase the padding value if numbers are cutoff

    // Clear the canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Draw the axes
    drawLine(ctx, padding, padding, padding, canvas.height - padding, "black");
    drawLine(ctx, padding, canvas.height - padding, canvas.width - padding, canvas.height - padding, "black");

    // Calculate yMin and yMax values
    const allData = [...dataRed, ...dataGreen, ...dataBlue];
    const minValue = Math.min(...allData);
    const maxValue = Math.max(...allData);
    const yMin = minValue - 0.1 * (maxValue - minValue);
    const yMax = maxValue + 0.1 * (maxValue - minValue);

    // Draw the lines for each dominant color (red, green, blue)
    drawGraph(ctx, dataRed, "red", yMin, yMax, padding);
    drawGraph(ctx, dataGreen, "green", yMin, yMax, padding);
    drawGraph(ctx, dataBlue, "blue", yMin, yMax, padding);

    // Draw y-axis labels
    drawYAxisLabels(ctx, yMin, yMax, padding, 5); // Pass 5 as the desired number of ticks

    // Request the next frame
    requestAnimationFrame(() => drawStats(canvas, dataRed, dataGreen, dataBlue));
}

function countByDominantColor(items, colorExtractor) {
    let redCount = 0;
    let greenCount = 0;
    let blueCount = 0;

    for (const item of items) {
        const color = colorExtractor(item);
        if (color.r > color.g && color.r > color.b) {
            redCount++;
        } else if (color.g > color.r && color.g > color.b) {
            greenCount++;
        } else {
            blueCount++;
        }
    }

    return { redCount, greenCount, blueCount };
}

// Call the drawStats function for organisms
const organismsCanvas = document.getElementById("organisms-stats");
drawStats(organismsCanvas, organismsDataRed, organismsDataGreen, organismsDataBlue);

// Call the drawStats function for food sources
const foodSourceStatsCanvas = document.getElementById("food-stats");
drawStats(foodSourceStatsCanvas, foodSourcesDataRed, foodSourcesDataGreen, foodSourcesDataBlue);
