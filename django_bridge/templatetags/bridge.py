import json
import os
from django import template
from django.conf import settings
from django.templatetags.static import static

register = template.Library()


@register.simple_tag
def bridge(filename):
    """ Add hash to filename for cache invalidation.

    Uses gulp-buster for cache invalidation. Adds current file hash as url arg.
    """
    if not hasattr(settings, 'BASE_DIR'):
        raise Exception("You must provide BASE_DIR in settings for bridge")
    file_path = getattr(settings, 'BUSTERS_FILE', os.path.join('static',
                                                               'busters.json'))
    buster_file = os.path.join(settings.BASE_DIR, file_path)
    fp = file(buster_file, 'r')
    # TODO: may be store it somewhere to not load file every time
    busters_json = json.loads(fp.read())
    fp.close()
    file_hash = busters_json.get("static/%s" % filename)
    path = static(filename)
    return "%s?%s" % (path, file_hash) if file_hash is not None else path
