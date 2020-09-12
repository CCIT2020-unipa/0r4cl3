from flask import Blueprint

from .utils import auth_utils

auth = Blueprint('auth', __name__)

@auth.route('/auth/status')
@auth_utils.auth_middleware
def _status():
  return { 'authenticated': True }
