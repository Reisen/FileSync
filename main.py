import json
import random
import tornado.ioloop
import tornado.web
import tornado.websocket

class MainHandler(tornado.web.RequestHandler):
    def get(self):
        self.write('Foo')

class SyncSocket(tornado.websocket.WebSocketHandler):
    clients = set()
    states  = dict()

    def check_origin(self, origin):
        return True

    def open(self):
        SyncSocket.clients.add(self)

    def on_close(self):
        for client in SyncSocket.clients:
            if client != self:
                client.write_message(json.dumps({
                    'command': 'quit',
                    'state': SyncSocket.states[self]
                }))

        del SyncSocket.states[self]
        SyncSocket.clients.remove(self)

    def on_message(self, message):
        try:
            payload = json.loads(message)
            command = payload.get('command', 'tick')

            if command in ['tick', 'join']:
                SyncSocket.states[self] = payload.get('state', {})
                for client in SyncSocket.clients:
                    client.write_message(message)

                if command == 'join':
                    for state in SyncSocket.states:
                        self.write_message(json.dumps({
                            'command': 'join',
                            'state': SyncSocket.states[state]
                        }))

        except Exception as e:
            print(e)

application = tornado.web.Application([
    (r'/',     MainHandler),
    (r'/sync', SyncSocket)
])

if __name__ == '__main__':
    application.listen(5005)
    tornado.ioloop.IOLoop.instance().start()
