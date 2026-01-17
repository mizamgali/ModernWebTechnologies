const http = require('http');

const server = http.createServer((req,res) => {
    res.writeHead(200, {'Content-Type': 'text/plain'}); // Set the response HTTP header with HTTP status and Content type
    res.end('Hello World, this is my first node.js app \n'); // Send the response body "Hello World"
});


//standard code
const PORT = 3000;

server.listen(PORT, () => {
    console.log(`Server is running at http://localhost:${PORT}/`);
}); 