const http = require('node:http');
const fs = require('node:fs');
const path = require('node:path');
const allowed = new Set(['index.html','life.js','life.css','experience.js','experience.css','assets/cover-landscape.png','assets/memory-scenes.png']);
const mime = {'.html':'text/html; charset=utf-8','.js':'text/javascript; charset=utf-8','.css':'text/css; charset=utf-8','.png':'image/png'};
const port=Number(process.env.PORT || 4186);
const host=process.env.HOST || '127.0.0.1';
http.createServer((req,res)=>{
  const url=new URL(req.url,'http://localhost');
  const name=url.pathname==='/'?'index.html':url.pathname.slice(1);
  if(!allowed.has(name)){res.writeHead(404);res.end('Not found');return;}
  fs.readFile(path.join(__dirname,name),(error,bytes)=>{if(error){res.writeHead(404);res.end();return;}res.writeHead(200,{'Content-Type':mime[path.extname(name)],'Cache-Control':'no-cache'});res.end(bytes);});
}).listen(port,host,()=>console.log(`Life Plus One: http://${host}:${port}`));
