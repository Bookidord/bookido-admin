(()=>{var a={};a.id=1323,a.ids=[1323],a.modules={261:a=>{"use strict";a.exports=require("next/dist/shared/lib/router/utils/app-paths")},3295:a=>{"use strict";a.exports=require("next/dist/server/app-render/after-task-async-storage.external.js")},5200:()=>{},7102:(a,b,c)=>{Promise.resolve().then(c.t.bind(c,65169,23)),Promise.resolve().then(c.bind(c,20833))},10846:a=>{"use strict";a.exports=require("next/dist/compiled/next-server/app-page.runtime.prod.js")},16846:(a,b,c)=>{Promise.resolve().then(c.t.bind(c,54160,23)),Promise.resolve().then(c.t.bind(c,31603,23)),Promise.resolve().then(c.t.bind(c,68495,23)),Promise.resolve().then(c.t.bind(c,75170,23)),Promise.resolve().then(c.t.bind(c,77526,23)),Promise.resolve().then(c.t.bind(c,78922,23)),Promise.resolve().then(c.t.bind(c,29234,23)),Promise.resolve().then(c.t.bind(c,12263,23)),Promise.resolve().then(c.bind(c,82146))},19121:a=>{"use strict";a.exports=require("next/dist/server/app-render/action-async-storage.external.js")},20833:(a,b,c)=>{"use strict";c.d(b,{HelpCenter:()=>d});let d=(0,c(97954).registerClientReference)(function(){throw Error("Attempted to call HelpCenter() from the server but HelpCenter is on the client. It's not possible to invoke a client function from the server, it can only be rendered as a Component or passed to props of a Client Component.")},"C:\\Users\\debai\\bookido\\src\\components\\help\\HelpCenter.tsx","HelpCenter")},20883:(a,b,c)=>{"use strict";c.r(b),c.d(b,{GlobalError:()=>D.a,__next_app__:()=>J,handler:()=>L,pages:()=>I,routeModule:()=>K,tree:()=>H});var d=c(49754),e=c(9117),f=c(46595),g=c(32324),h=c(39326),i=c(38928),j=c(20175),k=c(12),l=c(54290),m=c(12696),n=c(82802),o=c(77533),p=c(45229),q=c(32822),r=c(261),s=c(26453),t=c(52474),u=c(26713),v=c(51356),w=c(62685),x=c(36225),y=c(63446),z=c(2762),A=c(45742),B=c(86439),C=c(81170),D=c.n(C),E=c(62506),F=c(91203),G={};for(let a in E)0>["default","tree","pages","GlobalError","__next_app__","routeModule","handler"].indexOf(a)&&(G[a]=()=>E[a]);c.d(b,G);let H={children:["",{children:["ayuda",{children:["__PAGE__",{},{page:[()=>Promise.resolve().then(c.bind(c,22392)),"C:\\Users\\debai\\bookido\\src\\app\\ayuda\\page.tsx"]}]},{}]},{layout:[()=>Promise.resolve().then(c.bind(c,51472)),"C:\\Users\\debai\\bookido\\src\\app\\layout.tsx"],"global-error":[()=>Promise.resolve().then(c.t.bind(c,81170,23)),"next/dist/client/components/builtin/global-error.js"],"not-found":[()=>Promise.resolve().then(c.t.bind(c,87028,23)),"next/dist/client/components/builtin/not-found.js"],forbidden:[()=>Promise.resolve().then(c.t.bind(c,90461,23)),"next/dist/client/components/builtin/forbidden.js"],unauthorized:[()=>Promise.resolve().then(c.t.bind(c,32768,23)),"next/dist/client/components/builtin/unauthorized.js"]}]}.children,I=["C:\\Users\\debai\\bookido\\src\\app\\ayuda\\page.tsx"],J={require:c,loadChunk:()=>Promise.resolve()},K=new d.AppPageRouteModule({definition:{kind:e.RouteKind.APP_PAGE,page:"/ayuda/page",pathname:"/ayuda",bundlePath:"",filename:"",appPaths:[]},userland:{loaderTree:H},distDir:".next",relativeProjectDir:""});async function L(a,b,d){var C;let G="/ayuda/page";"/index"===G&&(G="/");let M=(0,h.getRequestMeta)(a,"postponed"),N=(0,h.getRequestMeta)(a,"minimalMode"),O=await K.prepare(a,b,{srcPage:G,multiZoneDraftMode:!1});if(!O)return b.statusCode=400,b.end("Bad Request"),null==d.waitUntil||d.waitUntil.call(d,Promise.resolve()),null;let{buildId:P,query:Q,params:R,parsedUrl:S,pageIsDynamic:T,buildManifest:U,nextFontManifest:V,reactLoadableManifest:W,serverActionsManifest:X,clientReferenceManifest:Y,subresourceIntegrityManifest:Z,prerenderManifest:$,isDraftMode:_,resolvedPathname:aa,revalidateOnlyGenerated:ab,routerServerContext:ac,nextConfig:ad,interceptionRoutePatterns:ae}=O,af=S.pathname||"/",ag=(0,r.normalizeAppPath)(G),{isOnDemandRevalidate:ah}=O,ai=K.match(af,$),aj=!!$.routes[aa],ak=!!(ai||aj||$.routes[ag]),al=a.headers["user-agent"]||"",am=(0,u.getBotType)(al),an=(0,p.isHtmlBotRequest)(a),ao=(0,h.getRequestMeta)(a,"isPrefetchRSCRequest")??"1"===a.headers[t.NEXT_ROUTER_PREFETCH_HEADER],ap=(0,h.getRequestMeta)(a,"isRSCRequest")??!!a.headers[t.RSC_HEADER],aq=(0,s.getIsPossibleServerAction)(a),ar=(0,m.checkIsAppPPREnabled)(ad.experimental.ppr)&&(null==(C=$.routes[ag]??$.dynamicRoutes[ag])?void 0:C.renderingMode)==="PARTIALLY_STATIC",as=!1,at=!1,au=ar?M:void 0,av=ar&&ap&&!ao,aw=(0,h.getRequestMeta)(a,"segmentPrefetchRSCRequest"),ax=!al||(0,p.shouldServeStreamingMetadata)(al,ad.htmlLimitedBots);an&&ar&&(ak=!1,ax=!1);let ay=!0===K.isDev||!ak||"string"==typeof M||av,az=an&&ar,aA=null;_||!ak||ay||aq||au||av||(aA=aa);let aB=aA;!aB&&K.isDev&&(aB=aa),K.isDev||_||!ak||!ap||av||(0,k.d)(a.headers);let aC={...E,tree:H,pages:I,GlobalError:D(),handler:L,routeModule:K,__next_app__:J};X&&Y&&(0,o.setReferenceManifestsSingleton)({page:G,clientReferenceManifest:Y,serverActionsManifest:X,serverModuleMap:(0,q.createServerModuleMap)({serverActionsManifest:X})});let aD=a.method||"GET",aE=(0,g.getTracer)(),aF=aE.getActiveScopeSpan();try{let f=K.getVaryHeader(aa,ae);b.setHeader("Vary",f);let k=async(c,d)=>{let e=new l.NodeNextRequest(a),f=new l.NodeNextResponse(b);return K.render(e,f,d).finally(()=>{if(!c)return;c.setAttributes({"http.status_code":b.statusCode,"next.rsc":!1});let d=aE.getRootSpanAttributes();if(!d)return;if(d.get("next.span_type")!==i.BaseServerSpan.handleRequest)return void console.warn(`Unexpected root span type '${d.get("next.span_type")}'. Please report this Next.js issue https://github.com/vercel/next.js`);let e=d.get("next.route");if(e){let a=`${aD} ${e}`;c.setAttributes({"next.route":e,"http.route":e,"next.span_name":a}),c.updateName(a)}else c.updateName(`${aD} ${a.url}`)})},m=async({span:e,postponed:f,fallbackRouteParams:g})=>{let i={query:Q,params:R,page:ag,sharedContext:{buildId:P},serverComponentsHmrCache:(0,h.getRequestMeta)(a,"serverComponentsHmrCache"),fallbackRouteParams:g,renderOpts:{App:()=>null,Document:()=>null,pageConfig:{},ComponentMod:aC,Component:(0,j.T)(aC),params:R,routeModule:K,page:G,postponed:f,shouldWaitOnAllReady:az,serveStreamingMetadata:ax,supportsDynamicResponse:"string"==typeof f||ay,buildManifest:U,nextFontManifest:V,reactLoadableManifest:W,subresourceIntegrityManifest:Z,serverActionsManifest:X,clientReferenceManifest:Y,setIsrStatus:null==ac?void 0:ac.setIsrStatus,dir:c(33873).join(process.cwd(),K.relativeProjectDir),isDraftMode:_,isRevalidate:ak&&!f&&!av,botType:am,isOnDemandRevalidate:ah,isPossibleServerAction:aq,assetPrefix:ad.assetPrefix,nextConfigOutput:ad.output,crossOrigin:ad.crossOrigin,trailingSlash:ad.trailingSlash,previewProps:$.preview,deploymentId:ad.deploymentId,enableTainting:ad.experimental.taint,htmlLimitedBots:ad.htmlLimitedBots,devtoolSegmentExplorer:ad.experimental.devtoolSegmentExplorer,reactMaxHeadersLength:ad.reactMaxHeadersLength,multiZoneDraftMode:!1,incrementalCache:(0,h.getRequestMeta)(a,"incrementalCache"),cacheLifeProfiles:ad.experimental.cacheLife,basePath:ad.basePath,serverActions:ad.experimental.serverActions,...as?{nextExport:!0,supportsDynamicResponse:!1,isStaticGeneration:!0,isRevalidate:!0,isDebugDynamicAccesses:as}:{},experimental:{isRoutePPREnabled:ar,expireTime:ad.expireTime,staleTimes:ad.experimental.staleTimes,cacheComponents:!!ad.experimental.cacheComponents,clientSegmentCache:!!ad.experimental.clientSegmentCache,clientParamParsing:!!ad.experimental.clientParamParsing,dynamicOnHover:!!ad.experimental.dynamicOnHover,inlineCss:!!ad.experimental.inlineCss,authInterrupts:!!ad.experimental.authInterrupts,clientTraceMetadata:ad.experimental.clientTraceMetadata||[]},waitUntil:d.waitUntil,onClose:a=>{b.on("close",a)},onAfterTaskError:()=>{},onInstrumentationRequestError:(b,c,d)=>K.onRequestError(a,b,d,ac),err:(0,h.getRequestMeta)(a,"invokeError"),dev:K.isDev}},l=await k(e,i),{metadata:m}=l,{cacheControl:n,headers:o={},fetchTags:p}=m;if(p&&(o[y.NEXT_CACHE_TAGS_HEADER]=p),a.fetchMetrics=m.fetchMetrics,ak&&(null==n?void 0:n.revalidate)===0&&!K.isDev&&!ar){let a=m.staticBailoutInfo,b=Object.defineProperty(Error(`Page changed from static to dynamic at runtime ${aa}${(null==a?void 0:a.description)?`, reason: ${a.description}`:""}
see more here https://nextjs.org/docs/messages/app-static-to-dynamic-error`),"__NEXT_ERROR_CODE",{value:"E132",enumerable:!1,configurable:!0});if(null==a?void 0:a.stack){let c=a.stack;b.stack=b.message+c.substring(c.indexOf("\n"))}throw b}return{value:{kind:v.CachedRouteKind.APP_PAGE,html:l,headers:o,rscData:m.flightData,postponed:m.postponed,status:m.statusCode,segmentData:m.segmentData},cacheControl:n}},o=async({hasResolved:c,previousCacheEntry:f,isRevalidating:g,span:i})=>{let j,k=!1===K.isDev,l=c||b.writableEnded;if(ah&&ab&&!f&&!N)return(null==ac?void 0:ac.render404)?await ac.render404(a,b):(b.statusCode=404,b.end("This page could not be found")),null;if(ai&&(j=(0,w.parseFallbackField)(ai.fallback)),j===w.FallbackMode.PRERENDER&&(0,u.isBot)(al)&&(!ar||an)&&(j=w.FallbackMode.BLOCKING_STATIC_RENDER),(null==f?void 0:f.isStale)===-1&&(ah=!0),ah&&(j!==w.FallbackMode.NOT_FOUND||f)&&(j=w.FallbackMode.BLOCKING_STATIC_RENDER),!N&&j!==w.FallbackMode.BLOCKING_STATIC_RENDER&&aB&&!l&&!_&&T&&(k||!aj)){let b;if((k||ai)&&j===w.FallbackMode.NOT_FOUND)throw new B.NoFallbackError;if(ar&&!ap){let c="string"==typeof(null==ai?void 0:ai.fallback)?ai.fallback:k?ag:null;if(b=await K.handleResponse({cacheKey:c,req:a,nextConfig:ad,routeKind:e.RouteKind.APP_PAGE,isFallback:!0,prerenderManifest:$,isRoutePPREnabled:ar,responseGenerator:async()=>m({span:i,postponed:void 0,fallbackRouteParams:k||at?(0,n.u)(ag):null}),waitUntil:d.waitUntil}),null===b)return null;if(b)return delete b.cacheControl,b}}let o=ah||g||!au?void 0:au;if(as&&void 0!==o)return{cacheControl:{revalidate:1,expire:void 0},value:{kind:v.CachedRouteKind.PAGES,html:x.default.EMPTY,pageData:{},headers:void 0,status:void 0}};let p=T&&ar&&((0,h.getRequestMeta)(a,"renderFallbackShell")||at)?(0,n.u)(af):null;return m({span:i,postponed:o,fallbackRouteParams:p})},p=async c=>{var f,g,i,j,k;let l,n=await K.handleResponse({cacheKey:aA,responseGenerator:a=>o({span:c,...a}),routeKind:e.RouteKind.APP_PAGE,isOnDemandRevalidate:ah,isRoutePPREnabled:ar,req:a,nextConfig:ad,prerenderManifest:$,waitUntil:d.waitUntil});if(_&&b.setHeader("Cache-Control","private, no-cache, no-store, max-age=0, must-revalidate"),K.isDev&&b.setHeader("Cache-Control","no-store, must-revalidate"),!n){if(aA)throw Object.defineProperty(Error("invariant: cache entry required but not generated"),"__NEXT_ERROR_CODE",{value:"E62",enumerable:!1,configurable:!0});return null}if((null==(f=n.value)?void 0:f.kind)!==v.CachedRouteKind.APP_PAGE)throw Object.defineProperty(Error(`Invariant app-page handler received invalid cache entry ${null==(i=n.value)?void 0:i.kind}`),"__NEXT_ERROR_CODE",{value:"E707",enumerable:!1,configurable:!0});let p="string"==typeof n.value.postponed;ak&&!av&&(!p||ao)&&(N||b.setHeader("x-nextjs-cache",ah?"REVALIDATED":n.isMiss?"MISS":n.isStale?"STALE":"HIT"),b.setHeader(t.NEXT_IS_PRERENDER_HEADER,"1"));let{value:q}=n;if(au)l={revalidate:0,expire:void 0};else if(N&&ap&&!ao&&ar)l={revalidate:0,expire:void 0};else if(!K.isDev)if(_)l={revalidate:0,expire:void 0};else if(ak){if(n.cacheControl)if("number"==typeof n.cacheControl.revalidate){if(n.cacheControl.revalidate<1)throw Object.defineProperty(Error(`Invalid revalidate configuration provided: ${n.cacheControl.revalidate} < 1`),"__NEXT_ERROR_CODE",{value:"E22",enumerable:!1,configurable:!0});l={revalidate:n.cacheControl.revalidate,expire:(null==(j=n.cacheControl)?void 0:j.expire)??ad.expireTime}}else l={revalidate:y.CACHE_ONE_YEAR,expire:void 0}}else b.getHeader("Cache-Control")||(l={revalidate:0,expire:void 0});if(n.cacheControl=l,"string"==typeof aw&&(null==q?void 0:q.kind)===v.CachedRouteKind.APP_PAGE&&q.segmentData){b.setHeader(t.NEXT_DID_POSTPONE_HEADER,"2");let c=null==(k=q.headers)?void 0:k[y.NEXT_CACHE_TAGS_HEADER];N&&ak&&c&&"string"==typeof c&&b.setHeader(y.NEXT_CACHE_TAGS_HEADER,c);let d=q.segmentData.get(aw);return void 0!==d?(0,A.sendRenderResult)({req:a,res:b,generateEtags:ad.generateEtags,poweredByHeader:ad.poweredByHeader,result:x.default.fromStatic(d,t.RSC_CONTENT_TYPE_HEADER),cacheControl:n.cacheControl}):(b.statusCode=204,(0,A.sendRenderResult)({req:a,res:b,generateEtags:ad.generateEtags,poweredByHeader:ad.poweredByHeader,result:x.default.EMPTY,cacheControl:n.cacheControl}))}let r=(0,h.getRequestMeta)(a,"onCacheEntry");if(r&&await r({...n,value:{...n.value,kind:"PAGE"}},{url:(0,h.getRequestMeta)(a,"initURL")}))return null;if(p&&au)throw Object.defineProperty(Error("Invariant: postponed state should not be present on a resume request"),"__NEXT_ERROR_CODE",{value:"E396",enumerable:!1,configurable:!0});if(q.headers){let a={...q.headers};for(let[c,d]of(N&&ak||delete a[y.NEXT_CACHE_TAGS_HEADER],Object.entries(a)))if(void 0!==d)if(Array.isArray(d))for(let a of d)b.appendHeader(c,a);else"number"==typeof d&&(d=d.toString()),b.appendHeader(c,d)}let s=null==(g=q.headers)?void 0:g[y.NEXT_CACHE_TAGS_HEADER];if(N&&ak&&s&&"string"==typeof s&&b.setHeader(y.NEXT_CACHE_TAGS_HEADER,s),!q.status||ap&&ar||(b.statusCode=q.status),!N&&q.status&&F.RedirectStatusCode[q.status]&&ap&&(b.statusCode=200),p&&b.setHeader(t.NEXT_DID_POSTPONE_HEADER,"1"),ap&&!_){if(void 0===q.rscData){if(q.postponed)throw Object.defineProperty(Error("Invariant: Expected postponed to be undefined"),"__NEXT_ERROR_CODE",{value:"E372",enumerable:!1,configurable:!0});return(0,A.sendRenderResult)({req:a,res:b,generateEtags:ad.generateEtags,poweredByHeader:ad.poweredByHeader,result:q.html,cacheControl:av?{revalidate:0,expire:void 0}:n.cacheControl})}return(0,A.sendRenderResult)({req:a,res:b,generateEtags:ad.generateEtags,poweredByHeader:ad.poweredByHeader,result:x.default.fromStatic(q.rscData,t.RSC_CONTENT_TYPE_HEADER),cacheControl:n.cacheControl})}let u=q.html;if(!p||N||ap)return(0,A.sendRenderResult)({req:a,res:b,generateEtags:ad.generateEtags,poweredByHeader:ad.poweredByHeader,result:u,cacheControl:n.cacheControl});if(as)return u.push(new ReadableStream({start(a){a.enqueue(z.ENCODED_TAGS.CLOSED.BODY_AND_HTML),a.close()}})),(0,A.sendRenderResult)({req:a,res:b,generateEtags:ad.generateEtags,poweredByHeader:ad.poweredByHeader,result:u,cacheControl:{revalidate:0,expire:void 0}});let w=new TransformStream;return u.push(w.readable),m({span:c,postponed:q.postponed,fallbackRouteParams:null}).then(async a=>{var b,c;if(!a)throw Object.defineProperty(Error("Invariant: expected a result to be returned"),"__NEXT_ERROR_CODE",{value:"E463",enumerable:!1,configurable:!0});if((null==(b=a.value)?void 0:b.kind)!==v.CachedRouteKind.APP_PAGE)throw Object.defineProperty(Error(`Invariant: expected a page response, got ${null==(c=a.value)?void 0:c.kind}`),"__NEXT_ERROR_CODE",{value:"E305",enumerable:!1,configurable:!0});await a.value.html.pipeTo(w.writable)}).catch(a=>{w.writable.abort(a).catch(a=>{console.error("couldn't abort transformer",a)})}),(0,A.sendRenderResult)({req:a,res:b,generateEtags:ad.generateEtags,poweredByHeader:ad.poweredByHeader,result:u,cacheControl:{revalidate:0,expire:void 0}})};if(!aF)return await aE.withPropagatedContext(a.headers,()=>aE.trace(i.BaseServerSpan.handleRequest,{spanName:`${aD} ${a.url}`,kind:g.SpanKind.SERVER,attributes:{"http.method":aD,"http.target":a.url}},p));await p(aF)}catch(b){throw b instanceof B.NoFallbackError||await K.onRequestError(a,b,{routerKind:"App Router",routePath:G,routeType:"render",revalidateReason:(0,f.c)({isRevalidate:ak,isOnDemandRevalidate:ah})},ac),b}}},22392:(a,b,c)=>{"use strict";c.r(b),c.d(b,{default:()=>l,metadata:()=>k});var d=c(75338),e=c(65169),f=c.n(e),g=c(74515);let h=[{slug:"configurar-negocio",title:"C\xf3mo configurar tu negocio",description:"Ponle tu nombre, horario y n\xfamero de WhatsApp al panel.",icon:"⚙️",body:`## \xbfQu\xe9 es la Configuraci\xf3n?

En la secci\xf3n **Configuraci\xf3n** de tu panel puedes personalizar todo lo que tus clientes ven cuando entran a reservar: el nombre de tu negocio, tu n\xfamero de WhatsApp, tu horario de atenci\xf3n y una descripci\xf3n breve.

## C\xf3mo llegar ah\xed

1. Entra a tu panel en **/panel**
2. En el men\xfa del lado izquierdo (o en el men\xfa de hamburguesa si est\xe1s en el celular), toca **Configuraci\xf3n**
3. Ah\xed ver\xe1s todos los campos que puedes editar

## Qu\xe9 puedes cambiar

- **Nombre del negocio** — el nombre que aparece en la p\xe1gina p\xfablica de reservas
- **Descripci\xf3n** — una l\xednea breve sobre tu negocio (por ejemplo: *"Nail salon en Santo Domingo"*)
- **WhatsApp** — tu n\xfamero con c\xf3digo de pa\xeds, sin guiones ni espacios (ejemplo: *18096106459*)
- **Horario de apertura y cierre** — las horas en que aceptas reservas
- **Color principal** — el color de acento que aparece en los botones de tu p\xe1gina p\xfablica

## Guardar los cambios

Cuando termines de editar, toca el bot\xf3n **Guardar cambios**. Ver\xe1s un mensaje de confirmaci\xf3n y los cambios se aplican de inmediato.

## Tu enlace p\xfablico

En la misma p\xe1gina de Configuraci\xf3n encontrar\xe1s tu **enlace de reservas** — la direcci\xf3n que le das a tus clientes para que reserven en l\xednea. Puedes copiarlo con un solo toque y compartirlo por WhatsApp, Instagram o como quieras.

> **Consejo:** Pon tu enlace de reservas en la bio de Instagram para que tus seguidores puedan agendar sin escribirte primero.`},{slug:"agregar-servicios",title:"C\xf3mo agregar y editar servicios",description:"Agrega, edita y organiza los servicios que ofreces.",icon:"✂️",body:`## \xbfD\xf3nde est\xe1n los servicios?

Tus servicios aparecen en la p\xe1gina p\xfablica de reservas para que los clientes elijan cu\xe1l quieren. Puedes agregar, editar, desactivar o eliminar servicios directamente desde el panel.

## C\xf3mo agregar un servicio nuevo

1. En el men\xfa de tu panel, ve a **Servicios**
2. Toca el bot\xf3n **Agregar servicio**
3. Rellena el nombre del servicio (por ejemplo: *Manicura gel*)
4. Escribe la duraci\xf3n en minutos (por ejemplo: *60*)
5. Toca **Guardar** — el servicio aparece de inmediato en tu p\xe1gina de reservas

## C\xf3mo editar un servicio existente

1. En la lista de servicios, toca el nombre del servicio que quieres cambiar
2. Edita el nombre o la duraci\xf3n
3. Toca **Guardar**

## Ocultar un servicio sin borrarlo

Si no quieres ofrecer un servicio por un tiempo, puedes **desactivarlo** en lugar de borrarlo. El servicio desaparece de la p\xe1gina de reservas pero queda guardado para despu\xe9s.

Para desactivarlo, toca el interruptor que aparece al lado del servicio en la lista.

## Eliminar un servicio

Para borrar un servicio permanentemente, toca el bot\xf3n de eliminar (\xedcono de basura) al lado del servicio. Las reservas ya agendadas para ese servicio no se borran — quedan en tu historial.

## Ordenar los servicios

Los servicios aparecen en la p\xe1gina de reservas en el mismo orden en que los ves en tu panel. Puedes reorganizarlos arrastr\xe1ndolos de arriba a abajo.

> **Consejo:** Pon primero los servicios que m\xe1s vendes. La mayor\xeda de los clientes eligen el primero que ven en la lista.`},{slug:"ver-reservas",title:"C\xf3mo ver y gestionar tus reservas",description:"Consulta, filtra y actualiza el estado de todas tus reservas.",icon:"\uD83D\uDCC5",body:`## D\xf3nde ver tus reservas

En el men\xfa de tu panel, toca **Reservas**. Ah\xed ver\xe1s todas las reservas que tus clientes han agendado, ordenadas de la m\xe1s reciente a la m\xe1s pr\xf3xima.

## Informaci\xf3n de cada reserva

Cada reserva te muestra:

- **Nombre del cliente**
- **Servicio elegido**
- **D\xeda y hora**
- **Tel\xe9fono** del cliente (si lo dej\xf3)
- **Notas** que escribi\xf3 al reservar
- **Estado**: Confirmada, Completada, Cancelada o No se present\xf3

## Filtrar reservas

Usa los botones de filtro en la parte superior para ver solo las reservas que te interesan:

- **Todas** — muestra el historial completo
- **Confirmadas** — las que est\xe1n activas y pendientes
- **Completadas** — las que ya ocurrieron
- **No-show** — clientes que no se presentaron
- **Canceladas** — las que fueron canceladas

Tambi\xe9n puedes filtrar por per\xedodo: \xfaltimos **7, 30 o 90 d\xedas**.

## El men\xfa de acciones \xb7\xb7\xb7

Cada reserva tiene un bot\xf3n **\xb7\xb7\xb7** (tres puntos) en la parte derecha. Al tocarlo aparecen las opciones disponibles seg\xfan el estado de la reserva:

Si la reserva est\xe1 **Confirmada**:
- **✓ Completada** — marca la cita como realizada
- **👻 No se present\xf3** — registra que el cliente no vino
- **✕ Cancelar** — cancela la reserva

Si la reserva est\xe1 en cualquier otro estado:
- **↩ Restaurar** — la vuelve a Confirmada

## Agendar una reserva manual

Si una clienta te escribe por WhatsApp y quieres registrar su reserva t\xfa misma:

1. Toca el bot\xf3n **Nueva reserva** en la parte superior
2. Escribe el nombre y tel\xe9fono de la clienta
3. Elige el servicio, el d\xeda y la hora disponible
4. Toca **Confirmar** — queda registrada y el horario se bloquea

## Reenviar el email de confirmaci\xf3n

Cada reserva tiene un \xedcono de sobre ✉ que te permite reenviarle el email de confirmaci\xf3n al cliente con un solo toque.

> **Consejo:** Revisa tus reservas confirmadas cada ma\xf1ana. Si ves que alguien tiene cita en unas horas, puedes prepararle los materiales con tiempo.`},{slug:"calendario",title:"C\xf3mo usar el Calendario",description:"Ve todas tus reservas del mes en una vista de calendario.",icon:"\uD83D\uDDD3️",body:`## \xbfQu\xe9 es el Calendario?

El **Calendario** te da una vista mensual de todas tus reservas. En lugar de ver una lista, ves un cuadr\xedcula con los d\xedas del mes donde cada punto de color representa una reserva.

## C\xf3mo acceder

En el men\xfa de tu panel, toca **Calendario**.

## Leer el calendario

Cada d\xeda del mes puede mostrar:

- **Puntos de color** — cada punto es una reserva (verde = confirmada, azul = completada, \xe1mbar = no-show, gris = cancelada)
- **N\xfamero en verde** — cu\xe1ntas reservas confirmadas tiene ese d\xeda
- **D\xeda resaltado** — el d\xeda de hoy aparece destacado autom\xe1ticamente

## Ver el detalle de un d\xeda

Toca cualquier d\xeda del calendario y en el panel de la derecha (o abajo en el celular) ver\xe1s la lista completa de reservas de ese d\xeda con:

- Hora y duraci\xf3n de cada reserva
- Nombre del cliente y servicio
- Estado de la reserva
- Tel\xe9fono con enlace directo a WhatsApp

## Navegar entre meses

Usa las flechas **←** y **→** en la parte superior del calendario para ir al mes anterior o al siguiente. La p\xe1gina se actualiza con las reservas de ese mes.

> **Consejo:** Usa el calendario al inicio de cada semana para tener una foto clara de qu\xe9 tan ocupados estar\xe1s y si hay d\xedas con espacio para m\xe1s reservas.`},{slug:"clientes",title:"C\xf3mo ver el historial de tus clientes",description:"Conoce a tus mejores clientes y revisa su historial de visitas.",icon:"\uD83D\uDC65",body:`## \xbfQu\xe9 es la vista de Clientes?

La secci\xf3n **Clientes** agrupa autom\xe1ticamente todas las personas que han reservado contigo, mostrando cu\xe1ntas veces han venido y cu\xe1ndo fue su \xfaltima visita. No tienes que hacer nada extra — se construye solo con tus reservas existentes.

## C\xf3mo acceder

En el men\xfa de tu panel, toca **Clientes**.

## La lista de clientes

Ver\xe1s una tabla con todos tus clientes \xfanicos. Cada fila muestra:

- **Nombre y email** del cliente
- **Total de reservas** que ha hecho
- **Tag autom\xe1tico** seg\xfan su frecuencia:
  - **Nuevo** — menos de 4 reservas
  - **Regular** — 4 o m\xe1s reservas
  - **VIP ⭐** — 10 o m\xe1s reservas
- **\xdaltima visita** en tiempo relativo (ej: *hace 3 d\xedas*)
- **Tel\xe9fono** con enlace directo a WhatsApp

## Buscar un cliente

Usa el buscador en la parte superior para encontrar a alguien por nombre, email o tel\xe9fono.

## Ver el historial completo de un cliente

Toca el bot\xf3n **Ver historial →** en cualquier fila para abrir la p\xe1gina de detalle del cliente. Ah\xed ver\xe1s:

- Sus estad\xedsticas: total de reservas, completadas, confirmadas, canceladas y no-shows
- Fecha de primera y \xfaltima visita
- Historial completo de todas sus reservas con fecha, servicio y estado

## Contactar por WhatsApp

Tanto en la lista como en el detalle, si el cliente dej\xf3 su tel\xe9fono hay un bot\xf3n de **WhatsApp** para escribirle directamente.

> **Consejo:** Revisa tus clientes VIP de vez en cuando. Si alguno lleva tiempo sin venir, un mensaje de WhatsApp record\xe1ndole que tienes su servicio favorito puede traerlo de vuelta.`},{slug:"mensajes-whatsapp",title:"C\xf3mo usar el bot\xf3n de WhatsApp",description:"Tu n\xfamero ya est\xe1 conectado — as\xed funciona el bot\xf3n de reservas.",icon:"\uD83D\uDCAC",body:`## \xbfC\xf3mo funciona el bot\xf3n de WhatsApp?

En tu p\xe1gina p\xfablica de reservas hay un bot\xf3n que dice **Reservar por WhatsApp**. Cuando una clienta lo toca, WhatsApp se abre directamente con tu n\xfamero y un mensaje ya escrito. Ella solo tiene que tocar "Enviar".

Esto hace que sea muy f\xe1cil para las clientas contactarte, aunque no quieran usar el sistema de reservas en l\xednea.

## Cambiar tu n\xfamero de WhatsApp

Tu n\xfamero de WhatsApp se guarda en **Configuraci\xf3n**. Para cambiarlo:

1. Ve al men\xfa → **Configuraci\xf3n**
2. Edita el campo **WhatsApp**
3. Escribe tu n\xfamero con el c\xf3digo del pa\xeds al inicio, sin espacios ni guiones
   - Ejemplo para Rep\xfablica Dominicana: **18096106459** (el 1 es el c\xf3digo de RD)
4. Toca **Guardar cambios**

El bot\xf3n de WhatsApp en tu p\xe1gina p\xfablica se actualiza autom\xe1ticamente.

## Bot\xf3n de WhatsApp en cada reserva

En la lista de reservas, si una clienta dej\xf3 su n\xfamero ver\xe1s un bot\xf3n **WA** al lado de su reserva. Al tocarlo se abre WhatsApp con un mensaje pre-escrito que incluye su nombre y la hora de la cita — ideal para recordatorios r\xe1pidos.

## Verificar que funciona

Para probar que todo est\xe1 bien:

1. Abre tu enlace p\xfablico de reservas (lo encuentras en Configuraci\xf3n)
2. Toca el bot\xf3n **Reservar por WhatsApp**
3. Comprueba que se abre WhatsApp con tu n\xfamero correcto

Si el n\xfamero no es el correcto, vuelve a Configuraci\xf3n y corr\xedgelo.

> **Consejo:** Aseg\xfarate de que tu n\xfamero de WhatsApp tenga la cuenta activa y puedas recibir mensajes. Pru\xe9balo desde otro celular si tienes dudas.`},{slug:"cancelaciones-no-shows",title:"C\xf3mo manejar cancelaciones y no-shows",description:"Cancela reservas, registra ausencias y reduce los no-shows.",icon:"\uD83D\uDEAB",body:`## Cancelar una reserva

Cuando una clienta te avisa que no puede venir:

1. Ve al men\xfa → **Reservas**
2. Busca la reserva de esa clienta
3. Toca el bot\xf3n **\xb7\xb7\xb7** (tres puntos) en su reserva
4. Selecciona **✕ Cancelar**

El horario queda libre de inmediato y ese turno vuelve a estar disponible para otras reservas.

## Registrar un no-show

Cuando la clienta ten\xeda cita pero no apareci\xf3 y no avis\xf3:

1. Busca la reserva en la lista
2. Toca el bot\xf3n **\xb7\xb7\xb7**
3. Selecciona **👻 No se present\xf3**

La reserva queda marcada como no-show en tu historial. Esto te ayuda a llevar un registro de clientes que fallan con frecuencia y verlo en su perfil en la secci\xf3n **Clientes**.

## Marcar una reserva como completada

Cuando la cita ya ocurri\xf3 y todo fue bien:

1. Toca el bot\xf3n **\xb7\xb7\xb7** en la reserva
2. Selecciona **✓ Completada**

Las reservas completadas aparecen en el historial del cliente y en las estad\xedsticas de tu panel.

## Restaurar una reserva cancelada

Si cancelaste por error o la clienta cambi\xf3 de opini\xf3n:

1. Busca la reserva cancelada (filtra por "Canceladas" en la barra de filtros)
2. Toca **\xb7\xb7\xb7** → **↩ Restaurar**
3. La reserva vuelve a estar Confirmada y el horario queda bloqueado

## C\xf3mo reducir los no-shows

- **Recordatorio por WhatsApp:** el d\xeda anterior toca el bot\xf3n **WA** en la reserva para enviarle un mensaje r\xe1pido con su horario
- **Pide confirmaci\xf3n:** en el mensaje de recordatorio p\xeddele que te confirme si viene — as\xed sabes con tiempo si el turno quedar\xe1 libre
- **Revisa el historial:** en la secci\xf3n **Clientes** puedes ver cu\xe1ntos no-shows tiene cada persona antes de aceptarle una nueva reserva

> **Consejo:** Un recordatorio por WhatsApp la noche anterior reduce los no-shows a casi cero. La mayor\xeda de las clientas agradecen el mensaje y confirman.`},{slug:"usar-desde-celular",title:"C\xf3mo usar el panel desde el celular",description:"Instala Bookido en tu pantalla de inicio y gestiona todo desde el m\xf3vil.",icon:"\uD83D\uDCF1",body:`## El panel funciona en el celular

Bookido est\xe1 dise\xf1ado para usarse c\xf3modamente desde el tel\xe9fono. Puedes ver las reservas del d\xeda, agendar reservas nuevas, cancelar turnos y editar tu configuraci\xf3n — todo sin necesitar una computadora.

## A\xf1adir el panel a tu pantalla de inicio

Puedes dejar un \xedcono en tu pantalla como si fuera una app, para entrar con un solo toque.

### En iPhone (Safari)

1. Abre tu panel en Safari: **tu-dominio.com/panel**
2. Inicia sesi\xf3n con tu correo y contrase\xf1a
3. Toca el \xedcono de **Compartir** (el cuadrado con la flecha hacia arriba, en la barra de abajo)
4. Desliza hacia abajo y toca **A\xf1adir a pantalla de inicio**
5. Ponle un nombre como *"Mi Panel"* y toca **A\xf1adir**

### En Android (Chrome)

1. Abre tu panel en Chrome: **tu-dominio.com/panel**
2. Inicia sesi\xf3n
3. Toca el men\xfa (los tres puntitos arriba a la derecha)
4. Toca **A\xf1adir a pantalla de inicio** o **Instalar app**
5. Confirma con **A\xf1adir**

Listo. Ahora tienes el \xedcono en tu pantalla de inicio y al tocarlo entras directo al panel.

## Consejos para usar el panel en el celular

- **Men\xfa:** en el celular el men\xfa aparece como un \xedcono de tres l\xedneas. T\xf3calo para navegar entre Reservas, Clientes, Calendario, Servicios y Configuraci\xf3n.
- **Nueva reserva r\xe1pida:** desde Reservas hay un bot\xf3n directo a "Nueva reserva" para cuando una clienta te llama y quieres registrar la cita al momento.
- **Gira el tel\xe9fono si necesitas espacio:** algunos formularios se ven mejor en horizontal cuando hay que elegir una hora.

> **Consejo:** Deja el panel como la primera pantalla que abres en la ma\xf1ana. Un vistazo r\xe1pido y ya sabes c\xf3mo estar\xe1 tu d\xeda.`}];Object.fromEntries(h.map(a=>[a.slug,a]));let i=h[0].slug;var j=c(20833);let k={title:"Centro de Ayuda | Bookido",description:"Gu\xedas paso a paso para configurar y sacar el m\xe1ximo provecho de Bookido: servicios, reservas, WhatsApp, cancelaciones y m\xe1s."};async function l({searchParams:a}){let{g:b}=await a,c=h.find(a=>a.slug===b)?.slug??i;return(0,d.jsxs)("div",{className:"flex h-dvh flex-col overflow-hidden bg-ink-950",children:[(0,d.jsx)("div",{className:"pointer-events-none fixed inset-x-0 top-0 z-50 h-px bg-gradient-to-r from-transparent via-[#14F195]/30 to-transparent","aria-hidden":!0}),(0,d.jsx)("header",{className:"relative z-40 flex-shrink-0 border-b border-white/[0.07] bg-ink-950/80 backdrop-blur-md",children:(0,d.jsxs)("div",{className:"mx-auto flex max-w-screen-xl items-center justify-between px-5 py-4",children:[(0,d.jsxs)("div",{className:"flex items-center gap-3",children:[(0,d.jsx)(f(),{href:"/panel",className:"flex flex-col leading-none transition hover:opacity-80",children:(0,d.jsx)("span",{className:"font-future text-base font-semibold tracking-tight text-white",children:"Bookido"})}),(0,d.jsx)("span",{className:"text-zinc-700","aria-hidden":!0,children:"/"}),(0,d.jsx)("span",{className:"text-sm text-zinc-400",children:"Centro de ayuda"})]}),(0,d.jsxs)("nav",{className:"flex items-center gap-5 text-sm text-zinc-400",children:[(0,d.jsx)(f(),{href:"/reserva",className:"hidden transition hover:text-white sm:block",children:"Reservas"}),(0,d.jsx)(f(),{href:"/ayuda",className:"font-medium text-[#14F195]/90 transition hover:text-[#14F195]",children:"Gu\xedas"}),(0,d.jsx)(f(),{href:"/panel",className:"hidden transition hover:text-white md:block",children:"← Panel"})]})]})}),(0,d.jsx)("main",{className:"flex min-h-0 flex-1 overflow-hidden",children:(0,d.jsx)(g.Suspense,{fallback:(0,d.jsx)(m,{}),children:(0,d.jsx)(j.HelpCenter,{guides:h,initialSlug:c})})})]})}function m(){return(0,d.jsxs)("div",{className:"flex flex-1 animate-pulse overflow-hidden",children:[(0,d.jsx)("div",{className:"hidden w-72 border-r border-white/[0.07] bg-ink-900/60 lg:block"}),(0,d.jsxs)("div",{className:"flex-1 p-12 space-y-4",children:[(0,d.jsx)("div",{className:"h-8 w-64 rounded-lg bg-white/[0.06]"}),(0,d.jsx)("div",{className:"h-4 w-96 rounded-lg bg-white/[0.04]"}),(0,d.jsx)("div",{className:"mt-8 space-y-3",children:Array.from({length:6}).map((a,b)=>(0,d.jsx)("div",{className:"h-4 rounded-lg bg-white/[0.04]",style:{width:`${75-5*b}%`}},b))})]})]})}},26713:a=>{"use strict";a.exports=require("next/dist/shared/lib/router/utils/is-bot")},28354:a=>{"use strict";a.exports=require("util")},29294:a=>{"use strict";a.exports=require("next/dist/server/app-render/work-async-storage.external.js")},30758:(a,b,c)=>{Promise.resolve().then(c.t.bind(c,81170,23)),Promise.resolve().then(c.t.bind(c,23597,23)),Promise.resolve().then(c.t.bind(c,36893,23)),Promise.resolve().then(c.t.bind(c,89748,23)),Promise.resolve().then(c.t.bind(c,6060,23)),Promise.resolve().then(c.t.bind(c,7184,23)),Promise.resolve().then(c.t.bind(c,69576,23)),Promise.resolve().then(c.t.bind(c,73041,23)),Promise.resolve().then(c.t.bind(c,51384,23))},30787:(a,b,c)=>{"use strict";Object.defineProperty(b,"__esModule",{value:!0}),Object.defineProperty(b,"createDedupedByCallsiteServerErrorLoggerDev",{enumerable:!0,get:function(){return i}});let d=function(a,b){if(a&&a.__esModule)return a;if(null===a||"object"!=typeof a&&"function"!=typeof a)return{default:a};var c=e(b);if(c&&c.has(a))return c.get(a);var d={__proto__:null},f=Object.defineProperty&&Object.getOwnPropertyDescriptor;for(var g in a)if("default"!==g&&Object.prototype.hasOwnProperty.call(a,g)){var h=f?Object.getOwnPropertyDescriptor(a,g):null;h&&(h.get||h.set)?Object.defineProperty(d,g,h):d[g]=a[g]}return d.default=a,c&&c.set(a,d),d}(c(74515));function e(a){if("function"!=typeof WeakMap)return null;var b=new WeakMap,c=new WeakMap;return(e=function(a){return a?c:b})(a)}let f={current:null},g="function"==typeof d.cache?d.cache:a=>a,h=console.warn;function i(a){return function(...b){h(a(...b))}}g(a=>{try{h(f.current)}finally{f.current=null}})},33873:a=>{"use strict";a.exports=require("path")},41025:a=>{"use strict";a.exports=require("next/dist/server/app-render/dynamic-access-async-storage.external.js")},42378:(a,b,c)=>{"use strict";var d=c(91330);c.o(d,"usePathname")&&c.d(b,{usePathname:function(){return d.usePathname}}),c.o(d,"useRouter")&&c.d(b,{useRouter:function(){return d.useRouter}}),c.o(d,"useSearchParams")&&c.d(b,{useSearchParams:function(){return d.useSearchParams}})},50502:(a,b,c)=>{"use strict";c.d(b,{HelpCenter:()=>j});var d=c(21124),e=c(38301),f=c(42378);function g(a){return a.replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;")}function h(a){return g(a).replace(/`([^`]+)`/g,"<code>$1</code>").replace(/\*\*([^*]+)\*\*/g,"<strong>$1</strong>").replace(/\*([^*]+)\*/g,"<em>$1</em>")}let i=[{slug:"configurar-negocio",title:"C\xf3mo configurar tu negocio",description:"Ponle tu nombre, horario y n\xfamero de WhatsApp al panel.",icon:"⚙️",body:`## \xbfQu\xe9 es la Configuraci\xf3n?

En la secci\xf3n **Configuraci\xf3n** de tu panel puedes personalizar todo lo que tus clientes ven cuando entran a reservar: el nombre de tu negocio, tu n\xfamero de WhatsApp, tu horario de atenci\xf3n y una descripci\xf3n breve.

## C\xf3mo llegar ah\xed

1. Entra a tu panel en **/panel**
2. En el men\xfa del lado izquierdo (o en el men\xfa de hamburguesa si est\xe1s en el celular), toca **Configuraci\xf3n**
3. Ah\xed ver\xe1s todos los campos que puedes editar

## Qu\xe9 puedes cambiar

- **Nombre del negocio** — el nombre que aparece en la p\xe1gina p\xfablica de reservas
- **Descripci\xf3n** — una l\xednea breve sobre tu negocio (por ejemplo: *"Nail salon en Santo Domingo"*)
- **WhatsApp** — tu n\xfamero con c\xf3digo de pa\xeds, sin guiones ni espacios (ejemplo: *18096106459*)
- **Horario de apertura y cierre** — las horas en que aceptas reservas
- **Color principal** — el color de acento que aparece en los botones de tu p\xe1gina p\xfablica

## Guardar los cambios

Cuando termines de editar, toca el bot\xf3n **Guardar cambios**. Ver\xe1s un mensaje de confirmaci\xf3n y los cambios se aplican de inmediato.

## Tu enlace p\xfablico

En la misma p\xe1gina de Configuraci\xf3n encontrar\xe1s tu **enlace de reservas** — la direcci\xf3n que le das a tus clientes para que reserven en l\xednea. Puedes copiarlo con un solo toque y compartirlo por WhatsApp, Instagram o como quieras.

> **Consejo:** Pon tu enlace de reservas en la bio de Instagram para que tus seguidores puedan agendar sin escribirte primero.`},{slug:"agregar-servicios",title:"C\xf3mo agregar y editar servicios",description:"Agrega, edita y organiza los servicios que ofreces.",icon:"✂️",body:`## \xbfD\xf3nde est\xe1n los servicios?

Tus servicios aparecen en la p\xe1gina p\xfablica de reservas para que los clientes elijan cu\xe1l quieren. Puedes agregar, editar, desactivar o eliminar servicios directamente desde el panel.

## C\xf3mo agregar un servicio nuevo

1. En el men\xfa de tu panel, ve a **Servicios**
2. Toca el bot\xf3n **Agregar servicio**
3. Rellena el nombre del servicio (por ejemplo: *Manicura gel*)
4. Escribe la duraci\xf3n en minutos (por ejemplo: *60*)
5. Toca **Guardar** — el servicio aparece de inmediato en tu p\xe1gina de reservas

## C\xf3mo editar un servicio existente

1. En la lista de servicios, toca el nombre del servicio que quieres cambiar
2. Edita el nombre o la duraci\xf3n
3. Toca **Guardar**

## Ocultar un servicio sin borrarlo

Si no quieres ofrecer un servicio por un tiempo, puedes **desactivarlo** en lugar de borrarlo. El servicio desaparece de la p\xe1gina de reservas pero queda guardado para despu\xe9s.

Para desactivarlo, toca el interruptor que aparece al lado del servicio en la lista.

## Eliminar un servicio

Para borrar un servicio permanentemente, toca el bot\xf3n de eliminar (\xedcono de basura) al lado del servicio. Las reservas ya agendadas para ese servicio no se borran — quedan en tu historial.

## Ordenar los servicios

Los servicios aparecen en la p\xe1gina de reservas en el mismo orden en que los ves en tu panel. Puedes reorganizarlos arrastr\xe1ndolos de arriba a abajo.

> **Consejo:** Pon primero los servicios que m\xe1s vendes. La mayor\xeda de los clientes eligen el primero que ven en la lista.`},{slug:"ver-reservas",title:"C\xf3mo ver y gestionar tus reservas",description:"Consulta, filtra y actualiza el estado de todas tus reservas.",icon:"\uD83D\uDCC5",body:`## D\xf3nde ver tus reservas

En el men\xfa de tu panel, toca **Reservas**. Ah\xed ver\xe1s todas las reservas que tus clientes han agendado, ordenadas de la m\xe1s reciente a la m\xe1s pr\xf3xima.

## Informaci\xf3n de cada reserva

Cada reserva te muestra:

- **Nombre del cliente**
- **Servicio elegido**
- **D\xeda y hora**
- **Tel\xe9fono** del cliente (si lo dej\xf3)
- **Notas** que escribi\xf3 al reservar
- **Estado**: Confirmada, Completada, Cancelada o No se present\xf3

## Filtrar reservas

Usa los botones de filtro en la parte superior para ver solo las reservas que te interesan:

- **Todas** — muestra el historial completo
- **Confirmadas** — las que est\xe1n activas y pendientes
- **Completadas** — las que ya ocurrieron
- **No-show** — clientes que no se presentaron
- **Canceladas** — las que fueron canceladas

Tambi\xe9n puedes filtrar por per\xedodo: \xfaltimos **7, 30 o 90 d\xedas**.

## El men\xfa de acciones \xb7\xb7\xb7

Cada reserva tiene un bot\xf3n **\xb7\xb7\xb7** (tres puntos) en la parte derecha. Al tocarlo aparecen las opciones disponibles seg\xfan el estado de la reserva:

Si la reserva est\xe1 **Confirmada**:
- **✓ Completada** — marca la cita como realizada
- **👻 No se present\xf3** — registra que el cliente no vino
- **✕ Cancelar** — cancela la reserva

Si la reserva est\xe1 en cualquier otro estado:
- **↩ Restaurar** — la vuelve a Confirmada

## Agendar una reserva manual

Si una clienta te escribe por WhatsApp y quieres registrar su reserva t\xfa misma:

1. Toca el bot\xf3n **Nueva reserva** en la parte superior
2. Escribe el nombre y tel\xe9fono de la clienta
3. Elige el servicio, el d\xeda y la hora disponible
4. Toca **Confirmar** — queda registrada y el horario se bloquea

## Reenviar el email de confirmaci\xf3n

Cada reserva tiene un \xedcono de sobre ✉ que te permite reenviarle el email de confirmaci\xf3n al cliente con un solo toque.

> **Consejo:** Revisa tus reservas confirmadas cada ma\xf1ana. Si ves que alguien tiene cita en unas horas, puedes prepararle los materiales con tiempo.`},{slug:"calendario",title:"C\xf3mo usar el Calendario",description:"Ve todas tus reservas del mes en una vista de calendario.",icon:"\uD83D\uDDD3️",body:`## \xbfQu\xe9 es el Calendario?

El **Calendario** te da una vista mensual de todas tus reservas. En lugar de ver una lista, ves un cuadr\xedcula con los d\xedas del mes donde cada punto de color representa una reserva.

## C\xf3mo acceder

En el men\xfa de tu panel, toca **Calendario**.

## Leer el calendario

Cada d\xeda del mes puede mostrar:

- **Puntos de color** — cada punto es una reserva (verde = confirmada, azul = completada, \xe1mbar = no-show, gris = cancelada)
- **N\xfamero en verde** — cu\xe1ntas reservas confirmadas tiene ese d\xeda
- **D\xeda resaltado** — el d\xeda de hoy aparece destacado autom\xe1ticamente

## Ver el detalle de un d\xeda

Toca cualquier d\xeda del calendario y en el panel de la derecha (o abajo en el celular) ver\xe1s la lista completa de reservas de ese d\xeda con:

- Hora y duraci\xf3n de cada reserva
- Nombre del cliente y servicio
- Estado de la reserva
- Tel\xe9fono con enlace directo a WhatsApp

## Navegar entre meses

Usa las flechas **←** y **→** en la parte superior del calendario para ir al mes anterior o al siguiente. La p\xe1gina se actualiza con las reservas de ese mes.

> **Consejo:** Usa el calendario al inicio de cada semana para tener una foto clara de qu\xe9 tan ocupados estar\xe1s y si hay d\xedas con espacio para m\xe1s reservas.`},{slug:"clientes",title:"C\xf3mo ver el historial de tus clientes",description:"Conoce a tus mejores clientes y revisa su historial de visitas.",icon:"\uD83D\uDC65",body:`## \xbfQu\xe9 es la vista de Clientes?

La secci\xf3n **Clientes** agrupa autom\xe1ticamente todas las personas que han reservado contigo, mostrando cu\xe1ntas veces han venido y cu\xe1ndo fue su \xfaltima visita. No tienes que hacer nada extra — se construye solo con tus reservas existentes.

## C\xf3mo acceder

En el men\xfa de tu panel, toca **Clientes**.

## La lista de clientes

Ver\xe1s una tabla con todos tus clientes \xfanicos. Cada fila muestra:

- **Nombre y email** del cliente
- **Total de reservas** que ha hecho
- **Tag autom\xe1tico** seg\xfan su frecuencia:
  - **Nuevo** — menos de 4 reservas
  - **Regular** — 4 o m\xe1s reservas
  - **VIP ⭐** — 10 o m\xe1s reservas
- **\xdaltima visita** en tiempo relativo (ej: *hace 3 d\xedas*)
- **Tel\xe9fono** con enlace directo a WhatsApp

## Buscar un cliente

Usa el buscador en la parte superior para encontrar a alguien por nombre, email o tel\xe9fono.

## Ver el historial completo de un cliente

Toca el bot\xf3n **Ver historial →** en cualquier fila para abrir la p\xe1gina de detalle del cliente. Ah\xed ver\xe1s:

- Sus estad\xedsticas: total de reservas, completadas, confirmadas, canceladas y no-shows
- Fecha de primera y \xfaltima visita
- Historial completo de todas sus reservas con fecha, servicio y estado

## Contactar por WhatsApp

Tanto en la lista como en el detalle, si el cliente dej\xf3 su tel\xe9fono hay un bot\xf3n de **WhatsApp** para escribirle directamente.

> **Consejo:** Revisa tus clientes VIP de vez en cuando. Si alguno lleva tiempo sin venir, un mensaje de WhatsApp record\xe1ndole que tienes su servicio favorito puede traerlo de vuelta.`},{slug:"mensajes-whatsapp",title:"C\xf3mo usar el bot\xf3n de WhatsApp",description:"Tu n\xfamero ya est\xe1 conectado — as\xed funciona el bot\xf3n de reservas.",icon:"\uD83D\uDCAC",body:`## \xbfC\xf3mo funciona el bot\xf3n de WhatsApp?

En tu p\xe1gina p\xfablica de reservas hay un bot\xf3n que dice **Reservar por WhatsApp**. Cuando una clienta lo toca, WhatsApp se abre directamente con tu n\xfamero y un mensaje ya escrito. Ella solo tiene que tocar "Enviar".

Esto hace que sea muy f\xe1cil para las clientas contactarte, aunque no quieran usar el sistema de reservas en l\xednea.

## Cambiar tu n\xfamero de WhatsApp

Tu n\xfamero de WhatsApp se guarda en **Configuraci\xf3n**. Para cambiarlo:

1. Ve al men\xfa → **Configuraci\xf3n**
2. Edita el campo **WhatsApp**
3. Escribe tu n\xfamero con el c\xf3digo del pa\xeds al inicio, sin espacios ni guiones
   - Ejemplo para Rep\xfablica Dominicana: **18096106459** (el 1 es el c\xf3digo de RD)
4. Toca **Guardar cambios**

El bot\xf3n de WhatsApp en tu p\xe1gina p\xfablica se actualiza autom\xe1ticamente.

## Bot\xf3n de WhatsApp en cada reserva

En la lista de reservas, si una clienta dej\xf3 su n\xfamero ver\xe1s un bot\xf3n **WA** al lado de su reserva. Al tocarlo se abre WhatsApp con un mensaje pre-escrito que incluye su nombre y la hora de la cita — ideal para recordatorios r\xe1pidos.

## Verificar que funciona

Para probar que todo est\xe1 bien:

1. Abre tu enlace p\xfablico de reservas (lo encuentras en Configuraci\xf3n)
2. Toca el bot\xf3n **Reservar por WhatsApp**
3. Comprueba que se abre WhatsApp con tu n\xfamero correcto

Si el n\xfamero no es el correcto, vuelve a Configuraci\xf3n y corr\xedgelo.

> **Consejo:** Aseg\xfarate de que tu n\xfamero de WhatsApp tenga la cuenta activa y puedas recibir mensajes. Pru\xe9balo desde otro celular si tienes dudas.`},{slug:"cancelaciones-no-shows",title:"C\xf3mo manejar cancelaciones y no-shows",description:"Cancela reservas, registra ausencias y reduce los no-shows.",icon:"\uD83D\uDEAB",body:`## Cancelar una reserva

Cuando una clienta te avisa que no puede venir:

1. Ve al men\xfa → **Reservas**
2. Busca la reserva de esa clienta
3. Toca el bot\xf3n **\xb7\xb7\xb7** (tres puntos) en su reserva
4. Selecciona **✕ Cancelar**

El horario queda libre de inmediato y ese turno vuelve a estar disponible para otras reservas.

## Registrar un no-show

Cuando la clienta ten\xeda cita pero no apareci\xf3 y no avis\xf3:

1. Busca la reserva en la lista
2. Toca el bot\xf3n **\xb7\xb7\xb7**
3. Selecciona **👻 No se present\xf3**

La reserva queda marcada como no-show en tu historial. Esto te ayuda a llevar un registro de clientes que fallan con frecuencia y verlo en su perfil en la secci\xf3n **Clientes**.

## Marcar una reserva como completada

Cuando la cita ya ocurri\xf3 y todo fue bien:

1. Toca el bot\xf3n **\xb7\xb7\xb7** en la reserva
2. Selecciona **✓ Completada**

Las reservas completadas aparecen en el historial del cliente y en las estad\xedsticas de tu panel.

## Restaurar una reserva cancelada

Si cancelaste por error o la clienta cambi\xf3 de opini\xf3n:

1. Busca la reserva cancelada (filtra por "Canceladas" en la barra de filtros)
2. Toca **\xb7\xb7\xb7** → **↩ Restaurar**
3. La reserva vuelve a estar Confirmada y el horario queda bloqueado

## C\xf3mo reducir los no-shows

- **Recordatorio por WhatsApp:** el d\xeda anterior toca el bot\xf3n **WA** en la reserva para enviarle un mensaje r\xe1pido con su horario
- **Pide confirmaci\xf3n:** en el mensaje de recordatorio p\xeddele que te confirme si viene — as\xed sabes con tiempo si el turno quedar\xe1 libre
- **Revisa el historial:** en la secci\xf3n **Clientes** puedes ver cu\xe1ntos no-shows tiene cada persona antes de aceptarle una nueva reserva

> **Consejo:** Un recordatorio por WhatsApp la noche anterior reduce los no-shows a casi cero. La mayor\xeda de las clientas agradecen el mensaje y confirman.`},{slug:"usar-desde-celular",title:"C\xf3mo usar el panel desde el celular",description:"Instala Bookido en tu pantalla de inicio y gestiona todo desde el m\xf3vil.",icon:"\uD83D\uDCF1",body:`## El panel funciona en el celular

Bookido est\xe1 dise\xf1ado para usarse c\xf3modamente desde el tel\xe9fono. Puedes ver las reservas del d\xeda, agendar reservas nuevas, cancelar turnos y editar tu configuraci\xf3n — todo sin necesitar una computadora.

## A\xf1adir el panel a tu pantalla de inicio

Puedes dejar un \xedcono en tu pantalla como si fuera una app, para entrar con un solo toque.

### En iPhone (Safari)

1. Abre tu panel en Safari: **tu-dominio.com/panel**
2. Inicia sesi\xf3n con tu correo y contrase\xf1a
3. Toca el \xedcono de **Compartir** (el cuadrado con la flecha hacia arriba, en la barra de abajo)
4. Desliza hacia abajo y toca **A\xf1adir a pantalla de inicio**
5. Ponle un nombre como *"Mi Panel"* y toca **A\xf1adir**

### En Android (Chrome)

1. Abre tu panel en Chrome: **tu-dominio.com/panel**
2. Inicia sesi\xf3n
3. Toca el men\xfa (los tres puntitos arriba a la derecha)
4. Toca **A\xf1adir a pantalla de inicio** o **Instalar app**
5. Confirma con **A\xf1adir**

Listo. Ahora tienes el \xedcono en tu pantalla de inicio y al tocarlo entras directo al panel.

## Consejos para usar el panel en el celular

- **Men\xfa:** en el celular el men\xfa aparece como un \xedcono de tres l\xedneas. T\xf3calo para navegar entre Reservas, Clientes, Calendario, Servicios y Configuraci\xf3n.
- **Nueva reserva r\xe1pida:** desde Reservas hay un bot\xf3n directo a "Nueva reserva" para cuando una clienta te llama y quieres registrar la cita al momento.
- **Gira el tel\xe9fono si necesitas espacio:** algunos formularios se ven mejor en horizontal cuando hay que elegir una hora.

> **Consejo:** Deja el panel como la primera pantalla que abres en la ma\xf1ana. Un vistazo r\xe1pido y ya sabes c\xf3mo estar\xe1 tu d\xeda.`}];function j({guides:a,initialSlug:b}){let c=(0,f.useRouter)(),i=(0,f.useSearchParams)(),j=(0,e.useRef)(null),k=i.get("g")??b,l=a.find(a=>a.slug===k)??a[0],[m,n]=(0,e.useState)(i.get("g")?"content":"list"),o=(0,e.useCallback)(a=>{let b=new URLSearchParams(i.toString());b.set("g",a),c.push(`?${b.toString()}`,{scroll:!1}),n("content")},[c,i]),p=function(a){let b=a.split("\n"),c=[],d=null,e=!1,f="",i=[],j=()=>{d&&(c.push("ul"===d?"</ul>":"</ol>"),d=null)};for(let a of b){if(a.startsWith("```")){if(e){let a=f?` class="language-${f}"`:"";c.push(`<pre><code${a}>${g(i.join("\n"))}</code></pre>`),e=!1,f=""}else j(),e=!0,f=a.slice(3).trim(),i.length=0;continue}if(e){i.push(a);continue}if(a.startsWith("### ")){j(),c.push(`<h3>${h(a.slice(4))}</h3>`);continue}if(a.startsWith("## ")){j(),c.push(`<h2>${h(a.slice(3))}</h2>`);continue}if(a.startsWith("> ")){j(),c.push(`<blockquote>${h(a.slice(2))}</blockquote>`);continue}if(/^[-*] /.test(a)){"ol"===d&&j(),d||(c.push("<ul>"),d="ul"),c.push(`<li>${h(a.slice(2))}</li>`);continue}if(/^\d+\. /.test(a)){"ul"===d&&j(),d||(c.push("<ol>"),d="ol"),c.push(`<li>${h(a.replace(/^\d+\. /,""))}</li>`);continue}if(""===a.trim()){j();continue}j(),c.push(`<p>${h(a)}</p>`)}return j(),c.join("\n")}(l.body);return(0,d.jsxs)("div",{className:"flex min-h-0 flex-1 overflow-hidden",children:[(0,d.jsxs)("aside",{className:`
          flex-shrink-0 overflow-y-auto border-r border-white/[0.07]
          bg-ink-900/60 backdrop-blur-sm
          w-full lg:w-72 xl:w-80
          ${"content"===m?"hidden lg:flex lg:flex-col":"flex flex-col"}
        `,children:[(0,d.jsxs)("div",{className:"px-5 pb-3 pt-6",children:[(0,d.jsx)("p",{className:"text-[10px] font-medium uppercase tracking-[0.28em] text-[#14F195]/50",children:"Centro de ayuda"}),(0,d.jsx)("h2",{className:"mt-1 font-future text-lg font-semibold text-white",children:"Gu\xedas"})]}),(0,d.jsx)("nav",{className:"flex-1 px-3 pb-6",children:(0,d.jsx)("ul",{className:"space-y-0.5",children:a.map(a=>{let b=a.slug===l.slug;return(0,d.jsx)("li",{children:(0,d.jsxs)("button",{type:"button",onClick:()=>o(a.slug),className:`
                      group flex w-full items-start gap-3 rounded-xl px-3 py-3 text-left
                      transition-all duration-200
                      ${b?"bg-[#14F195]/[0.10] text-white ring-1 ring-[#14F195]/20":"text-zinc-400 hover:bg-white/[0.04] hover:text-zinc-200"}
                    `,children:[(0,d.jsx)("span",{className:`mt-0.5 flex-shrink-0 text-base leading-none transition-transform duration-200 ${b?"":"group-hover:scale-110"}`,"aria-hidden":!0,children:a.icon}),(0,d.jsxs)("div",{className:"min-w-0",children:[(0,d.jsx)("p",{className:`text-sm font-medium leading-snug ${b?"text-white":""}`,children:a.title}),(0,d.jsx)("p",{className:`mt-0.5 text-xs leading-snug ${b?"text-[#14F195]/50":"text-zinc-600"}`,children:a.description})]}),b&&(0,d.jsx)("span",{className:"ml-auto mt-1 flex-shrink-0 h-1.5 w-1.5 rounded-full bg-[#14F195] shadow-[0_0_6px_rgba(20,241,149,0.7)]"})]})},a.slug)})})}),(0,d.jsx)("div",{className:"border-t border-white/[0.06] px-5 py-4",children:(0,d.jsxs)("p",{className:"text-xs text-zinc-600",children:["\xbfNo encuentras lo que buscas?"," ",(0,d.jsx)("a",{href:"mailto:soporte@bookido.app",className:"text-[#14F195]/70 transition hover:text-[#14F195]",children:"Escr\xedbenos"})]})})]}),(0,d.jsxs)("div",{ref:j,className:`
          flex-1 overflow-y-auto
          ${"list"===m?"hidden lg:block":"block"}
        `,children:[(0,d.jsx)("div",{className:"lg:hidden border-b border-white/[0.07] bg-ink-900/40 px-5 py-3",children:(0,d.jsxs)("button",{type:"button",onClick:()=>n("list"),className:"flex items-center gap-1.5 text-sm text-zinc-400 transition hover:text-white",children:[(0,d.jsx)("svg",{className:"h-4 w-4",fill:"none",stroke:"currentColor",strokeWidth:2,viewBox:"0 0 24 24",children:(0,d.jsx)("path",{strokeLinecap:"round",strokeLinejoin:"round",d:"M15 19l-7-7 7-7"})}),"Todas las gu\xedas"]})}),(0,d.jsxs)("article",{className:"mx-auto max-w-3xl px-6 py-10 lg:px-12 lg:py-14",children:[(0,d.jsxs)("div",{className:"mb-10 border-b border-white/[0.08] pb-8",children:[(0,d.jsx)("span",{className:"text-3xl leading-none","aria-hidden":!0,children:l.icon}),(0,d.jsx)("h1",{className:"mt-4 font-future text-2xl font-semibold text-white md:text-3xl",children:l.title}),(0,d.jsx)("p",{className:"mt-2 text-base text-zinc-400",children:l.description})]}),(0,d.jsx)("div",{className:"help-prose",dangerouslySetInnerHTML:{__html:p}}),(0,d.jsx)("div",{className:"mt-14 flex flex-col gap-3 border-t border-white/[0.08] pt-8 sm:flex-row sm:justify-between",children:(()=>{let b=a.findIndex(a=>a.slug===l.slug),c=a[b-1],e=a[b+1];return(0,d.jsxs)(d.Fragment,{children:[(0,d.jsx)("div",{children:c&&(0,d.jsxs)("button",{type:"button",onClick:()=>o(c.slug),className:"group flex items-center gap-2 rounded-xl border border-white/10 bg-ink-900/40 px-4 py-3 text-left transition hover:border-[#14F195]/25 hover:bg-[#14F195]/[0.05]",children:[(0,d.jsx)("svg",{className:"h-4 w-4 flex-shrink-0 text-zinc-500 transition group-hover:text-[#14F195]",fill:"none",stroke:"currentColor",strokeWidth:2,viewBox:"0 0 24 24",children:(0,d.jsx)("path",{strokeLinecap:"round",strokeLinejoin:"round",d:"M15 19l-7-7 7-7"})}),(0,d.jsxs)("div",{children:[(0,d.jsx)("p",{className:"text-[10px] uppercase tracking-wider text-zinc-600",children:"Anterior"}),(0,d.jsx)("p",{className:"text-sm font-medium text-zinc-300 group-hover:text-white",children:c.title})]})]})}),(0,d.jsx)("div",{children:e&&(0,d.jsxs)("button",{type:"button",onClick:()=>o(e.slug),className:"group flex items-center gap-2 rounded-xl border border-white/10 bg-ink-900/40 px-4 py-3 text-right transition hover:border-[#14F195]/25 hover:bg-[#14F195]/[0.05]",children:[(0,d.jsxs)("div",{children:[(0,d.jsx)("p",{className:"text-[10px] uppercase tracking-wider text-zinc-600",children:"Siguiente"}),(0,d.jsx)("p",{className:"text-sm font-medium text-zinc-300 group-hover:text-white",children:e.title})]}),(0,d.jsx)("svg",{className:"h-4 w-4 flex-shrink-0 text-zinc-500 transition group-hover:text-[#14F195]",fill:"none",stroke:"currentColor",strokeWidth:2,viewBox:"0 0 24 24",children:(0,d.jsx)("path",{strokeLinecap:"round",strokeLinejoin:"round",d:"M9 5l7 7-7 7"})})]})})]})})()})]})]})]})}Object.fromEntries(i.map(a=>[a.slug,a])),i[0].slug},51472:(a,b,c)=>{"use strict";c.r(b),c.d(b,{default:()=>n,metadata:()=>m});var d=c(75338),e=c(94294),f=c.n(e),g=c(81464),h=c.n(g),i=c(4472),j=c.n(i),k=c(76952),l=c.n(k);c(61135);let m={title:"Bookido",description:"Gesti\xf3n de reservas online para negocios de belleza y servicios."};function n({children:a}){return(0,d.jsx)("html",{lang:"es",className:"scroll-smooth",children:(0,d.jsx)("body",{className:`${f().variable} ${h().variable} ${j().variable} ${l().variable} font-sans antialiased`,children:a})})}},61135:()=>{},63033:a=>{"use strict";a.exports=require("next/dist/server/app-render/work-unit-async-storage.external.js")},65169:(a,b,c)=>{let{createProxy:d}=c(39893);a.exports=d("C:\\Users\\debai\\bookido\\node_modules\\next\\dist\\client\\app-dir\\link.js")},70352:()=>{},86439:a=>{"use strict";a.exports=require("next/dist/shared/lib/no-fallback-error.external")},98854:(a,b,c)=>{Promise.resolve().then(c.t.bind(c,3991,23)),Promise.resolve().then(c.bind(c,50502))}};var b=require("../../webpack-runtime.js");b.C(a);var c=b.X(0,[1331,6473,3991],()=>b(b.s=20883));module.exports=c})();