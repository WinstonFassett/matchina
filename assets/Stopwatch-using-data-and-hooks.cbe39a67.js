import{j as s}from"./jsx-runtime.1b205933.js";import{r as p}from"./index.9fa1aa67.js";import{S as i,u as r,t as c}from"./StopwatchCommon.b1a49c45.js";import{m as n}from"./matchina.249c8300.js";import{b as m,e as o}from"./state-machine-hooks.88d207e6.js";import{w as d}from"./when.d7179dfb.js";import{s as f}from"./states.c77b78b3.js";import"./MachineViz.1176ee01.js";import"./preload-helper.587ec6b2.js";/* empty css                         */function u(){const e=p.useMemo(()=>{const a=Object.assign(n({Stopped:()=>({elapsed:0}),Ticking:(t=0)=>({at:Date.now(),elapsed:t}),Suspended:(t=0)=>({elapsed:t})},{Stopped:{start:"Ticking"},Ticking:{_tick:"Ticking",stop:"Stopped",suspend:"Suspended",clear:"Ticking"},Suspended:{stop:"Stopped",resume:"Ticking",clear:"Suspended"}},"Stopped"),{elapsed:0});return f(a.machine)(m(t=>{t.to.data.elapsed=t.match({stop:()=>0,clear:()=>0,_:()=>t.from.data.elapsed,_tick:()=>t.from.data.elapsed+(Date.now()-t.from.as("Ticking").data.at)},!1)}),o(d(t=>t.to.is("Ticking"),()=>c(e._tick))),o(t=>{a.elapsed=t.to.data.elapsed})),a},[]);return r(e.machine),e}function b(){const e=u();return s.jsx(i,{stopwatch:e})}export{b as Stopwatch};