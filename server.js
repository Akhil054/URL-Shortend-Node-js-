import { readFile, writeFile } from 'fs/promises';
import {createServer} from 'http';
import path from 'path';
import crypto from 'crypto';

// creating that DATA_FILE 
const DATA_FILE = path.join("data","links.json")

//Creating an Port 
const PORT = 3002;

//function 
const ServeFile = async (res, filePath, contentType) => {
    try {
        // Getting the Data 
        const data = await readFile(filePath);
        res.writeHead(200, { 'Content-Type': contentType });
        res.end(data);
    } // Getting an Error 
    catch (error) {
        res.writeHead(404, { 'Content-Type': 'text/plain' });
        res.end("404 - File Not Found");
    }
};


const  loadLinks = async () =>{
    try{
        // getting an data if file exists and parsing it to read 
        const data = await readFile(DATA_FILE, "utf-8");
        return JSON.parse(data);
    }
    catch (error) {
        // If file doesn't exists 
        if(error.code === "ENOENT"){
            await writeFile(DATA_FILE, JSON.stringify({}));
            return {};
        }
        throw error;
    }
}


// creating an saveLinks function to add the data into DATA_FILE from loadlinks
const saveLinks = async (links) =>{
    // writing an data into DATA_FILE & parsing it to json as taking from loadLinks
    await writeFile(DATA_FILE, JSON.stringify(links));
}


const server = createServer(async (req, res) => {
    if (req.method === "GET") {
        if (req.url === '/') {
            return ServeFile(res, path.join('public', 'index.html'),'text/html');
        } else if (req.url === '/style.css') {
            return ServeFile(res, path.join('public', 'style.css'),'text/css');
        } 
        else if(req.url === '/links'){
            //Getting links data 
            const links = await loadLinks();

            res.writeHead(404, { 'Content-Type': 'application/json' });
            return res.end(JSON.stringify(links));
        }
        //Redirecting the links 
        else{
            const links = await loadLinks();
            const shortCode = req.url.slice(1);  //slice(1) is used for removing the forwared slash coming in links path 
            console.log("Link Redirect ",req.url);
            if(links[shortCode]){
                res.writeHead(302, { 'Location': links[shortCode] }); //locaton is the place where it will redirect the page & location value is shortend link 
                return res.end();
            }
           
            res.writeHead(404, { 'Content-Type': 'text/plain' });
            return res.end("Shortend URL is not found")
            
        }
    } 

    // Getting an Data from Frontend and storing into body 
    if(req.method === "POST" && req.url === "/shorten"){

        const links = await loadLinks();

        let body = " ";
        req.on("data",(chunk) =>{body += chunk;})
        // Once response is ended its converted into JSON parse 
        req.on("end",async () =>{
            console.log(body);
            const {url, shortCode} = JSON.parse(body);

            // Conditon thrown if the URL is empty
            if(!url){
                res.writeHead(400, { 'Content-Type': 'text/plain' });
                return res.end("400 - URL is required");
            }

            // getting out duplicate 
            const finalShortCode = shortCode || crypto.randomBytes(4).toString("hex");
            
            if(links[finalShortCode]){
                res.writeHead(400, { 'Content-Type': 'text/plain' });
                return res.end("Short Code already exist, Choose another one");
            }


            // Writing Data in link.json
            links[finalShortCode] = url;

            await saveLinks(links);

            res.writeHead(200, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({success:true, shortCode:finalShortCode}));

        });
    }
});

//Listing to Server 
server.listen(PORT, () =>{
    console.log(`Server is running at http://localhost:${PORT}`);
});