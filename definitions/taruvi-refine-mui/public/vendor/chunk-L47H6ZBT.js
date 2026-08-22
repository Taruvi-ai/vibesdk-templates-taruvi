import{b as y}from"./chunk-FSRPMVAS.js";var P=y(e=>{"use strict";var R=Symbol.for("react.transitional.element"),C=Symbol.for("react.portal"),f=Symbol.for("react.fragment"),i=Symbol.for("react.strict_mode"),u=Symbol.for("react.profiler"),a=Symbol.for("react.consumer"),E=Symbol.for("react.context"),c=Symbol.for("react.forward_ref"),l=Symbol.for("react.suspense"),T=Symbol.for("react.suspense_list"),_=Symbol.for("react.memo"),m=Symbol.for("react.lazy"),d=Symbol.for("react.view_transition"),Y=Symbol.for("react.client.reference");function o(r){if(typeof r=="object"&&r!==null){var n=r.$$typeof;switch(n){case R:switch(r=r.type,r){case f:case u:case i:case l:case T:case d:return r;default:switch(r=r&&r.$$typeof,r){case E:case c:case m:case _:return r;case a:return r;default:return n}}case C:return n}}}e.ContextConsumer=a;e.ContextProvider=E;e.Element=R;e.ForwardRef=c;e.Fragment=f;e.Lazy=m;e.Memo=_;e.Portal=C;e.Profiler=u;e.StrictMode=i;e.Suspense=l;e.SuspenseList=T;e.isContextConsumer=function(r){return o(r)===a};e.isContextProvider=function(r){return o(r)===E};e.isElement=function(r){return typeof r=="object"&&r!==null&&r.$$typeof===R};e.isForwardRef=function(r){return o(r)===c};e.isFragment=function(r){return o(r)===f};e.isLazy=function(r){return o(r)===m};e.isMemo=function(r){return o(r)===_};e.isPortal=function(r){return o(r)===C};e.isProfiler=function(r){return o(r)===u};e.isStrictMode=function(r){return o(r)===i};e.isSuspense=function(r){return o(r)===l};e.isSuspenseList=function(r){return o(r)===T};e.isValidElementType=function(r){return typeof r=="string"||typeof r=="function"||r===f||r===u||r===i||r===l||r===T||typeof r=="object"&&r!==null&&(r.$$typeof===m||r.$$typeof===_||r.$$typeof===E||r.$$typeof===a||r.$$typeof===c||r.$$typeof===Y||r.getModuleId!==void 0)};e.typeOf=o});var $=y((M,A)=>{"use strict";A.exports=P()});function p(r){var n,s,t="";if(typeof r=="string"||typeof r=="number")t+=r;else if(typeof r=="object")if(Array.isArray(r)){var S=r.length;for(n=0;n<S;n++)r[n]&&(s=p(r[n]))&&(t&&(t+=" "),t+=s)}else for(s in r)r[s]&&(t&&(t+=" "),t+=s);return t}function N(){for(var r,n,s=0,t="",S=arguments.length;s<S;s++)(r=arguments[s])&&(n=p(r))&&(t&&(t+=" "),t+=n);return t}var O=N;export{$ as a,N as b,O as c};
/*! Bundled license information:

react-is/cjs/react-is.production.js:
  (**
   * @license React
   * react-is.production.js
   *
   * Copyright (c) Meta Platforms, Inc. and affiliates.
   *
   * This source code is licensed under the MIT license found in the
   * LICENSE file in the root directory of this source tree.
   *)
*/
