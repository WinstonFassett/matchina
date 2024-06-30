import{r as o,R as l}from"./index.9fa1aa67.js";import{j as n}from"./jsx-runtime.1b205933.js";import{S as d}from"./MachineViz.1176ee01.js";import{c as x,g,b as m}from"./states.c77b78b3.js";function N(e){const t=o.useCallback(i=>{const r=e.notify,a=r.bind(e);return e.notify=c=>{a(c),i(c)},()=>{e.notify=r}},[e]),s=o.useCallback(()=>e.getChange(),[e]);return[l.useSyncExternalStore(t,s,s),e]}function M(e,t=50){const s=setInterval(e,t);return()=>clearInterval(s)}function y({stopwatch:e}){return n.jsxs("div",{className:"p-4 rounded border",children:[n.jsx("div",{className:`inline ${e.state.match({Stopped:()=>"text-red-500",Ticking:()=>"text-green-500",Suspended:()=>"text-yellow-500"})}`,children:e.state.key}),n.jsxs("div",{className:"text-4xl",children:[e.elapsed/1e3,"s"]}),n.jsx("div",{className:"flex items-center gap-2",children:g(e.machine.transitions,e.state.key).map(t=>!t.startsWith("_")&&n.jsx("button",{className:"rounded",onClick:()=>{e[t]()},children:t},t))})]})}function C({stopwatch:e}){const t=o.useMemo(()=>S(e.machine),[e.machine]),s=o.useMemo(()=>x(e.machine,e.state.key),[e.state]);return n.jsxs("div",{style:{width:"100%",display:"flex",gap:"1em"},children:[n.jsxs("div",{style:{flex:2},children:[n.jsx(y,{stopwatch:e}),n.jsx(d,{config:t,stateKey:e.state.key,actions:s})]}),n.jsx("pre",{className:"text-xs flex-1",children:JSON.stringify(e.change,null,2)})]})}function p(e){return Object.entries(e).map(([t,s])=>s({}))}function S(e){const t=e.getState(),s=p(e.states),i={initial:t.key,states:{}};for(const r of s)i.states[r.key]={on:{}};return Object.entries(e.transitions).forEach(([r,a])=>{Object.entries(a).forEach(([c,u])=>{i.states[r].on[c]=f(e.states,u).key})}),i}function O(e,t=s=>s.data.effects){o.useEffect(()=>{const s=t(e);if(!s)return;const i=[];for(const r of s){const a=r(e);a&&i.push(a)}return m(i)},[e])}function b(e,t,s=[]){o.useEffect(()=>t[e]?.apply(t,s),s.concat(e))}function V(e,t){b(e.type,t,[e])}function f(e,t){if(typeof t=="string")return e[t]({});if(typeof t=="function"){const s=t();return typeof s=="function"&&s(),f(e,s)}return t}export{C as S,O as a,V as b,S as g,M as t,N as u};