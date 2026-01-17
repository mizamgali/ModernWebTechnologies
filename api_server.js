const http = require('http'); // import the http library

// Create an HTTP server
const server = http.createServer((req,res) => {
    if(req.method === 'GET' && req.url === '/api/hello') {
        res.writeHead(200, {'Content-Type': 'application/json'});
        //we r not returning plain text but a json object
        return res.end(JSON.stringify({ 
            message: 'Hello from API' 
        }));
    }
    if(req.method === 'POST' && req.url === '/api/echo') {
        let body = '';
        req.on('end', () => {
            try{
                const data = JSON.parse(body);
                res.writeHead(200, {'Content-Type': 'application/json'});
                return res.end(JSON.stringify({ 
                    received: data
                }));
            }catch(err){
                res.writeHead(400, {'Content-Type': 'application/json'});
                return res.end(JSON.stringify({ 
                    error: 'Invalid JSON'
                }));
            }
        });
        return;
    }
});
//standard code
const PORT = 3000;

server.listen(PORT, () => {
    console.log(`Server is running at http://localhost:${PORT}/`);
});