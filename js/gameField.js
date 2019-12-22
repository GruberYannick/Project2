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
                    if ((newValue !== oldValue) && (newValue !== this.columns)) {
                        this.widthUpdated(newValue);
                    }
                    break;
                case "height":
                    if ((newValue !== oldValue) && (newValue !== this.rows)) {
                        this.heightUpdated(newValue);
                    }
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
                    if ((newValue !== oldValue) && (newValue !== this.speed)) {
                        this.speedUpdated(newValue);
                    }
                    break;
                default:
                    break;
            }
        }
    }
    static get observedAttributes() {
        return ["width", "height", "start", "pause", "clear", "level", "random", "speed"];
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
      background-color: white;
    }

    .alive {
      background-color: darkblue;
    }

    .dead {
      background-color: lightgreen;
    }
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

//# sourceMappingURL=data:application/json;charset=utf8;base64,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QUNILENBQUM7SUFFTyxlQUFlLENBQUMsR0FBVyxFQUFFLE1BQWM7UUFDakQsSUFBSSxDQUFDLFNBQVMsR0FBRyxJQUFJLENBQUM7UUFDdEIsSUFBSSxJQUFJLENBQUMsU0FBUyxDQUFDLEdBQUcsQ0FBQyxDQUFDLE1BQU0sQ0FBQyxLQUFLLFVBQVUsQ0FBQyxLQUFLLEVBQUU7WUFDcEQsSUFBSSxDQUFDLFNBQVMsQ0FBQyxHQUFHLENBQUMsQ0FBQyxNQUFNLENBQUMsR0FBRyxVQUFVLENBQUMsS0FBSyxDQUFDO1lBQy9DLElBQUksQ0FBQyxXQUFXLEVBQUUsQ0FBQztTQUNwQjtJQUNILENBQUM7SUFFTyxnQkFBZ0I7UUFDdEIsSUFBSSxDQUFDLFNBQVMsR0FBRyxJQUFJLENBQUM7SUFDeEIsQ0FBQztJQUVPLGFBQWE7UUFDbkIsSUFBSSxDQUFDLFNBQVMsR0FBRyxLQUFLLENBQUM7SUFDekIsQ0FBQztJQUVPLGNBQWM7UUFDcEIsSUFBSSxDQUFDLFNBQVMsR0FBRyxLQUFLLENBQUM7SUFDekIsQ0FBQztJQUVPLGtCQUFrQixDQUFDLEdBQVcsRUFBRSxNQUFjO1FBQ3BELElBQUksSUFBSSxDQUFDLFNBQVMsSUFBSSxDQUFDLElBQUksQ0FBQyxTQUFTLENBQUMsR0FBRyxDQUFDLENBQUMsTUFBTSxDQUFDLEtBQUssVUFBVSxDQUFDLEtBQUssQ0FBQyxFQUFFO1lBQ3hFLElBQUksQ0FBQyxTQUFTLENBQUMsR0FBRyxDQUFDLENBQUMsTUFBTSxDQUFDLEdBQUcsVUFBVSxDQUFDLEtBQUssQ0FBQztZQUMvQyxJQUFJLENBQUMsV0FBVyxFQUFFLENBQUM7U0FDcEI7SUFDSCxDQUFDO0NBQ0Y7QUFFRCxNQUFNLENBQUMsY0FBYyxDQUFDLE1BQU0sQ0FBQyxZQUFZLEVBQUUsU0FBUyxDQUFDLENBQUMiLCJmaWxlIjoiZ2FtZUZpZWxkLmpzIiwic291cmNlc0NvbnRlbnQiOlsiZW51bSBGaWVsZFN0YXRlIHtcbiAgVW5zZXQgPSAwLFxuICBBbGl2ZSxcbiAgRGVhZCxcbn1cblxuY2xhc3MgR2FtZUZpZWxkIGV4dGVuZHMgSFRNTEVsZW1lbnQge1xuICBwcml2YXRlIGNvbHVtbnM6IG51bWJlcjtcbiAgcHJpdmF0ZSByb3dzOiBudW1iZXI7XG5cbiAgcHJpdmF0ZSBzaXplOiBudW1iZXI7XG5cbiAgcHJpdmF0ZSB2aWV3cG9ydFdpZHRoOiBudW1iZXI7XG4gIHByaXZhdGUgdmlld3BvcnRIZWlnaHQ6IG51bWJlcjtcblxuICBwcml2YXRlIGdhbWVGaWVsZDogbnVtYmVyW11bXTtcblxuICBwcml2YXRlIG1vdXNlRG93bjogYm9vbGVhbjtcblxuICBwcml2YXRlIHJ1bm5pbmc6IGJvb2xlYW47XG4gIHByaXZhdGUgZ2VuZXJhdGlvbjogbnVtYmVyO1xuXG4gIHByaXZhdGUgaW5pdGlhbGl6ZWQ6IGJvb2xlYW47XG5cbiAgcHJpdmF0ZSBzcGVlZDogbnVtYmVyO1xuXG4gIGNvbnN0cnVjdG9yKCkge1xuICAgIHN1cGVyKCk7XG4gICAgdGhpcy5jb2x1bW5zID0gNjA7XG4gICAgdGhpcy5yb3dzID0gMjU7XG4gICAgdGhpcy5zaXplID0gMDtcbiAgICB0aGlzLnZpZXdwb3J0V2lkdGggPSAwO1xuICAgIHRoaXMudmlld3BvcnRIZWlnaHQgPSAwO1xuICAgIHRoaXMuZ2FtZUZpZWxkID0gW107XG4gICAgdGhpcy5tb3VzZURvd24gPSBmYWxzZTtcbiAgICB0aGlzLnJ1bm5pbmcgPSBmYWxzZTtcbiAgICB0aGlzLmdlbmVyYXRpb24gPSAxO1xuICAgIHRoaXMuaW5pdGlhbGl6ZWQgPSBmYWxzZTtcbiAgICB0aGlzLnNwZWVkID0gMDtcbiAgfVxuXG4gIHB1YmxpYyBjb25uZWN0ZWRDYWxsYmFjaygpIHtcbiAgICB3aW5kb3cub25yZXNpemUgPSAoKSA9PiB0aGlzLnZpZXdwb3J0VXBkYXRlZCgpO1xuXG4gICAgdGhpcy5nYW1lRmllbGQgPSB0aGlzLmNyZWF0ZUdhbWVGaWVsZCgpO1xuXG4gICAgdGhpcy5zZXRWaWV3cG9ydFZhbHVlcygpO1xuICAgIHRoaXMuc2l6ZSA9IE1hdGgubWluKHRoaXMudmlld3BvcnRXaWR0aCAvIHRoaXMuY29sdW1ucywgdGhpcy52aWV3cG9ydEhlaWdodCAvIHRoaXMucm93cyk7XG5cbiAgICB0aGlzLmF0dGFjaFNoYWRvdyh7IG1vZGU6IFwib3BlblwiIH0pO1xuICAgIHRoaXMuY3JlYXRlU2hhZG93RG9tKCk7XG5cbiAgICB0aGlzLmluaXRpYWxpemVkID0gdHJ1ZTtcbiAgfVxuXG4gIHB1YmxpYyBhdHRyaWJ1dGVDaGFuZ2VkQ2FsbGJhY2sobmFtZTogc3RyaW5nLCBvbGRWYWx1ZTogYW55LCBuZXdWYWx1ZTogYW55KSB7XG4gICAgaWYgKHRoaXMuaW5pdGlhbGl6ZWQpIHtcbiAgICAgIHN3aXRjaCAobmFtZSkge1xuICAgICAgICBjYXNlIFwid2lkdGhcIjpcbiAgICAgICAgICBpZiAoKG5ld1ZhbHVlICE9PSBvbGRWYWx1ZSkgJiYgKG5ld1ZhbHVlICE9PSB0aGlzLmNvbHVtbnMpKSB7XG4gICAgICAgICAgICB0aGlzLndpZHRoVXBkYXRlZChuZXdWYWx1ZSk7XG4gICAgICAgICAgfVxuICAgICAgICAgIGJyZWFrO1xuICAgICAgICBjYXNlIFwiaGVpZ2h0XCI6XG4gICAgICAgICAgaWYgKChuZXdWYWx1ZSAhPT0gb2xkVmFsdWUpICYmIChuZXdWYWx1ZSAhPT0gdGhpcy5yb3dzKSkge1xuICAgICAgICAgICAgdGhpcy5oZWlnaHRVcGRhdGVkKG5ld1ZhbHVlKTtcbiAgICAgICAgICB9XG4gICAgICAgICAgYnJlYWs7XG4gICAgICAgIGNhc2UgXCJzdGFydFwiOlxuICAgICAgICAgIHRoaXMuZG9TdGFydCgpO1xuICAgICAgICAgIGJyZWFrO1xuICAgICAgICBjYXNlIFwicGF1c2VcIjpcbiAgICAgICAgICB0aGlzLmRvUGF1c2UoKTtcbiAgICAgICAgICBicmVhaztcbiAgICAgICAgY2FzZSBcImNsZWFyXCI6XG4gICAgICAgICAgdGhpcy5kb0NsZWFyKCk7XG4gICAgICAgICAgYnJlYWs7XG4gICAgICAgIGNhc2UgXCJsZXZlbFwiOlxuICAgICAgICAgIHRoaXMubG9hZExldmVsKG5ld1ZhbHVlKTtcbiAgICAgICAgICBicmVhaztcbiAgICAgICAgY2FzZSBcInJhbmRvbVwiOlxuICAgICAgICAgIHRoaXMucmFuZG9taXplKCk7XG4gICAgICAgICAgYnJlYWs7XG4gICAgICAgIGNhc2UgXCJzcGVlZFwiOlxuICAgICAgICAgIGlmICgobmV3VmFsdWUgIT09IG9sZFZhbHVlKSAmJiAobmV3VmFsdWUgIT09IHRoaXMuc3BlZWQpKSB7XG4gICAgICAgICAgICB0aGlzLnNwZWVkVXBkYXRlZChuZXdWYWx1ZSk7XG4gICAgICAgICAgfVxuICAgICAgICAgIGJyZWFrO1xuICAgICAgICBkZWZhdWx0OlxuICAgICAgICAgIGJyZWFrO1xuICAgICAgfVxuICAgIH1cbiAgfVxuXG4gIHN0YXRpYyBnZXQgb2JzZXJ2ZWRBdHRyaWJ1dGVzKCkge1xuICAgIHJldHVybiBbXCJ3aWR0aFwiLCBcImhlaWdodFwiLCBcInN0YXJ0XCIsIFwicGF1c2VcIiwgXCJjbGVhclwiLCBcImxldmVsXCIsIFwicmFuZG9tXCIsIFwic3BlZWRcIl07XG4gIH1cblxuICBwcml2YXRlIGNyZWF0ZUdhbWVGaWVsZCgpOiBudW1iZXJbXVtdIHtcbiAgICBjb25zdCBhcnI6IG51bWJlcltdW10gPSBbXTtcblxuICAgIGZvciAobGV0IHJvdzogbnVtYmVyID0gMDsgcm93IDwgdGhpcy5yb3dzOyByb3crKykge1xuICAgICAgYXJyW3Jvd10gPSBbXTtcbiAgICAgIGZvciAobGV0IGNvbHVtbjogbnVtYmVyID0gMDsgY29sdW1uIDwgdGhpcy5jb2x1bW5zOyBjb2x1bW4rKykge1xuICAgICAgICBhcnJbcm93XVtjb2x1bW5dID0gRmllbGRTdGF0ZS5VbnNldDtcbiAgICAgIH1cbiAgICB9XG5cbiAgICByZXR1cm4gYXJyO1xuICB9XG5cbiAgcHJpdmF0ZSB3aWR0aFVwZGF0ZWQobmV3V2lkdGg6IHN0cmluZykge1xuICAgIGNvbnN0IHdpZHRoID0gcGFyc2VJbnQobmV3V2lkdGgsIDEwKTtcblxuICAgIGlmICghaXNOYU4od2lkdGgpKSB7XG4gICAgICBjb25zdCBjb2x1bW5zID0gTWF0aC5tYXgoMTAsIHdpZHRoKTtcbiAgICAgIGlmIChjb2x1bW5zICE9PSB0aGlzLmNvbHVtbnMpIHtcbiAgICAgICAgdGhpcy5jb2x1bW5zID0gY29sdW1ucztcbiAgICAgICAgdGhpcy5zaXplVXBkYXRlZCgpO1xuICAgICAgfVxuICAgIH1cblxuICAgIHRoaXMuZGlzcGF0Y2hFdmVudChuZXcgQ3VzdG9tRXZlbnQoXCJ3aWR0aFVwZGF0ZWRFdmVudFwiLCB7IGRldGFpbDogdGhpcy5jb2x1bW5zIH0pKTtcbiAgfVxuXG4gIHByaXZhdGUgaGVpZ2h0VXBkYXRlZChuZXdIZWlnaHQ6IHN0cmluZykge1xuICAgIGNvbnN0IGhlaWdodCA9IHBhcnNlSW50KG5ld0hlaWdodCwgMTApO1xuXG4gICAgaWYgKCFpc05hTihoZWlnaHQpKSB7XG4gICAgICBjb25zdCByb3dzID0gTWF0aC5tYXgoMTAsIGhlaWdodCk7XG4gICAgICBpZiAocm93cyAhPT0gdGhpcy5yb3dzKSB7XG4gICAgICAgIHRoaXMucm93cyA9IHJvd3M7XG4gICAgICAgIHRoaXMuc2l6ZVVwZGF0ZWQoKTtcbiAgICAgIH1cbiAgICB9XG5cbiAgICB0aGlzLmRpc3BhdGNoRXZlbnQobmV3IEN1c3RvbUV2ZW50KFwiaGVpZ2h0VXBkYXRlZEV2ZW50XCIsIHsgZGV0YWlsOiB0aGlzLnJvd3MgfSkpO1xuICB9XG5cbiAgcHJpdmF0ZSBzcGVlZFVwZGF0ZWQobmV3U3BlZWQ6IGFueSkge1xuICAgIGNvbnN0IHNwZWVkID0gcGFyc2VJbnQobmV3U3BlZWQsIDEwKTtcbiAgICBpZiAoIWlzTmFOKHNwZWVkKSkge1xuICAgICAgaWYgKHNwZWVkICE9PSB0aGlzLnNwZWVkKSB7XG4gICAgICAgIHRoaXMuc3BlZWQgPSBzcGVlZDtcbiAgICAgIH1cbiAgICB9XG4gICAgdGhpcy5kaXNwYXRjaEV2ZW50KG5ldyBDdXN0b21FdmVudChcInNwZWVkVXBkYXRlZEV2ZW50XCIsIHsgZGV0YWlsOiB0aGlzLnNwZWVkIH0pKTtcbiAgfVxuXG4gIHByaXZhdGUgc2l6ZVVwZGF0ZWQoKSB7XG4gICAgdGhpcy5nYW1lRmllbGQgPSB0aGlzLmNyZWF0ZUdhbWVGaWVsZCgpO1xuICAgIHRoaXMuZ2VuZXJhdGlvbiA9IDE7XG4gICAgdGhpcy5zaXplID0gTWF0aC5taW4odGhpcy52aWV3cG9ydFdpZHRoIC8gdGhpcy5jb2x1bW5zLCB0aGlzLnZpZXdwb3J0SGVpZ2h0IC8gdGhpcy5yb3dzKTtcbiAgICB0aGlzLmNyZWF0ZVNoYWRvd0RvbSgpO1xuICAgIHRoaXMuZGlzcGF0Y2hFdmVudChuZXcgQ3VzdG9tRXZlbnQoXCJnZW5lcmF0aW9uVXBkYXRlZEV2ZW50XCIsIHsgZGV0YWlsOiB0aGlzLmdlbmVyYXRpb24gfSkpO1xuICB9XG5cbiAgcHJpdmF0ZSBzZXRWaWV3cG9ydFZhbHVlcygpIHtcbiAgICB0aGlzLnZpZXdwb3J0V2lkdGggPSBNYXRoLm1pbihkb2N1bWVudC5kb2N1bWVudEVsZW1lbnQuY2xpZW50V2lkdGgsIHdpbmRvdy5pbm5lcldpZHRoKTtcbiAgICB0aGlzLnZpZXdwb3J0SGVpZ2h0ID0gTWF0aC5taW4oZG9jdW1lbnQuZG9jdW1lbnRFbGVtZW50LmNsaWVudEhlaWdodCwgd2luZG93LmlubmVySGVpZ2h0KTtcbiAgfVxuXG4gIHByaXZhdGUgdmlld3BvcnRVcGRhdGVkKCkge1xuICAgIHRoaXMuc2V0Vmlld3BvcnRWYWx1ZXMoKTtcblxuICAgIHRoaXMuc2l6ZSA9IE1hdGgubWluKHRoaXMudmlld3BvcnRXaWR0aCAvIHRoaXMuY29sdW1ucywgdGhpcy52aWV3cG9ydEhlaWdodCAvIHRoaXMucm93cyk7XG5cbiAgICBjb25zdCBzdHlsZVNoZWV0cyA9IHRoaXMuc2hhZG93Um9vdC5zdHlsZVNoZWV0cztcbiAgICBsZXQgc3R5bGVTaGVldDogeyBbaW5kZXg6IHN0cmluZ106IGFueSB9ID0ge307XG4gICAgc3R5bGVTaGVldCA9IHN0eWxlU2hlZXRzWzBdO1xuXG4gICAgLy8gLmNlbGxcbiAgICBzdHlsZVNoZWV0W1wiY3NzUnVsZXNcIl1bMF0uc3R5bGUud2lkdGggPSBgJHt0aGlzLnNpemV9cHhgO1xuICAgIHN0eWxlU2hlZXRbXCJjc3NSdWxlc1wiXVswXS5zdHlsZS5oZWlnaHQgPSBgJHt0aGlzLnNpemV9cHhgO1xuXG4gICAgLy8gLnJvd1xuICAgIHN0eWxlU2hlZXRbXCJjc3NSdWxlc1wiXVsxXS5zdHlsZS53aWR0aCA9IGAke3RoaXMuc2l6ZSAqIHRoaXMuY29sdW1uc31weGA7XG4gICAgc3R5bGVTaGVldFtcImNzc1J1bGVzXCJdWzFdLnN0eWxlLmhlaWdodCA9IGAke3RoaXMuc2l6ZX1weGA7XG5cbiAgICAvLyAuZ3JpZFxuICAgIHN0eWxlU2hlZXRbXCJjc3NSdWxlc1wiXVsyXS5zdHlsZS53aWR0aCA9IGAke3RoaXMuc2l6ZSAqIHRoaXMuY29sdW1uc31weGA7XG4gICAgc3R5bGVTaGVldFtcImNzc1J1bGVzXCJdWzJdLnN0eWxlLmhlaWdodCA9IGAke3RoaXMuc2l6ZSAqIHRoaXMucm93c31weGA7XG4gIH1cblxuICBwcml2YXRlIGNyZWF0ZVNoYWRvd0RvbSgpIHtcbiAgICB0aGlzLnNoYWRvd1Jvb3QuaW5uZXJIVE1MID0gdGhpcy5jcmVhdGVTaGFkb3dDc3MoKTtcbiAgICBjb25zdCBncmlkRWxlbSA9IHRoaXMuY3JlYXRlU2hhZG93R2FtZUZpZWxkKCk7XG4gICAgdGhpcy5zaGFkb3dSb290LmFwcGVuZENoaWxkKGdyaWRFbGVtKTtcbiAgICB0aGlzLnZpZXdwb3J0VXBkYXRlZCgpO1xuICB9XG5cbiAgcHJpdmF0ZSBjcmVhdGVTaGFkb3dDc3MoKSB7XG4gICAgcmV0dXJuIGA8c3R5bGU+XG4gICAgLmNlbGwge1xuICAgICAgYm94LXNpemluZzogYm9yZGVyLWJveDtcbiAgICAgIHdpZHRoOiAke3RoaXMuc2l6ZX1weDtcbiAgICAgIGhlaWdodDogJHt0aGlzLnNpemV9cHg7XG4gICAgICBiYWNrZ3JvdW5kLWNvbG9yOiB3aGl0ZTtcbiAgICAgIGZsb2F0OiBsZWZ0O1xuICAgICAgYmFja2dyb3VuZC1jbGlwOiBjb250ZW50LWJveDtcbiAgICAgIHBhZGRpbmc6IDFweDtcbiAgICB9XG5cbiAgICAucm93IHtcbiAgICAgIGJveC1zaXppbmc6IGJvcmRlci1ib3g7XG4gICAgICB3aWR0aDogJHt0aGlzLnNpemUgKiB0aGlzLmNvbHVtbnN9cHg7XG4gICAgICBoZWlnaHQ6ICR7dGhpcy5zaXplfXB4O1xuICAgICAgY2xlYXI6IGJvdGg7XG4gICAgICBmbG9hdDogbGVmdDtcbiAgICB9XG5cbiAgICAuZ3JpZCB7XG4gICAgICBib3gtc2l6aW5nOiBib3JkZXItYm94O1xuICAgICAgd2lkdGg6ICR7dGhpcy5zaXplICogdGhpcy5jb2x1bW5zfXB4O1xuICAgICAgaGVpZ2h0OiAke3RoaXMuc2l6ZSAqIHRoaXMucm93c31weDtcbiAgICAgIG1hcmdpbjogYXV0bztcbiAgICB9XG5cbiAgICAudW5zZXQge1xuICAgICAgYmFja2dyb3VuZC1jb2xvcjogd2hpdGU7XG4gICAgfVxuXG4gICAgLmFsaXZlIHtcbiAgICAgIGJhY2tncm91bmQtY29sb3I6IGRhcmtibHVlO1xuICAgIH1cblxuICAgIC5kZWFkIHtcbiAgICAgIGJhY2tncm91bmQtY29sb3I6IGxpZ2h0Z3JlZW47XG4gICAgfVxuICAgIGA7XG4gIH1cblxuICBwcml2YXRlIGNyZWF0ZVNoYWRvd0dhbWVGaWVsZCgpIHtcbiAgICBjb25zdCBncmlkRWxlbSA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoXCJkaXZcIik7XG4gICAgZ3JpZEVsZW0uY2xhc3NOYW1lID0gXCJncmlkXCI7XG4gICAgZm9yIChsZXQgcm93ID0gMDsgcm93IDwgdGhpcy5yb3dzOyByb3crKykge1xuICAgICAgY29uc3Qgcm93RWxlbSA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoXCJkaXZcIik7XG4gICAgICByb3dFbGVtLmNsYXNzTmFtZSA9IFwicm93XCI7XG4gICAgICBmb3IgKGxldCBjb2x1bW4gPSAwOyBjb2x1bW4gPCB0aGlzLmNvbHVtbnM7IGNvbHVtbisrKSB7XG4gICAgICAgIGNvbnN0IGNlbGxFbGVtID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudChcImRpdlwiKTtcblxuICAgICAgICAvLyBmaW5kaW5nIHRoaXMgY2VsbCBhZ2FpbiBpcyBtdWNoIGZhc3RlciBpZiB0aGUgZWxlbWVudHMgYXJlIGluIG9uZSBhdHRyaWJ1dGVcbiAgICAgICAgLy8gYW5kIGV2ZW4gZmFzdGVyIGlmIHRoZXkgYXJlIGluIHRoZSBpZC5cbiAgICAgICAgLy8gQnkgdXNpbmcgdHdvIGF0dHJpYnV0ZXMgb3Igc29tZXRoaW5nIGVsc2UgdGhhbiB0aGUgaWQsIGV2ZXJ5dGhpbmcgY3Jhd2xzIHRvIGEgc3RvcC5cbiAgICAgICAgY2VsbEVsZW0uc2V0QXR0cmlidXRlKFwiaWRcIiwgYCR7cm93fSwke2NvbHVtbn1gKTtcblxuICAgICAgICBzd2l0Y2ggKHRoaXMuZ2FtZUZpZWxkW3Jvd11bY29sdW1uXSkge1xuICAgICAgICAgIGNhc2UgRmllbGRTdGF0ZS5VbnNldDpcbiAgICAgICAgICAgIGNlbGxFbGVtLmNsYXNzTmFtZSA9IFwiY2VsbCB1bnNldFwiO1xuICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgY2FzZSBGaWVsZFN0YXRlLkFsaXZlOlxuICAgICAgICAgICAgY2VsbEVsZW0uY2xhc3NOYW1lID0gXCJjZWxsIGFsaXZlXCI7XG4gICAgICAgICAgICBicmVhaztcbiAgICAgICAgICBjYXNlIEZpZWxkU3RhdGUuRGVhZDpcbiAgICAgICAgICAgIGNlbGxFbGVtLmNsYXNzTmFtZSA9IFwiY2VsbCBkZWFkXCI7XG4gICAgICAgICAgICBicmVhaztcbiAgICAgICAgICBkZWZhdWx0OlxuICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgIH1cblxuICAgICAgICBjZWxsRWxlbS5hZGRFdmVudExpc3RlbmVyKFwibW91c2VvdmVyXCIsICgpID0+IHRoaXMuY2VsbEhvdmVyZWRIYW5kbGVyKHJvdywgY29sdW1uKSk7XG4gICAgICAgIGNlbGxFbGVtLmFkZEV2ZW50TGlzdGVuZXIoXCJtb3VzZWRvd25cIiwgKCkgPT4gdGhpcy5jZWxsRG93bkhhbmRsZXIocm93LCBjb2x1bW4pKTtcbiAgICAgICAgY2VsbEVsZW0uYWRkRXZlbnRMaXN0ZW5lcihcIm1vdXNldXBcIiwgKCkgPT4gdGhpcy5jZWxsVXBIYW5kbGVyKCkpO1xuICAgICAgICBjZWxsRWxlbS5hZGRFdmVudExpc3RlbmVyKFwidG91Y2hzdGFydFwiLCAoKSA9PiB0aGlzLmNlbGxUb3VjaGVkSGFuZGxlcihyb3csIGNvbHVtbikpO1xuICAgICAgICByb3dFbGVtLmFwcGVuZENoaWxkKGNlbGxFbGVtKTtcbiAgICAgIH1cbiAgICAgIGdyaWRFbGVtLmFkZEV2ZW50TGlzdGVuZXIoXCJtb3VzZWRvd25cIiwgKCkgPT4gdGhpcy5maWVsZERvd25IYW5kbGVyKCkpO1xuICAgICAgZ3JpZEVsZW0uYWRkRXZlbnRMaXN0ZW5lcihcIm1vdXNldXBcIiwgKCkgPT4gdGhpcy5maWVsZFVwSGFuZGxlcigpKTtcbiAgICAgIGdyaWRFbGVtLmFwcGVuZENoaWxkKHJvd0VsZW0pO1xuICAgIH1cblxuICAgIHJldHVybiBncmlkRWxlbTtcbiAgfVxuXG4gIHByaXZhdGUgZG9TdGFydCgpIHtcbiAgICBpZiAoIXRoaXMucnVubmluZykge1xuICAgICAgdGhpcy5ydW5uaW5nID0gdHJ1ZTtcbiAgICAgIHRoaXMuZGlzcGF0Y2hFdmVudChuZXcgQ3VzdG9tRXZlbnQoXCJydW5uaW5nU3RhcnRlZEV2ZW50XCIsIHsgZGV0YWlsOiB0aGlzLnJ1bm5pbmcgfSkpO1xuICAgICAgdGhpcy5leGVjdXRlKCk7XG4gICAgfVxuICB9XG5cbiAgcHJpdmF0ZSBkb1BhdXNlKCkge1xuICAgIHRoaXMucnVubmluZyA9IGZhbHNlO1xuICAgIHRoaXMuZGlzcGF0Y2hFdmVudChuZXcgQ3VzdG9tRXZlbnQoXCJydW5uaW5nU3RvcHBlZEV2ZW50XCIsIHsgZGV0YWlsOiB0aGlzLnJ1bm5pbmcgfSkpO1xuICB9XG5cbiAgcHJpdmF0ZSBkb0NsZWFyKCkge1xuICAgIHRoaXMucnVubmluZyA9IGZhbHNlO1xuICAgIHRoaXMuZ2FtZUZpZWxkID0gdGhpcy5jcmVhdGVHYW1lRmllbGQoKTtcbiAgICB0aGlzLmdlbmVyYXRpb24gPSAxO1xuICAgIHRoaXMudXBkYXRlRmllbGQoKTtcbiAgICB0aGlzLmRpc3BhdGNoRXZlbnQobmV3IEN1c3RvbUV2ZW50KFwiZ2VuZXJhdGlvblVwZGF0ZWRFdmVudFwiLCB7IGRldGFpbDogdGhpcy5nZW5lcmF0aW9uIH0pKTtcbiAgICB0aGlzLmRpc3BhdGNoRXZlbnQobmV3IEN1c3RvbUV2ZW50KFwicnVubmluZ1N0b3BwZWRFdmVudFwiLCB7IGRldGFpbDogdGhpcy5ydW5uaW5nIH0pKTtcbiAgfVxuXG4gIHByaXZhdGUgbG9hZExldmVsKGxldmVsOiBzdHJpbmcpIHtcbiAgICBjb25zdCBsZXZlbEFycmF5ID0gbGV2ZWwuc3BsaXQoXCJcXG5cIik7XG5cbiAgICBjb25zdCByb3dzID0gbGV2ZWxBcnJheS5sZW5ndGg7XG4gICAgbGV0IGNvbHVtbnMgPSAwO1xuXG4gICAgZm9yIChsZXQgcm93ID0gMDsgcm93IDwgbGV2ZWxBcnJheS5sZW5ndGg7IHJvdysrKSB7XG4gICAgICBsZXZlbEFycmF5W3Jvd10gPSBsZXZlbEFycmF5W3Jvd10ucmVwbGFjZSgvXFxzL2csIFwiXCIpO1xuICAgICAgY29sdW1ucyA9IE1hdGgubWF4KGNvbHVtbnMsIGxldmVsQXJyYXlbcm93XS5sZW5ndGgpO1xuICAgIH1cblxuICAgIHRoaXMuaGVpZ2h0VXBkYXRlZChyb3dzLnRvU3RyaW5nKCkpO1xuICAgIHRoaXMud2lkdGhVcGRhdGVkKGNvbHVtbnMudG9TdHJpbmcoKSk7XG5cbiAgICB0aGlzLmRvQ2xlYXIoKTtcblxuICAgIGZvciAobGV0IHJvdyA9IDA7IHJvdyA8IGxldmVsQXJyYXkubGVuZ3RoOyByb3crKykge1xuICAgICAgbGV2ZWxBcnJheVtyb3ddICs9IFwiMFwiLnJlcGVhdChjb2x1bW5zIC0gbGV2ZWxBcnJheVtyb3ddLmxlbmd0aCk7XG4gICAgICBmb3IgKGxldCBjb2x1bW4gPSAwOyBjb2x1bW4gPCBjb2x1bW5zOyBjb2x1bW4rKykge1xuICAgICAgICBpZiAocGFyc2VJbnQobGV2ZWxBcnJheVtyb3ddW2NvbHVtbl0sIDEwKSA9PT0gRmllbGRTdGF0ZS5BbGl2ZSkge1xuICAgICAgICAgIHRoaXMuZ2FtZUZpZWxkW3Jvd11bY29sdW1uXSA9IEZpZWxkU3RhdGUuQWxpdmU7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgdGhpcy5nYW1lRmllbGRbcm93XVtjb2x1bW5dID0gRmllbGRTdGF0ZS5VbnNldDtcbiAgICAgICAgfVxuICAgICAgfVxuICAgIH1cblxuICAgIHRoaXMuY3JlYXRlU2hhZG93RG9tKCk7XG4gIH1cblxuICBwcml2YXRlIHJhbmRvbWl6ZSgpIHtcbiAgICB0aGlzLmRvQ2xlYXIoKTtcblxuICAgIGZvciAobGV0IHJvdzogbnVtYmVyID0gMDsgcm93IDwgdGhpcy5yb3dzOyByb3crKykge1xuICAgICAgZm9yIChsZXQgY29sdW1uOiBudW1iZXIgPSAwOyBjb2x1bW4gPCB0aGlzLmNvbHVtbnM7IGNvbHVtbisrKSB7XG4gICAgICAgIHRoaXMuZ2FtZUZpZWxkW3Jvd11bY29sdW1uXSA9IE1hdGgucm91bmQoTWF0aC5yYW5kb20oKSk7XG4gICAgICB9XG4gICAgfVxuXG4gICAgdGhpcy51cGRhdGVGaWVsZCgpO1xuICB9XG5cbiAgcHJpdmF0ZSBleGVjdXRlKCkge1xuICAgIGlmICh0aGlzLnJ1bm5pbmcpIHtcbiAgICAgIGNvbnN0IG5leHRHZW5lcmF0aW9uR2FtZUZpZWxkID0gdGhpcy5jYWxjdWxhdGVOZXh0R2VuZXJhdGlvbkdhbWVGaWVsZCgpO1xuXG4gICAgICB0aGlzLmdhbWVGaWVsZCA9IG5leHRHZW5lcmF0aW9uR2FtZUZpZWxkO1xuICAgICAgdGhpcy51cGRhdGVGaWVsZCgpO1xuXG4gICAgICB0aGlzLmdlbmVyYXRpb24rKztcbiAgICAgIHRoaXMuZGlzcGF0Y2hFdmVudChuZXcgQ3VzdG9tRXZlbnQoXCJnZW5lcmF0aW9uVXBkYXRlZEV2ZW50XCIsIHsgZGV0YWlsOiB0aGlzLmdlbmVyYXRpb24gfSkpO1xuXG4gICAgICBzZXRUaW1lb3V0KGZ1bmN0aW9uKCkge1xuICAgICAgICB0aGlzLmV4ZWN1dGUoKTtcbiAgICAgIH0uYmluZCh0aGlzKSwgdGhpcy5zcGVlZCk7XG4gICAgfVxuICB9XG5cbiAgcHJpdmF0ZSBjYWxjdWxhdGVOZXh0R2VuZXJhdGlvbkdhbWVGaWVsZCgpIHtcbiAgICBjb25zdCBuZXh0R2VuZXJhdGlvbkdhbWVGaWVsZCA9IHRoaXMuY3JlYXRlR2FtZUZpZWxkKCk7XG4gICAgbGV0IGNvdW50RGlmZmVyZW50Q2VsbHMgPSAwO1xuXG4gICAgZm9yIChsZXQgcm93OiBudW1iZXIgPSAwOyByb3cgPCB0aGlzLnJvd3M7IHJvdysrKSB7XG4gICAgICBmb3IgKGxldCBjb2x1bW46IG51bWJlciA9IDA7IGNvbHVtbiA8IHRoaXMuY29sdW1uczsgY29sdW1uKyspIHtcbiAgICAgICAgbmV4dEdlbmVyYXRpb25HYW1lRmllbGRbcm93XVtjb2x1bW5dID0gdGhpcy5jYWxjdWxhdGVOZXh0R2VuZXJhdGlvbkNlbGwocm93LCBjb2x1bW4pO1xuICAgICAgICBpZiAobmV4dEdlbmVyYXRpb25HYW1lRmllbGRbcm93XVtjb2x1bW5dICE9PSB0aGlzLmdhbWVGaWVsZFtyb3ddW2NvbHVtbl0pIHtcbiAgICAgICAgICBjb3VudERpZmZlcmVudENlbGxzKys7XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICB9XG5cbiAgICBpZiAoY291bnREaWZmZXJlbnRDZWxscyA9PT0gMCkge1xuICAgICAgdGhpcy5kb1BhdXNlKCk7XG4gICAgfVxuXG4gICAgcmV0dXJuIG5leHRHZW5lcmF0aW9uR2FtZUZpZWxkO1xuICB9XG5cbiAgcHJpdmF0ZSBjYWxjdWxhdGVOZXh0R2VuZXJhdGlvbkNlbGwocm93OiBudW1iZXIsIGNvbHVtbjogbnVtYmVyKTogRmllbGRTdGF0ZSB7XG4gICAgY29uc3QgYWxpdmVOZWlnaGJvdXJzID0gdGhpcy5jb3VudEFsaXZlTmVpZ2hib3Vycyhyb3csIGNvbHVtbik7XG5cbiAgICBpZiAodGhpcy5nYW1lRmllbGRbcm93XVtjb2x1bW5dID09PSBGaWVsZFN0YXRlLkFsaXZlKSB7XG4gICAgICBpZiAoYWxpdmVOZWlnaGJvdXJzIDw9IDEpIHtcbiAgICAgICAgcmV0dXJuIEZpZWxkU3RhdGUuRGVhZDtcbiAgICAgIH0gZWxzZSBpZiAoYWxpdmVOZWlnaGJvdXJzID49IDQpIHtcbiAgICAgICAgcmV0dXJuIEZpZWxkU3RhdGUuRGVhZDtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIHJldHVybiBGaWVsZFN0YXRlLkFsaXZlO1xuICAgICAgfVxuICAgIH0gZWxzZSB7XG4gICAgICBpZiAoYWxpdmVOZWlnaGJvdXJzID09PSAzKSB7XG4gICAgICAgIHJldHVybiBGaWVsZFN0YXRlLkFsaXZlO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgcmV0dXJuIHRoaXMuZ2FtZUZpZWxkW3Jvd11bY29sdW1uXTtcbiAgICAgIH1cbiAgICB9XG4gIH1cblxuICBwcml2YXRlIGNvdW50QWxpdmVOZWlnaGJvdXJzKHJvdzogbnVtYmVyLCBjb2x1bW46IG51bWJlcik6IG51bWJlciB7XG4gICAgbGV0IGFsaXZlTmVpZ2hib3VycyA9IDA7XG5cbiAgICBmb3IgKGxldCBpOiBudW1iZXIgPSAtMTsgaSA8PSAxOyBpKyspIHtcbiAgICAgIGZvciAobGV0IGo6IG51bWJlciA9IC0xOyBqIDw9IDE7IGorKykge1xuICAgICAgICBjb25zdCByb3dUb0NoZWNrID0gKHJvdyArIGkgKyB0aGlzLnJvd3MpICUgdGhpcy5yb3dzO1xuICAgICAgICBjb25zdCBjb2x1bW5Ub0NoZWNrID0gKGNvbHVtbiArIGogKyB0aGlzLmNvbHVtbnMpICUgdGhpcy5jb2x1bW5zO1xuICAgICAgICBpZiAodGhpcy5nYW1lRmllbGRbcm93VG9DaGVja11bY29sdW1uVG9DaGVja10gPT09IEZpZWxkU3RhdGUuQWxpdmUpIHtcbiAgICAgICAgICBhbGl2ZU5laWdoYm91cnMrKztcbiAgICAgICAgfVxuICAgICAgfVxuICAgIH1cblxuICAgIGlmICh0aGlzLmdhbWVGaWVsZFtyb3ddW2NvbHVtbl0gPT09IEZpZWxkU3RhdGUuQWxpdmUpIHtcbiAgICAgIGFsaXZlTmVpZ2hib3Vycy0tO1xuICAgIH1cblxuICAgIHJldHVybiBhbGl2ZU5laWdoYm91cnM7XG4gIH1cblxuICBwcml2YXRlIHVwZGF0ZUZpZWxkKCkge1xuICAgIGZvciAobGV0IHJvdyA9IDA7IHJvdyA8IHRoaXMucm93czsgcm93KyspIHtcbiAgICAgIGZvciAobGV0IGNvbHVtbiA9IDA7IGNvbHVtbiA8IHRoaXMuY29sdW1uczsgY29sdW1uKyspIHtcblxuICAgICAgICAvLyBmaW5kaW5nIHRoaXMgY2VsbCBpcyBtdWNoIGZhc3RlciBpZiB0aGUgZWxlbWVudHMgYXJlIGluIG9uZSBhdHRyaWJ1dGUgYW5kIGV2ZW4gZmFzdGVyIGlmIHRoZXkgYXJlIGluIHRoZSBpZC5cbiAgICAgICAgLy8gQnkgdXNpbmcgdHdvIGF0dHJpYnV0ZXMgb3Igc29tZXRoaW5nIGVsc2UgdGhhbiB0aGUgaWQsIGV2ZXJ5dGhpbmcgY3Jhd2xzIHRvIGEgc3RvcC5cbiAgICAgICAgY29uc3QgY2VsbCA9IHRoaXMuc2hhZG93Um9vdC5nZXRFbGVtZW50QnlJZChgJHtyb3d9LCR7Y29sdW1ufWApO1xuXG4gICAgICAgIGlmICh0aGlzLmdhbWVGaWVsZFtyb3ddW2NvbHVtbl0gPT09IEZpZWxkU3RhdGUuVW5zZXQpIHtcbiAgICAgICAgICBjZWxsLnNldEF0dHJpYnV0ZShcImNsYXNzXCIsIFwiY2VsbCB1bnNldFwiKTtcbiAgICAgICAgfSBlbHNlIGlmICh0aGlzLmdhbWVGaWVsZFtyb3ddW2NvbHVtbl0gPT09IEZpZWxkU3RhdGUuQWxpdmUpIHtcbiAgICAgICAgICBjZWxsLnNldEF0dHJpYnV0ZShcImNsYXNzXCIsIFwiY2VsbCBhbGl2ZVwiKTtcbiAgICAgICAgfSBlbHNlIGlmICh0aGlzLmdhbWVGaWVsZFtyb3ddW2NvbHVtbl0gPT09IEZpZWxkU3RhdGUuRGVhZCkge1xuICAgICAgICAgIGNlbGwuc2V0QXR0cmlidXRlKFwiY2xhc3NcIiwgXCJjZWxsIGRlYWRcIik7XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICB9XG4gIH1cblxuICBwcml2YXRlIGNlbGxUb3VjaGVkSGFuZGxlcihyb3c6IG51bWJlciwgY29sdW1uOiBudW1iZXIpOiBhbnkge1xuICAgIGlmICh0aGlzLmdhbWVGaWVsZFtyb3ddW2NvbHVtbl0gIT09IEZpZWxkU3RhdGUuQWxpdmUpIHtcbiAgICAgIHRoaXMuZ2FtZUZpZWxkW3Jvd11bY29sdW1uXSA9IEZpZWxkU3RhdGUuQWxpdmU7XG4gICAgICB0aGlzLnVwZGF0ZUZpZWxkKCk7XG4gICAgfVxuICB9XG5cbiAgcHJpdmF0ZSBjZWxsRG93bkhhbmRsZXIocm93OiBudW1iZXIsIGNvbHVtbjogbnVtYmVyKTogYW55IHtcbiAgICB0aGlzLm1vdXNlRG93biA9IHRydWU7XG4gICAgaWYgKHRoaXMuZ2FtZUZpZWxkW3Jvd11bY29sdW1uXSAhPT0gRmllbGRTdGF0ZS5BbGl2ZSkge1xuICAgICAgdGhpcy5nYW1lRmllbGRbcm93XVtjb2x1bW5dID0gRmllbGRTdGF0ZS5BbGl2ZTtcbiAgICAgIHRoaXMudXBkYXRlRmllbGQoKTtcbiAgICB9XG4gIH1cblxuICBwcml2YXRlIGZpZWxkRG93bkhhbmRsZXIoKTogYW55IHtcbiAgICB0aGlzLm1vdXNlRG93biA9IHRydWU7XG4gIH1cblxuICBwcml2YXRlIGNlbGxVcEhhbmRsZXIoKTogYW55IHtcbiAgICB0aGlzLm1vdXNlRG93biA9IGZhbHNlO1xuICB9XG5cbiAgcHJpdmF0ZSBmaWVsZFVwSGFuZGxlcigpOiBhbnkge1xuICAgIHRoaXMubW91c2VEb3duID0gZmFsc2U7XG4gIH1cblxuICBwcml2YXRlIGNlbGxIb3ZlcmVkSGFuZGxlcihyb3c6IG51bWJlciwgY29sdW1uOiBudW1iZXIpOiBhbnkge1xuICAgIGlmICh0aGlzLm1vdXNlRG93biAmJiAodGhpcy5nYW1lRmllbGRbcm93XVtjb2x1bW5dICE9PSBGaWVsZFN0YXRlLkFsaXZlKSkge1xuICAgICAgdGhpcy5nYW1lRmllbGRbcm93XVtjb2x1bW5dID0gRmllbGRTdGF0ZS5BbGl2ZTtcbiAgICAgIHRoaXMudXBkYXRlRmllbGQoKTtcbiAgICB9XG4gIH1cbn1cblxud2luZG93LmN1c3RvbUVsZW1lbnRzLmRlZmluZShcImNnb2wtcGl0Y2hcIiwgR2FtZUZpZWxkKTtcbiJdfQ==
