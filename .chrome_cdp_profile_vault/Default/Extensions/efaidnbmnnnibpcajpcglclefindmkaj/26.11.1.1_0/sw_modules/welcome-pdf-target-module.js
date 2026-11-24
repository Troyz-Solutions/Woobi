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
import{removeExperimentCodeForAnalytics as e,setExperimentCodeForAnalytics as t}from"../common/experimentUtils.js";import{dcLocalStorage as r}from"../common/local-storage.js";import{target as n,getOfferData as o}from"./target.js";import{common as a}from"./common.js";import{floodgate as l}from"./floodgate.js";import{util as i}from"./util.js";const m=["en_US","en_GB"],s="welcomePdfCtaVariant",c="DCExt_Welcome_PDF_CTA_Test",u="WPC",f="WPCC";async function g(g){return i.isEdge()||!m.includes(chrome.i18n.getMessage("@@ui_locale"))?{variant:null}:(await l.getFeatureGroups(),g?.aborted?{variant:null}:a.isAdobeInternalUser()?(e(u),e(f),r.setItem(s,"challenger"),{variant:"challenger"}):async function(a){const l=await n.getTargetOffer([c]);if(a?.aborted)return{variant:null};const i=o(l,c);return!0===i?.enable?(e(f),t(u),r.setItem(s,"challenger"),{variant:"challenger"}):!1===i?.enable?(e(u),t(f),r.setItem(s,"control"),{variant:"control"}):(e(u),e(f),r.removeItem(s),{variant:null})}(g))}export{g as resolveWelcomePdfVariant};