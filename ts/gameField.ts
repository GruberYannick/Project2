enum FieldState {
  Unset = 0,
  Alive,
  Dead,
}

class GameField extends HTMLElement {
  private columns: number;
  private rows: number;

  private size: number;

  private viewportWidth: number;
  private viewportHeight: number;

  private gameField: number[][];

  private mouseDown: boolean;

  private running: boolean;
  private generation: number;

  private initialized: boolean;

  private speed: number;

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

  public connectedCallback() {
    window.onresize = () => this.viewportUpdated();

    this.gameField = this.createGameField();

    this.setViewportValues();
    this.size = Math.min(this.viewportWidth / this.columns, this.viewportHeight / this.rows);

    this.attachShadow({ mode: "open" });
    this.createShadowDom();

    this.initialized = true;
  }

  public attributeChangedCallback(name: string, oldValue: any, newValue: any) {
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

  private createGameField(): number[][] {
    const arr: number[][] = [];

    for (let row: number = 0; row < this.rows; row++) {
      arr[row] = [];
      for (let column: number = 0; column < this.columns; column++) {
        arr[row][column] = FieldState.Unset;
      }
    }

    return arr;
  }

  private widthUpdated(newWidth: string) {
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

  private heightUpdated(newHeight: string) {
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

  private speedUpdated(newSpeed: any) {
    const speed = parseInt(newSpeed, 10);
    if (!isNaN(speed)) {
      if (speed !== this.speed) {
        this.speed = speed;
      }
    }
    this.dispatchEvent(new CustomEvent("speedUpdatedEvent", { detail: this.speed }));
  }

  private sizeUpdated() {
    this.gameField = this.createGameField();
    this.generation = 1;
    this.size = Math.min(this.viewportWidth / this.columns, this.viewportHeight / this.rows);
    this.createShadowDom();
    this.dispatchEvent(new CustomEvent("generationUpdatedEvent", { detail: this.generation }));
  }

  private setViewportValues() {
    this.viewportWidth = Math.min(document.documentElement.clientWidth, window.innerWidth);
    this.viewportHeight = Math.min(document.documentElement.clientHeight, window.innerHeight);
  }

  private viewportUpdated() {
    this.setViewportValues();

    this.size = Math.min(this.viewportWidth / this.columns, this.viewportHeight / this.rows);

    const styleSheets = this.shadowRoot.styleSheets;
    let styleSheet: { [index: string]: any } = {};
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

  private createShadowDom() {
    this.shadowRoot.innerHTML = this.createShadowCss();
    const gridElem = this.createShadowGameField();
    this.shadowRoot.appendChild(gridElem);
    this.viewportUpdated();
  }

  private createShadowCss() {
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

  private createShadowGameField() {
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

  private doStart() {
    if (!this.running) {
      this.running = true;
      this.dispatchEvent(new CustomEvent("runningStartedEvent", { detail: this.running }));
      this.execute();
    }
  }

  private doPause() {
    this.running = false;
    this.dispatchEvent(new CustomEvent("runningStoppedEvent", { detail: this.running }));
  }

  private doClear() {
    this.running = false;
    this.gameField = this.createGameField();
    this.generation = 1;
    this.updateField();
    this.dispatchEvent(new CustomEvent("generationUpdatedEvent", { detail: this.generation }));
    this.dispatchEvent(new CustomEvent("runningStoppedEvent", { detail: this.running }));
  }

  private loadLevel(level: string) {
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
        } else {
          this.gameField[row][column] = FieldState.Unset;
        }
      }
    }

    this.createShadowDom();
  }

  private randomize() {
    this.doClear();

    for (let row: number = 0; row < this.rows; row++) {
      for (let column: number = 0; column < this.columns; column++) {
        this.gameField[row][column] = Math.round(Math.random());
      }
    }

    this.updateField();
  }

  private execute() {
    if (this.running) {
      const nextGenerationGameField = this.calculateNextGenerationGameField();

      this.gameField = nextGenerationGameField;
      this.updateField();

      this.generation++;
      this.dispatchEvent(new CustomEvent("generationUpdatedEvent", { detail: this.generation }));

      setTimeout(function() {
        this.execute();
      }.bind(this), this.speed);
    }
  }

  private calculateNextGenerationGameField() {
    const nextGenerationGameField = this.createGameField();
    let countDifferentCells = 0;

    for (let row: number = 0; row < this.rows; row++) {
      for (let column: number = 0; column < this.columns; column++) {
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

  private calculateNextGenerationCell(row: number, column: number): FieldState {
    const aliveNeighbours = this.countAliveNeighbours(row, column);

    if (this.gameField[row][column] === FieldState.Alive) {
      if (aliveNeighbours <= 1) {
        return FieldState.Dead;
      } else if (aliveNeighbours >= 4) {
        return FieldState.Dead;
      } else {
        return FieldState.Alive;
      }
    } else {
      if (aliveNeighbours === 3) {
        return FieldState.Alive;
      } else {
        return this.gameField[row][column];
      }
    }
  }

  private countAliveNeighbours(row: number, column: number): number {
    let aliveNeighbours = 0;

    for (let i: number = -1; i <= 1; i++) {
      for (let j: number = -1; j <= 1; j++) {
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

  private updateField() {
    for (let row = 0; row < this.rows; row++) {
      for (let column = 0; column < this.columns; column++) {

        // finding this cell is much faster if the elements are in one attribute and even faster if they are in the id.
        // By using two attributes or something else than the id, everything crawls to a stop.
        const cell = this.shadowRoot.getElementById(`${row},${column}`);

        if (this.gameField[row][column] === FieldState.Unset) {
          cell.setAttribute("class", "cell unset");
        } else if (this.gameField[row][column] === FieldState.Alive) {
          cell.setAttribute("class", "cell alive");
        } else if (this.gameField[row][column] === FieldState.Dead) {
          cell.setAttribute("class", "cell dead");
        }
      }
    }
  }

  private cellTouchedHandler(row: number, column: number): any {
    if (this.gameField[row][column] !== FieldState.Alive) {
      this.gameField[row][column] = FieldState.Alive;
      this.updateField();
    }
  }

  private cellDownHandler(row: number, column: number): any {
    this.mouseDown = true;
    if (this.gameField[row][column] !== FieldState.Alive) {
      this.gameField[row][column] = FieldState.Alive;
      this.updateField();
    }
  }

  private fieldDownHandler(): any {
    this.mouseDown = true;
  }

  private cellUpHandler(): any {
    this.mouseDown = false;
  }

  private fieldUpHandler(): any {
    this.mouseDown = false;
  }

  private cellHoveredHandler(row: number, column: number): any {
    if (this.mouseDown && (this.gameField[row][column] !== FieldState.Alive)) {
      this.gameField[row][column] = FieldState.Alive;
      this.updateField();
    }
  }
}

window.customElements.define("cgol-pitch", GameField);
