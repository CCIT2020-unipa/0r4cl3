from functools import wraps
from flask import request
import hashlib
import os

# Access token authentication middleware
def auth_middleware(route_handler):
  @wraps(route_handler)
  def _auth_middleware(*args, **kwargs):
    access_token = request.args.get('access_token', None)

    if access_token is None:
      return { 'error': 'missing "access_token" parameter' }, 400

    # Compare the access tokens' SHA-512 hashes
    access_token_hash = hashlib.sha512(access_token.encode()).hexdigest()
    server_access_token: str = os.environ['ACCESS_TOKEN']
    server_access_token_hash = hashlib.sha512(server_access_token.encode()).hexdigest()

    if access_token_hash != server_access_token_hash:
      return { 'error': 'invalid "access_token" parameter' }, 401

    # Successful authentication
    return route_handler(*args, **kwargs)

  return _auth_middleware
