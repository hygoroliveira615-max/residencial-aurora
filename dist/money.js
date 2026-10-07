(()=>{
const parse=v=>{const s=String(v).replace(/R\$/g,'').replace(/\s/g,'').replace(/\./g,'').replace(',','.');return s!==''&&/^-?\d+(\.\d{0,2})?$/.test(s)?Number(s):NaN;};
const format=v=>Number(v).toLocaleString('pt-BR',{style:'currency',currency:'BRL'});
const validate=el=>{const v=parse(el.value),min=Number(el.dataset.min||0),max=Number(el.dataset.max||1e8);el.setCustomValidity(Number.isFinite(v)&&v>=min&&v<=max?'':'Informe um valor em reais entre '+format(min)+' e '+format(max)+'.');};
const refresh=()=>document.querySelectorAll('[data-money]').forEach(el=>{if(document.activeElement===el)return;const v=/^\d+(\.\d+)?$/.test(el.value)&&!el.value.includes('R$')?Number(el.value):parse(el.value);if(Number.isFinite(v))el.value=format(v);validate(el);});
document.addEventListener('input',e=>{if(e.target.matches('[data-money]'))validate(e.target);},true);
document.addEventListener('focusout',e=>{if(e.target.matches('[data-money]')){const v=parse(e.target.value);if(Number.isFinite(v))e.target.value=format(v);validate(e.target);}},true);
window.AuroraMoney={parse,format,refresh};})();