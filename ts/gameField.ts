class GameField extends HTMLElement {
  private width: number;
  private height: number;

  constructor() {
    super();
  }

  public connectedCallback() {
    console.log("connectedCallback");
    this.width = parseInt(this.getAttribute("width"), 10);
    this.height = parseInt(this.getAttribute("height"), 10);
    console.log(this.width);
    console.log(this.height);
    this.attachShadow({ mode: "open" });
    this.shadowRoot.innerHTML = `
<style>
.grid {
    margin: 0 auto;
    width: 80vw;
    max-width: 60vh;
    height: 80vw;
    max-height: 60vh;
    font-size: 1rem;
}
.row {
    display: flex;
}
.box {
    background: tomato;
    margin: 1px;
    color: white;
    font-weight: bold;
    flex: 1 0 auto;
    position: relative;
}
.box:after {
    content: "";
    float:left;
    display: block;
    padding-top: 100%;
}
</style>
`;
    const gridElem = document.createElement("div");
    gridElem.className += "grid";
    for (let row = 0; row < this.height; row++) {
      const rowElem = document.createElement("div");
      rowElem.className += "row";
      for (let column = 0; column < this.width; column++) {
        const boxElem = document.createElement("div");
        boxElem.className += "box";
        rowElem.appendChild(boxElem);
      }
      gridElem.appendChild(rowElem);
    }
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
    return [];
  }
}

window.customElements.define("cgol-pitch", GameField);
