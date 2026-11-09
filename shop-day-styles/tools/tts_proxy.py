# Runs the library's tts_zh.py with the sandbox proxy's CA bundle (edge-tts pins certifi's list).
import os, sys, runpy, certifi
ca = os.environ.get('SSL_CERT_FILE')
if ca and os.path.exists(ca): certifi.where = lambda: ca
sys.argv = sys.argv[1:]
runpy.run_path(sys.argv[0], run_name='__main__')
