// Dependency-free local server. Run `npm start`, then open http://localhost:3000.
import http from 'node:http';
import { readFile,stat } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
const root=fileURLToPath(new URL('./dist/',import.meta.url));
const types={'.html':'text/html; charset=utf-8','.js':'text/javascript; charset=utf-8','.css':'text/css; charset=utf-8','.svg':'image/svg+xml','.zip':'application/zip','.md':'text/markdown; charset=utf-8'};
const port=Number(process.env.PORT)||3000;
http.createServer(async(req,res)=>{
  try{
    let name;try{name=decodeURIComponent(new URL(req.url,'http://localhost').pathname);}catch{res.writeHead(400);res.end('Bad request');return;}
    const file=path.resolve(root,'.'+name+(name.endsWith('/')?'index.html':''));
    if(!file.startsWith(root)){res.writeHead(403);res.end('Forbidden');return;}
    const info=await stat(file);if(!info.isFile())throw new Error('Not a file');
    res.writeHead(200,{'Content-Type':types[path.extname(file)]||'application/octet-stream','X-Content-Type-Options':'nosniff'});
    if(req.method==='HEAD')res.end();else res.end(await readFile(file));
  }catch{res.writeHead(404,{'Content-Type':'text/plain'});res.end('Not found');}
}).listen(port,'127.0.0.1',()=>console.log(`AFTERLIGHT is ready at http://localhost:${port}`));
