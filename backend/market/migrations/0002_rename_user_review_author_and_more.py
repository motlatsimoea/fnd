# Generated by Django 5.1.4 on 2025-04-21 20:59

import django.db.models.deletion
from django.db import migrations, models


class Migration(migrations.Migration):
    dependencies = [
        ("market", "0001_initial"),
    ]

    operations = [
        migrations.RenameField(
            model_name="review",
            old_name="user",
            new_name="author",
        ),
        migrations.RenameField(
            model_name="review",
            old_name="comment",
            new_name="content",
        ),
        migrations.AddField(
            model_name="review",
            name="parent",
            field=models.ForeignKey(
                blank=True,
                null=True,
                on_delete=django.db.models.deletion.CASCADE,
                related_name="replies",
                to="market.review",
            ),
        ),
    ]
