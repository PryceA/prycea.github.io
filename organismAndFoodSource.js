const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

const organismSize = 5;
const startingOrganismsCount = 200;
const startingFoodSourcesCount = 100
const organisms = [];
const scanRadius = 200;
const movementCost = .001;
const newOrganismFrequency = 0.1; // Set the desired frequency (e.g., 0.01 for 1% chance per frame)
const newFoodSourceFrequency = 0.1; // Set the desired frequency (e.g., 0.005 for 0.5% chance per frame)
const reproductionEnergyThreshold = 2000;
const maxStartingEnergy = 100;
const sameSpeciesColorDistance = 50; // The "color distance" that is considered the same species
const sameFoodColorDistance = 150;
const eatRate = 0.01; // Adjust this value to control the speed of size transfer


class Organism {
    constructor(x, y, color) {
        this.x = x;
        this.y = y;

        // Calculate the average of the input color components
        const inputColorAverage = (color.r + color.g + color.b) / 3;

        // Calculate the normalization factor to achieve an average of 127.5
        const normalizationFactor = 127.5 / inputColorAverage;

        // Normalize the input color
        this.color = {
            r: Math.min(255, Math.round(color.r * normalizationFactor)),
            g: Math.min(255, Math.round(color.g * normalizationFactor)),
            b: Math.min(255, Math.round(color.b * normalizationFactor)),
        };

        this.energy = Math.random() * (maxStartingEnergy - 1) + 1;
        this.radius = Math.sqrt(this.energy / Math.PI); // Update the radius based on energy
        this.speed = this.color.b / 255 + 1; // You can set a constant value or use another attribute for speed
        this.directionVector = { x: 0, y: 0 };
    }

