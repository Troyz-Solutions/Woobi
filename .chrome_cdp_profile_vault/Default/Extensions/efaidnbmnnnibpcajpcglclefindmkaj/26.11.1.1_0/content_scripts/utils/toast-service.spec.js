/*************************************************************************
* ADOBE CONFIDENTIAL
* ___________________
*
*  Copyright 2015 Adobe Systems Incorporated
*  All Rights Reserved.
*
* NOTICE:  All information contained herein is, and remains
* the property of Adobe Systems Incorporated and its suppliers,
* if any.  The intellectual and technical concepts contained
* herein are proprietary to Adobe Systems Incorporated and its
* suppliers and are protected by all applicable intellectual property laws,
* including trade secret and or copyright laws.
* Dissemination of this information or reproduction of this material
* is strictly forbidden unless prior written permission is obtained
* from Adobe Systems Incorporated.
**************************************************************************/
jest.mock("./util.js",()=>({sendAnalytics:jest.fn(),sendErrorLog:jest.fn(),getElementFromParent:(t,o)=>o?.getElementsByClassName(t[0])?.[0]??null}));const{showToast:showToast}=require("./toast-service.js"),{sendAnalytics:sendAnalytics}=require("./util.js");describe("toast service",()=>{let t,o;beforeEach(()=>{document.body.innerHTML="",sendAnalytics.mockClear(),t=[],o=global.fetch,global.fetch=jest.fn(()=>new Promise(o=>t.push(o)))}),afterEach(()=>{global.fetch=o}),it.each([void 0,"campus.instructure.com"])("preserves domain %s on every toast event",async o=>{const e=showToast("canvas","Couldn't create quiz",{variant:"error",analyticsDomain:o,actionButton:{text:"Retry"}});t[0]({text:async()=>"<div class='acrobat-toast'><button class='acrobat-toast-action-button'></button><button class='acrobat-toast-close'></button></div>"}),await e;const s=document.querySelector(".acrobat-toast-action-button"),a=document.querySelector(".acrobat-toast-close");s.click(),a.click();const n={source:"canvas",...o&&{domain:o}};expect(sendAnalytics.mock.calls).toEqual([[[["DCBrowserExt:ErrorToast:Shown",n]]],[[["DCBrowserExt:ErrorToast:Action",n]]],[[["DCBrowserExt:ErrorToast:Dismissed",n]]]])}),it("shows only the newest toast when concurrent toast requests complete out of order",async()=>{const o=showToast("gmail","Converting to PDF"),e=showToast("gmail","Conversion failed",{variant:"error"}),s={text:async()=>'<div class="acrobat-toast"><div class="acrobat-toast-message"></div></div>'};t[1](s),await e,t[0](s),await o;const a=document.querySelectorAll("#acrobat-toast-container");expect(a).toHaveLength(1),expect(a[0].textContent).toContain("Conversion failed"),expect(a[0].classList.contains("acrobat-toast-error")).toBe(!0)})});