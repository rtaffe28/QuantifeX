from celery import shared_task

from .engine.runner import run_backtest_for


@shared_task
def execute_backtest(run_id):
    from .models import BacktestRun, BacktestResult

    run = BacktestRun.objects.get(id=run_id)
    run.status = BacktestRun.STATUS_RUNNING
    run.save()

    try:
        result_data = run_backtest_for(run)
        BacktestResult.objects.create(run=run, **result_data)
        run.status = BacktestRun.STATUS_COMPLETE
    except Exception as exc:
        run.status = BacktestRun.STATUS_FAILED
        run.error_message = str(exc)
    finally:
        run.save()
