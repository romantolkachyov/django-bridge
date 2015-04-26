# -*- coding: utf-8 -*-
# TODO: better command name, bridge command
import os
import pkgutil
import json

from django.core.management.base import BaseCommand, CommandError
from django.conf import settings


class Command(BaseCommand):
    help = 'Returns JSON that contains aliases and paths for django apps'

    def handle(self, *args, **options):
        if settings.DEBUG is True:
            result = dict()
            for app in settings.INSTALLED_APPS:
                module_path = pkgutil.get_loader(app).filename
                scripts_path = os.path.join(module_path, 'static')
                if os.path.exists(scripts_path):
                    result[app] = scripts_path
            print json.dumps(result)
        else:
            raise CommandError("Not in production enviroment. Set DEBUG=True")
