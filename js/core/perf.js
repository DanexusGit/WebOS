'use strict';
/* PERF: low-end detection and a one-time move to lighter defaults (smaller blur). Must load last. */
const LOWEND=OS.mobile||(navigator.hardwareConcurrency||4)<=4||(navigator.deviceMemory||8)<=4;
document.documentElement.classList.toggle('lowend',LOWEND);
Object.assign(PREF_DEF,{blur:LOWEND?4:8});
const _pf=OS.applyPrefs;OS.applyPrefs=()=>{const P=OS.prefs;if(!P.v2){P.v2=1;P.blur=Math.min(P.blur,LOWEND?4:8)}_pf()};
