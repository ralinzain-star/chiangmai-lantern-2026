import os, http.server, socketserver
os.chdir(os.path.dirname(os.path.abspath(__file__)))
PORT = 8765
with socketserver.TCPServer(('', PORT), http.server.SimpleHTTPRequestHandler) as s:
    print('Trip guide running at http://localhost:%d' % PORT)
    s.serve_forever()
