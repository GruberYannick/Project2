var FieldState;
(function (FieldState) {
    FieldState[FieldState["Unset"] = 0] = "Unset";
    FieldState[FieldState["Alive"] = 1] = "Alive";
    FieldState[FieldState["Dead"] = 2] = "Dead";
})(FieldState || (FieldState = {}));
class GameField extends HTMLElement {
    constructor() {
        super();
        this.columns = 60;
        this.rows = 25;
        this.size = 0;
        this.viewportWidth = 0;
        this.viewportHeight = 0;
        this.gameField = [];
        this.mouseDown = false;
        this.running = false;
        this.generation = 1;
        this.initialized = false;
        this.speed = 0;
        this.unsetColor = "#ffffff";
        this.aliveColor = "#00008b";
        this.deadColor = "#90ee90";
    }
    connectedCallback() {
        window.onresize = () => this.viewportUpdated();
        this.gameField = this.createGameField();
        this.setViewportValues();
        this.size = Math.min(this.viewportWidth / this.columns, this.viewportHeight / this.rows);
        this.attachShadow({ mode: "open" });
        this.createShadowDom();
        this.initialized = true;
    }
    attributeChangedCallback(name, oldValue, newValue) {
        if (this.initialized) {
            switch (name) {
                case "width":
                    this.widthUpdated(newValue);
                    break;
                case "height":
                    this.heightUpdated(newValue);
                    break;
                case "start":
                    this.doStart();
                    break;
                case "pause":
                    this.doPause();
                    break;
                case "clear":
                    this.doClear();
                    break;
                case "level":
                    this.loadLevel(newValue);
                    break;
                case "random":
                    this.randomize();
                    break;
                case "speed":
                    this.speedUpdated(newValue);
                    break;
                case "unset_color":
                    this.unsetColorUpdated(newValue);
                    break;
                case "alive_color":
                    this.aliveColorUpdated(newValue);
                    break;
                case "dead_color":
                    this.deadColorUpdated(newValue);
                    break;
                default:
                    break;
            }
        }
    }
    static get observedAttributes() {
        return ["width", "height", "start", "pause", "clear", "level", "random", "speed", "unset_color", "alive_color", "dead_color"];
    }
    createGameField() {
        const arr = [];
        for (let row = 0; row < this.rows; row++) {
            arr[row] = [];
            for (let column = 0; column < this.columns; column++) {
                arr[row][column] = FieldState.Unset;
            }
        }
        return arr;
    }
    widthUpdated(newWidth) {
        const width = parseInt(newWidth, 10);
        if (!isNaN(width)) {
            const columns = Math.max(10, width);
            if (columns !== this.columns) {
                this.columns = columns;
                this.sizeUpdated();
            }
        }
        this.dispatchEvent(new CustomEvent("widthUpdatedEvent", { detail: this.columns }));
    }
    heightUpdated(newHeight) {
        const height = parseInt(newHeight, 10);
        if (!isNaN(height)) {
            const rows = Math.max(10, height);
            if (rows !== this.rows) {
                this.rows = rows;
                this.sizeUpdated();
            }
        }
        this.dispatchEvent(new CustomEvent("heightUpdatedEvent", { detail: this.rows }));
    }
    speedUpdated(newSpeed) {
        const speed = parseInt(newSpeed, 10);
        if (!isNaN(speed)) {
            if (speed !== this.speed) {
                this.speed = speed;
            }
        }
        this.dispatchEvent(new CustomEvent("speedUpdatedEvent", { detail: this.speed }));
    }
    sizeUpdated() {
        this.gameField = this.createGameField();
        this.generation = 1;
        this.size = Math.min(this.viewportWidth / this.columns, this.viewportHeight / this.rows);
        this.createShadowDom();
        this.dispatchEvent(new CustomEvent("generationUpdatedEvent", { detail: this.generation }));
    }
    unsetColorUpdated(unsetColor) {
        this.unsetColor = unsetColor;
        this.updateShadowCss();
    }
    aliveColorUpdated(aliveColor) {
        this.aliveColor = aliveColor;
        this.updateShadowCss();
    }
    deadColorUpdated(deadColor) {
        this.deadColor = deadColor;
        this.updateShadowCss();
    }
    updateShadowCss() {
        const shadow = this.shadowRoot;
        const childNodes = Array.from(shadow.childNodes);
        childNodes.forEach((childNode) => {
            if (childNode.nodeName === "STYLE") {
                childNode.textContent = `
        .cell {
          box-sizing: border-box;
          width: ${this.size}px;
          height: ${this.size}px;
          background-color: white;
          float: left;
          background-clip: content-box;
          padding: 1px;
        }

        .row {
          box-sizing: border-box;
          width: ${this.size * this.columns}px;
          height: ${this.size}px;
          clear: both;
          float: left;
        }

        .grid {
          box-sizing: border-box;
          width: ${this.size * this.columns}px;
          height: ${this.size * this.rows}px;
          margin: auto;
        }

        .unset {
          background-color: ${this.unsetColor};
        }

        .alive {
          background-color: ${this.aliveColor};
        }

        .dead {
          background-color: ${this.deadColor};
        }
        `;
            }
        });
    }
    setViewportValues() {
        this.viewportWidth = Math.min(document.documentElement.clientWidth, window.innerWidth);
        this.viewportHeight = Math.min(document.documentElement.clientHeight, window.innerHeight);
    }
    viewportUpdated() {
        this.setViewportValues();
        this.size = Math.min(this.viewportWidth / this.columns, this.viewportHeight / this.rows);
        const styleSheets = this.shadowRoot.styleSheets;
        let styleSheet = {};
        styleSheet = styleSheets[0];
        // .cell
        styleSheet["cssRules"][0].style.width = `${this.size}px`;
        styleSheet["cssRules"][0].style.height = `${this.size}px`;
        // .row
        styleSheet["cssRules"][1].style.width = `${this.size * this.columns}px`;
        styleSheet["cssRules"][1].style.height = `${this.size}px`;
        // .grid
        styleSheet["cssRules"][2].style.width = `${this.size * this.columns}px`;
        styleSheet["cssRules"][2].style.height = `${this.size * this.rows}px`;
    }
    createShadowDom() {
        this.shadowRoot.innerHTML = this.createShadowCss();
        const gridElem = this.createShadowGameField();
        this.shadowRoot.appendChild(gridElem);
        this.viewportUpdated();
    }
    createShadowCss() {
        return `<style>
    .cell {
      box-sizing: border-box;
      width: ${this.size}px;
      height: ${this.size}px;
      background-color: white;
      float: left;
      background-clip: content-box;
      padding: 1px;
    }

    .row {
      box-sizing: border-box;
      width: ${this.size * this.columns}px;
      height: ${this.size}px;
      clear: both;
      float: left;
    }

    .grid {
      box-sizing: border-box;
      width: ${this.size * this.columns}px;
      height: ${this.size * this.rows}px;
      margin: auto;
    }

    .unset {
      background-color: ${this.unsetColor};
    }

    .alive {
      background-color: ${this.aliveColor};
    }

    .dead {
      background-color: ${this.deadColor};
    }
    </style>
    `;
    }
    createShadowGameField() {
        const gridElem = document.createElement("div");
        gridElem.className = "grid";
        for (let row = 0; row < this.rows; row++) {
            const rowElem = document.createElement("div");
            rowElem.className = "row";
            for (let column = 0; column < this.columns; column++) {
                const cellElem = document.createElement("div");
                // finding this cell again is much faster if the elements are in one attribute
                // and even faster if they are in the id.
                // By using two attributes or something else than the id, everything crawls to a stop.
                cellElem.setAttribute("id", `${row},${column}`);
                switch (this.gameField[row][column]) {
                    case FieldState.Unset:
                        cellElem.className = "cell unset";
                        break;
                    case FieldState.Alive:
                        cellElem.className = "cell alive";
                        break;
                    case FieldState.Dead:
                        cellElem.className = "cell dead";
                        break;
                    default:
                        break;
                }
                cellElem.addEventListener("mouseover", () => this.cellHoveredHandler(row, column));
                cellElem.addEventListener("mousedown", () => this.cellDownHandler(row, column));
                cellElem.addEventListener("mouseup", () => this.cellUpHandler());
                cellElem.addEventListener("touchstart", () => this.cellTouchedHandler(row, column));
                rowElem.appendChild(cellElem);
            }
            gridElem.addEventListener("mousedown", () => this.fieldDownHandler());
            gridElem.addEventListener("mouseup", () => this.fieldUpHandler());
            gridElem.appendChild(rowElem);
        }
        return gridElem;
    }
    doStart() {
        if (!this.running) {
            this.running = true;
            this.dispatchEvent(new CustomEvent("runningStartedEvent", { detail: this.running }));
            this.execute();
        }
    }
    doPause() {
        this.running = false;
        this.dispatchEvent(new CustomEvent("runningStoppedEvent", { detail: this.running }));
    }
    doClear() {
        this.running = false;
        this.gameField = this.createGameField();
        this.generation = 1;
        this.updateField();
        this.dispatchEvent(new CustomEvent("generationUpdatedEvent", { detail: this.generation }));
        this.dispatchEvent(new CustomEvent("runningStoppedEvent", { detail: this.running }));
    }
    loadLevel(level) {
        const levelArray = level.split("\n");
        const rows = levelArray.length;
        let columns = 0;
        for (let row = 0; row < levelArray.length; row++) {
            levelArray[row] = levelArray[row].replace(/\s/g, "");
            columns = Math.max(columns, levelArray[row].length);
        }
        this.heightUpdated(rows.toString());
        this.widthUpdated(columns.toString());
        this.doClear();
        for (let row = 0; row < levelArray.length; row++) {
            levelArray[row] += "0".repeat(columns - levelArray[row].length);
            for (let column = 0; column < columns; column++) {
                if (parseInt(levelArray[row][column], 10) === FieldState.Alive) {
                    this.gameField[row][column] = FieldState.Alive;
                }
                else {
                    this.gameField[row][column] = FieldState.Unset;
                }
            }
        }
        this.createShadowDom();
    }
    randomize() {
        this.doClear();
        for (let row = 0; row < this.rows; row++) {
            for (let column = 0; column < this.columns; column++) {
                this.gameField[row][column] = Math.round(Math.random());
            }
        }
        this.updateField();
    }
    execute() {
        if (this.running) {
            const nextGenerationGameField = this.calculateNextGenerationGameField();
            this.gameField = nextGenerationGameField;
            this.updateField();
            this.generation++;
            this.dispatchEvent(new CustomEvent("generationUpdatedEvent", { detail: this.generation }));
            setTimeout(function () {
                this.execute();
            }.bind(this), this.speed);
        }
    }
    calculateNextGenerationGameField() {
        const nextGenerationGameField = this.createGameField();
        let countDifferentCells = 0;
        for (let row = 0; row < this.rows; row++) {
            for (let column = 0; column < this.columns; column++) {
                nextGenerationGameField[row][column] = this.calculateNextGenerationCell(row, column);
                if (nextGenerationGameField[row][column] !== this.gameField[row][column]) {
                    countDifferentCells++;
                }
            }
        }
        if (countDifferentCells === 0) {
            this.doPause();
        }
        return nextGenerationGameField;
    }
    calculateNextGenerationCell(row, column) {
        const aliveNeighbours = this.countAliveNeighbours(row, column);
        if (this.gameField[row][column] === FieldState.Alive) {
            if (aliveNeighbours <= 1) {
                return FieldState.Dead;
            }
            else if (aliveNeighbours >= 4) {
                return FieldState.Dead;
            }
            else {
                return FieldState.Alive;
            }
        }
        else {
            if (aliveNeighbours === 3) {
                return FieldState.Alive;
            }
            else {
                return this.gameField[row][column];
            }
        }
    }
    countAliveNeighbours(row, column) {
        let aliveNeighbours = 0;
        for (let i = -1; i <= 1; i++) {
            for (let j = -1; j <= 1; j++) {
                const rowToCheck = (row + i + this.rows) % this.rows;
                const columnToCheck = (column + j + this.columns) % this.columns;
                if (this.gameField[rowToCheck][columnToCheck] === FieldState.Alive) {
                    aliveNeighbours++;
                }
            }
        }
        if (this.gameField[row][column] === FieldState.Alive) {
            aliveNeighbours--;
        }
        return aliveNeighbours;
    }
    updateField() {
        for (let row = 0; row < this.rows; row++) {
            for (let column = 0; column < this.columns; column++) {
                // finding this cell is much faster if the elements are in one attribute and even faster if they are in the id.
                // By using two attributes or something else than the id, everything crawls to a stop.
                const cell = this.shadowRoot.getElementById(`${row},${column}`);
                if (this.gameField[row][column] === FieldState.Unset) {
                    cell.setAttribute("class", "cell unset");
                }
                else if (this.gameField[row][column] === FieldState.Alive) {
                    cell.setAttribute("class", "cell alive");
                }
                else if (this.gameField[row][column] === FieldState.Dead) {
                    cell.setAttribute("class", "cell dead");
                }
            }
        }
    }
    cellTouchedHandler(row, column) {
        if (this.gameField[row][column] !== FieldState.Alive) {
            this.gameField[row][column] = FieldState.Alive;
            this.updateField();
        }
    }
    cellDownHandler(row, column) {
        this.mouseDown = true;
        if (this.gameField[row][column] !== FieldState.Alive) {
            this.gameField[row][column] = FieldState.Alive;
            this.updateField();
        }
    }
    fieldDownHandler() {
        this.mouseDown = true;
    }
    cellUpHandler() {
        this.mouseDown = false;
    }
    fieldUpHandler() {
        this.mouseDown = false;
    }
    cellHoveredHandler(row, column) {
        if (this.mouseDown && (this.gameField[row][column] !== FieldState.Alive)) {
            this.gameField[row][column] = FieldState.Alive;
            this.updateField();
        }
    }
}
window.customElements.define("cgol-pitch", GameField);

