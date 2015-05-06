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

After that you must add `django-bridge` into `INSTALLED_APPS` list in django
settings. After that you may use command `bridge install` to install node and
related packages into your python virtualenv using `nodeenv`. It will not work
outside virtualenv because perfoms global gulp install

    python manage.py bridge install

Manual
------

You may wish to install nodejs manually.

We recommend you to not install node packages globally. You may choose from
`NVM` and `nodeenv` (you will prefer first if you are from node world). `nodeenv`
allows you to install node packages into your python virtualenv.

    nodeenv -p --prebuilt -n 0.11.16

    npm install --save-dev django-bridge

Also you must install gulp globally:

    npm install -g gulp

Usage
=====

After installing you can create endpoints for your scripts and styles in any
django app in `static/scripts` and `static/styles` respectevly.

Script files must have '.js' or '.coffee' extensions and styles
are '.css' or '.scss'.

You may import scripts and styles from any other installed django apps inside
yours using django app name.

After that you may reffer generated files using template tag in django:

    {% bridge "scripts/<endpoint>.coffee" %}

It will be replaced with `gulp-buster` generated scripts.


Configuration
=============

You can change package behaivor via `package.json` in your application.
Available settings and their defaults listed below.


Roadmap
=======

1.0
---

* JSX
* less
* open file at pos on notification click (seems like imposible)
* sprites

0.1
---

* gulp-notify
* gulp-buster
* vendors bundle
* `manage.py bridge init` command
* `bridge` template tag
* configuration

