enum FieldState {
  Unset = 0,
  Alive,
  Dead,
}

class GameField extends HTMLElement {
  private columns: number;
  private rows: number;

  private viewportWidth: number;
  private viewportHeight: number;

  private gameField: number[][];

  constructor() {
    super();
  }

  public connectedCallback() {
    window.onresize = () => this.viewportUpdated();
    document.querySelector("#setSize").addEventListener("click", (e) => this.buttonClickedHandler("setSize"));

    this.columns = parseInt(this.getAttribute("width"), 10);
    this.rows = parseInt(this.getAttribute("height"), 10);

    this.columns = Math.max(10, this.columns);
    this.rows = Math.max(10, this.rows);

    this.gameField = this.createGameField();

    this.setViewportValues();
    const size = Math.min(this.viewportWidth / this.columns, this.viewportHeight / this.rows);

    this.attachShadow({ mode: "open" });
    this.updateShadowDom(size);

    this.viewportUpdated();
  }

  public disconnectedCallback() {
    return;
  }

  public adoptedCallback() {
    return;
  }

  public attributeChangedCallback(name: any, oldValue: any, newValue: any) {
    return;
  }

  static get observedAttributes(): any {
    return [];
  }

  private createGameField(): number[][] {
    const arr: number[][] = [];

    for (let i: number = 0; i < this.rows; i++) {
      arr[i] = [];
      for (let j: number = 0; j < this.columns; j++) {
        arr[i][j] = FieldState.Unset;
      }
    }

    return arr;
  }

  private updateShadowDom(size: number) {
    this.shadowRoot.innerHTML = this.createShadowCss(size);
    const gridElem = this.createShadowGameField();
    this.shadowRoot.appendChild(gridElem);
  }

  private setViewportValues() {
    this.viewportWidth = Math.min(document.documentElement.clientWidth, window.innerWidth);
    this.viewportHeight = Math.min(document.documentElement.clientHeight, window.innerHeight);
  }

  private createShadowGameField() {
    const gridElem = document.createElement("div");
    gridElem.className += "grid";
    for (let row = 0; row < this.rows; row++) {
      const rowElem = document.createElement("div");
      rowElem.className += "row";
      for (let column = 0; column < this.columns; column++) {
        const boxElem = document.createElement("div");
        boxElem.setAttribute("row", row.toString());
        boxElem.setAttribute("column", column.toString());
        boxElem.className += "box";
        boxElem.addEventListener("click", (e) => this.fieldClickedHandler(row, column));
        rowElem.appendChild(boxElem);
      }
      gridElem.appendChild(rowElem);
    }

    return gridElem;
  }

  private fieldClickedHandler(row: number, column: number): any {
    return;
  }

  private createShadowCss(size: number) {
    return `<style>
    .box {
      box-sizing: border-box;
      width: ${size}px;
      height: ${size}px;
      background-color: white;
      float: left;
      background-clip: content-box;
      padding: 1px;
    }

    .row {
      box-sizing: border-box;
      width: ${size * this.columns}px;
      height: ${size}px;
      clear: both;
      float: left;
    }

    .grid {
      box-sizing: border-box;
      width: ${size * this.columns}px;
      height: ${size * this.rows}px;
    }`;
  }

  private buttonClickedHandler(id: string) {
    switch (id) {
      case "setSize":
        this.sizeUpdated();
        break;
      default:
        break;
    }
  }

  private sizeUpdated() {
    this.columns = parseInt((document.getElementById("width") as HTMLInputElement).value, 10);
    this.rows = parseInt((document.getElementById("height") as HTMLInputElement).value, 10);

    this.columns = Math.max(10, this.columns);
    this.rows = Math.max(10, this.rows);

    (document.getElementById("width") as HTMLInputElement).value = this.columns.toString();
    (document.getElementById("height") as HTMLInputElement).value = this.rows.toString();

    this.gameField = this.createGameField();

    const size = Math.min(this.viewportWidth / this.columns, this.viewportHeight / this.rows);

    this.updateShadowDom(size);

    this.viewportUpdated();
  }

  private viewportUpdated() {
    this.setViewportValues();

    const size = Math.min(this.viewportWidth / this.columns, this.viewportHeight / this.rows);

    const styleSheets = this.shadowRoot.styleSheets;
    let styleSheet: { [index: string]: any } = {};
    styleSheet = styleSheets[0];

    // .box
    styleSheet["cssRules"][0].style.width = `${size}px`;
    styleSheet["cssRules"][0].style.height = `${size}px`;

    // .row
    styleSheet["cssRules"][1].style.width = `${size * this.columns}px`;
    styleSheet["cssRules"][1].style.height = `${size}px`;

    // .grid
    styleSheet["cssRules"][2].style.width = `${size * this.columns}px`;
    styleSheet["cssRules"][2].style.height = `${size * this.rows}px`;
  }
}

window.customElements.define("cgol-pitch", GameField);
