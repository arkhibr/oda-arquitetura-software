#!/usr/bin/env python3
"""Servidor estático para os testes de navegador, com fila de conexões maior que a do http.server."""

from functools import partial
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
import sys


class Servidor(ThreadingHTTPServer):
    request_queue_size = 128


def main() -> None:
    porta, raiz = int(sys.argv[1]), sys.argv[2]
    manipulador = partial(SimpleHTTPRequestHandler, directory=raiz)
    with Servidor(("127.0.0.1", porta), manipulador) as servidor:
        servidor.serve_forever()


if __name__ == "__main__":
    main()
