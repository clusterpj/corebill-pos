if(!self.define){let e,s={};const i=(i,a)=>(i=new URL(i+".js",a).href,s[i]||new Promise((s=>{if("document"in self){const e=document.createElement("script");e.src=i,e.onload=s,document.head.appendChild(e)}else e=i,importScripts(i),s()})).then((()=>{let e=s[i];if(!e)throw new Error(`Module ${i} didn’t register its module`);return e})));self.define=(a,n)=>{const r=e||("document"in self?document.currentScript.src:"")||location.href;if(s[r])return;let o={};const c=e=>i(e,r),l={module:{uri:r},exports:o,require:c};s[r]=Promise.all(a.map((e=>l[e]||c(e)))).then((e=>(n(...e),o)))}}define(["./workbox-42774e1b"],(function(e){"use strict";self.skipWaiting(),e.clientsClaim(),e.precacheAndRoute([{url:"apple-touch-icon.png",revision:"120e3f3bcb61e0b4aa7b804a3dc5a5ee"},{url:"assets/CustomerDisplayView-a48ab1da.js",revision:null},{url:"assets/index-137470bc.js",revision:null},{url:"assets/Items-f0eb41a9.js",revision:null},{url:"assets/Login-f69dc426.js",revision:null},{url:"assets/NotFound-24d16957.js",revision:null},{url:"assets/PosView-8f0ed2a8.js",revision:null},{url:"assets/SelectCashier-fde876e8.js",revision:null},{url:"assets/vuetify-3f7b308f.js",revision:null},{url:"assets/workbox-window.prod.es5-5ffdab76.js",revision:null},{url:"CustomerDisplayView.e4b0f703.css",revision:"d7990e2decec5921596b6e186af64ee4"},{url:"favicon.ico",revision:"120e3f3bcb61e0b4aa7b804a3dc5a5ee"},{url:"index.b2a9cf97.css",revision:"1f3defbd71141647ed75b40e7fd31e10"},{url:"index.html",revision:"68227f566db3fbaf653b953e7f905db1"},{url:"Items.f06f5948.css",revision:"812bc60be5ee71ab4dce1fa4c58020c4"},{url:"Login.c578e0c0.css",revision:"a366c870f28b3ae74941fde15535d5b3"},{url:"masked-icon.svg",revision:"3a4210066679daff35dd6734520747e0"},{url:"PosView.75d50584.css",revision:"283b1de470bfae887df41d3ae8fde367"},{url:"pwa-192x192.png",revision:"120e3f3bcb61e0b4aa7b804a3dc5a5ee"},{url:"pwa-512x512.png",revision:"120e3f3bcb61e0b4aa7b804a3dc5a5ee"},{url:"SelectCashier.39baceaa.css",revision:"aba53597a6e2f45edf093f36ed42d0d3"},{url:"apple-touch-icon.png",revision:"120e3f3bcb61e0b4aa7b804a3dc5a5ee"},{url:"favicon.ico",revision:"120e3f3bcb61e0b4aa7b804a3dc5a5ee"},{url:"masked-icon.svg",revision:"3a4210066679daff35dd6734520747e0"},{url:"pwa-192x192.png",revision:"120e3f3bcb61e0b4aa7b804a3dc5a5ee"},{url:"pwa-512x512.png",revision:"120e3f3bcb61e0b4aa7b804a3dc5a5ee"},{url:"manifest.webmanifest",revision:"f73b97dc5316ecfe91c457f1bc4ce567"}],{}),e.cleanupOutdatedCaches(),e.registerRoute(new e.NavigationRoute(e.createHandlerBoundToURL("index.html"))),e.registerRoute(/^https:\/\/api\.*/i,new e.NetworkFirst({cacheName:"api-cache",plugins:[new e.ExpirationPlugin({maxEntries:10,maxAgeSeconds:604800}),new e.CacheableResponsePlugin({statuses:[0,200]})]}),"GET")}));
//# sourceMappingURL=sw.js.map
