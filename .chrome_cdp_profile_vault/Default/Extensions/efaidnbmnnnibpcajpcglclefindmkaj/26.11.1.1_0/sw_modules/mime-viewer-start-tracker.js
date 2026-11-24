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
export const MIME_VIEWER_START_TIMEOUT_MS=5e3;const e=new Map;export function clearMimeViewerStartTracking(t){clearTimeout(e.get(t)),e.delete(t)}export function trackMimeViewerStart(t,r){clearMimeViewerStartTracking(t),e.set(t,setTimeout(()=>{e.delete(t),r()},5e3))}