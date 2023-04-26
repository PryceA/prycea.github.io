const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

const organismSize = 5;
const organismsCount = 100;
const organisms = [];
const scanRadius = 200;
const movementCost = .000001;
const newOrganismFrequency = 0.01; // Set the desired frequency (e.g., 0.01 for 1% chance per frame)
const newFoodSourceFrequency = 0.1; // Set the desired frequency (e.g., 0.005 for 0.5% chance per frame)
const reproductionEnergyThreshold = 30;
const sameSpeciesColorDistance = 100; // The "color distance" that is considered the same species
const sameFoodColorDistance = 200;

class Organism {
    constructor(x, y, color) {
        this.x = x;
        this.y = y;
        this.color = {...color};
        this.size = Math.random() * (10 - 1) + 1;
        this.speed = 1; // You can set a constant value or use another attribute for speed
        this.directionVector = { x: 0, y: 0 };
    }

    draw() {
        this.size = this.size; // Update the size based on energy

        ctx.fillStyle = `rgba(${this.color.r}, ${this.color.g}, ${this.color.b}, 255)`;
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.size, 0, 2 * Math.PI);
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
            const distance = Math.sqrt(dx * dx + dy * dy);

            // If same color, then only consider for reproduction
            if (colorDistance <= sameSpeciesColorDistance) {
                if (distance < scanRadius && this.size > reproductionEnergyThreshold && otherOrganism.size > reproductionEnergyThreshold) {
                    const vectorMagnitude = this.color.b / 255;
                    const normalizedVector = {
                        x: (dx/distance) * vectorMagnitude / distance,
                        y: (dy/distance) * vectorMagnitude / distance,
                    };

                    directionVectors.push(normalizedVector);
                } else {
                    continue;
                }
            }
            
            if (distance < scanRadius) {
                let vectorMagnitude;
                if (otherOrganism.size > this.size) {
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
            const energyCost = Math.pow(this.size, 3) * movementCost; // Replace this.color.b with this.speed


            // Move only if there's enough energy
            if (this.size - energyCost >= 0) {
                const newX = this.x + directionVector.x/maxMagnitude * this.speed;
                const newY = this.y + directionVector.y/maxMagnitude * this.speed;

                // Check if the new position is within the canvas bounds
                if (newX >= 0 && newX <= canvas.width) {
                    this.x = newX;
                }
                if (newY >= 0 && newY <= canvas.height) {
                    this.y = newY;
                }

                this.size -= energyCost;
            }

            this.checkForCollisions();
        }
    }


    checkForCollisions() {
        for (const otherOrganism of organisms) {
           if (otherOrganism === this) continue;

            const colorDistance = Math.sqrt(
                Math.pow(this.color.r - otherOrganism.color.r, 2) +
                Math.pow(this.color.g - otherOrganism.color.g, 2) +
                Math.pow(this.color.b - otherOrganism.color.b, 2)
            );

            if (colorDistance <= sameSpeciesColorDistance) {
                if (this.size > reproductionEnergyThreshold && otherOrganism.size > reproductionEnergyThreshold) {
                    this.reproduce();
                    otherOrganism.reproduce();
                }
                continue;
            }
            
            const dx = otherOrganism.x - this.x;
            const dy = otherOrganism.y - this.y;
            const distance = Math.sqrt(dx * dx + dy * dy);
            const minDistance = (this.size + otherOrganism.size) / 2 + 10; // +10 is just to help catch guys stuck on the side

            if (distance < minDistance) {
                if (this.size > otherOrganism.size) {
                    this.size += otherOrganism.size; // Add the smaller organism's energy to the larger organism
                    organisms.splice(organisms.indexOf(otherOrganism), 1);
                } else {
                    otherOrganism.size += this.size; // Add the smaller organism's energy to the larger organism
                    organisms.splice(organisms.indexOf(this), 1);
                }
            }
        }
    }

    reproduce() {
        if (this.size > reproductionEnergyThreshold) {
            console.log(`Reproducing. Color: ${this.color.r}, ${this.color.g}, ${this.color.b}`);
            const offspringSize = this.size * 0.5;
            const offspringColor = {
                r: Math.floor(this.color.r + (Math.random() * 20 - 10)),
                g: Math.floor(this.color.g + (Math.random() * 20 - 10)),
                b: Math.floor(this.color.b + (Math.random() * 20 - 10)),
            };

            // Randomly choose an angle for the offspring's position
            const angle = Math.random() * 2 * Math.PI;
            const distanceFromParent = this.size + offspringSize;

            const offspringX = this.x + distanceFromParent * Math.cos(angle);
            const offspringY = this.y + distanceFromParent * Math.sin(angle);

            const offspring = new Organism(offspringX, offspringY, offspringColor);
            offspring.size = offspringSize;
            organisms.push(offspring);

            this.size -= offspringSize;
        }
    }

    consumeFood() {
        for (const foodSource of foodSources) {
            const dx = foodSource.x - this.x;
            const dy = foodSource.y - this.y;
            const distance = Math.sqrt(dx * dx + dy * dy);
            const minDistance = (this.size + 5) / 2;

            if (distance < minDistance) {
                const colorDistance = Math.sqrt(
                    Math.pow(this.color.r - foodSource.colorPreference.r, 2) +
                    Math.pow(this.color.g - foodSource.colorPreference.g, 2) +
                    Math.pow(this.color.b - foodSource.colorPreference.b, 2)
                );

                const energyGain = Math.max(0, (sameFoodColorDistance - colorDistance) / 255 * foodSource.energy);
                this.size += energyGain;
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
    for (let i = 0; i < organismsCount; i++) {
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
        this.energy = 10;
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
    for (let i = 0; i < 10; i++) {
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


