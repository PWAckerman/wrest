function httpParse(http){
    let httpRequest = http.split('\n');
    let [method, route, version] = httpRequest[0].split(' ');
    let headers = httpRequest
                    .slice(1)
                    .map((headerTuple)=> headerTuple.split(':'))
                    .reduce((headerObjAccumulator, headerTuple)=>{
                            let key = headerTuple[0];
                            let value = headerTuple[1] ? headerTuple[1].replace(/^\s|\\r+$/gm, '').substr(0, headerTuple[1].length - 2) : null;
                            headerObjAccumulator[key] = value;
                            return headerObjAccumulator;
                    }, {})

   return new RequestObject(method, route, version, headers);
}

class RequestObject{

    constructor(method, route, version, headers, body={}){
        this.method = method;
        this.route = route;
        this.version = version;
        this.headers = headers;
        this.body = body;
    }

}

module.exports = httpParse;
