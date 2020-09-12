from flask import Blueprint

from ..services.packet_sniffer import PacketSniffer
from .utils import auth_utils

sniffer = Blueprint('sniffer', __name__)

@sniffer.route('/sniffer/status')
@auth_utils.auth_middleware
def _status():
  return { 'online': PacketSniffer().is_running() }
