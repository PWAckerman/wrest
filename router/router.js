class Router{
    constructor(){
        this.routes = {}
    }

    addRoute(url){
        this.routes[url] = new Route()
    }
}
