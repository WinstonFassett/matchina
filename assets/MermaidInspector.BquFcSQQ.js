import{j as h}from"./jsx-runtime.D_zvdyIk.js";import{bG as k,bH as v}from"./Mermaid.DhCx7KWe.js";import{r as c}from"./index.CRVbtxaI.js";import"./preload-helper.DKeeWlPV.js";/* empty css                         */k.initialize({themeVariables:{},themeCSS:`
    .label text, span, p {
      color: var(--sl-color-text);
     }; 
    .node rect {
      fill: var(--sl-color-bg);
      stroke: var(--sl-color-text);
      rx: 10; ry: 10;
      
    }
    .active rect {
      animation: fadeInBg .8s ease forwards;
    }
    .flowchart-link {
      stroke: var(--sl-color-text);
    }
    .active rect {
      fill: var(--sl-color-text-accent);

    }
    .active span {
      color: var(--sl-color-text-invert);
      animation: fadeInText .8s ease forwards;
    }
    .marker {
      fill: var(--sl-color-text);
    }
    @keyframes fadeInBg {
      from {
        fill-opacity: 0;
      }
      to {
        fill-opacity: 1;
      }
    }
    @keyframes fadeInText {
      from {
        opacity: 0;
      }
      to {
        opacity: 1;
      }
    }
    
  `});function $(o,l){const i=o,a=[];let d=0;const f=new Set;return b(i),`
graph LR
${a.join(`
`)}
`;function u(){return Array(d*4).fill(" ").join("")}function b(m){const x=new Set;d+=1;const{states:t}=m;Object.keys(t).forEach((e,y)=>{x.add(e);const r=t[e]?.on;r?Object.keys(r).forEach(n=>{const s=r[n];if(s){const g=s;a.push(`    ${e}-->|${n?`${e}<br>${n}`:`${e}<br>AUTO`}|${g}[${g}]`),f.add(e),f.add(g)}}):a.push(`${u()}${e} --> [*]`)})}}let E=0;const M=c.memo(({config:o,stateKey:l,actions:i,interactive:a=!0})=>{const[d]=c.useState((E++).toString()),{states:f}=o,p=c.useMemo(()=>$(o),[f]),u=j(l,60),b=c.useCallback(m=>{console.log("onRender",m),setTimeout(()=>{m.querySelectorAll("span.edgeLabel").forEach(x=>{const t=x.querySelector("p");if(!t)return;const S=Array.from(t.childNodes).map(s=>s.nodeType===Node.ELEMENT_NODE&&s.tagName==="BR"?`
`:s.textContent).join("").split(`
`),[e,y]=S,r=i?.[y];t.innerHTML=y;const n=r&&a;t.onclick=n?()=>r():null,r&&e===u?(t.style.backgroundColor="var(--sl-color-gray-5)",t.style.color="var(--sl-color-accent-high)",n&&(t.style.textDecoration="underline",t.style.cursor=r?"pointer":"default")):(t.style.backgroundColor="var(--sl-color-bg)",t.style.color="var(--sl-color-gray-3)")})},1)},[u]);return p?h.jsx("div",{className:"container",children:h.jsx(v,{content:`${p}
    ${u}:::active
`,onRender:b})}):h.jsx("div",{children:"NO CHART!!!"})});function j(o,l){const[i,a]=c.useState(o);return c.useEffect(()=>{const d=setTimeout(()=>a(o),l);return()=>{clearTimeout(d)}},[o,l]),i}export{M as default};
