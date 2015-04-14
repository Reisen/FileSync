import tornado.ioloop
import tornado.web
import tornado.websocket

class MainHandler(tornado.web.RequestHandler):
    def get(self):
        self.write('Foo')

class SyncSocket(tornado.websocket.WebSocketHandler):
    clients = set()

    def check_origin(self, origin): return True
    def open(self): print('Open');SyncSocket.clients.add(self)
    def on_close(self): print('Close');SyncSocket.clients.remove(self)

    def on_message(self, message):
        try:
            command, *args = message.split(' ')
            for client in SyncSocket.clients:
                client.write_message('{}'.format([command] + args))

        except Exception as e:
            print(e)

application = tornado.web.Application([
    (r'/',     MainHandler),
    (r'/sync', SyncSocket)
])

if __name__ == '__main__':
    application.listen(5005)
    tornado.ioloop.IOLoop.instance().start()
