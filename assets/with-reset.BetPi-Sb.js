const o=(t,e,s="reset")=>{const r=t.getChange();t.transition({from:r.to,type:s,to:e})},n=(t,e)=>()=>{o(t,e)},c=(t,e)=>(t.reset||(t.reset=n(t,e)),t);export{n as c,c as w};
