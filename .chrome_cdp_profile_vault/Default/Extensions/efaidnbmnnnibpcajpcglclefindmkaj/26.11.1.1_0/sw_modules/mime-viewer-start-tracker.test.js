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
import{trackMimeViewerStart as e,clearMimeViewerStartTracking as t,MIME_VIEWER_START_TIMEOUT_MS as s}from"./mime-viewer-start-tracker.js";describe("MIME viewer start tracker",()=>{beforeEach(()=>jest.useFakeTimers()),afterEach(()=>jest.useRealTimers()),it("fires once if the viewer never starts",()=>{const t=jest.fn();e(1,t),jest.advanceTimersByTime(s),jest.advanceTimersByTime(s),expect(t).toHaveBeenCalledTimes(1)}),it("does not fire and leaves no timer once the viewer starts",()=>{const a=jest.fn();e(1,a),t(1),expect(jest.getTimerCount()).toBe(0),jest.advanceTimersByTime(s),expect(a).not.toHaveBeenCalled()}),it("replaces earlier tracking when the same tab opens another PDF",()=>{const t=jest.fn(),a=jest.fn();e(1,t),e(1,a),expect(jest.getTimerCount()).toBe(1),jest.advanceTimersByTime(s),expect(t).not.toHaveBeenCalled(),expect(a).toHaveBeenCalledTimes(1)})});