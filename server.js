// Quick Bites Cafe - zero-dependency server. Run: node server.js
const http=require('http'),fs=require('fs'),path=require('path'),crypto=require('crypto');
const cfg=JSON.parse(fs.readFileSync(path.join(__dirname,'config.json')));
const menu=JSON.parse(fs.readFileSync(path.join(__dirname,'menu.json')));
const price={};for(const c in menu)menu[c].forEach(([n,p])=>price[n]=p);
const DB=path.join(__dirname,'orders.json');
let orders=[];try{orders=JSON.parse(fs.readFileSync(DB))}catch(e){}
const save=()=>fs.writeFileSync(DB,JSON.stringify(orders));
const PUB=path.join(__dirname,'public'),MIME={'.html':'text/html','.js':'text/javascript','.css':'text/css'};
const send=(r,c,o)=>{r.writeHead(c,{'Content-Type':'application/json'});r.end(JSON.stringify(o))};
const staff=q=>q.headers['x-pin']===String(cfg.staffPin);
const body=q=>new Promise(res=>{let b='';q.on('data',d=>{b+=d;if(b.length>1e5)q.destroy()});q.on('end',()=>{try{res(JSON.parse(b))}catch(e){res({})}})});
const clean=s=>String(s||'').replace(/[<>]/g,'').trim().slice(0,200);
const pub=o=>({id:o.id,table:o.table,name:o.name,items:o.items,total:o.total,status:o.status,fb:o.fb});
http.createServer(async(q,r)=>{
 const u=new URL(q.url,'http://x'),p=u.pathname;
 try{
 if(p==='/api/config')return send(r,200,{cafeName:cfg.cafeName,upiId:cfg.upiId,countryCode:cfg.countryCode,tables:cfg.tables,menu});
 if(p==='/api/orders'&&q.method==='POST'){
  const b=await body(q),name=clean(b.name),phone=String(b.phone||'').replace(/\D/g,'').slice(-10),table=clean(b.table);
  if(!name||phone.length!==10||!table||!Array.isArray(b.items))return send(r,400,{error:'Invalid details'});
  const items=[];for(const i of b.items){const pr=price[i.n],qn=parseInt(i.q);if(pr&&qn>0&&qn<=50)items.push({n:i.n,p:pr,q:qn})}
  if(!items.length)return send(r,400,{error:'Empty order'});
  const o={id:crypto.randomBytes(8).toString('hex'),table,name,phone,items,total:items.reduce((a,i)=>a+i.p*i.q,0),status:'new',ts:Date.now()};
  orders.push(o);save();return send(r,200,pub(o));}
 if(p==='/api/orders'&&q.method==='GET'){if(!staff(q))return send(r,401,{error:'PIN'});return send(r,200,orders.slice().reverse().slice(0,200));}
 let m=p.match(/^\/api\/orders\/(\w+)(\/(status|feedback))?$/);
 if(m){const o=orders.find(x=>x.id===m[1]);if(!o)return send(r,404,{error:'Not found'});
  if(!m[3]&&q.method==='GET')return send(r,200,pub(o));
  if(m[3]==='feedback'&&q.method==='POST'){const b=await body(q);o.fb={r:Math.min(5,Math.max(1,parseInt(b.r)||5)),t:clean(b.t)};save();return send(r,200,pub(o));}
  if(m[3]==='status'&&q.method==='POST'){if(!staff(q))return send(r,401,{error:'PIN'});const b=await body(q);
   if(!['new','accepted','served','paid'].includes(b.status))return send(r,400,{error:'bad'});o.status=b.status;save();return send(r,200,o);}
 }
 if(p==='/api/ping')return send(r,200,{ok:staff(q)});
 let f=path.join(PUB,p==='/'?'index.html':p);if(!f.startsWith(PUB)||!fs.existsSync(f))f=path.join(PUB,'index.html');
 r.writeHead(200,{'Content-Type':MIME[path.extname(f)]||'text/plain'});fs.createReadStream(f).pipe(r);
 }catch(e){send(r,500,{error:'Server error'})}
}).listen(process.env.PORT||cfg.port,()=>console.log('Quick Bites running on port '+(process.env.PORT||cfg.port)));
