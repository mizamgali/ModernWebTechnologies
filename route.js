const http = require('http');

const server = http.createServer((req,res) => {
    if(req.url === '/home') {
        res.writeHead(200, {'Content-Type': 'text/plain'});

        return res.end('Home Page\n');
    }
    if(req.url === '/about') {
        res.writeHead(200, {'Content-Type': 'text/plain'});

        return res.end('About Page\n');
    }
    res.writeHead(404, {'Content-Type': 'text/plain'});
    res.end('404 Page Not Found\n');


});

//standard code
const PORT = 3000;

server.listen(PORT, () => {
    console.log(`Server is running at http://localhost:${PORT}/`);
});