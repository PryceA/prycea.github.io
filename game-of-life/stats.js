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

function drawGraph(ctx, data, color) {
    const stepX = ctx.canvas.width / (data.length - 1);

    for (let i = 0; i < data.length - 1; i++) {
        const startX = i * stepX;
        const startY = ctx.canvas.height - data[i];
        const endX = (i + 1) * stepX;
        const endY = ctx.canvas.height - data[i + 1];

        drawLine(ctx, startX, startY, endX, endY, color);
    }
}

function drawLineGraph(ctx, dataPoints) {
    const dataLength = dataPoints.length;
    const canvasWidth = ctx.canvas.width;
    const canvasHeight = ctx.canvas.height;
    const padding = 10;
    const plotWidth = canvasWidth - 2 * padding;
    const plotHeight = canvasHeight - 2 * padding;

    // Get the maximum value in the dataPoints array
    const maxValue = Math.max(...dataPoints);

    // Calculate the horizontal and vertical scale factors
    const xScale = plotWidth / (dataLength - 1);
    const yScale = plotHeight / maxValue;

    // Move to the first data point
    ctx.moveTo(padding, canvasHeight - padding - dataPoints[0] * yScale);

    // Draw lines to each subsequent data point
    for (let i = 1; i < dataLength; i++) {
        const xPos = padding + i * xScale;
        const yPos = canvasHeight - padding - dataPoints[i] * yScale;
        ctx.lineTo(xPos, yPos);
    }
}



function drawStats(canvas, dataRed, dataGreen, dataBlue) {
    const ctx = canvas.getContext("2d");

    // Clear the canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Draw the axes
    drawLine(ctx, 0, 0, 0, canvas.height, "black");
    drawLine(ctx, 0, canvas.height, canvas.width, canvas.height, "black");

    // Draw the lines for each dominant color (red, green, blue)
    drawGraph(ctx, dataRed, "red");
    drawGraph(ctx, dataGreen, "green");
    drawGraph(ctx, dataBlue, "blue");

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
