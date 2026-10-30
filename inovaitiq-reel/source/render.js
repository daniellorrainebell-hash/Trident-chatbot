// usage: node render.js out_dir start_s end_s [step_frames] [times...]
const {chromium}=require('playwright');const fs=require('fs');const path=require('path');
(async()=>{
 const [out,a,b,step]=process.argv.slice(2); const extra=process.argv.slice(6).map(Number);
 fs.mkdirSync(out,{recursive:true});
 const counts={}; for(let c=0;c<7;c++){counts[c]=fs.readdirSync(`${process.env.FRAMEDIR||'frames'}/c${c}`).filter(f=>f.endsWith('.jpg')).length}
 const br=await chromium.launch({args:['--allow-file-access-from-files']});
 const SCALE=+(process.env.SCALE||1), DIR=process.env.FRAMEDIR||'frames';
 const p=await br.newPage({viewport:{width:1080,height:1920},deviceScaleFactor:SCALE});
 await p.goto('file://'+path.resolve('reel.html')); await p.evaluate(()=>document.fonts.ready);
 await p.evaluate(([c,d])=>{window.FRAMECOUNTS=c;window.FRAMEDIR=d},[counts,DIR]);
 const times=extra.length?extra:null;
 const list=times||[...Array(Math.round((b-a)*30)).keys()].filter(i=>i%(+step||1)===0).map(i=>+a+i/30);
 let n=0;
 for(const t of list){await p.evaluate(t=>window.render(t),t);
   const name=times?`t${t}.jpg`:String(Math.round(t*30)+1).padStart(5,'0')+'.jpg';
   await p.screenshot({path:path.join(out,name),type:'jpeg',quality:92}); if(++n%30===0)fs.appendFileSync(process.env.LOG||'/dev/null',`${new Date().toISOString()} ${out} t=${t.toFixed(2)} n=${n}\n`);}
 await br.close();})();
