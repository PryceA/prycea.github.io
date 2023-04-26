
let frameCounter = 0;

function gameLoop() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    for (const organism of organisms) {
        organism.move();
        organism.consumeFood();
        if (Math.random() < organism.color.a) {
            organism.reproduce();
        }
        organism.draw();
    }

    for (const foodSource of foodSources) {
        foodSource.draw();
    }

    if (Math.random() < newOrganismFrequency) {
        addRandomOrganism();
    }

    if (Math.random() < newFoodSourceFrequency) {
        addRandomFoodSource();
    }
    
    const { redCount, greenCount, blueCount } = countByDominantColor(organisms, organism => organism.color);
    organismsDataRed.push(redCount);
    organismsDataGreen.push(greenCount);
    organismsDataBlue.push(blueCount);

    // Remove the oldest entry when the array length exceeds 100
    [organismsDataRed, organismsDataGreen, organismsDataBlue].forEach(data => {
        if (data.length > 100) {
            data.shift();
        }
    });

    const { redCount: foodRedCount, greenCount: foodGreenCount, blueCount: foodBlueCount } = countByDominantColor(foodSources, foodSource => foodSource.colorPreference);
    foodSourcesDataRed.push(foodRedCount);
    foodSourcesDataGreen.push(foodGreenCount);
    foodSourcesDataBlue.push(foodBlueCount);

    // Remove the oldest entry when the array length exceeds 100
    [foodSourcesDataRed, foodSourcesDataGreen, foodSourcesDataBlue].forEach(data => {
        if (data.length > 100) {
            data.shift();
        }
    });

    frameCounter++;
    document.getElementById('frameCounter').innerText = frameCounter;

    requestAnimationFrame(gameLoop);
}

gameLoop();