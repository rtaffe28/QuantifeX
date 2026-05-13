import django.db.models.deletion
from django.db import migrations, models


def connect_portfolio_stocks_to_stocks(apps, schema_editor):
    Stock = apps.get_model("stocks", "Stock")
    PortfolioStock = apps.get_model("stocks", "PortfolioStock")

    for holding in PortfolioStock.objects.all():
        stock, _ = Stock.objects.get_or_create(
            symbol=holding.symbol.upper(),
            defaults={
                "company_name": holding.company_name or holding.symbol.upper(),
                "current_price": holding.average_buy_price,
            },
        )
        holding.stock = stock
        holding.save(update_fields=["stock"])


class Migration(migrations.Migration):

    dependencies = [
        ("stocks", "0002_portfoliostock"),
    ]

    operations = [
        migrations.RenameField(
            model_name="stock",
            old_name="purchase_price",
            new_name="current_price",
        ),
        migrations.RemoveField(
            model_name="stock",
            name="shares",
        ),
        migrations.AddField(
            model_name="stock",
            name="updated_at",
            field=models.DateTimeField(auto_now=True),
        ),
        migrations.AlterField(
            model_name="stock",
            name="symbol",
            field=models.CharField(max_length=10, unique=True),
        ),
        migrations.AddField(
            model_name="portfoliostock",
            name="stock",
            field=models.ForeignKey(
                null=True,
                on_delete=django.db.models.deletion.CASCADE,
                related_name="portfolio_holdings",
                to="stocks.stock",
            ),
        ),
        migrations.RunPython(connect_portfolio_stocks_to_stocks, migrations.RunPython.noop),
        migrations.AlterUniqueTogether(
            name="portfoliostock",
            unique_together={("user", "stock")},
        ),
        migrations.AlterField(
            model_name="portfoliostock",
            name="stock",
            field=models.ForeignKey(
                on_delete=django.db.models.deletion.CASCADE,
                related_name="portfolio_holdings",
                to="stocks.stock",
            ),
        ),
        migrations.RemoveField(
            model_name="portfoliostock",
            name="average_buy_price",
        ),
        migrations.RemoveField(
            model_name="portfoliostock",
            name="company_name",
        ),
        migrations.RemoveField(
            model_name="portfoliostock",
            name="symbol",
        ),
    ]
