export default class ServerManager {
    static healthCheck = async () : Promise<Boolean> => {
        try {
            console.log("running server health check...");
            const response = await fetch("http://localhost:8000/healthcheck");
            if (response.status === 200){
                console.log("SERVER IS UP");
                return true;
            }else{
                return false;
            }
        } catch (err: any) {
            console.error(`SERVER IS DOWN ❌❌❌. (error: ${err})`);
            return false;
        }
    }
}