import{j as h}from"./jsx-runtime.D_zvdyIk.js";import{bG as k,bH as v}from"./Mermaid.DhCx7KWe.js";import{r as s}from"./index.CRVbtxaI.js";import"./preload-helper.DKeeWlPV.js";/* empty css                         */k.initialize({themeVariables:{},themeCSS:`
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
    
  `});function $(o,c){const l=o,a=[];let n=0;const i=new Set;return u(l),`
graph LR
${a.join(`
`)}
`;function g(){return Array(n*4).fill(" ").join("")}function u(f){const t=new Set;n+=1;const{states:p}=f;Object.keys(p).forEach((e,m)=>{t.add(e);const r=p[e]?.on;r?Object.keys(r).forEach(b=>{const S=r[b];if(S){const y=S;a.push(`    ${e}-->|${b?`${e}<br>${b}`:`${e}<br>AUTO`}|${y}[${y}]`),i.add(e),i.add(y)}}):a.push(`${g()}${e} --> [*]`)})}}let E=0;const D=s.memo(({config:o,stateKey:c,actions:l})=>{const[a]=s.useState((E++).toString()),{states:n}=o,i=s.useMemo(()=>$(o),[n]),d=j(c,60),g=s.useCallback(u=>{console.log("onRender",u),setTimeout(()=>{u.querySelectorAll("span.edgeLabel").forEach(f=>{const t=f.querySelector("p");if(!t)return;const p=Array.from(t.childNodes).map(r=>r.nodeType===Node.ELEMENT_NODE&&r.tagName==="BR"?`
`:r.textContent).join("").split(`
`),[x,e]=p,m=l?.[e];t.innerHTML=e,t.style.cursor=m?"pointer":"default",t.onclick=m?()=>m():null,m&&x===d?(t.style.backgroundColor="var(--sl-color-gray-5)",t.style.color="var(--sl-color-accent-high)",t.style.textDecoration="underline"):(t.style.backgroundColor="var(--sl-color-bg)",t.style.color="var(--sl-color-gray-3)"),console.log("ok",f,x,d)})},1)},[d]);return i?h.jsx("div",{className:"container",children:h.jsx(v,{content:`${i}
    ${d}:::active
`,onRender:g})}):h.jsx("div",{children:"NO CHART!!!"})});function j(o,c){const[l,a]=s.useState(o);return s.useEffect(()=>{const n=setTimeout(()=>a(o),c);return()=>{clearTimeout(n)}},[o,c]),l}export{D as default};
