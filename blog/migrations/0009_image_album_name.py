# -*- coding: utf-8 -*-
# Generated by Django 1.9.5 on 2016-05-20 04:13
from __future__ import unicode_literals

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('blog', '0008_auto_20160520_0304'),
    ]

    operations = [
        migrations.AddField(
            model_name='image',
            name='album_name',
            field=models.CharField(max_length=200, null=True),
        ),
    ]
