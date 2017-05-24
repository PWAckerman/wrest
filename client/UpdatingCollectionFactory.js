export default class UpdatingCollectionFactory {
    constructor(resource){
          let self = this;
          this.resource = resource;
          this.socket = new WebSocket(`ws://${resource}`);
          this.collection = [];
          this.retried = 0;
          this._setUpSocket = ()=>{
                  this.socket.onmessage = (message) => {
                            var body = JSON.parse(message.data);
                            console.log(body);
                            body.SELECT ? this.collection = this.collection = body.SELECT : ""
                            body.INSERT ? this.collection = this.collection.concat(body.INSERT) : ""
                          }
                  this.socket.onopen = (evt) => {
                            this.socket.send(JSON.stringify({method: "GET"}));
                          }
                  this.socket.onerror = (err) => {
                            console.log(err.type);
                          }
                  this.socket.onclose = (evt) => {
                            console.log("that dang nginx downgraded the connection again.");
                            self._attemptReconnect();
                          }
                }
          this._attemptReconnect = () => {
                  console.log('attempt reconnect');
                  console.log(this.resource);
                  if(self.retried < 1){
                              self.socket = new WebSocket(`ws://${this.resource}`);
                              self._setUpSocket();
                              self.retried += 1;
                          } else {
                                    console.log("Attempted reconnect failed!");
                                  }
                }
          this._setUpSocket();
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
