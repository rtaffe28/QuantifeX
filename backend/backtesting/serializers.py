from rest_framework import serializers
from .models import BacktestRun, BacktestResult


class BacktestResultSerializer(serializers.ModelSerializer):
    class Meta:
        model = BacktestResult
        fields = [
            "total_return_pct",
            "annualized_return_pct",
            "max_drawdown_pct",
            "sharpe_ratio",
            "total_trades",
            "final_portfolio_value",
            "equity_curve",
            "trade_log",
            "completed_at",
        ]


class BacktestRunSerializer(serializers.ModelSerializer):
    result = BacktestResultSerializer(read_only=True)

    class Meta:
        model = BacktestRun
        fields = [
            "id",
            "ticker",
            "strategy",
            "parameters",
            "start_date",
            "end_date",
            "initial_capital",
            "status",
            "error_message",
            "created_at",
            "result",
        ]
        extra_kwargs = {"error_message": {"read_only": True}}


class BacktestRunCreateSerializer(serializers.ModelSerializer):
    class Meta:
        model = BacktestRun
        fields = [
            "ticker",
            "strategy",
            "parameters",
            "start_date",
            "end_date",
            "initial_capital",
        ]

    def validate_strategy(self, value):
        valid = {"buy_and_hold", "sma_crossover", "covered_call", "leap", "wheel"}
        if value not in valid:
            raise serializers.ValidationError(
                f"Invalid strategy. Choose from: {', '.join(sorted(valid))}"
            )
        return value
