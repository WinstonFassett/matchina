import{j as o}from"./jsx-runtime.1b205933.js";import{R as u,r}from"./index.9fa1aa67.js";import{z as p}from"./zen.ec9d499f.js";import{d as f}from"./delay.f383f45e.js";import{g as h,u as j}from"./StopwatchCommon.b1a49c45.js";import{S as v}from"./MachineViz.1176ee01.js";import{c as x,d as y,a as g,s as R}from"./states.c77b78b3.js";import{e as k}from"./state-machine-hooks.88d207e6.js";import"./preload-helper.587ec6b2.js";/* empty css                         */function M(a){const n=r.useMemo(()=>{const c=y({Idle:void 0,Pending:(...s)=>s,Resolved:s=>s,Rejected:s=>s}),e=g(c,{Idle:{execute:"Pending"},Pending:{resolve:"Resolved",reject:"Rejected"}},"Idle"),t=Object.assign(p(e),{promise:void 0,done:void 0});return R(t.machine)(k(s=>{if(s.type!=="execute")return;const i=a(...s.params);t.promise=i;const m=d=>(...l)=>{if(i===t.promise)return d(...l)};t.done=i.then(m(t.resolve)).catch(m(t.reject)).finally(()=>{delete t.promise,delete t.done})})),t},[a]);return j(n.machine),n}function H(){const[a,n]=u.useState({}),c=r.useCallback(()=>n({}),[]),e=M(r.useCallback(async(i=1e3)=>(await f(i),"Hello World"),[a])),t=r.useMemo(()=>h(e.machine),[e.machine]),s=r.useMemo(()=>x(e.machine,e.state.key),[e.state.key]);return o.jsxs("div",{children:[o.jsx("div",{children:e.state.key}),e.state.key==="Resolved"&&o.jsx("pre",{children:e.state.data}),e.state.match({Idle:()=>o.jsx("button",{onClick:()=>s.execute(1e3),children:"Say hello"}),Pending:()=>o.jsx("div",{children:"Hang tight"}),Resolved:()=>o.jsx("button",{onClick:c,children:"Reset"})},!1),o.jsx(v,{config:t,stateKey:e.state.key,actions:s})]})}export{H as SimpleFetchDemo};