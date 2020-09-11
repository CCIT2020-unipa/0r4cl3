from flask import Blueprint

from ..services.packet_sniffer import PacketSniffer

sniffer = Blueprint('sniffer', __name__)

@sniffer.route('/sniffer/status')
def _status():
  return {
    'online': PacketSniffer().is_running()
  }
