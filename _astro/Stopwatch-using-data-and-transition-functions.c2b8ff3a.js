import{j as p}from"./jsx-runtime.1b205933.js";import{r as m}from"./index.9fa1aa67.js";import{S as c,u as i,t as n}from"./StopwatchCommon.1f4f1dff.js";import{m as d}from"./matchina.249c8300.js";import{s as f}from"./states.c77b78b3.js";import{a as u,e as h}from"./state-machine-hooks.88d207e6.js";import{w as l}from"./when.d7179dfb.js";import"./MachineViz.08ed681a.js";import"./preload-helper.587ec6b2.js";/* empty css                         */function w(){const e=m.useMemo(()=>{const s=Object.assign(d({Stopped:()=>({elapsed:0}),Ticking:(t=0)=>({elapsed:t,at:Date.now()}),Suspended:(t=0)=>({elapsed:t})},({Stopped:t,Ticking:o,Suspended:r})=>({Stopped:{start:o},Ticking:{_tick:()=>a=>o(a?a?.from.data.elapsed+(Date.now()-a?.from.data.at):0),stop:t,suspend:()=>a=>r(a?.from.data.elapsed),clear:o},Suspended:{stop:t,resume:()=>a=>o(a?.from.data.elapsed),clear:r}}),({Stopped:t})=>t()),{elapsed:0});return f(s.machine)(u(l(t=>t.to.is("Ticking"),()=>n(s._tick))),h(t=>{e.elapsed=t.to.data.elapsed??0})),s},[]);return i(e.machine),e}function O(){const e=w();return p.jsx(c,{stopwatch:e})}export{O as Stopwatch};
