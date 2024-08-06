const http = require("http");
function bodyPart(req){
    req.files = {};
    req.body = {};
    req.params = {};
    if(req.method == "POST"){
    var err = false,totalFile = -1;
    let bufferData = Buffer.alloc(0);
    req.on("data",(ch)=>{
    bufferData =   Buffer.concat([bufferData,ch]);
    });
   req.on("end",()=>{
    const rct = req.headers['content-type'];
    if(rct.toString().match(/multipart\/form-data/i)){
      const entries = {}
      const files = {}
        const boundry = "--"+req.headers['content-type'].split("=")[1];
       let start = bufferData.indexOf(Buffer.from(boundry))+Buffer.from(boundry).length;
       let end = bufferData.indexOf(Buffer.from(boundry),start);
       while(end !== -1){
       const bufferParts = bufferData.slice(start,end);
        let headerEnd = bufferParts.indexOf(Buffer.from("\r\n\r\n"));
        const header = bufferParts.slice(0,headerEnd);
        const body = bufferParts.slice(headerEnd + 4);
        fileName = header.toString().match(/filename="([^"]+)"/);
       if(fileName){
          files[++totalFile] = {
            size:body.length,
            file:body,
            fileName:fileName[1],
            contentType : header.toString().split("Content-Type: ")[1]
          }
        }else{
          entries[header.toString().match(/name="([^"]+)"/)[1]] = body.toString().trim();
        }
        start = end + Buffer.from(boundry).length;
        end = bufferData.indexOf(Buffer.from(boundry),start);
       }
       req.body = entries;
       req.files = files;
     }else if(rct.toString().match(/json/i)){
      req.body = JSON.parse(bufferData.toString());
      req.files = files;
     }else if(rct.toString().match(/text/i) || req.headers['content-type'].match(/x-www-form-urlencoded/i)){
      const q = require('querystring');
       let queries = q.parse(bufferData.toString());
       req.body = queries;
       req.files = files;
     }else{
      req.body = bufferData.toString();
       req.files = files;
     }
  })
   
  }
}
const oS = ()=>{
    const imp = {
     get:{},
     post:{}
    }
    function addImp(method,path,addImpCb){
     imp[method][path] = addImpCb
    }
    const run = {
    get:(path,appCb)=>addImp('get',path,appCb),
    post:(path,appCb)=>addImp('post',path,appCb),
    listen:(port,cb = ()=>0)=>{
     server = http.createServer((req,res)=>{
        const qs = require("querystring")
 
    const actualUrl = req.url.split("?")[0]
    const queryString = req.url.split("?")[1]

    req.query = qs.parse(queryString)
    req.url = actualUrl
    console.log(req.url)
        const {method,url} = req;
        calls = imp[method.toLocaleLowerCase()][url];
        if(calls){
           bodyPart(req)
            calls(req,res)
        }else{
            res.statusCode = 200;
            res.write(`Can not get ${url}`)
            res.end()
        }
     });
     server.listen(port,cb)
    }
    
    };
    return run;
}
//exports.oS

const a = oS()
a.get("/home",(req,res)=>{
    res.write(JSON.stringify(req.files))
    res.write(JSON.stringify(req.body))
    res.write(JSON.stringify(req.query))
    res.write('Hello')
    res.end()
})
a.listen(3404)
