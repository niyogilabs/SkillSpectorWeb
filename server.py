#!/usr/bin/env python3
"""
Simple HTTP server for previewing SkillSpectorWeb from docs/ locally.
Run: python3 server.py [port]
"""

import http.server
import os
import socketserver
import sys

PORT = int(sys.argv[1]) if len(sys.argv) > 1 else 8080
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
DIRECTORY = os.path.join(BASE_DIR, "docs") if os.path.exists(os.path.join(BASE_DIR, "docs")) else BASE_DIR


class Handler(http.server.SimpleHTTPRequestHandler):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=DIRECTORY, **kwargs)

    def do_GET(self):
        # Pretty URL routing for HTML pages
        clean_path = self.path.split("?")[0].rstrip("/")
        if clean_path in ("/scan", "/audit", "/features", "/rules", "/scanner"):
            self.path = "/index.html"
        return super().do_GET()

    def end_headers(self):
        self.send_header("Access-Control-Allow-Origin", "*")
        self.send_header("Cache-Control", "no-cache, no-store, must-revalidate")
        super().end_headers()


def main():
    with socketserver.TCPServer(("", PORT), Handler) as httpd:
        print(f"==================================================")
        print(f"🛡️  SkillSpector Web Running Locally")
        print(f"👉 Serving GitHub Pages directory: {DIRECTORY}")
        print(f"👉 URL: http://localhost:{PORT}")
        print(f"==================================================")
        try:
            httpd.serve_forever()
        except KeyboardInterrupt:
            print("\nShutting down server.")


if __name__ == "__main__":
    main()
