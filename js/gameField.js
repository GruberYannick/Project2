class GameField extends HTMLElement {
    constructor() {
        super();
    }
    connectedCallback() {
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
    disconnectedCallback() {
        console.log("2 Custom square element added to page.");
    }
    adoptedCallback() {
        console.log("3 Custom square element added to page.");
    }
    attributeChangedCallback(name, oldValue, newValue) {
        console.log("4 Custom square element added to page.");
    }
    static get observedAttributes() {
        return [];
    }
}
window.customElements.define("cgol-pitch", GameField);

//# sourceMappingURL=data:application/json;charset=utf8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImdhbWVGaWVsZC50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQSxNQUFNLFNBQVUsU0FBUSxXQUFXO0lBSWpDO1FBQ0UsS0FBSyxFQUFFLENBQUM7SUFDVixDQUFDO0lBRU0saUJBQWlCO1FBQ3RCLE9BQU8sQ0FBQyxHQUFHLENBQUMsbUJBQW1CLENBQUMsQ0FBQztRQUNqQyxJQUFJLENBQUMsS0FBSyxHQUFHLFFBQVEsQ0FBQyxJQUFJLENBQUMsWUFBWSxDQUFDLE9BQU8sQ0FBQyxFQUFFLEVBQUUsQ0FBQyxDQUFDO1FBQ3RELElBQUksQ0FBQyxNQUFNLEdBQUcsUUFBUSxDQUFDLElBQUksQ0FBQyxZQUFZLENBQUMsUUFBUSxDQUFDLEVBQUUsRUFBRSxDQUFDLENBQUM7UUFDeEQsT0FBTyxDQUFDLEdBQUcsQ0FBQyxJQUFJLENBQUMsS0FBSyxDQUFDLENBQUM7UUFDeEIsT0FBTyxDQUFDLEdBQUcsQ0FBQyxJQUFJLENBQUMsTUFBTSxDQUFDLENBQUM7UUFDekIsSUFBSSxDQUFDLFlBQVksQ0FBQyxFQUFFLElBQUksRUFBRSxNQUFNLEVBQUUsQ0FBQyxDQUFDO1FBQ3BDLElBQUksQ0FBQyxVQUFVLENBQUMsU0FBUyxHQUFHOzs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7O0NBNEIvQixDQUFDO1FBQ0UsTUFBTSxRQUFRLEdBQUcsUUFBUSxDQUFDLGFBQWEsQ0FBQyxLQUFLLENBQUMsQ0FBQztRQUMvQyxRQUFRLENBQUMsU0FBUyxJQUFJLE1BQU0sQ0FBQztRQUM3QixLQUFLLElBQUksR0FBRyxHQUFHLENBQUMsRUFBRSxHQUFHLEdBQUcsSUFBSSxDQUFDLE1BQU0sRUFBRSxHQUFHLEVBQUUsRUFBRTtZQUMxQyxNQUFNLE9BQU8sR0FBRyxRQUFRLENBQUMsYUFBYSxDQUFDLEtBQUssQ0FBQyxDQUFDO1lBQzlDLE9BQU8sQ0FBQyxTQUFTLElBQUksS0FBSyxDQUFDO1lBQzNCLEtBQUssSUFBSSxNQUFNLEdBQUcsQ0FBQyxFQUFFLE1BQU0sR0FBRyxJQUFJLENBQUMsS0FBSyxFQUFFLE1BQU0sRUFBRSxFQUFFO2dCQUNsRCxNQUFNLE9BQU8sR0FBRyxRQUFRLENBQUMsYUFBYSxDQUFDLEtBQUssQ0FBQyxDQUFDO2dCQUM5QyxPQUFPLENBQUMsU0FBUyxJQUFJLEtBQUssQ0FBQztnQkFDM0IsT0FBTyxDQUFDLFdBQVcsQ0FBQyxPQUFPLENBQUMsQ0FBQzthQUM5QjtZQUNELFFBQVEsQ0FBQyxXQUFXLENBQUMsT0FBTyxDQUFDLENBQUM7U0FDL0I7UUFDRCxJQUFJLENBQUMsVUFBVSxDQUFDLFdBQVcsQ0FBQyxRQUFRLENBQUMsQ0FBQztJQUN4QyxDQUFDO0lBRU0sb0JBQW9CO1FBQ3pCLE9BQU8sQ0FBQyxHQUFHLENBQUMsd0NBQXdDLENBQUMsQ0FBQztJQUN4RCxDQUFDO0lBRU0sZUFBZTtRQUNwQixPQUFPLENBQUMsR0FBRyxDQUFDLHdDQUF3QyxDQUFDLENBQUM7SUFDeEQsQ0FBQztJQUVNLHdCQUF3QixDQUFDLElBQVMsRUFBRSxRQUFhLEVBQUUsUUFBYTtRQUNyRSxPQUFPLENBQUMsR0FBRyxDQUFDLHdDQUF3QyxDQUFDLENBQUM7SUFDeEQsQ0FBQztJQUVELE1BQU0sS0FBSyxrQkFBa0I7UUFDM0IsT0FBTyxFQUFFLENBQUM7SUFDWixDQUFDO0NBQ0Y7QUFFRCxNQUFNLENBQUMsY0FBYyxDQUFDLE1BQU0sQ0FBQyxZQUFZLEVBQUUsU0FBUyxDQUFDLENBQUMiLCJmaWxlIjoiZ2FtZUZpZWxkLmpzIiwic291cmNlc0NvbnRlbnQiOlsiY2xhc3MgR2FtZUZpZWxkIGV4dGVuZHMgSFRNTEVsZW1lbnQge1xyXG4gIHByaXZhdGUgd2lkdGg6IG51bWJlcjtcclxuICBwcml2YXRlIGhlaWdodDogbnVtYmVyO1xyXG5cclxuICBjb25zdHJ1Y3RvcigpIHtcclxuICAgIHN1cGVyKCk7XHJcbiAgfVxyXG5cclxuICBwdWJsaWMgY29ubmVjdGVkQ2FsbGJhY2soKSB7XHJcbiAgICBjb25zb2xlLmxvZyhcImNvbm5lY3RlZENhbGxiYWNrXCIpO1xyXG4gICAgdGhpcy53aWR0aCA9IHBhcnNlSW50KHRoaXMuZ2V0QXR0cmlidXRlKFwid2lkdGhcIiksIDEwKTtcclxuICAgIHRoaXMuaGVpZ2h0ID0gcGFyc2VJbnQodGhpcy5nZXRBdHRyaWJ1dGUoXCJoZWlnaHRcIiksIDEwKTtcclxuICAgIGNvbnNvbGUubG9nKHRoaXMud2lkdGgpO1xyXG4gICAgY29uc29sZS5sb2codGhpcy5oZWlnaHQpO1xyXG4gICAgdGhpcy5hdHRhY2hTaGFkb3coeyBtb2RlOiBcIm9wZW5cIiB9KTtcclxuICAgIHRoaXMuc2hhZG93Um9vdC5pbm5lckhUTUwgPSBgXHJcbjxzdHlsZT5cclxuLmdyaWQge1xyXG4gICAgbWFyZ2luOiAwIGF1dG87XHJcbiAgICB3aWR0aDogODB2dztcclxuICAgIG1heC13aWR0aDogNjB2aDtcclxuICAgIGhlaWdodDogODB2dztcclxuICAgIG1heC1oZWlnaHQ6IDYwdmg7XHJcbiAgICBmb250LXNpemU6IDFyZW07XHJcbn1cclxuLnJvdyB7XHJcbiAgICBkaXNwbGF5OiBmbGV4O1xyXG59XHJcbi5ib3gge1xyXG4gICAgYmFja2dyb3VuZDogdG9tYXRvO1xyXG4gICAgbWFyZ2luOiAxcHg7XHJcbiAgICBjb2xvcjogd2hpdGU7XHJcbiAgICBmb250LXdlaWdodDogYm9sZDtcclxuICAgIGZsZXg6IDEgMCBhdXRvO1xyXG4gICAgcG9zaXRpb246IHJlbGF0aXZlO1xyXG59XHJcbi5ib3g6YWZ0ZXIge1xyXG4gICAgY29udGVudDogXCJcIjtcclxuICAgIGZsb2F0OmxlZnQ7XHJcbiAgICBkaXNwbGF5OiBibG9jaztcclxuICAgIHBhZGRpbmctdG9wOiAxMDAlO1xyXG59XHJcbjwvc3R5bGU+XHJcbmA7XHJcbiAgICBjb25zdCBncmlkRWxlbSA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoXCJkaXZcIik7XHJcbiAgICBncmlkRWxlbS5jbGFzc05hbWUgKz0gXCJncmlkXCI7XHJcbiAgICBmb3IgKGxldCByb3cgPSAwOyByb3cgPCB0aGlzLmhlaWdodDsgcm93KyspIHtcclxuICAgICAgY29uc3Qgcm93RWxlbSA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoXCJkaXZcIik7XHJcbiAgICAgIHJvd0VsZW0uY2xhc3NOYW1lICs9IFwicm93XCI7XHJcbiAgICAgIGZvciAobGV0IGNvbHVtbiA9IDA7IGNvbHVtbiA8IHRoaXMud2lkdGg7IGNvbHVtbisrKSB7XHJcbiAgICAgICAgY29uc3QgYm94RWxlbSA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoXCJkaXZcIik7XHJcbiAgICAgICAgYm94RWxlbS5jbGFzc05hbWUgKz0gXCJib3hcIjtcclxuICAgICAgICByb3dFbGVtLmFwcGVuZENoaWxkKGJveEVsZW0pO1xyXG4gICAgICB9XHJcbiAgICAgIGdyaWRFbGVtLmFwcGVuZENoaWxkKHJvd0VsZW0pO1xyXG4gICAgfVxyXG4gICAgdGhpcy5zaGFkb3dSb290LmFwcGVuZENoaWxkKGdyaWRFbGVtKTtcclxuICB9XHJcblxyXG4gIHB1YmxpYyBkaXNjb25uZWN0ZWRDYWxsYmFjaygpIHtcclxuICAgIGNvbnNvbGUubG9nKFwiMiBDdXN0b20gc3F1YXJlIGVsZW1lbnQgYWRkZWQgdG8gcGFnZS5cIik7XHJcbiAgfVxyXG5cclxuICBwdWJsaWMgYWRvcHRlZENhbGxiYWNrKCkge1xyXG4gICAgY29uc29sZS5sb2coXCIzIEN1c3RvbSBzcXVhcmUgZWxlbWVudCBhZGRlZCB0byBwYWdlLlwiKTtcclxuICB9XHJcblxyXG4gIHB1YmxpYyBhdHRyaWJ1dGVDaGFuZ2VkQ2FsbGJhY2sobmFtZTogYW55LCBvbGRWYWx1ZTogYW55LCBuZXdWYWx1ZTogYW55KSB7XHJcbiAgICBjb25zb2xlLmxvZyhcIjQgQ3VzdG9tIHNxdWFyZSBlbGVtZW50IGFkZGVkIHRvIHBhZ2UuXCIpO1xyXG4gIH1cclxuXHJcbiAgc3RhdGljIGdldCBvYnNlcnZlZEF0dHJpYnV0ZXMoKTogYW55IHtcclxuICAgIHJldHVybiBbXTtcclxuICB9XHJcbn1cclxuXHJcbndpbmRvdy5jdXN0b21FbGVtZW50cy5kZWZpbmUoXCJjZ29sLXBpdGNoXCIsIEdhbWVGaWVsZCk7XHJcbiJdfQ==
