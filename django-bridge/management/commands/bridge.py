# -*- coding: utf-8 -*-
# TODO: better command name, bridge command
import os
import pkgutil
import json
import subprocess

from django.core.management.base import BaseCommand, CommandError
from django.conf import settings


class Command(BaseCommand):
    help = 'django-bridge helper command'

    action_list = ['aliases', 'init']

    def handle(self, *args, **options):
        action = options.get('action')

        if action == 'aliases':
            if settings.DEBUG is True:
                result = dict()
                for app in settings.INSTALLED_APPS:
                    module_path = pkgutil.get_loader(app).filename
                    scripts_path = os.path.join(module_path, 'static')
                    if os.path.exists(scripts_path):
                        result[app] = scripts_path
                self.stdout.write(json.dumps(result))
            else:
                raise CommandError("Not in production enviroment. "
                                   "Set DEBUG=True")
        elif action == 'init':
            subprocess.call(['npm', 'init'])
        else:
            # unrecognized command
            raise CommandError("Unrecognized action `%s` for bridge command"
                               % action)

    def add_arguments(self, parser):
        # Positional arguments
        parser.add_argument('action', choices=self.action_list,
                            help='command action')
