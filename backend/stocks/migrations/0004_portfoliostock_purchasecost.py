from decimal import Decimal

from django.db import migrations, models


def set_existing_purchasecosts(apps, schema_editor):
    PortfolioStock = apps.get_model("stocks", "PortfolioStock")

    for holding in PortfolioStock.objects.select_related("stock"):
        holding.purchasecost = Decimal(str(holding.shares)) * Decimal(str(holding.stock.current_price))
        holding.save(update_fields=["purchasecost"])


class Migration(migrations.Migration):

    dependencies = [
        ("stocks", "0003_stock_market_data_portfolio_stock_relation"),
    ]

    operations = [
        migrations.AddField(
            model_name="portfoliostock",
            name="purchasecost",
            field=models.DecimalField(decimal_places=6, max_digits=16, null=True),
        ),
        migrations.RunPython(set_existing_purchasecosts, migrations.RunPython.noop),
        migrations.AlterField(
            model_name="portfoliostock",
            name="purchasecost",
            field=models.DecimalField(decimal_places=6, max_digits=16),
        ),
    ]
