export default class UpdatingCollectionFactory {
  constructor(resource){
    this.socket = new WebSocket(`ws://${resource}`);
    this.collection = [];
    this.socket.onmessage = (message) => {
      var body = JSON.parse(message.data);
      body.SELECT ? this.collection = this.collection.concat(body.SELECT) : ""
      body.INSERT ? this.collection = this.collection.concat(body.INSERT) : ""
    }
    this.socket.onopen = (evt) => {
      this.socket.send(JSON.stringify({method: "GET"}));
    }
    this.socket.onerror = (err) => {
      console.log(err.error);
    }
    return new Proxy(this, {
      get: function(target, inx){
        if(typeof target[inx] === "function"){
          return (...args)=>{
              return target[inx](args);
          }
        } else if(!isNaN(parseInt(inx))){
          return target.collection[parseInt(inx)]
        } else if(inx === 'length'){
          return target.collection.length
        }
      }
    })
  }

  push(element){
    this.socket.send(JSON.stringify({method: "POST", body: element[0]}));
  }
}
