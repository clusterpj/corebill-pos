import{_ as H,u as M,b as U,o as D,n as w,V as O,c as W,d as $,e as G,f as J,g as v,h as K,p as k,q as A,r as F,s as P,t as B,k as Q,l as X,v as Y,w as Z,m as E,x as ee}from"./index-9f2fee20.js";import{r as d,j as V,H as ae,L as p,bg as le,F as a,N as e,bj as g,c1 as N,c2 as I,be as c,bh as f,M as h,bl as _}from"./vuetify-7130618d.js";const se={class:"select-cashier-page"},te={class:"select-cashier-header"},re={class:"d-flex flex-column align-center pt-8 pb-6"},ie={__name:"SelectCashier",setup(oe){const L=M(),o=U(),T=D(),t=d(!1),n=d(null),C=d(!1),b=d(""),y=d(""),r=d(null),u=d(null),q=V(()=>{if(!Array.isArray(o.availableCashiers))return[];const s=new Map;return o.availableCashiers.forEach(l=>{s.has(l.store_id)||s.set(l.store_id,{id:l.store_id,name:l.store_name||"Unknown Store",description:l.description||""})}),Array.from(s.values())}),S=V(()=>!r.value||!Array.isArray(o.availableCashiers)?[]:o.availableCashiers.filter(s=>s.store_id===r.value)),x=V(()=>r.value&&u.value);function z(s){r.value=s,u.value=null,b.value="",y.value="",n.value=null,C.value=!1}async function R(){if(C.value=!0,!x.value){r.value||(b.value="Please select a store"),u.value||(y.value="Please select a cash register");return}t.value=!0;try{const s=S.value.find(l=>l.id===u.value);if(!s)throw new Error("Selected cash register not found");await T.initializeFromCashier(s),L.push("/pos")}catch(s){n.value="Failed to select cash register. Please try again.",w.error("Failed to select cashier:",s)}finally{t.value=!1}}function j(){o.logout()}return ae(async()=>{t.value=!0;try{await o.loadAvailableCashiers(),o.hasCashiers||(n.value="No cash registers are available. Please contact your administrator.")}catch(s){n.value="Failed to load cash registers. Please try again.",w.error("Failed to load cashiers:",s)}finally{t.value=!1}}),(s,l)=>(p(),le("div",se,[a(O,{fluid:"",class:"fill-height pa-0"},{default:e(()=>[a(W,{align:"center",justify:"center","no-gutters":"",class:"fill-height"},{default:e(()=>[a($,{cols:"12",sm:"8",md:"6",lg:"4",xl:"3",class:"pa-4"},{default:e(()=>[a(G,{class:"select-cashier-card",elevation:"2",rounded:"lg"},{default:e(()=>[g("div",te,[g("div",re,[a(J,{color:"primary",size:"64",class:"mb-6"},{default:e(()=>[a(v,{icon:"mdi-cash-register",size:"32",color:"white"})]),_:1}),l[3]||(l[3]=g("h1",{class:"text-h4 font-weight-bold mb-1 text-primary"}," Welcome Back ",-1)),l[4]||(l[4]=g("p",{class:"text-subtitle-1 text-primary"}," Select your workspace to continue ",-1))])]),a(K,{class:"px-6 pt-8 pb-4"},{default:e(()=>[a(k,{modelValue:r.value,"onUpdate:modelValue":[l[0]||(l[0]=i=>r.value=i),z],items:q.value,"item-title":"name","item-value":"id",label:"Select Store",loading:t.value,required:"",variant:"outlined","bg-color":"surface",class:"mb-4",disabled:t.value,"error-messages":b.value,"prepend-inner-icon":"mdi-store","menu-props":{maxHeight:"300"}},{item:e(({props:i,item:m})=>[a(A,N(I(i)),{prepend:e(()=>[a(v,{icon:"mdi-store",color:"primary",class:"mr-2"})]),default:e(()=>[a(F,null,{default:e(()=>[c(f(m.raw.name),1)]),_:2},1024),m.raw.description?(p(),h(P,{key:0},{default:e(()=>[c(f(m.raw.description),1)]),_:2},1024)):_("",!0)]),_:2},1040)]),append:e(()=>[a(B,{"leave-absolute":""},{default:e(()=>[r.value?(p(),h(v,{key:0,icon:"mdi-check-circle",color:"success"})):_("",!0)]),_:1})]),_:1},8,["modelValue","items","loading","disabled","error-messages"]),a(k,{modelValue:u.value,"onUpdate:modelValue":l[1]||(l[1]=i=>u.value=i),items:S.value,"item-title":"name","item-value":"id",label:"Select Register",loading:t.value,required:"",variant:"outlined","bg-color":"surface",disabled:t.value||!r.value,"error-messages":y.value,"prepend-inner-icon":"mdi-register","menu-props":{maxHeight:"300"}},{item:e(({props:i,item:m})=>[a(A,N(I(i)),{prepend:e(()=>[a(v,{icon:"mdi-register",color:"primary",class:"mr-2"})]),default:e(()=>[a(F,null,{default:e(()=>[c(f(m.raw.name),1)]),_:2},1024),a(P,null,{default:e(()=>[c(f(m.raw.store_name),1)]),_:2},1024)]),_:2},1040)]),append:e(()=>[a(B,{"leave-absolute":""},{default:e(()=>[u.value?(p(),h(v,{key:0,icon:"mdi-check-circle",color:"success"})):_("",!0)]),_:1})]),_:1},8,["modelValue","items","loading","disabled","error-messages"]),a(Q,null,{default:e(()=>[n.value?(p(),h(X,{key:0,type:"error",variant:"tonal",class:"mt-4",closable:"",density:"compact","onClick:close":l[2]||(l[2]=i=>n.value=null)},{prepend:e(()=>[a(v,{icon:"mdi-alert-circle"})]),default:e(()=>[c(" "+f(n.value),1)]),_:1})):_("",!0)]),_:1})]),_:1}),a(Y),a(Z,{class:"pa-4"},{default:e(()=>[a(E,{color:"error",variant:"text",disabled:t.value,onClick:j,density:"comfortable"},{default:e(()=>l[5]||(l[5]=[c(" Sign Out ")])),_:1},8,["disabled"]),a(ee),a(E,{color:"primary",loading:t.value,disabled:!x.value,onClick:R,"min-width":"120"},{default:e(()=>l[6]||(l[6]=[c(" Continue ")])),_:1},8,["loading","disabled"])]),_:1})]),_:1})]),_:1})]),_:1})]),_:1})]))}},de=H(ie,[["__scopeId","data-v-9db89107"]]);export{de as default};
//# sourceMappingURL=SelectCashier-a48687e2.js.map