import{j as n}from"./jsx-runtime.1b205933.js";import{u as o,g as i}from"./StopwatchCommon.b1a49c45.js";import{S as s}from"./MachineViz.1176ee01.js";import{m}from"./matchina.249c8300.js";import{r as a}from"./index.9fa1aa67.js";import{c}from"./states.c77b78b3.js";import"./preload-helper.587ec6b2.js";/* empty css                         */const e=m({Red:()=>"means stop",Yellow:()=>"means caution",Green:()=>"means go"},{Red:{next:"Green"},Yellow:{next:"Red"},Green:{next:"Yellow"}},"Red"),l=()=>{o(e.machine);const{state:t}=e;return n.jsxs("button",{title:"Click to Change",className:`rounded ${e.state.match({Red:()=>"bg-red-500",Yellow:()=>"bg-yellow-500",Green:()=>"bg-green-500"})}`,onClick:()=>e.next(),children:[t.key," ",t.data]})};function y(){const t=a.useMemo(()=>i(e.machine),[e.machine]);o(e.machine);const r=a.useMemo(()=>c(e.machine,e.state.key),[e.state]);return n.jsxs("div",{className:"not-content flex items-center justify-around",children:[n.jsx(l,{}),n.jsx(s,{config:t,stateKey:e.state.key,actions:r})]})}export{y as TrafficLightDemo};