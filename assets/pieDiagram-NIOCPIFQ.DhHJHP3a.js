import{p as V}from"./chunk-353BL4L5.CYe9u3Fc.js";import{X as x,R as z,aJ as U,_ as p,g as j,s as H,a as J,c as K,x as X,v as Z,l as F,d as q,H as Q,M as Y,a6 as tt,f as et,B as at,K as rt}from"./Mermaid.C191AWsg.js";import{p as nt}from"./treemap-75Q7IDZK.BZ6Oo5n1.js";import{d as O}from"./arc.lt2gHkqQ.js";import{o as it}from"./ordinal.BYWQX77i.js";import"./jsx-runtime.D_zvdyIk.js";import"./preload-helper.DKeeWlPV.js";import"./index.CRVbtxaI.js";/* empty css                         */import"./_baseUniq.D_XyAgSU.js";import"./isSymbol.rFOetw8G.js";import"./_basePickBy.B7YRr3b8.js";import"./toNumber.OdPuAQTH.js";import"./clone.CxQNe9tE.js";import"./init.Gi6I4Gst.js";function ot(t,a){return a<t?-1:a>t?1:a>=t?0:NaN}function st(t){return t}function lt(){var t=st,a=ot,m=null,o=x(0),u=x(z),y=x(0);function i(e){var r,l=(e=U(e)).length,d,A,h=0,c=new Array(l),n=new Array(l),v=+o.apply(this,arguments),w=Math.min(z,Math.max(-z,u.apply(this,arguments)-v)),f,T=Math.min(Math.abs(w)/l,y.apply(this,arguments)),$=T*(w<0?-1:1),g;for(r=0;r<l;++r)(g=n[c[r]=r]=+t(e[r],r,e))>0&&(h+=g);for(a!=null?c.sort(function(S,C){return a(n[S],n[C])}):m!=null&&c.sort(function(S,C){return m(e[S],e[C])}),r=0,A=h?(w-l*$)/h:0;r<l;++r,v=f)d=c[r],g=n[d],f=v+(g>0?g*A:0)+$,n[d]={data:e[d],index:r,value:g,startAngle:v,endAngle:f,padAngle:T};return n}return i.value=function(e){return arguments.length?(t=typeof e=="function"?e:x(+e),i):t},i.sortValues=function(e){return arguments.length?(a=e,m=null,i):a},i.sort=function(e){return arguments.length?(m=e,a=null,i):m},i.startAngle=function(e){return arguments.length?(o=typeof e=="function"?e:x(+e),i):o},i.endAngle=function(e){return arguments.length?(u=typeof e=="function"?e:x(+e),i):u},i.padAngle=function(e){return arguments.length?(y=typeof e=="function"?e:x(+e),i):y},i}var ct=rt.pie,G={sections:new Map,showData:!1},M=G.sections,R=G.showData,pt=structuredClone(ct),ut=p(()=>structuredClone(pt),"getConfig"),dt=p(()=>{M=new Map,R=G.showData,at()},"clear"),gt=p(({label:t,value:a})=>{M.has(t)||(M.set(t,a),F.debug(`added new section: ${t}, with value: ${a}`))},"addSection"),ft=p(()=>M,"getSections"),mt=p(t=>{R=t},"setShowData"),ht=p(()=>R,"getShowData"),P={getConfig:ut,clear:dt,setDiagramTitle:Z,getDiagramTitle:X,setAccTitle:K,getAccTitle:J,setAccDescription:H,getAccDescription:j,addSection:gt,getSections:ft,setShowData:mt,getShowData:ht},vt=p((t,a)=>{V(t,a),a.setShowData(t.showData),t.sections.map(a.addSection)},"populateDb"),St={parse:p(async t=>{const a=await nt("pie",t);F.debug(a),vt(a,P)},"parse")},xt=p(t=>`
  .pieCircle{
    stroke: ${t.pieStrokeColor};
    stroke-width : ${t.pieStrokeWidth};
    opacity : ${t.pieOpacity};
  }
  .pieOuterCircle{
    stroke: ${t.pieOuterStrokeColor};
    stroke-width: ${t.pieOuterStrokeWidth};
    fill: none;
  }
  .pieTitleText {
    text-anchor: middle;
    font-size: ${t.pieTitleTextSize};
    fill: ${t.pieTitleTextColor};
    font-family: ${t.fontFamily};
  }
  .slice {
    font-family: ${t.fontFamily};
    fill: ${t.pieSectionTextColor};
    font-size:${t.pieSectionTextSize};
    // fill: white;
  }
  .legend text {
    fill: ${t.pieLegendTextColor};
    font-family: ${t.fontFamily};
    font-size: ${t.pieLegendTextSize};
  }
`,"getStyles"),yt=xt,At=p(t=>{const a=[...t.entries()].map(o=>({label:o[0],value:o[1]})).sort((o,u)=>u.value-o.value);return lt().value(o=>o.value)(a)},"createPieArcs"),wt=p((t,a,m,o)=>{F.debug(`rendering pie chart
`+t);const u=o.db,y=q(),i=Q(u.getConfig(),y.pie),e=40,r=18,l=4,d=450,A=d,h=Y(a),c=h.append("g");c.attr("transform","translate("+A/2+","+d/2+")");const{themeVariables:n}=y;let[v]=tt(n.pieOuterStrokeWidth);v??=2;const w=i.textPosition,f=Math.min(A,d)/2-e,T=O().innerRadius(0).outerRadius(f),$=O().innerRadius(f*w).outerRadius(f*w);c.append("circle").attr("cx",0).attr("cy",0).attr("r",f+v/2).attr("class","pieOuterCircle");const g=u.getSections(),S=At(g),C=[n.pie1,n.pie2,n.pie3,n.pie4,n.pie5,n.pie6,n.pie7,n.pie8,n.pie9,n.pie10,n.pie11,n.pie12],D=it(C);c.selectAll("mySlices").data(S).enter().append("path").attr("d",T).attr("fill",s=>D(s.data.label)).attr("class","pieCircle");let W=0;g.forEach(s=>{W+=s}),c.selectAll("mySlices").data(S).enter().append("text").text(s=>(s.data.value/W*100).toFixed(0)+"%").attr("transform",s=>"translate("+$.centroid(s)+")").style("text-anchor","middle").attr("class","slice"),c.append("text").text(u.getDiagramTitle()).attr("x",0).attr("y",-400/2).attr("class","pieTitleText");const b=c.selectAll(".legend").data(D.domain()).enter().append("g").attr("class","legend").attr("transform",(s,k)=>{const E=r+l,L=E*D.domain().length/2,_=12*r,B=k*E-L;return"translate("+_+","+B+")"});b.append("rect").attr("width",r).attr("height",r).style("fill",D).style("stroke",D),b.data(S).append("text").attr("x",r+l).attr("y",r-l).text(s=>{const{label:k,value:E}=s.data;return u.getShowData()?`${k} [${E}]`:k});const I=Math.max(...b.selectAll("text").nodes().map(s=>s?.getBoundingClientRect().width??0)),N=A+e+r+l+I;h.attr("viewBox",`0 0 ${N} ${d}`),et(h,d,N,i.useMaxWidth)},"draw"),Ct={draw:wt},It={parser:St,db:P,renderer:Ct,styles:yt};export{It as diagram};
