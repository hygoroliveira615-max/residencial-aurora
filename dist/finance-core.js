(function(root){
'use strict';
const round=n=>Math.round((n+Number.EPSILON)*100)/100||0;
function number(v,min,max,name){if(!Number.isFinite(v)||v<min||v>max)throw Error(`${name}: informe um valor entre ${min} e ${max}.`);return v;}
function band(income){return income<=3200?1:income<=5000?2:income<=9600?3:income<=13000?4:0;}
function rate(income,cotista){const v=income<=2160?4.25:income<=2850?4.5:income<=3200?4.75:income<=3500?5:income<=4000?5.5:income<=5000?6.5:7.66;return round(v+(cotista?0:.5));}
function financing(p){
 for(const [k,min,max] of [['price',1,1e8],['income',1,1e6],['debts',0,1e6],['costs',0,1e5],['age',18,80.5],['months',1,420],['quota',1,90],['fgts',0,1e8],['subsidy',0,55000]])number(p[k],min,max,k);
 if(!Number.isInteger(p.months))throw Error('O prazo precisa ser um número inteiro de meses.');
 if(!['SAC','PRICE'].includes(p.system)||!['faixa','classe'].includes(p.product))throw Error('Escolha uma linha e um sistema válidos.');
 const faixa=band(p.income),ceiling=p.product==='classe'?600000:faixa<=2&&faixa>0?275000:faixa===3?400000:faixa===4?600000:0;
 const classe=p.product==='classe'||faixa===4,annual=classe?10:rate(p.income,p.cotista),warnings=[],errors=[];
 if(!faixa)errors.push('Renda acima de R$ 13.000: fora do limite de renda do MCMV nesta simulação.');
 if(p.price>ceiling)errors.push(`O preço supera o teto de R$ ${ceiling.toLocaleString('pt-BR')} desta linha. ${!classe&&p.price<=600000?'A linha Classe Média pode ser simulada separadamente, sem subsídio.':''}`);
 if(p.hasProperty)errors.push('Há imóvel ou financiamento habitacional declarado. O enquadramento precisa ser analisado pelo banco; esta simulação MCMV não será emitida.');
 if(p.subsidy>0&&(classe||p.income>5000))errors.push('Subsídio não se aplica à linha ou faixa selecionada. Zere esse valor.');
 if(p.fgts+p.subsidy>p.price)errors.push('FGTS e subsídio não podem superar o valor do imóvel.');
 const quotaLimit=classe?(p.system==='SAC'?90:80):80;if(p.quota>quotaLimit)errors.push(`Use uma cota de até ${quotaLimit}% neste cenário.`);
 const months=Math.min(p.months,Math.max(0,Math.floor((80.5-p.age)*12+1e-7)));if(!months)errors.push('A idade no início do financiamento não deixa prazo disponível até 80 anos e 6 meses.');
 if(months<p.months&&months>0)warnings.push(`Prazo ajustado para ${months} meses pela idade informada no início do financiamento.`);
 const budget=Math.max(0,p.income*.3-p.debts),available=Math.max(0,budget-p.costs);
 if(available<=0)errors.push('Sem margem mensal para financiamento após os compromissos e a reserva de seguros/tarifas.');
 if(errors.length)return {valid:false,errors,warnings,faixa,classe,ceiling,annual,months,budget};
 const i=annual/1200,factor=p.system==='SAC'?1/months+i:i/(1-Math.pow(1+i,-months));
 const maxIncome=available/factor,principal=Math.floor(Math.max(0,Math.min(maxIncome,p.price*p.quota/100,p.price-p.fgts-p.subsidy))*100)/100;
 if(principal<=0)return {valid:false,errors:['Não há saldo a financiar com os recursos informados. Use o planejamento manual da entrada, se necessário.'],warnings,faixa,classe,ceiling,annual,months,budget};
 const rows=[];let balance=principal,amort=principal/months,fixed=principal*factor;
 for(let m=1;m<=months;m++){const interest=balance*i,a=m===months?balance:p.system==='SAC'?amort:fixed-interest;balance=Math.max(0,balance-a);rows.push({month:m,principal:round(a),interest:round(interest),payment:round(a+interest+p.costs),balance:round(balance)});}
 return {valid:true,errors:[],warnings,faixa,classe,ceiling,annual,months,budget:round(budget),principal,cash:round(p.price-principal-p.fgts-p.subsidy),first:rows[0].payment,last:rows.at(-1).payment,rows,total:round(rows.reduce((s,r)=>s+r.payment,0))};
}
function monthIndex(s){if(!/^\d{4}-\d{2}$/.test(s))throw Error('Preencha as datas do planejamento.');let [y,m]=s.split('-').map(Number);if(y<2020||y>2100||m<1||m>12)throw Error('Data fora do intervalo permitido.');return y*12+m-1;}
function monthString(i){return `${Math.floor(i/12)}-${String(i%12+1).padStart(2,'0')}`;}
function planning(p){
 for(const k of ['target','signal','monthly','keys','capacity'])number(p[k],0,1e8,k);number(p.correction,0,30,'Correção anual');
 let contract=monthIndex(p.contract),start=monthIndex(p.start),end=monthIndex(p.end);if(start<contract||end<start)throw Error('A primeira mensal deve ser no mês da contratação ou depois; as chaves devem ser no mês da primeira mensal ou depois.');
 if(end-contract>120)throw Error('O planejamento aceita até 120 meses entre contratação e chaves.');
 const rows=Array.from({length:end-contract+1},(_,i)=>({date:monthString(contract+i),signal:i===0?p.signal:0,monthly:contract+i>=start?p.monthly:0,extras:0,keys:contract+i===end?p.keys:0}));
 for(const extra of p.extras){number(extra.amount,0,1e8,'Pagamento extra');const begin=monthIndex(extra.date),every=Number(extra.every);if(![0,6,12].includes(every))throw Error('Periodicidade inválida.');if(begin<contract||begin>end)throw Error('Pagamento extra fora do período da contratação até as chaves.');for(let m=begin;m<=end;m+=every||121){rows[m-contract].extras+=extra.amount;if(!every)break;}}
 if(p.autoMonthly){const count=end-start+1,other=rows.reduce((sum,r)=>sum+Math.round((r.signal+r.extras+r.keys)*100),0),remaining=Math.max(0,Math.round(p.target*100)-other),cents=Math.floor(remaining/count);for(let i=start-contract;i<rows.length;i++)rows[i].monthly=cents/100;rows.at(-1).monthly=round(rows.at(-1).monthly+(remaining-cents*count)/100);}
 let total=0,baseTotal=0;for(let i=0;i<rows.length;i++){const r=rows[i],factor=Math.pow(1+p.correction/100,i/12);r.base=round(r.signal+r.monthly+r.extras+r.keys);r.total=round(r.base*factor);r.correction=round(r.total-r.base);r.over=r.total>p.capacity+.005;r.cumulative=round(total+=r.total);baseTotal+=r.base;}
 // Coverage is calculated in contract-month reais; correction applies equally to target and installments.
 const gap=round(p.target-baseTotal),count=end-start+1,extraNeeded=Math.max(0,gap)/count;
 return {rows,count,monthly:rows[start-contract].monthly,lastMonthly:rows.at(-1).monthly,baseTotal:round(baseTotal),total:round(total),gap,monthlySuggestion:round(p.monthly+extraNeeded),over:rows.filter(r=>r.over).length,correction:round(total-baseTotal)};
}

// Independent implementation of the public quick-calculator model observed 2026-10-06.
// Source: simuladorhabitacao.caixa.gov.br/calculadora, public assets main.c5c18bbf9130785e.js and 237.a68d02937ce3c97f.js.
const quickBands=[[2160,210000,.048548],[2850,210000,.051162],[3200,210000,.053782],[3500,210000,.056408],[4000,210000,.061678],[5000,210000,.07229],[9600,400000,.084722],[13000,600000,.1047],[77500,2250000,.1149],[Infinity,Infinity,.134]];
function quickFinancing(p){
 number(p.price,100,1e8,'Preço');number(p.income,100,1e6,'Renda');
 const date=p.asOf||new Intl.DateTimeFormat('sv-SE',{timeZone:'America/Sao_Paulo'}).format(new Date());
 function parts(s){if(!/^\d{4}-\d{2}-\d{2}$/.test(s))throw Error('Informe uma data de nascimento válida.');const a=s.split('-').map(Number),d=new Date(Date.UTC(a[0],a[1]-1,a[2]));if(d.getUTCFullYear()!==a[0]||d.getUTCMonth()!==a[1]-1||d.getUTCDate()!==a[2])throw Error('Data inválida.');return a;}
 const [y,m,d]=parts(date),[by,bm,bd]=parts(p.birth),ageMonths=(y-by)*12+m-bm-(d<bd?1:0),age=Math.floor(ageMonths/12);
 if(age<18||ageMonths>=966)throw Error('Informe uma idade entre 18 anos e menos de 80 anos e 6 meses.');
 const months=Math.min(420,966-ageMonths),incomeBand=quickBands.findIndex(b=>p.income<=b[0]),priceBand=quickBands.findIndex(b=>p.price<=b[1]),index=Math.max(incomeBand,priceBand),effective=quickBands[index][2],i=Math.pow(1+effective,1/12)-1,system=effective>=.1092?'SAC':'PRICE';
 const mipPercent=age<=25?.0093:age<=30?.0096:age<=35?.0116:age<=40?.0154:age<=45?.0252:age<=50?.0386:age<=55?.0676:age<=60?.1533:age<=65?.2731:age<=70?.3259:age<=75?.4894:.5312;
 const factor=system==='SAC'?1/months+i:i/(1-Math.pow(1+i,-months)),budget=p.income*.3;
 // The public quick calculator reduces a reference property value along with the loan;
 // its DFI uses this reduced reference, not the originally entered property price.
 const evaluate=reference=>{const principal=reference*.8,mip=principal*mipPercent/100,dfi=reference*.0066/100,costs=25+mip+dfi;return {principal,mip,dfi,costs,first:principal*factor+costs,reference};};
 let result=evaluate(p.price);
 if(result.first>budget){let low=0,high=p.price,best=0;for(let n=0;n<30;n++){const mid=(low+high)/2;if(evaluate(mid).first<=budget){best=mid;low=mid;}else high=mid;}result=evaluate(best);}
 if(result.principal<=0)return {valid:false,errors:['Renda sem margem para financiamento neste modelo.'],warnings:[]};
 let balance=result.principal;const rows=[];for(let n=1;n<=months;n++){const interest=balance*i,amort=n===months?balance:system==='SAC'?result.principal/months:result.principal*factor-interest;balance=Math.max(0,balance-amort);rows.push({month:n,principal:round(amort),interest:round(interest),payment:round(amort+interest+result.costs),balance:round(balance)});}
 return {valid:true,quick:true,errors:[],warnings:[],classe:index===7,faixa:index<=2?1:index<=5?2:index===6?3:4,label:index>=8?'CRÉDITO HABITACIONAL · ESTIMATIVA':'MCMV · SIMULAÇÃO RÁPIDA',price:p.price,system,months,annual:round(effective*100),effective,age,principal:round(result.principal),cash:round(p.price-result.principal),first:rows[0].payment,last:rows.at(-1).payment,rows,total:round(rows.reduce((a,r)=>a+r.payment,0)),costs:round(result.costs),tac:25,mip:round(result.mip),dfi:round(result.dfi),reference:round(result.reference),expenses:round(p.price*.05),budget:round(budget)};
}


function ageAt(birth,at){const b=new Date(birth+'T00:00:00Z'),d=new Date(at+'T00:00:00Z');if(!Number.isFinite(+b)||!Number.isFinite(+d)||b.toISOString().slice(0,10)!==birth)throw Error('Data de nascimento inválida.');const m=(d.getUTCFullYear()-b.getUTCFullYear())*12+d.getUTCMonth()-b.getUTCMonth()-(d.getUTCDate()<b.getUTCDate()?1:0);return m/12;}
function subsidyEstimate(p){
 if(!Number.isFinite(p.income)||p.income<=0||!Number.isFinite(p.price)||p.price<=0)return {value:0,reason:'Preencha renda e preço.'};
 if(p.price>275000||p.classe||p.hasProperty)return {value:0,reason:'Sem subsídio estimado: imóvel/linha fora do cenário de habitação popular adotado.'};
 if(p.income>4000)return {value:0,reason:'Estimativa automática indisponível acima de R$ 4.000 nesta referência normativa; informe o valor validado pelo banco.'};
 const r=Math.min(3700,Math.max(1750,p.income)),b=2*(1900-50000)/1950,a=-b/(2*1950),fr=a*(r-1750)**2+b*(r-1750)+50000,j=rate(p.income,p.cotista)/1200;
 const demand=.25*p.income*(1-Math.pow(1+j,-420))/j,vvi=Math.min(p.price,275000*.675),fd=Math.max(-10,Math.min(10,30-40*demand/vvi)),fu=Math.max(0,Math.min(10,10*((p.area||43)-39)/20));
 let value=Math.min(55000,fr*(1+(2.07+fd+fu)/100)*1.2);if(value<1500)value=0;if(p.single)value*=.3;
 return {value:round(Math.min(p.price,value)),reason:'Aproximação para apartamento em construção em São Paulo, com área coberta de 43 m²; depende de enquadramento e validação do banco.'};
}
const api={financing,quickFinancing,subsidyEstimate,ageAt,planning,band,rate,monthIndex,monthString};if(typeof module!=='undefined'&&module.exports)module.exports=api;else root.AuroraFinance=api;
})(typeof window==='undefined'?globalThis:window);


