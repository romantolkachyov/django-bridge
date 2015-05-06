import json
import os
from django import template
from django.conf import settings

register = template.Library()


@register.simple_tag
def bridge(filename):
    """ Add hash to filename for cache invalidation.

    Uses gulp-buster for cache invalidation. Adds current file hash as url arg.
    """
    if not hasattr(settings, 'BASE_DIR'):
        raise Exception("You must provide BASE_DIR in settings for bridge")
    buster_file = os.path.join(settings.BASE_DIR, 'static', 'busters.json')
    fp = file(buster_file, 'r')
    # TODO: may be store it somewhere to not load file every time
    busters_json = json.loads(fp.read())
    fp.close()
    file_hash = busters_json.get(filename)
    STATIC_URL = settings.STATIC_URL
    path = os.path.join(STATIC_URL, filename)
    return "%s?%s" % (path, file_hash) if file_hash is not None else path