    draw() {
        this.radius = Math.sqrt(this.energy / Math.PI); // Update the radius based on energy

        ctx.fillStyle = `rgba(${this.color.r}, ${this.color.g}, ${this.color.b}, 255)`;
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.radius, 0, 2 * Math.PI);
        ctx.closePath();
        ctx.fill();
    }


  move() {
    let directionVectors = [];

    // Interaction with other organisms
    for (const otherOrganism of organisms) {
        if (otherOrganism === this) continue;

        const colorDistance = Math.sqrt(
            Math.pow(this.color.r - otherOrganism.color.r, 2) +
            Math.pow(this.color.g - otherOrganism.color.g, 2) +
            Math.pow(this.color.b - otherOrganism.color.b, 2)
        );

        const dx = otherOrganism.x - this.x;
        const dy = otherOrganism.y - this.y;
        const distance = Math.sqrt(dx * dx + dy * dy) - this.radius - otherOrganism.radius;
        
        if (distance < scanRadius) {
            let vectorMagnitude;

            if (colorDistance <= sameSpeciesColorDistance) {
                if (this.energy > reproductionEnergyThreshold && otherOrganism.energy > reproductionEnergyThreshold) {
                    vectorMagnitude = this.color.b / 255; // Move toward organisms of the same color if the energy is at least reproductionEnergyThreshold
                } else {
                    vectorMagnitude = -(this.color.b / 255); // Move away from organisms of the same color if the energy is below reproductionEnergyThreshold
                }
            } else if (otherOrganism.energy > this.energy) {
                vectorMagnitude = -(this.color.r / 255); // Move away from larger organisms
            } else {
                vectorMagnitude = this.color.r / 255; // Move toward smaller organisms
            }

            const normalizedVector = {
                x: (dx/distance) * vectorMagnitude / distance,
                y: (dy/distance) * vectorMagnitude / distance,
            };

            directionVectors.push(normalizedVector);
        }
    }

    // Interaction with food sources
    for (const foodSource of foodSources) {
        const dx = foodSource.x - this.x;
        const dy = foodSource.y - this.y;
        const distance = Math.sqrt(dx * dx + dy * dy);

        if (distance < scanRadius) {
            const colorDistance = Math.sqrt(
                Math.pow(this.color.r - foodSource.colorPreference.r, 2) +
                Math.pow(this.color.g - foodSource.colorPreference.g, 2) +
                Math.pow(this.color.b - foodSource.colorPreference.b, 2)
            );

            // Calculate the food source element based on the color distance
            const foodSourceElement = Math.max(0, (sameFoodColorDistance - colorDistance) / 255);
            const vectorMagnitude = this.color.g / 255 * foodSourceElement;

            const normalizedVector = {
                x: (dx/distance) * vectorMagnitude / distance,
                y: (dy/distance) * vectorMagnitude / distance,
            };

            directionVectors.push(normalizedVector);
        }
    }

    // Select the vector with the greatest magnitude
    let maxMagnitude = 0;
    let maxIndex = -1;
    for (let i = 0; i < directionVectors.length; i++) {
        const magnitude = Math.sqrt(
            directionVectors[i].x * directionVectors[i].x +
            directionVectors[i].y * directionVectors[i].y
        );

        if (magnitude > maxMagnitude) {
            maxMagnitude = magnitude;
            maxIndex = i;
        }
    }
    if (maxIndex >= 0) {
        const directionVector = directionVectors[maxIndex];

        // Calculate the energy cost of the movement
        const energyCost = Math.pow(this.radius, 2) * Math.pow(this.speed, 3) * movementCost;

        // Move only if there's enough energy
        if (this.energy - energyCost >= 0) {
            const newX = this.x + directionVector.x / maxMagnitude * this.speed;
            const newY = this.y + directionVector.y / maxMagnitude * this.speed;

            // Check if the new position is within the canvas bounds
            if (newX >= 0 && newX <= canvas.width) {
                this.x = newX;
            }
            if (newY >= 0 && newY <= canvas.height) {
                this.y = newY;
            }

            this.energy -= energyCost;
        }

        this.checkForCollisions();
    }
}
checkForCollisions() {
    for (const otherOrganism of organisms) {
        if (otherOrganism === this) continue;

        const dx = otherOrganism.x - this.x;
        const dy = otherOrganism.y - this.y;
        const distance = Math.sqrt(dx * dx + dy * dy) - this.radius - otherOrganism.radius;

        if (distance < 1) {
            const colorDistance = Math.sqrt(
                Math.pow(this.color.r - otherOrganism.color.r, 2) +
                Math.pow(this.color.g - otherOrganism.color.g, 2) +
                Math.pow(this.color.b - otherOrganism.color.b, 2)
            );

            if (colorDistance <= sameSpeciesColorDistance) {
                if (this.energy > reproductionEnergyThreshold && otherOrganism.energy > reproductionEnergyThreshold) {
                    this.reproduce();
                    otherOrganism.reproduce();
                }
                continue;
            } else {
                if (this.energy > otherOrganism.energy) {
                    const transferEnergy = Math.min(otherOrganism.energy, eatRate * this.energy);
                    this.energy += transferEnergy; // Transfer energy from the smaller organism to the larger organism at the specified rate
                    otherOrganism.energy -= transferEnergy;
                    if (otherOrganism.energy <= 0) {
                        organisms.splice(organisms.indexOf(otherOrganism), 1);
                    }
                } else {
                    const transferEnergy = Math.min(this.energy, eatRate * otherOrganism.energy);
                    otherOrganism.energy += transferEnergy; // Transfer energy from the smaller organism to the larger organism at the specified rate
                    this.energy -= transferEnergy;
                    if (this.energy <= 0) {
                        organisms.splice(organisms.indexOf(this), 1);
                    }
                }
            }
        }
    }
}

reproduce() {
    if (this.energy > reproductionEnergyThreshold) {
        console.log(`Reproducing. Color: ${this.color.r}, ${this.color.g}, ${this.color.b}`);
        const offspringEnergy = this.energy * 0.5;
        const offspringColor = {
            r: Math.floor(this.color.r + (Math.random() * 20 - 10)),
            g: Math.floor(this.color.g + (Math.random() * 20 - 10)),
            b: Math.floor(this.color.b + (Math.random() * 20 - 10)),
        };

        // Randomly choose an angle for the offspring's position
        const angle = Math.random() * 2 * Math.PI;
        const distanceFromParent = this.radius + Math.sqrt(offspringEnergy / Math.PI);

        const offspringX = this.x + distanceFromParent * Math.cos(angle);
        const offspringY = this.y + distanceFromParent * Math.sin(angle);

        const offspring = new Organism(offspringX, offspringY, offspringColor);
        offspring.energy = offspringEnergy;
        organisms.push(offspring);

        this.energy -= offspringEnergy;
    }
}
consumeFood() {
    for (const foodSource of foodSources) {
        const dx = foodSource.x - this.x;
        const dy = foodSource.y - this.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        const minDistance = (this.radius + 5) / 2;

        if (distance < minDistance) {
            const colorDistance = Math.sqrt(
                Math.pow(this.color.r - foodSource.colorPreference.r, 2) +
                Math.pow(this.color.g - foodSource.colorPreference.g, 2) +
                Math.pow(this.color.b - foodSource.colorPreference.b, 2)
            );

            const energyGain = Math.max(0, (sameFoodColorDistance - colorDistance) / 255 * foodSource.energy);
            this.energy += energyGain;
            foodSource.energy -= energyGain;

            if (foodSource.energy <= 1) {
                console.log(`Food source depleted. Color: ${this.color.r}, ${this.color.g}, ${this.color.b}`);
                foodSources.splice(foodSources.indexOf(foodSource), 1);
            }
        }
    }
}




}

