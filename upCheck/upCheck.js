
async function upCheck(url) {
    const { default: fetch } = await import('node-fetch');
    try {
        const response = await fetch(url);
        if(response.status<= 200 && response.status < 400) {
            console.log(`Website ${url} is up!`);
            return true;
        }
        else{
            console.log(`Website ${url} is down!`);
            return false;
        }
    } catch (error) {
        console.error(`Error checking website status for ${url}: ${error.message}`);
        return false;
    }
}
module.exports= upCheck;