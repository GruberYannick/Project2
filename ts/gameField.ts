class GameField extends HTMLElement {
  private columns: number;
  private rows: number;

  private viewportWidth: number;
  private viewportHeight: number;

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

    this.setViewportValues();
    const size = Math.min(this.viewportWidth / this.columns, this.viewportHeight / this.rows);

    this.attachShadow({ mode: "open" });
    this.shadowRoot.innerHTML = this.createShadowCss(size);

    const gridElem = this.createShadowGameField();
    this.shadowRoot.appendChild(gridElem);
  }

  public disconnectedCallback() {
    console.log("2 Custom square element added to page.");
  }

  public adoptedCallback() {
    console.log("3 Custom square element added to page.");
  }

  public attributeChangedCallback(name: any, oldValue: any, newValue: any) {
    console.log("4 Custom square element added to page.");
  }

  static get observedAttributes(): any {
    return ["columns", "rows"];
  }

  private setViewportValues() {
    this.viewportWidth = Math.max(document.documentElement.clientWidth, window.innerWidth || 0);
    this.viewportHeight = Math.max(document.documentElement.clientHeight, window.innerHeight || 0);
  }

  private createShadowGameField() {
    const gridElem = document.createElement("div");
    gridElem.className += "grid";
    for (let row = 0; row < this.rows; row++) {
      const rowElem = document.createElement("div");
      rowElem.className += "row";
      for (let column = 0; column < this.columns; column++) {
        const boxElem = document.createElement("div");
        boxElem.className += "box";
        rowElem.appendChild(boxElem);
      }
      gridElem.appendChild(rowElem);
    }

    return gridElem;
  }

  private createShadowCss(size: number) {
    return `<style>
    .box {
      box-sizing: border-box;
      width: ${size}px;
      height: ${size}px;
      background-color: red;
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
      margin: auto;
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

    const size = Math.min(this.viewportWidth / this.columns, this.viewportHeight / this.rows);

    this.shadowRoot.innerHTML = this.createShadowCss(size);

    const gridElem = this.createShadowGameField();
    this.shadowRoot.appendChild(gridElem);
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
