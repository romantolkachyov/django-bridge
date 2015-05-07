# django-bridge

Integrated packages list:

* gulp
* browserify
* gulp-notify
* sass
* less
*

Installation
============

Because of nature of this packages you must install to pieces of it using node's
npm and python's pip both. You need to install python package first. Assuming
that you using python virtualenv.

    pip install django-bridge

After that you must add `django_bridge` into `INSTALLED_APPS` list in django
settings. Also you must have `BASE_DIR` setting (added by default in latest
django) and add static dir where `django-bridge` will put bundles into
`STATICFILES_DIRS` setting (see configuration section).

After that you may use command `bridge init` to install node and
related packages into your python virtualenv using `nodeenv`. It will not work
outside virtualenv because perfoms global gulp install (in this case refer to
manual install section)

    python manage.py bridge init

Manual install
--------------

You may wish to install nodejs manually.

We recommend you to not install node packages globally. You may choose from
`NVM` and `nodeenv` (you will prefer first if you are from node world). `nodeenv`
allows you to install node packages into your python virtualenv.

    nodeenv -p --prebuilt -n 0.11.16

    npm install --save-dev django-bridge

Also you must install gulp globally:

    npm install -g gulp

You must create `gulpfile.js` then with following content:

    require('django-bridge');

Usage
=====

After installing you can create endpoints for your scripts and styles in any
django app in `static/scripts` and `static/styles` respectevly.

Script files must have '.js' or '.coffee' extensions and styles
are '.css' or '.scss'.

Endpoint ignored if filename started with `_` or equal to `index` (with any
extension).

You may import scripts and styles from any other installed django apps inside
yours using django app name.

After that you may reffer generated files using template tag in django:

    {% bridge "scripts/<endpoint>.coffee" %}

It will be replaced with `gulp-buster` generated scripts.


Configuration
=============

You can change package behaivor via `package.json` in your application.
Available settings and their defaults listed below.

All configuration options must be located in `package.json` under the 'bridge' key.

Example:

    ...
    "bridge": {
        "django_path": "./",
        "static_path": "./static",
        "editor": "subl %(file)s:%(line)d:%(column)d",
        "vendors": ["backbone"]
    },
    ...

django_path
-----------

`manage.py` script path. Relative to `package.json`.

static_path
-----------

Where to put bundles. Also you must add this directory to `STATICFILES_DIRS`
in django. It will have a highest priority over application files. Relative to
`package.json` file.

editor
------

Which command must be executed when user click on error notification.
You may wish to use placeholders:

* `%(file)s` — full file path
* `%(line)d` — line of the file
* `%(column)d` — error position in string

By default it is a Sublime Text `subl` command as in example above.

vendors
-------

List of npm packages which must be bundled in separate `vendors.js` bundle.

Roadmap
=======

1.0
---

* JSX
* less
* sprites
* live reload
* bower?

0.1
---

* open file at pos on notification click
* gulp-notify
* gulp-buster
* vendors bundle
* `manage.py bridge init` command
* `bridge` template tag
* configuration

