#!/usr/bin/env python3
"""Simple HTTP server with proper MIME types for ES modules."""

import http.server
import socketserver
import mimetypes
import os

PORT = 8080

# Force correct MIME types (Windows registry often has wrong values)
mimetypes.add_type('application/javascript', '.js')
mimetypes.add_type('application/javascript', '.mjs')
mimetypes.add_type('text/css', '.css')

class Handler(http.server.SimpleHTTPRequestHandler):
    extensions_map = {
        '.html': 'text/html',
        '.css': 'text/css',
        '.js': 'application/javascript',
        '.mjs': 'application/javascript',
        '.json': 'application/json',
        '.png': 'image/png',
        '.jpg': 'image/jpeg',
        '.jpeg': 'image/jpeg',
        '.gif': 'image/gif',
        '.svg': 'image/svg+xml',
        '.ico': 'image/x-icon',
        '.woff': 'font/woff',
        '.woff2': 'font/woff2',
        '.ttf': 'font/ttf',
        '': 'application/octet-stream',
    }

    def guess_type(self, path):
        """Override to ensure correct MIME types for JS modules."""
        _, ext = os.path.splitext(path)
        ext = ext.lower()
        if ext in self.extensions_map:
            return self.extensions_map[ext]
        return super().guess_type(path)

with socketserver.TCPServer(("", PORT), Handler) as httpd:
    print(f"Server running at http://localhost:{PORT}")
    print("Press Ctrl+C to stop")
    httpd.serve_forever()
