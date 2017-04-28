const crypto = require('crypto');

class Response{
    constructor(version, status, desc, headers, body){
        this.version = version;
        this.status = status;
        this.desc = desc;
        this.headers = headers;
        console.log(this.headers);
        this.body = body;
    }

    registerSocketAccept(secWebsocketAccept){
        console.log(secWebsocketAccept + '258EAFA5-E914-47DA-95CA-C5AB0DC85B11');
        let val = crypto.createHash('sha1').update(secWebsocketAccept + '258EAFA5-E914-47DA-95CA-C5AB0DC85B11').digest('base64');
        console.log(val);
        this.headers['Sec-WebSocket-Accept'] = val;
    }

    serialize(){
        let self = this;
        console.log("join '/r'", Object.keys(this.headers).map((key) => `${key} : ${self.headers[key]}`).join('\r\n'));
        let headers = Object.keys(this.headers).map((key) => `${key} : ${self.headers[key]}`);
        console.log(typeof headers);
        console.log(headers);
        let message = `${this.version} ${this.status} ${this.desc}
${headers.join('\r\n')}

${this.body || ''}`;
         console.log(message);
        return message;
    }
}

module.exports = Response;
// HTTP/1.1 101 Switching Protocols
//         Upgrade: websocket
//         Connection: Upgrade
//         Sec-WebSocket-Accept: s3pPLMBiTxaQ9kYGzzhZRbK+xOo=
//         Sec-WebSocket-Protocol: chat