function createOrganisms() {
    for (let i = 0; i < startingOrganismsCount; i++) {
        const x = Math.random() * canvas.width;
        const y = Math.random() * canvas.height;
        const color = {
            r: Math.floor(Math.random() * 256),
            g: Math.floor(Math.random() * 256),
            b: Math.floor(Math.random() * 256),
        };
        organisms.push(new Organism(x, y, color));
    }
}

class FoodSource {
    constructor(x, y, colorPreference) {
        this.x = x;
        this.y = y;
        this.colorPreference = colorPreference;
        this.energy = 1000;
    }

    draw() {
        ctx.fillStyle = `rgb(${this.colorPreference.r}, ${this.colorPreference.g}, ${this.colorPreference.b})`;
        ctx.beginPath();
        ctx.arc(this.x, this.y, 5, 0, 2 * Math.PI);
        ctx.closePath();
        ctx.fill();
    }
}

const foodSources = [];

function createFoodSources() {
    for (let i = 0; i < startingFoodSourcesCount; i++) {
        const x = Math.random() * canvas.width;
        const y = Math.random() * canvas.height;
        const colorPreference = {
            r: Math.floor(Math.random() * 256),
            g: Math.floor(Math.random() * 256),
            b: Math.floor(Math.random() * 256),
        };
        foodSources.push(new FoodSource(x, y, colorPreference));
    }
}

function addRandomOrganism() {
    const x = Math.random() * canvas.width;
    const y = Math.random() * canvas.height;
    const color = {
        r: Math.floor(Math.random() * 256),
        g: Math.floor(Math.random() * 256),
        b: Math.floor(Math.random() * 256),
    };
    organisms.push(new Organism(x, y, color));
}

function addRandomFoodSource() {
    const x = Math.random() * canvas.width;
    const y = Math.random() * canvas.height;
    const colorPreference = {
        r: Math.floor(Math.random() * 256),
        g: Math.floor(Math.random() * 256),
        b: Math.floor(Math.random() * 256),
    };
    foodSources.push(new FoodSource(x, y, colorPreference));
}

function addFoodSource(x, y, color) {
    const colorPreference = {
        r: color.r,
        g: color.g,
        b: color.b,
    };
    foodSources.push(new FoodSource(x, y, colorPreference));
}

function addSelectedFoodSource(event) {
    const x = event.clientX - canvas.offsetLeft;
    const y = event.clientY - canvas.offsetTop;
    const colorPicker = document.getElementById('foodSourceColor');
    const colorValue = colorPicker.value;

    const color = {
        r: parseInt(colorValue.slice(1, 3), 16),
        g: parseInt(colorValue.slice(3, 5), 16),
        b: parseInt(colorValue.slice(5, 7), 16),
    };

    addFoodSource(x, y, color);
    updateCurrentAction('Food Source');
}


addFoodSourceBtn.addEventListener('click', (event) => {
    canvas.removeEventListener('click', addOrganismOnClick);
    canvas.addEventListener('click', addSelectedFoodSource);
    updateCurrentAction('Food Source');
});


function updateCurrentAction(action) {
    const currentActionElement = document.getElementById('currentAction');
    currentActionElement.innerText = `Adding: ${action}`;
}
function addOrganismOnClick(event) {
    const x = event.clientX - canvas.offsetLeft;
    const y = event.clientY - canvas.offsetTop;
    const color = {
        r: Math.floor(Math.random() * 256),
        g: Math.floor(Math.random() * 256),
        b: Math.floor(Math.random() * 256),
    };
    organisms.push(new Organism(x, y, color));
    updateCurrentAction('Organism');
}
function switchToAddOrganismMode() {
    canvas.removeEventListener('click', addSelectedFoodSource);
    canvas.addEventListener('click', addOrganismOnClick);
    updateCurrentAction('Organism');
}
const addOrganismBtn = document.getElementById('addOrganismBtn');
addOrganismBtn.addEventListener('click', switchToAddOrganismMode);


createOrganisms();
createFoodSources();