//# sourceMappingURL=data:application/json;charset=utf8;base64,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QUFFLENBQUM7UUFDOUMsVUFBVSxHQUFHLFdBQVcsQ0FBQyxDQUFDLENBQUMsQ0FBQztRQUU1QixRQUFRO1FBQ1IsVUFBVSxDQUFDLFVBQVUsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLEtBQUssQ0FBQyxLQUFLLEdBQUcsR0FBRyxJQUFJLENBQUMsSUFBSSxJQUFJLENBQUM7UUFDekQsVUFBVSxDQUFDLFVBQVUsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLEtBQUssQ0FBQyxNQUFNLEdBQUcsR0FBRyxJQUFJLENBQUMsSUFBSSxJQUFJLENBQUM7UUFFMUQsT0FBTztRQUNQLFVBQVUsQ0FBQyxVQUFVLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxLQUFLLENBQUMsS0FBSyxHQUFHLEdBQUcsSUFBSSxDQUFDLElBQUksR0FBRyxJQUFJLENBQUMsT0FBTyxJQUFJLENBQUM7UUFDeEUsVUFBVSxDQUFDLFVBQVUsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLEtBQUssQ0FBQyxNQUFNLEdBQUcsR0FBRyxJQUFJLENBQUMsSUFBSSxJQUFJLENBQUM7UUFFMUQsUUFBUTtRQUNSLFVBQVUsQ0FBQyxVQUFVLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxLQUFLLENBQUMsS0FBSyxHQUFHLEdBQUcsSUFBSSxDQUFDLElBQUksR0FBRyxJQUFJLENBQUMsT0FBTyxJQUFJLENBQUM7UUFDeEUsVUFBVSxDQUFDLFVBQVUsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLEtBQUssQ0FBQyxNQUFNLEdBQUcsR0FBRyxJQUFJLENBQUMsSUFBSSxHQUFHLElBQUksQ0FBQyxJQUFJLElBQUksQ0FBQztJQUN4RSxDQUFDO0lBRU8sZUFBZTtRQUNyQixJQUFJLENBQUMsVUFBVSxDQUFDLFNBQVMsR0FBRyxJQUFJLENBQUMsZUFBZSxFQUFFLENBQUM7UUFDbkQsTUFBTSxRQUFRLEdBQUcsSUFBSSxDQUFDLHFCQUFxQixFQUFFLENBQUM7UUFDOUMsSUFBSSxDQUFDLFVBQVUsQ0FBQyxXQUFXLENBQUMsUUFBUSxDQUFDLENBQUM7UUFD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S0FBSyxDQUFDLEtBQUssQ0FBQyxJQUFJLENBQUMsQ0FBQztRQUVyQyxNQUFNLElBQUksR0FBRyxVQUFVLENBQUMsTUFBTSxDQUFDO1FBQy9CLElBQUksT0FBTyxHQUFHLENBQUMsQ0FBQztRQUVoQixLQUFLLElBQUksR0FBRyxHQUFHLENBQUMsRUFBRSxHQUFHLEdBQUcsVUFBVSxDQUFDLE1BQU0sRUFBRSxHQUFHLEVBQUUsRUFBRTtZQUNoRCxVQUFVLENBQUMsR0FBRyxDQUFDLEdBQUcsVUFBVSxDQUFDLEdBQUcsQ0FBQyxDQUFDLE9BQU8sQ0FBQyxLQUFLLEVBQUUsRUFBRSxDQUFDLENBQUM7WUFDckQsT0FBTyxHQUFHLElBQUksQ0FBQyxHQUFHLENBQUMsT0FBTyxFQUFFLFVBQVUsQ0FBQyxHQUFHLENBQUMsQ0FBQyxNQUFNLENBQUMsQ0FBQztTQUNyRDtRQUVELElBQUksQ0FBQyxhQUFhLENBQUMsSUFBSSxDQUFDLFFBQVEsRUFBRSxDQUFDLENBQUM7UUFDcEMsSUFBSSxDQUFDLFlBQVksQ0FBQyxPQUFPLENBQUMsUUFBUSxFQUFFLENBQUMsQ0FBQztRQUV0QyxJQUFJLENBQUMsT0FBTyxFQUFFLENBQUM7UUFFZixLQUFLLElBQUksR0FBRyxHQUFHLENBQUMsRUFBRSxHQUFHLEdBQUcsVUFBVSxDQUFDLE1BQU0sRUFBRSxHQUFHLEVBQUUsRUFBRTtZQUNoRCxVQUFVLENBQUMsR0FBRyxDQUFDLElBQUksR0FBRyxDQUFDLE1BQU0sQ0FBQyxPQUFPLEdBQUcsVUFBVSxDQUFDLEdBQUcsQ0FBQyxDQUFDLE1BQU0sQ0FBQyxDQUFDO1lBQ2hFLEtBQUssSUFBSSxNQUFNLEdBQUcsQ0FBQyxFQUFFLE1BQU0sR0FBRyxPQUFPLEVBQUUsTUFBTSxFQUFFLEVBQUU7Z0JBQy9DLElBQUksUUFBUSxDQUFDLFVBQVUsQ0FBQyxHQUFHLENBQUMsQ0FBQyxNQUFNLENBQUMsRUFBRSxFQUFFLENBQUMsS0FBSyxVQUFVLENBQUMsS0FBSyxFQUFFO29CQUM5RCxJQUFJLENBQUMsU0FBUyxDQUFDLEdBQUcsQ0FBQyxDQUFDLE1BQU0sQ0FBQyxHQUFHLFVBQVUsQ0FBQyxLQUFLLENBQUM7aUJBQ2hEO3FCQUFNO29CQUNMLElBQUksQ0FBQyxTQUFTLENBQUMsR0FBRyxDQUFDLENBQUMsTUFBTSxDQUFDLEdBQUcsVUFBVSxDQUFDLEtBQUssQ0FBQztpQkFDaEQ7YUFDRjtTQUNGO1FBRUQsSUFBSSxDQUFDLGVBQWUsRUFBRSxDQUFDO0lBQ3pCLENBQUM7SUFFTyxTQUFTO1FBQ2YsSUFBSSxDQUFDLE9BQU8sRUFBRSxDQUFDO1FBRWYsS0FBSyxJQUFJLEdBQUcsR0FBVyxDQUFDLEVBQUUsR0FBRyxHQUFHLElBQUksQ0FBQyxJQUFJLEVBQUUsR0FBRyxFQUFFLEVBQUU7WUFDaEQsS0FBSyxJQUFJLE1BQU0sR0FBVyxDQUFDLEVBQUUsTUFBTSxHQUFHLElBQUksQ0FBQyxPQUFPLEVBQUUsTUFBTSxFQUFFLEVBQUU7Z0JBQzVELElBQUksQ0FBQyxTQUFTLENBQUMsR0FBRyxDQUFDLENBQUMsTUFBTSxDQUFDLEdBQUcsSUFBSSxDQUFDLEtBQUssQ0FBQyxJQUFJLENBQUMsTUFBTSxFQUFFLENBQUMsQ0FBQzthQUN6RDtTQUNGO1FBRUQsSUFBSSxDQUFDLFdBQVcsRUFBRSxDQUFDO0lBQ3JCLENBQUM7SUFFTyxPQUFPO1FBQ2IsSUFBSSxJQUFJLENBQUMsT0FBTyxFQUFFO1lBQ2hCLE1BQU0sdUJBQXVCLEdBQUcsSUFBSSxDQUFDLGdDQUFnQyxFQUFFLENBQUM7WUFFeEUsSUFBSSxDQUFDLFNBQVMsR0FBRyx1QkFBdUIsQ0FBQztZQUN6QyxJQUFJLENBQUMsV0FBVyxFQUFFLENBQUM7WUFFbkIsSUFBSSxDQUFDLFVBQVUsRUFBRSxDQUFDO1lBQ2xCLElBQUksQ0FBQyxhQUFhLENBQUMsSUFBSSxXQUFXLENBQUMsd0JBQXdCLEVBQUUsRUFBRSxNQUFNLEVBQUUsSUFBSSxDQUFDLFVBQVUsRUFBRSxDQUFDLENBQUMsQ0FBQztZQUUzRixVQUFVLENBQUM7Z0JBQ1QsSUFBSSxDQUFDLE9BQU8sRUFBRSxDQUFDO1lBQ2pCLENBQUMsQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFDLEVBQUUsSUFBSSxDQUFDLEtBQUssQ0FBQyxDQUFDO1NBQzNCO0lBQ0gsQ0FBQztJQUVPLGdDQUFnQztRQUN0QyxNQUFNLHVCQUF1QixHQUFHLElBQUksQ0FBQyxlQUFlLEVBQUUsQ0FBQztRQUN2RCxJQUFJLG1CQUFtQixHQUFHLENBQUMsQ0FBQztRQUU1QixLQUFLLElBQUksR0FBRyxHQUFXLENBQUMsRUFBRSxHQUFHLEdBQUcsSUFBSSxDQUFDLElBQUksRUFBRSxHQUFHLEVBQUUsRUFBRTtZQUNoRCxLQUFLLElBQUksTUFBTSxHQUFXLENBQUMsRUFBRSxNQUFNLEdBQUcsSUFBSSxDQUFDLE9BQU8sRUFBRSxNQUFNLEVBQUUsRUFBRTtnQkFDNUQsdUJBQXVCLENBQUMsR0FBRyxDQUFDLENBQUMsTUFBTSxDQUFDLEdBQUcsSUFBSSxDQUFDLDJCQUEyQixDQUFDLEdBQUcsRUFBRSxNQUFNLENBQUMsQ0FBQztnQkFDckYsSUFBSSx1QkFBdUIsQ0FBQyxHQUFHLENBQUMsQ0FBQyxNQUFNLENBQUMsS0FBSyxJQUFJLENBQUMsU0FBUyxDQUFDLEdBQUcsQ0FBQyxDQUFDLE1BQU0sQ0FBQyxFQUFFO29CQUN4RSxtQkFBbUIsRUFBRSxDQUFDO2lCQUN2QjthQUNGO1NBQ0Y7UUFFRCxJQUFJLG1CQUFtQixLQUFLLENBQUMsRUFBRTtZQUM3QixJQUFJLENBQUMsT0FBTyxFQUFFLENBQUM7U0FDaEI7UUFFRCxPQUFPLHVCQUF1QixDQUFDO0lBQ2pDLENBQUM7SUFFTywyQkFBMkIsQ0FBQyxHQUFXLEVBQUUsTUFBYztRQUM3RCxNQUFNLGVBQWUsR0FBRyxJQUFJLENBQUMsb0JBQW9CLENBQUMsR0FBRyxFQUFFLE1BQU0sQ0FBQyxDQUFDO1FBRS9ELElBQUksSUFBSSxDQUFDLFNBQVMsQ0FBQyxHQUFHLENBQUMsQ0FBQyxNQUFNLENBQUMsS0FBSyxVQUFVLENBQUMsS0FBSyxFQUFFO1lBQ3BELElBQUksZUFBZSxJQUFJLENBQUMsRUFBRTtnQkFDeEIsT0FBTyxVQUFVLENBQUMsSUFBSSxDQUFDO2FBQ3hCO2lCQUFNLElBQUksZUFBZSxJQUFJLENBQUMsRUFBRTtnQkFDL0IsT0FBTyxVQUFVLENBQUMsSUFBSSxDQUFDO2FBQ3hCO2lCQUFNO2dCQUNMLE9BQU8sVUFBVSxDQUFDLEtBQUssQ0FBQzthQUN6QjtTQUNGO2FBQU07WUFDTCxJQUFJLGVBQWUsS0FBSyxDQUFDLEVBQUU7Z0JBQ3pCLE9BQU8sVUFBVSxDQUFDLEtBQUssQ0FBQzthQUN6QjtpQkFBTTtnQkFDTCxPQUFPLElBQUksQ0FBQyxTQUFTLENBQUMsR0FBRyxDQUFDLENBQUMsTUFBTSxDQUFDLENBQUM7YUFDcEM7U0FDRjtJQUNILENBQUM7SUFFTyxvQkFBb0IsQ0FBQyxHQUFXLEVBQUUsTUFBYztRQUN0RCxJQUFJLGVBQWUsR0FBRyxDQUFDLENBQUM7UUFFeEIsS0FBSyxJQUFJLENBQUMsR0FBVyxDQUFDLENBQUMsRUFBRSxDQUFDLElBQUksQ0FBQyxFQUFFLENBQUMsRUFBRSxFQUFFO1lBQ3BDLEtBQUssSUFBSSxDQUFDLEdBQVcsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxJQUFJLENBQUMsRUFBRSxDQUFDLEVBQUUsRUFBRTtnQkFDcEMsTUFBTSxVQUFVLEdBQUcsQ0FBQyxHQUFHLEdBQUcsQ0FBQyxHQUFHLElBQUksQ0FBQyxJQUFJLENBQUMsR0FBRyxJQUFJLENBQUMsSUFBSSxDQUFDO2dCQUNyRCxNQUFNLGFBQWEsR0FBRyxDQUFDLE1BQU0sR0FBRyxDQUFDLEdBQUcsSUFBSSxDQUFDLE9BQU8sQ0FBQyxHQUFHLElBQUksQ0FBQyxPQUFPLENBQUM7Z0JBQ2pFLElBQUksSUFBSSxDQUFDLFNBQVMsQ0FBQyxVQUFVLENBQUMsQ0FBQyxhQUFhLENBQUMsS0FBSyxVQUFVLENBQUMsS0FBSyxFQUFFO29CQUNsRSxlQUFlLEVBQUUsQ0FBQztpQkFDbkI7YUFDRjtTQUNGO1FBRUQsSUFBSSxJQUFJLENBQUMsU0FBUyxDQUFDLEdBQUcsQ0FBQyxDQUFDLE1BQU0sQ0FBQyxLQUFLLFVBQVUsQ0FBQyxLQUFLLEVBQUU7WUFDcEQsZUFBZSxFQUFFLENBQUM7U0FDbkI7UUFFRCxPQUFPLGVBQWUsQ0FBQztJQUN6QixDQUFDO0lBRU8sV0FBVztRQUNqQixLQUFLLElBQUksR0FBRyxHQUFHLENBQUMsRUFBRSxHQUFHLEdBQUcsSUFBSSxDQUFDLElBQUksRUFBRSxHQUFHLEVBQUUsRUFBRTtZQUN4QyxLQUFLLElBQUksTUFBTSxHQUFHLENBQUMsRUFBRSxNQUFNLEdBQUcsSUFBSSxDQUFDLE9BQU8sRUFBRSxNQUFNLEVBQUUsRUFBRTtnQkFFcEQsK0dBQStHO2dCQUMvRyxzRkFBc0Y7Z0JBQ3RGLE1BQU0sSUFBSSxHQUFHLElBQUksQ0FBQyxVQUFVLENBQUMsY0FBYyxDQUFDLEdBQUcsR0FBRyxJQUFJLE1BQU0sRUFBRSxDQUFDLENBQUM7Z0JBRWhFLElBQUksSUFBSSxDQUFDLFNBQVMsQ0FBQyxHQUFHLENBQUMsQ0FBQyxNQUFNLENBQUMsS0FBSyxVQUFVLENBQUMsS0FBSyxFQUFFO29CQUNwRCxJQUFJLENBQUMsWUFBWSxDQUFDLE9BQU8sRUFBRSxZQUFZLENBQUMsQ0FBQztpQkFDMUM7cUJBQU0sSUFBSSxJQUFJLENBQUMsU0FBUyxDQUFDLEdBQUcsQ0FBQyxDQUFDLE1BQU0sQ0FBQyxLQUFLLFVBQVUsQ0FBQyxLQUFLLEVBQUU7b0JBQzNELElBQUksQ0FBQyxZQUFZLENBQUMsT0FBTyxFQUFFLFlBQVksQ0FBQyxDQUFDO2lCQUMxQztxQkFBTSxJQUFJLElBQUksQ0FBQyxTQUFTLENBQUMsR0FBRyxDQUFDLENBQUMsTUFBTSxDQUFDLEtBQUssVUFBVSxDQUFDLElBQUksRUFBRTtvQkFDMUQsSUFBSSxDQUFDLFlBQVksQ0FBQyxPQUFPLEVBQUUsV0FBVyxDQUFDLENBQUM7aUJBQ3pDO2FBQ0Y7U0FDRjtJQUNILENBQUM7SUFFTyxrQkFBa0IsQ0FBQyxHQUFXLEVBQUUsTUFBYztRQUNwRCxJQUFJLElBQUksQ0FBQyxTQUFTLENBQUMsR0FBRyxDQUFDLENBQUMsTUFBTSxDQUFDLEtBQUssVUFBVSxDQUFDLEtBQUssRUFBRTtZQUNwRCxJQUFJLENBQUMsU0FBUyxDQUFDLEdBQUcsQ0FBQyxDQUFDLE1BQU0sQ0FBQyxHQUFHLFVBQVUsQ0FBQyxLQUFLLENBQUM7WUFDL0MsSUFBSSxDQUFDLFdBQVcsRUFBRSxDQUFDO1NBQ3BCO0lBQ0gsQ0FBQztJQUVPLGVBQWUsQ0FBQyxHQUFXLEVBQUUsTUFBYztRQUNqRCxJQUFJLENBQUMsU0FBUyxHQUFHLElBQUksQ0FBQztRQUN0QixJQUFJLElBQUksQ0FBQyxTQUFTLENBQUMsR0FBRyxDQUFDLENBQUMsTUFBTSxDQUFDLEtBQUssVUFBVSxDQUFDLEtBQUssRUFBRTtZQUNwRCxJQUFJLENBQUMsU0FBUyxDQUFDLEdBQUcsQ0FBQyxDQUFDLE1BQU0sQ0FBQyxHQUFHLFVBQVUsQ0FBQyxLQUFLLENBQUM7WUFDL0MsSUFBSSxDQUFDLFdBQVcsRUFBRSxDQUFDO1NBQ3BCO0lBQ0gsQ0FBQztJQUVPLGdCQUFnQjtRQUN0QixJQUFJLENBQUMsU0FBUyxHQUFHLElBQUksQ0FBQztJQUN4QixDQUFDO0lBRU8sYUFBYTtRQUNuQixJQUFJLENBQUMsU0FBUyxHQUFHLEtBQUssQ0FBQztJQUN6QixDQUFDO0lBRU8sY0FBYztRQUNwQixJQUFJLENBQUMsU0FBUyxHQUFHLEtBQUssQ0FBQztJQUN6QixDQUFDO0lBRU8sa0JBQWtCLENBQUMsR0FBVyxFQUFFLE1BQWM7UUFDcEQsSUFBSSxJQUFJLENBQUMsU0FBUyxJQUFJLENBQUMsSUFBSSxDQUFDLFNBQVMsQ0FBQyxHQUFHLENBQUMsQ0FBQyxNQUFNLENBQUMsS0FBSyxVQUFVLENBQUMsS0FBSyxDQUFDLEVBQUU7WUFDeEUsSUFBSSxDQUFDLFNBQVMsQ0FBQyxHQUFHLENBQUMsQ0FBQyxNQUFNLENBQUMsR0FBRyxVQUFVLENBQUMsS0FBSyxDQUFDO1lBQy9DLElBQUksQ0FBQyxXQUFXLEVBQUUsQ0FBQztTQUNwQjtJQUNILENBQUM7Q0FDRjtBQUVELE1BQU0sQ0FBQyxjQUFjLENBQUMsTUFBTSxDQUFDLFlBQVksRUFBRSxTQUFTLENBQUMsQ0FBQyIsImZpbGUiOiJnYW1lRmllbGQuanMiLCJzb3VyY2VzQ29udGVudCI6WyJlbnVtIEZpZWxkU3RhdGUge1xuICBVbnNldCA9IDAsXG4gIEFsaXZlLFxuICBEZWFkLFxufVxuXG5jbGFzcyBHYW1lRmllbGQgZXh0ZW5kcyBIVE1MRWxlbWVudCB7XG4gIHByaXZhdGUgY29sdW1uczogbnVtYmVyO1xuICBwcml2YXRlIHJvd3M6IG51bWJlcjtcblxuICBwcml2YXRlIHNpemU6IG51bWJlcjtcblxuICBwcml2YXRlIHZpZXdwb3J0V2lkdGg6IG51bWJlcjtcbiAgcHJpdmF0ZSB2aWV3cG9ydEhlaWdodDogbnVtYmVyO1xuXG4gIHByaXZhdGUgZ2FtZUZpZWxkOiBudW1iZXJbXVtdO1xuXG4gIHByaXZhdGUgbW91c2VEb3duOiBib29sZWFuO1xuXG4gIHByaXZhdGUgcnVubmluZzogYm9vbGVhbjtcbiAgcHJpdmF0ZSBnZW5lcmF0aW9uOiBudW1iZXI7XG5cbiAgcHJpdmF0ZSBpbml0aWFsaXplZDogYm9vbGVhbjtcblxuICBwcml2YXRlIHNwZWVkOiBudW1iZXI7XG5cbiAgcHJpdmF0ZSB1bnNldENvbG9yOiBzdHJpbmc7XG4gIHByaXZhdGUgYWxpdmVDb2xvcjogc3RyaW5nO1xuICBwcml2YXRlIGRlYWRDb2xvcjogc3RyaW5nO1xuXG4gIGNvbnN0cnVjdG9yKCkge1xuICAgIHN1cGVyKCk7XG4gICAgdGhpcy5jb2x1bW5zID0gNjA7XG4gICAgdGhpcy5yb3dzID0gMjU7XG4gICAgdGhpcy5zaXplID0gMDtcbiAgICB0aGlzLnZpZXdwb3J0V2lkdGggPSAwO1xuICAgIHRoaXMudmlld3BvcnRIZWlnaHQgPSAwO1xuICAgIHRoaXMuZ2FtZUZpZWxkID0gW107XG4gICAgdGhpcy5tb3VzZURvd24gPSBmYWxzZTtcbiAgICB0aGlzLnJ1bm5pbmcgPSBmYWxzZTtcbiAgICB0aGlzLmdlbmVyYXRpb24gPSAxO1xuICAgIHRoaXMuaW5pdGlhbGl6ZWQgPSBmYWxzZTtcbiAgICB0aGlzLnNwZWVkID0gMDtcbiAgICB0aGlzLnVuc2V0Q29sb3IgPSBcIiNmZmZmZmZcIjtcbiAgICB0aGlzLmFsaXZlQ29sb3IgPSBcIiMwMDAwOGJcIjtcbiAgICB0aGlzLmRlYWRDb2xvciA9IFwiIzkwZWU5MFwiO1xuICB9XG5cbiAgcHVibGljIGNvbm5lY3RlZENhbGxiYWNrKCkge1xuICAgIHdpbmRvdy5vbnJlc2l6ZSA9ICgpID0+IHRoaXMudmlld3BvcnRVcGRhdGVkKCk7XG5cbiAgICB0aGlzLmdhbWVGaWVsZCA9IHRoaXMuY3JlYXRlR2FtZUZpZWxkKCk7XG5cbiAgICB0aGlzLnNldFZpZXdwb3J0VmFsdWVzKCk7XG4gICAgdGhpcy5zaXplID0gTWF0aC5taW4odGhpcy52aWV3cG9ydFdpZHRoIC8gdGhpcy5jb2x1bW5zLCB0aGlzLnZpZXdwb3J0SGVpZ2h0IC8gdGhpcy5yb3dzKTtcblxuICAgIHRoaXMuYXR0YWNoU2hhZG93KHsgbW9kZTogXCJvcGVuXCIgfSk7XG4gICAgdGhpcy5jcmVhdGVTaGFkb3dEb20oKTtcblxuICAgIHRoaXMuaW5pdGlhbGl6ZWQgPSB0cnVlO1xuICB9XG5cbiAgcHVibGljIGF0dHJpYnV0ZUNoYW5nZWRDYWxsYmFjayhuYW1lOiBzdHJpbmcsIG9sZFZhbHVlOiBhbnksIG5ld1ZhbHVlOiBhbnkpIHtcbiAgICBpZiAodGhpcy5pbml0aWFsaXplZCkge1xuICAgICAgc3dpdGNoIChuYW1lKSB7XG4gICAgICAgIGNhc2UgXCJ3aWR0aFwiOlxuICAgICAgICAgIHRoaXMud2lkdGhVcGRhdGVkKG5ld1ZhbHVlKTtcbiAgICAgICAgICBicmVhaztcbiAgICAgICAgY2FzZSBcImhlaWdodFwiOlxuICAgICAgICAgIHRoaXMuaGVpZ2h0VXBkYXRlZChuZXdWYWx1ZSk7XG4gICAgICAgICAgYnJlYWs7XG4gICAgICAgIGNhc2UgXCJzdGFydFwiOlxuICAgICAgICAgIHRoaXMuZG9TdGFydCgpO1xuICAgICAgICAgIGJyZWFrO1xuICAgICAgICBjYXNlIFwicGF1c2VcIjpcbiAgICAgICAgICB0aGlzLmRvUGF1c2UoKTtcbiAgICAgICAgICBicmVhaztcbiAgICAgICAgY2FzZSBcImNsZWFyXCI6XG4gICAgICAgICAgdGhpcy5kb0NsZWFyKCk7XG4gICAgICAgICAgYnJlYWs7XG4gICAgICAgIGNhc2UgXCJsZXZlbFwiOlxuICAgICAgICAgIHRoaXMubG9hZExldmVsKG5ld1ZhbHVlKTtcbiAgICAgICAgICBicmVhaztcbiAgICAgICAgY2FzZSBcInJhbmRvbVwiOlxuICAgICAgICAgIHRoaXMucmFuZG9taXplKCk7XG4gICAgICAgICAgYnJlYWs7XG4gICAgICAgIGNhc2UgXCJzcGVlZFwiOlxuICAgICAgICAgIHRoaXMuc3BlZWRVcGRhdGVkKG5ld1ZhbHVlKTtcbiAgICAgICAgICBicmVhaztcbiAgICAgICAgY2FzZSBcInVuc2V0X2NvbG9yXCI6XG4gICAgICAgICAgdGhpcy51bnNldENvbG9yVXBkYXRlZChuZXdWYWx1ZSk7XG4gICAgICAgICAgYnJlYWs7XG4gICAgICAgIGNhc2UgXCJhbGl2ZV9jb2xvclwiOlxuICAgICAgICAgIHRoaXMuYWxpdmVDb2xvclVwZGF0ZWQobmV3VmFsdWUpO1xuICAgICAgICAgIGJyZWFrO1xuICAgICAgICBjYXNlIFwiZGVhZF9jb2xvclwiOlxuICAgICAgICAgIHRoaXMuZGVhZENvbG9yVXBkYXRlZChuZXdWYWx1ZSk7XG4gICAgICAgICAgYnJlYWs7XG4gICAgICAgIGRlZmF1bHQ6XG4gICAgICAgICAgYnJlYWs7XG4gICAgICB9XG4gICAgfVxuICB9XG5cbiAgc3RhdGljIGdldCBvYnNlcnZlZEF0dHJpYnV0ZXMoKSB7XG4gICAgcmV0dXJuIFtcIndpZHRoXCIsIFwiaGVpZ2h0XCIsIFwic3RhcnRcIiwgXCJwYXVzZVwiLCBcImNsZWFyXCIsIFwibGV2ZWxcIiwgXCJyYW5kb21cIiwgXCJzcGVlZFwiLCBcInVuc2V0X2NvbG9yXCIsIFwiYWxpdmVfY29sb3JcIiwgXCJkZWFkX2NvbG9yXCJdO1xuICB9XG5cbiAgcHJpdmF0ZSBjcmVhdGVHYW1lRmllbGQoKTogbnVtYmVyW11bXSB7XG4gICAgY29uc3QgYXJyOiBudW1iZXJbXVtdID0gW107XG5cbiAgICBmb3IgKGxldCByb3c6IG51bWJlciA9IDA7IHJvdyA8IHRoaXMucm93czsgcm93KyspIHtcbiAgICAgIGFycltyb3ddID0gW107XG4gICAgICBmb3IgKGxldCBjb2x1bW46IG51bWJlciA9IDA7IGNvbHVtbiA8IHRoaXMuY29sdW1uczsgY29sdW1uKyspIHtcbiAgICAgICAgYXJyW3Jvd11bY29sdW1uXSA9IEZpZWxkU3RhdGUuVW5zZXQ7XG4gICAgICB9XG4gICAgfVxuXG4gICAgcmV0dXJuIGFycjtcbiAgfVxuXG4gIHByaXZhdGUgd2lkdGhVcGRhdGVkKG5ld1dpZHRoOiBzdHJpbmcpIHtcbiAgICBjb25zdCB3aWR0aCA9IHBhcnNlSW50KG5ld1dpZHRoLCAxMCk7XG5cbiAgICBpZiAoIWlzTmFOKHdpZHRoKSkge1xuICAgICAgY29uc3QgY29sdW1ucyA9IE1hdGgubWF4KDEwLCB3aWR0aCk7XG4gICAgICBpZiAoY29sdW1ucyAhPT0gdGhpcy5jb2x1bW5zKSB7XG4gICAgICAgIHRoaXMuY29sdW1ucyA9IGNvbHVtbnM7XG4gICAgICAgIHRoaXMuc2l6ZVVwZGF0ZWQoKTtcbiAgICAgIH1cbiAgICB9XG5cbiAgICB0aGlzLmRpc3BhdGNoRXZlbnQobmV3IEN1c3RvbUV2ZW50KFwid2lkdGhVcGRhdGVkRXZlbnRcIiwgeyBkZXRhaWw6IHRoaXMuY29sdW1ucyB9KSk7XG4gIH1cblxuICBwcml2YXRlIGhlaWdodFVwZGF0ZWQobmV3SGVpZ2h0OiBzdHJpbmcpIHtcbiAgICBjb25zdCBoZWlnaHQgPSBwYXJzZUludChuZXdIZWlnaHQsIDEwKTtcblxuICAgIGlmICghaXNOYU4oaGVpZ2h0KSkge1xuICAgICAgY29uc3Qgcm93cyA9IE1hdGgubWF4KDEwLCBoZWlnaHQpO1xuICAgICAgaWYgKHJvd3MgIT09IHRoaXMucm93cykge1xuICAgICAgICB0aGlzLnJvd3MgPSByb3dzO1xuICAgICAgICB0aGlzLnNpemVVcGRhdGVkKCk7XG4gICAgICB9XG4gICAgfVxuXG4gICAgdGhpcy5kaXNwYXRjaEV2ZW50KG5ldyBDdXN0b21FdmVudChcImhlaWdodFVwZGF0ZWRFdmVudFwiLCB7IGRldGFpbDogdGhpcy5yb3dzIH0pKTtcbiAgfVxuXG4gIHByaXZhdGUgc3BlZWRVcGRhdGVkKG5ld1NwZWVkOiBhbnkpIHtcbiAgICBjb25zdCBzcGVlZCA9IHBhcnNlSW50KG5ld1NwZWVkLCAxMCk7XG4gICAgaWYgKCFpc05hTihzcGVlZCkpIHtcbiAgICAgIGlmIChzcGVlZCAhPT0gdGhpcy5zcGVlZCkge1xuICAgICAgICB0aGlzLnNwZWVkID0gc3BlZWQ7XG4gICAgICB9XG4gICAgfVxuICAgIHRoaXMuZGlzcGF0Y2hFdmVudChuZXcgQ3VzdG9tRXZlbnQoXCJzcGVlZFVwZGF0ZWRFdmVudFwiLCB7IGRldGFpbDogdGhpcy5zcGVlZCB9KSk7XG4gIH1cblxuICBwcml2YXRlIHNpemVVcGRhdGVkKCkge1xuICAgIHRoaXMuZ2FtZUZpZWxkID0gdGhpcy5jcmVhdGVHYW1lRmllbGQoKTtcbiAgICB0aGlzLmdlbmVyYXRpb24gPSAxO1xuICAgIHRoaXMuc2l6ZSA9IE1hdGgubWluKHRoaXMudmlld3BvcnRXaWR0aCAvIHRoaXMuY29sdW1ucywgdGhpcy52aWV3cG9ydEhlaWdodCAvIHRoaXMucm93cyk7XG4gICAgdGhpcy5jcmVhdGVTaGFkb3dEb20oKTtcbiAgICB0aGlzLmRpc3BhdGNoRXZlbnQobmV3IEN1c3RvbUV2ZW50KFwiZ2VuZXJhdGlvblVwZGF0ZWRFdmVudFwiLCB7IGRldGFpbDogdGhpcy5nZW5lcmF0aW9uIH0pKTtcbiAgfVxuXG4gIHByaXZhdGUgdW5zZXRDb2xvclVwZGF0ZWQodW5zZXRDb2xvcjogc3RyaW5nKSB7XG4gICAgdGhpcy51bnNldENvbG9yID0gdW5zZXRDb2xvcjtcbiAgICB0aGlzLnVwZGF0ZVNoYWRvd0NzcygpO1xuICB9XG5cbiAgcHJpdmF0ZSBhbGl2ZUNvbG9yVXBkYXRlZChhbGl2ZUNvbG9yOiBzdHJpbmcpIHtcbiAgICB0aGlzLmFsaXZlQ29sb3IgPSBhbGl2ZUNvbG9yO1xuICAgIHRoaXMudXBkYXRlU2hhZG93Q3NzKCk7XG4gIH1cblxuICBwcml2YXRlIGRlYWRDb2xvclVwZGF0ZWQoZGVhZENvbG9yOiBzdHJpbmcpIHtcbiAgICB0aGlzLmRlYWRDb2xvciA9IGRlYWRDb2xvcjtcbiAgICB0aGlzLnVwZGF0ZVNoYWRvd0NzcygpO1xuICB9XG5cbiAgcHJpdmF0ZSB1cGRhdGVTaGFkb3dDc3MoKSB7XG4gICAgY29uc3Qgc2hhZG93ID0gdGhpcy5zaGFkb3dSb290O1xuICAgIGNvbnN0IGNoaWxkTm9kZXMgPSBBcnJheS5mcm9tKHNoYWRvdy5jaGlsZE5vZGVzKTtcblxuICAgIGNoaWxkTm9kZXMuZm9yRWFjaCgoY2hpbGROb2RlKSA9PiB7XG4gICAgICBpZiAoY2hpbGROb2RlLm5vZGVOYW1lID09PSBcIlNUWUxFXCIpIHtcbiAgICAgICAgY2hpbGROb2RlLnRleHRDb250ZW50ID0gYFxuICAgICAgICAuY2VsbCB7XG4gICAgICAgICAgYm94LXNpemluZzogYm9yZGVyLWJveDtcbiAgICAgICAgICB3aWR0aDogJHt0aGlzLnNpemV9cHg7XG4gICAgICAgICAgaGVpZ2h0OiAke3RoaXMuc2l6ZX1weDtcbiAgICAgICAgICBiYWNrZ3JvdW5kLWNvbG9yOiB3aGl0ZTtcbiAgICAgICAgICBmbG9hdDogbGVmdDtcbiAgICAgICAgICBiYWNrZ3JvdW5kLWNsaXA6IGNvbnRlbnQtYm94O1xuICAgICAgICAgIHBhZGRpbmc6IDFweDtcbiAgICAgICAgfVxuXG4gICAgICAgIC5yb3cge1xuICAgICAgICAgIGJveC1zaXppbmc6IGJvcmRlci1ib3g7XG4gICAgICAgICAgd2lkdGg6ICR7dGhpcy5zaXplICogdGhpcy5jb2x1bW5zfXB4O1xuICAgICAgICAgIGhlaWdodDogJHt0aGlzLnNpemV9cHg7XG4gICAgICAgICAgY2xlYXI6IGJvdGg7XG4gICAgICAgICAgZmxvYXQ6IGxlZnQ7XG4gICAgICAgIH1cblxuICAgICAgICAuZ3JpZCB7XG4gICAgICAgICAgYm94LXNpemluZzogYm9yZGVyLWJveDtcbiAgICAgICAgICB3aWR0aDogJHt0aGlzLnNpemUgKiB0aGlzLmNvbHVtbnN9cHg7XG4gICAgICAgICAgaGVpZ2h0OiAke3RoaXMuc2l6ZSAqIHRoaXMucm93c31weDtcbiAgICAgICAgICBtYXJnaW46IGF1dG87XG4gICAgICAgIH1cblxuICAgICAgICAudW5zZXQge1xuICAgICAgICAgIGJhY2tncm91bmQtY29sb3I6ICR7dGhpcy51bnNldENvbG9yfTtcbiAgICAgICAgfVxuXG4gICAgICAgIC5hbGl2ZSB7XG4gICAgICAgICAgYmFja2dyb3VuZC1jb2xvcjogJHt0aGlzLmFsaXZlQ29sb3J9O1xuICAgICAgICB9XG5cbiAgICAgICAgLmRlYWQge1xuICAgICAgICAgIGJhY2tncm91bmQtY29sb3I6ICR7dGhpcy5kZWFkQ29sb3J9O1xuICAgICAgICB9XG4gICAgICAgIGA7XG4gICAgICB9XG4gICAgfSk7XG4gIH1cblxuICBwcml2YXRlIHNldFZpZXdwb3J0VmFsdWVzKCkge1xuICAgIHRoaXMudmlld3BvcnRXaWR0aCA9IE1hdGgubWluKGRvY3VtZW50LmRvY3VtZW50RWxlbWVudC5jbGllbnRXaWR0aCwgd2luZG93LmlubmVyV2lkdGgpO1xuICAgIHRoaXMudmlld3BvcnRIZWlnaHQgPSBNYXRoLm1pbihkb2N1bWVudC5kb2N1bWVudEVsZW1lbnQuY2xpZW50SGVpZ2h0LCB3aW5kb3cuaW5uZXJIZWlnaHQpO1xuICB9XG5cbiAgcHJpdmF0ZSB2aWV3cG9ydFVwZGF0ZWQoKSB7XG4gICAgdGhpcy5zZXRWaWV3cG9ydFZhbHVlcygpO1xuXG4gICAgdGhpcy5zaXplID0gTWF0aC5taW4odGhpcy52aWV3cG9ydFdpZHRoIC8gdGhpcy5jb2x1bW5zLCB0aGlzLnZpZXdwb3J0SGVpZ2h0IC8gdGhpcy5yb3dzKTtcblxuICAgIGNvbnN0IHN0eWxlU2hlZXRzID0gdGhpcy5zaGFkb3dSb290LnN0eWxlU2hlZXRzO1xuICAgIGxldCBzdHlsZVNoZWV0OiB7IFtpbmRleDogc3RyaW5nXTogYW55IH0gPSB7fTtcbiAgICBzdHlsZVNoZWV0ID0gc3R5bGVTaGVldHNbMF07XG5cbiAgICAvLyAuY2VsbFxuICAgIHN0eWxlU2hlZXRbXCJjc3NSdWxlc1wiXVswXS5zdHlsZS53aWR0aCA9IGAke3RoaXMuc2l6ZX1weGA7XG4gICAgc3R5bGVTaGVldFtcImNzc1J1bGVzXCJdWzBdLnN0eWxlLmhlaWdodCA9IGAke3RoaXMuc2l6ZX1weGA7XG5cbiAgICAvLyAucm93XG4gICAgc3R5bGVTaGVldFtcImNzc1J1bGVzXCJdWzFdLnN0eWxlLndpZHRoID0gYCR7dGhpcy5zaXplICogdGhpcy5jb2x1bW5zfXB4YDtcbiAgICBzdHlsZVNoZWV0W1wiY3NzUnVsZXNcIl1bMV0uc3R5bGUuaGVpZ2h0ID0gYCR7dGhpcy5zaXplfXB4YDtcblxuICAgIC8vIC5ncmlkXG4gICAgc3R5bGVTaGVldFtcImNzc1J1bGVzXCJdWzJdLnN0eWxlLndpZHRoID0gYCR7dGhpcy5zaXplICogdGhpcy5jb2x1bW5zfXB4YDtcbiAgICBzdHlsZVNoZWV0W1wiY3NzUnVsZXNcIl1bMl0uc3R5bGUuaGVpZ2h0ID0gYCR7dGhpcy5zaXplICogdGhpcy5yb3dzfXB4YDtcbiAgfVxuXG4gIHByaXZhdGUgY3JlYXRlU2hhZG93RG9tKCkge1xuICAgIHRoaXMuc2hhZG93Um9vdC5pbm5lckhUTUwgPSB0aGlzLmNyZWF0ZVNoYWRvd0NzcygpO1xuICAgIGNvbnN0IGdyaWRFbGVtID0gdGhpcy5jcmVhdGVTaGFkb3dHYW1lRmllbGQoKTtcbiAgICB0aGlzLnNoYWRvd1Jvb3QuYXBwZW5kQ2hpbGQoZ3JpZEVsZW0pO1xuICAgIHRoaXMudmlld3BvcnRVcGRhdGVkKCk7XG4gIH1cblxuICBwcml2YXRlIGNyZWF0ZVNoYWRvd0NzcygpIHtcbiAgICByZXR1cm4gYDxzdHlsZT5cbiAgICAuY2VsbCB7XG4gICAgICBib3gtc2l6aW5nOiBib3JkZXItYm94O1xuICAgICAgd2lkdGg6ICR7dGhpcy5zaXplfXB4O1xuICAgICAgaGVpZ2h0OiAke3RoaXMuc2l6ZX1weDtcbiAgICAgIGJhY2tncm91bmQtY29sb3I6IHdoaXRlO1xuICAgICAgZmxvYXQ6IGxlZnQ7XG4gICAgICBiYWNrZ3JvdW5kLWNsaXA6IGNvbnRlbnQtYm94O1xuICAgICAgcGFkZGluZzogMXB4O1xuICAgIH1cblxuICAgIC5yb3cge1xuICAgICAgYm94LXNpemluZzogYm9yZGVyLWJveDtcbiAgICAgIHdpZHRoOiAke3RoaXMuc2l6ZSAqIHRoaXMuY29sdW1uc31weDtcbiAgICAgIGhlaWdodDogJHt0aGlzLnNpemV9cHg7XG4gICAgICBjbGVhcjogYm90aDtcbiAgICAgIGZsb2F0OiBsZWZ0O1xuICAgIH1cblxuICAgIC5ncmlkIHtcbiAgICAgIGJveC1zaXppbmc6IGJvcmRlci1ib3g7XG4gICAgICB3aWR0aDogJHt0aGlzLnNpemUgKiB0aGlzLmNvbHVtbnN9cHg7XG4gICAgICBoZWlnaHQ6ICR7dGhpcy5zaXplICogdGhpcy5yb3dzfXB4O1xuICAgICAgbWFyZ2luOiBhdXRvO1xuICAgIH1cblxuICAgIC51bnNldCB7XG4gICAgICBiYWNrZ3JvdW5kLWNvbG9yOiAke3RoaXMudW5zZXRDb2xvcn07XG4gICAgfVxuXG4gICAgLmFsaXZlIHtcbiAgICAgIGJhY2tncm91bmQtY29sb3I6ICR7dGhpcy5hbGl2ZUNvbG9yfTtcbiAgICB9XG5cbiAgICAuZGVhZCB7XG4gICAgICBiYWNrZ3JvdW5kLWNvbG9yOiAke3RoaXMuZGVhZENvbG9yfTtcbiAgICB9XG4gICAgPC9zdHlsZT5cbiAgICBgO1xuICB9XG5cbiAgcHJpdmF0ZSBjcmVhdGVTaGFkb3dHYW1lRmllbGQoKSB7XG4gICAgY29uc3QgZ3JpZEVsZW0gPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KFwiZGl2XCIpO1xuICAgIGdyaWRFbGVtLmNsYXNzTmFtZSA9IFwiZ3JpZFwiO1xuICAgIGZvciAobGV0IHJvdyA9IDA7IHJvdyA8IHRoaXMucm93czsgcm93KyspIHtcbiAgICAgIGNvbnN0IHJvd0VsZW0gPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KFwiZGl2XCIpO1xuICAgICAgcm93RWxlbS5jbGFzc05hbWUgPSBcInJvd1wiO1xuICAgICAgZm9yIChsZXQgY29sdW1uID0gMDsgY29sdW1uIDwgdGhpcy5jb2x1bW5zOyBjb2x1bW4rKykge1xuICAgICAgICBjb25zdCBjZWxsRWxlbSA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoXCJkaXZcIik7XG5cbiAgICAgICAgLy8gZmluZGluZyB0aGlzIGNlbGwgYWdhaW4gaXMgbXVjaCBmYXN0ZXIgaWYgdGhlIGVsZW1lbnRzIGFyZSBpbiBvbmUgYXR0cmlidXRlXG4gICAgICAgIC8vIGFuZCBldmVuIGZhc3RlciBpZiB0aGV5IGFyZSBpbiB0aGUgaWQuXG4gICAgICAgIC8vIEJ5IHVzaW5nIHR3byBhdHRyaWJ1dGVzIG9yIHNvbWV0aGluZyBlbHNlIHRoYW4gdGhlIGlkLCBldmVyeXRoaW5nIGNyYXdscyB0byBhIHN0b3AuXG4gICAgICAgIGNlbGxFbGVtLnNldEF0dHJpYnV0ZShcImlkXCIsIGAke3Jvd30sJHtjb2x1bW59YCk7XG5cbiAgICAgICAgc3dpdGNoICh0aGlzLmdhbWVGaWVsZFtyb3ddW2NvbHVtbl0pIHtcbiAgICAgICAgICBjYXNlIEZpZWxkU3RhdGUuVW5zZXQ6XG4gICAgICAgICAgICBjZWxsRWxlbS5jbGFzc05hbWUgPSBcImNlbGwgdW5zZXRcIjtcbiAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgIGNhc2UgRmllbGRTdGF0ZS5BbGl2ZTpcbiAgICAgICAgICAgIGNlbGxFbGVtLmNsYXNzTmFtZSA9IFwiY2VsbCBhbGl2ZVwiO1xuICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgY2FzZSBGaWVsZFN0YXRlLkRlYWQ6XG4gICAgICAgICAgICBjZWxsRWxlbS5jbGFzc05hbWUgPSBcImNlbGwgZGVhZFwiO1xuICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgZGVmYXVsdDpcbiAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICB9XG5cbiAgICAgICAgY2VsbEVsZW0uYWRkRXZlbnRMaXN0ZW5lcihcIm1vdXNlb3ZlclwiLCAoKSA9PiB0aGlzLmNlbGxIb3ZlcmVkSGFuZGxlcihyb3csIGNvbHVtbikpO1xuICAgICAgICBjZWxsRWxlbS5hZGRFdmVudExpc3RlbmVyKFwibW91c2Vkb3duXCIsICgpID0+IHRoaXMuY2VsbERvd25IYW5kbGVyKHJvdywgY29sdW1uKSk7XG4gICAgICAgIGNlbGxFbGVtLmFkZEV2ZW50TGlzdGVuZXIoXCJtb3VzZXVwXCIsICgpID0+IHRoaXMuY2VsbFVwSGFuZGxlcigpKTtcbiAgICAgICAgY2VsbEVsZW0uYWRkRXZlbnRMaXN0ZW5lcihcInRvdWNoc3RhcnRcIiwgKCkgPT4gdGhpcy5jZWxsVG91Y2hlZEhhbmRsZXIocm93LCBjb2x1bW4pKTtcbiAgICAgICAgcm93RWxlbS5hcHBlbmRDaGlsZChjZWxsRWxlbSk7XG4gICAgICB9XG4gICAgICBncmlkRWxlbS5hZGRFdmVudExpc3RlbmVyKFwibW91c2Vkb3duXCIsICgpID0+IHRoaXMuZmllbGREb3duSGFuZGxlcigpKTtcbiAgICAgIGdyaWRFbGVtLmFkZEV2ZW50TGlzdGVuZXIoXCJtb3VzZXVwXCIsICgpID0+IHRoaXMuZmllbGRVcEhhbmRsZXIoKSk7XG4gICAgICBncmlkRWxlbS5hcHBlbmRDaGlsZChyb3dFbGVtKTtcbiAgICB9XG5cbiAgICByZXR1cm4gZ3JpZEVsZW07XG4gIH1cblxuICBwcml2YXRlIGRvU3RhcnQoKSB7XG4gICAgaWYgKCF0aGlzLnJ1bm5pbmcpIHtcbiAgICAgIHRoaXMucnVubmluZyA9IHRydWU7XG4gICAgICB0aGlzLmRpc3BhdGNoRXZlbnQobmV3IEN1c3RvbUV2ZW50KFwicnVubmluZ1N0YXJ0ZWRFdmVudFwiLCB7IGRldGFpbDogdGhpcy5ydW5uaW5nIH0pKTtcbiAgICAgIHRoaXMuZXhlY3V0ZSgpO1xuICAgIH1cbiAgfVxuXG4gIHByaXZhdGUgZG9QYXVzZSgpIHtcbiAgICB0aGlzLnJ1bm5pbmcgPSBmYWxzZTtcbiAgICB0aGlzLmRpc3BhdGNoRXZlbnQobmV3IEN1c3RvbUV2ZW50KFwicnVubmluZ1N0b3BwZWRFdmVudFwiLCB7IGRldGFpbDogdGhpcy5ydW5uaW5nIH0pKTtcbiAgfVxuXG4gIHByaXZhdGUgZG9DbGVhcigpIHtcbiAgICB0aGlzLnJ1bm5pbmcgPSBmYWxzZTtcbiAgICB0aGlzLmdhbWVGaWVsZCA9IHRoaXMuY3JlYXRlR2FtZUZpZWxkKCk7XG4gICAgdGhpcy5nZW5lcmF0aW9uID0gMTtcbiAgICB0aGlzLnVwZGF0ZUZpZWxkKCk7XG4gICAgdGhpcy5kaXNwYXRjaEV2ZW50KG5ldyBDdXN0b21FdmVudChcImdlbmVyYXRpb25VcGRhdGVkRXZlbnRcIiwgeyBkZXRhaWw6IHRoaXMuZ2VuZXJhdGlvbiB9KSk7XG4gICAgdGhpcy5kaXNwYXRjaEV2ZW50KG5ldyBDdXN0b21FdmVudChcInJ1bm5pbmdTdG9wcGVkRXZlbnRcIiwgeyBkZXRhaWw6IHRoaXMucnVubmluZyB9KSk7XG4gIH1cblxuICBwcml2YXRlIGxvYWRMZXZlbChsZXZlbDogc3RyaW5nKSB7XG4gICAgY29uc3QgbGV2ZWxBcnJheSA9IGxldmVsLnNwbGl0KFwiXFxuXCIpO1xuXG4gICAgY29uc3Qgcm93cyA9IGxldmVsQXJyYXkubGVuZ3RoO1xuICAgIGxldCBjb2x1bW5zID0gMDtcblxuICAgIGZvciAobGV0IHJvdyA9IDA7IHJvdyA8IGxldmVsQXJyYXkubGVuZ3RoOyByb3crKykge1xuICAgICAgbGV2ZWxBcnJheVtyb3ddID0gbGV2ZWxBcnJheVtyb3ddLnJlcGxhY2UoL1xccy9nLCBcIlwiKTtcbiAgICAgIGNvbHVtbnMgPSBNYXRoLm1heChjb2x1bW5zLCBsZXZlbEFycmF5W3Jvd10ubGVuZ3RoKTtcbiAgICB9XG5cbiAgICB0aGlzLmhlaWdodFVwZGF0ZWQocm93cy50b1N0cmluZygpKTtcbiAgICB0aGlzLndpZHRoVXBkYXRlZChjb2x1bW5zLnRvU3RyaW5nKCkpO1xuXG4gICAgdGhpcy5kb0NsZWFyKCk7XG5cbiAgICBmb3IgKGxldCByb3cgPSAwOyByb3cgPCBsZXZlbEFycmF5Lmxlbmd0aDsgcm93KyspIHtcbiAgICAgIGxldmVsQXJyYXlbcm93XSArPSBcIjBcIi5yZXBlYXQoY29sdW1ucyAtIGxldmVsQXJyYXlbcm93XS5sZW5ndGgpO1xuICAgICAgZm9yIChsZXQgY29sdW1uID0gMDsgY29sdW1uIDwgY29sdW1uczsgY29sdW1uKyspIHtcbiAgICAgICAgaWYgKHBhcnNlSW50KGxldmVsQXJyYXlbcm93XVtjb2x1bW5dLCAxMCkgPT09IEZpZWxkU3RhdGUuQWxpdmUpIHtcbiAgICAgICAgICB0aGlzLmdhbWVGaWVsZFtyb3ddW2NvbHVtbl0gPSBGaWVsZFN0YXRlLkFsaXZlO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgIHRoaXMuZ2FtZUZpZWxkW3Jvd11bY29sdW1uXSA9IEZpZWxkU3RhdGUuVW5zZXQ7XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICB9XG5cbiAgICB0aGlzLmNyZWF0ZVNoYWRvd0RvbSgpO1xuICB9XG5cbiAgcHJpdmF0ZSByYW5kb21pemUoKSB7XG4gICAgdGhpcy5kb0NsZWFyKCk7XG5cbiAgICBmb3IgKGxldCByb3c6IG51bWJlciA9IDA7IHJvdyA8IHRoaXMucm93czsgcm93KyspIHtcbiAgICAgIGZvciAobGV0IGNvbHVtbjogbnVtYmVyID0gMDsgY29sdW1uIDwgdGhpcy5jb2x1bW5zOyBjb2x1bW4rKykge1xuICAgICAgICB0aGlzLmdhbWVGaWVsZFtyb3ddW2NvbHVtbl0gPSBNYXRoLnJvdW5kKE1hdGgucmFuZG9tKCkpO1xuICAgICAgfVxuICAgIH1cblxuICAgIHRoaXMudXBkYXRlRmllbGQoKTtcbiAgfVxuXG4gIHByaXZhdGUgZXhlY3V0ZSgpIHtcbiAgICBpZiAodGhpcy5ydW5uaW5nKSB7XG4gICAgICBjb25zdCBuZXh0R2VuZXJhdGlvbkdhbWVGaWVsZCA9IHRoaXMuY2FsY3VsYXRlTmV4dEdlbmVyYXRpb25HYW1lRmllbGQoKTtcblxuICAgICAgdGhpcy5nYW1lRmllbGQgPSBuZXh0R2VuZXJhdGlvbkdhbWVGaWVsZDtcbiAgICAgIHRoaXMudXBkYXRlRmllbGQoKTtcblxuICAgICAgdGhpcy5nZW5lcmF0aW9uKys7XG4gICAgICB0aGlzLmRpc3BhdGNoRXZlbnQobmV3IEN1c3RvbUV2ZW50KFwiZ2VuZXJhdGlvblVwZGF0ZWRFdmVudFwiLCB7IGRldGFpbDogdGhpcy5nZW5lcmF0aW9uIH0pKTtcblxuICAgICAgc2V0VGltZW91dChmdW5jdGlvbigpIHtcbiAgICAgICAgdGhpcy5leGVjdXRlKCk7XG4gICAgICB9LmJpbmQodGhpcyksIHRoaXMuc3BlZWQpO1xuICAgIH1cbiAgfVxuXG4gIHByaXZhdGUgY2FsY3VsYXRlTmV4dEdlbmVyYXRpb25HYW1lRmllbGQoKSB7XG4gICAgY29uc3QgbmV4dEdlbmVyYXRpb25HYW1lRmllbGQgPSB0aGlzLmNyZWF0ZUdhbWVGaWVsZCgpO1xuICAgIGxldCBjb3VudERpZmZlcmVudENlbGxzID0gMDtcblxuICAgIGZvciAobGV0IHJvdzogbnVtYmVyID0gMDsgcm93IDwgdGhpcy5yb3dzOyByb3crKykge1xuICAgICAgZm9yIChsZXQgY29sdW1uOiBudW1iZXIgPSAwOyBjb2x1bW4gPCB0aGlzLmNvbHVtbnM7IGNvbHVtbisrKSB7XG4gICAgICAgIG5leHRHZW5lcmF0aW9uR2FtZUZpZWxkW3Jvd11bY29sdW1uXSA9IHRoaXMuY2FsY3VsYXRlTmV4dEdlbmVyYXRpb25DZWxsKHJvdywgY29sdW1uKTtcbiAgICAgICAgaWYgKG5leHRHZW5lcmF0aW9uR2FtZUZpZWxkW3Jvd11bY29sdW1uXSAhPT0gdGhpcy5nYW1lRmllbGRbcm93XVtjb2x1bW5dKSB7XG4gICAgICAgICAgY291bnREaWZmZXJlbnRDZWxscysrO1xuICAgICAgICB9XG4gICAgICB9XG4gICAgfVxuXG4gICAgaWYgKGNvdW50RGlmZmVyZW50Q2VsbHMgPT09IDApIHtcbiAgICAgIHRoaXMuZG9QYXVzZSgpO1xuICAgIH1cblxuICAgIHJldHVybiBuZXh0R2VuZXJhdGlvbkdhbWVGaWVsZDtcbiAgfVxuXG4gIHByaXZhdGUgY2FsY3VsYXRlTmV4dEdlbmVyYXRpb25DZWxsKHJvdzogbnVtYmVyLCBjb2x1bW46IG51bWJlcik6IEZpZWxkU3RhdGUge1xuICAgIGNvbnN0IGFsaXZlTmVpZ2hib3VycyA9IHRoaXMuY291bnRBbGl2ZU5laWdoYm91cnMocm93LCBjb2x1bW4pO1xuXG4gICAgaWYgKHRoaXMuZ2FtZUZpZWxkW3Jvd11bY29sdW1uXSA9PT0gRmllbGRTdGF0ZS5BbGl2ZSkge1xuICAgICAgaWYgKGFsaXZlTmVpZ2hib3VycyA8PSAxKSB7XG4gICAgICAgIHJldHVybiBGaWVsZFN0YXRlLkRlYWQ7XG4gICAgICB9IGVsc2UgaWYgKGFsaXZlTmVpZ2hib3VycyA+PSA0KSB7XG4gICAgICAgIHJldHVybiBGaWVsZFN0YXRlLkRlYWQ7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICByZXR1cm4gRmllbGRTdGF0ZS5BbGl2ZTtcbiAgICAgIH1cbiAgICB9IGVsc2Uge1xuICAgICAgaWYgKGFsaXZlTmVpZ2hib3VycyA9PT0gMykge1xuICAgICAgICByZXR1cm4gRmllbGRTdGF0ZS5BbGl2ZTtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIHJldHVybiB0aGlzLmdhbWVGaWVsZFtyb3ddW2NvbHVtbl07XG4gICAgICB9XG4gICAgfVxuICB9XG5cbiAgcHJpdmF0ZSBjb3VudEFsaXZlTmVpZ2hib3Vycyhyb3c6IG51bWJlciwgY29sdW1uOiBudW1iZXIpOiBudW1iZXIge1xuICAgIGxldCBhbGl2ZU5laWdoYm91cnMgPSAwO1xuXG4gICAgZm9yIChsZXQgaTogbnVtYmVyID0gLTE7IGkgPD0gMTsgaSsrKSB7XG4gICAgICBmb3IgKGxldCBqOiBudW1iZXIgPSAtMTsgaiA8PSAxOyBqKyspIHtcbiAgICAgICAgY29uc3Qgcm93VG9DaGVjayA9IChyb3cgKyBpICsgdGhpcy5yb3dzKSAlIHRoaXMucm93cztcbiAgICAgICAgY29uc3QgY29sdW1uVG9DaGVjayA9IChjb2x1bW4gKyBqICsgdGhpcy5jb2x1bW5zKSAlIHRoaXMuY29sdW1ucztcbiAgICAgICAgaWYgKHRoaXMuZ2FtZUZpZWxkW3Jvd1RvQ2hlY2tdW2NvbHVtblRvQ2hlY2tdID09PSBGaWVsZFN0YXRlLkFsaXZlKSB7XG4gICAgICAgICAgYWxpdmVOZWlnaGJvdXJzKys7XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICB9XG5cbiAgICBpZiAodGhpcy5nYW1lRmllbGRbcm93XVtjb2x1bW5dID09PSBGaWVsZFN0YXRlLkFsaXZlKSB7XG4gICAgICBhbGl2ZU5laWdoYm91cnMtLTtcbiAgICB9XG5cbiAgICByZXR1cm4gYWxpdmVOZWlnaGJvdXJzO1xuICB9XG5cbiAgcHJpdmF0ZSB1cGRhdGVGaWVsZCgpIHtcbiAgICBmb3IgKGxldCByb3cgPSAwOyByb3cgPCB0aGlzLnJvd3M7IHJvdysrKSB7XG4gICAgICBmb3IgKGxldCBjb2x1bW4gPSAwOyBjb2x1bW4gPCB0aGlzLmNvbHVtbnM7IGNvbHVtbisrKSB7XG5cbiAgICAgICAgLy8gZmluZGluZyB0aGlzIGNlbGwgaXMgbXVjaCBmYXN0ZXIgaWYgdGhlIGVsZW1lbnRzIGFyZSBpbiBvbmUgYXR0cmlidXRlIGFuZCBldmVuIGZhc3RlciBpZiB0aGV5IGFyZSBpbiB0aGUgaWQuXG4gICAgICAgIC8vIEJ5IHVzaW5nIHR3byBhdHRyaWJ1dGVzIG9yIHNvbWV0aGluZyBlbHNlIHRoYW4gdGhlIGlkLCBldmVyeXRoaW5nIGNyYXdscyB0byBhIHN0b3AuXG4gICAgICAgIGNvbnN0IGNlbGwgPSB0aGlzLnNoYWRvd1Jvb3QuZ2V0RWxlbWVudEJ5SWQoYCR7cm93fSwke2NvbHVtbn1gKTtcblxuICAgICAgICBpZiAodGhpcy5nYW1lRmllbGRbcm93XVtjb2x1bW5dID09PSBGaWVsZFN0YXRlLlVuc2V0KSB7XG4gICAgICAgICAgY2VsbC5zZXRBdHRyaWJ1dGUoXCJjbGFzc1wiLCBcImNlbGwgdW5zZXRcIik7XG4gICAgICAgIH0gZWxzZSBpZiAodGhpcy5nYW1lRmllbGRbcm93XVtjb2x1bW5dID09PSBGaWVsZFN0YXRlLkFsaXZlKSB7XG4gICAgICAgICAgY2VsbC5zZXRBdHRyaWJ1dGUoXCJjbGFzc1wiLCBcImNlbGwgYWxpdmVcIik7XG4gICAgICAgIH0gZWxzZSBpZiAodGhpcy5nYW1lRmllbGRbcm93XVtjb2x1bW5dID09PSBGaWVsZFN0YXRlLkRlYWQpIHtcbiAgICAgICAgICBjZWxsLnNldEF0dHJpYnV0ZShcImNsYXNzXCIsIFwiY2VsbCBkZWFkXCIpO1xuICAgICAgICB9XG4gICAgICB9XG4gICAgfVxuICB9XG5cbiAgcHJpdmF0ZSBjZWxsVG91Y2hlZEhhbmRsZXIocm93OiBudW1iZXIsIGNvbHVtbjogbnVtYmVyKTogYW55IHtcbiAgICBpZiAodGhpcy5nYW1lRmllbGRbcm93XVtjb2x1bW5dICE9PSBGaWVsZFN0YXRlLkFsaXZlKSB7XG4gICAgICB0aGlzLmdhbWVGaWVsZFtyb3ddW2NvbHVtbl0gPSBGaWVsZFN0YXRlLkFsaXZlO1xuICAgICAgdGhpcy51cGRhdGVGaWVsZCgpO1xuICAgIH1cbiAgfVxuXG4gIHByaXZhdGUgY2VsbERvd25IYW5kbGVyKHJvdzogbnVtYmVyLCBjb2x1bW46IG51bWJlcik6IGFueSB7XG4gICAgdGhpcy5tb3VzZURvd24gPSB0cnVlO1xuICAgIGlmICh0aGlzLmdhbWVGaWVsZFtyb3ddW2NvbHVtbl0gIT09IEZpZWxkU3RhdGUuQWxpdmUpIHtcbiAgICAgIHRoaXMuZ2FtZUZpZWxkW3Jvd11bY29sdW1uXSA9IEZpZWxkU3RhdGUuQWxpdmU7XG4gICAgICB0aGlzLnVwZGF0ZUZpZWxkKCk7XG4gICAgfVxuICB9XG5cbiAgcHJpdmF0ZSBmaWVsZERvd25IYW5kbGVyKCk6IGFueSB7XG4gICAgdGhpcy5tb3VzZURvd24gPSB0cnVlO1xuICB9XG5cbiAgcHJpdmF0ZSBjZWxsVXBIYW5kbGVyKCk6IGFueSB7XG4gICAgdGhpcy5tb3VzZURvd24gPSBmYWxzZTtcbiAgfVxuXG4gIHByaXZhdGUgZmllbGRVcEhhbmRsZXIoKTogYW55IHtcbiAgICB0aGlzLm1vdXNlRG93biA9IGZhbHNlO1xuICB9XG5cbiAgcHJpdmF0ZSBjZWxsSG92ZXJlZEhhbmRsZXIocm93OiBudW1iZXIsIGNvbHVtbjogbnVtYmVyKTogYW55IHtcbiAgICBpZiAodGhpcy5tb3VzZURvd24gJiYgKHRoaXMuZ2FtZUZpZWxkW3Jvd11bY29sdW1uXSAhPT0gRmllbGRTdGF0ZS5BbGl2ZSkpIHtcbiAgICAgIHRoaXMuZ2FtZUZpZWxkW3Jvd11bY29sdW1uXSA9IEZpZWxkU3RhdGUuQWxpdmU7XG4gICAgICB0aGlzLnVwZGF0ZUZpZWxkKCk7XG4gICAgfVxuICB9XG59XG5cbndpbmRvdy5jdXN0b21FbGVtZW50cy5kZWZpbmUoXCJjZ29sLXBpdGNoXCIsIEdhbWVGaWVsZCk7XG4iXX0=
