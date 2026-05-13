import json
import re
from decimal import Decimal, InvalidOperation
from django.db import IntegrityError
from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt
from .models import Stock, PortfolioStock
from django.contrib.auth import authenticate, login, logout
from django.contrib.auth.decorators import login_required
from django.contrib.auth.models import User
from django.views.decorators.http import require_http_methods

TICKER_SYMBOL_PATTERN = re.compile(r"^[A-Z][A-Z0-9.:-]{0,9}$")


def parse_json_body(request):
    try:
        return json.loads(request.body or "{}"), None
    except json.JSONDecodeError:
        return None, {"body": "Request body must be valid JSON."}


def validation_error(errors, status=400):
    first_error = next(iter(errors.values()), "Invalid request.")
    return JsonResponse({"error": first_error, "errors": errors}, status=status)


def clean_required_string(data, field, errors, label=None, max_length=None):
    value = str(data.get(field, "")).strip()
    field_label = label or field.replace("_", " ")

    if not value:
        errors[field] = f"{field_label.capitalize()} is required."
        return ""

    if max_length and len(value) > max_length:
        errors[field] = f"{field_label.capitalize()} must be {max_length} characters or fewer."

    return value


def clean_positive_decimal(data, field, errors, label=None, max_digits=None, decimal_places=None):
    field_label = label or field.replace("_", " ")
    raw_value = data.get(field)

    if raw_value in (None, ""):
        errors[field] = f"{field_label.capitalize()} is required."
        return None

    try:
        value = Decimal(str(raw_value))
    except (InvalidOperation, TypeError, ValueError):
        errors[field] = f"{field_label.capitalize()} must be a valid number."
        return None

    if value <= 0:
        errors[field] = f"{field_label.capitalize()} must be greater than 0."
        return None

    if max_digits is not None:
        sign, digits, exponent = value.as_tuple()
        whole_digits = len(digits) + exponent if exponent >= 0 else max(len(digits[:exponent]), 0)
        fraction_digits = abs(exponent) if exponent < 0 else 0

        if decimal_places is not None and fraction_digits > decimal_places:
            errors[field] = f"{field_label.capitalize()} can have at most {decimal_places} decimal places."
            return None

        if whole_digits + fraction_digits > max_digits:
            if field == "shares":
                errors[field] = "Shares value is too large."
            else:
                errors[field] = f"{field_label.capitalize()} is too large."
            return None

    return value


def clean_stock_id(data, errors):
    raw_stock_id = data.get("stock_id")

    if raw_stock_id in (None, ""):
        errors["stock_id"] = "Stock is required."
        return None

    try:
        stock_id = int(raw_stock_id)
    except (TypeError, ValueError):
        errors["stock_id"] = "Stock must be a valid stock id."
        return None

    if stock_id <= 0:
        errors["stock_id"] = "Stock must be a valid stock id."
        return None

    return stock_id


def clean_stock_payload(data):
    errors = {}
    symbol = clean_required_string(data, "symbol", errors, max_length=10).upper()
    company_name = clean_required_string(data, "company_name", errors, max_length=100)
    current_price = clean_positive_decimal(
        data,
        "current_price",
        errors,
        "current price",
        max_digits=12,
        decimal_places=2,
    )

    if symbol and not TICKER_SYMBOL_PATTERN.match(symbol):
        errors["symbol"] = "Symbol must start with a letter and use only uppercase letters, numbers, '.', ':', or '-'."

    if errors:
        return None, errors

    return {
        "symbol": symbol,
        "company_name": company_name,
        "current_price": current_price,
    }, {}


def clean_portfolio_payload(data, require_stock_id):
    errors = {}
    payload = {
        "shares": clean_positive_decimal(
            data,
            "shares",
            errors,
            max_digits=12,
            decimal_places=4,
        ),
    }

    if require_stock_id or "stock_id" in data:
        payload["stock_id"] = clean_stock_id(data, errors)

    if errors:
        return None, errors

    return payload, {}


@csrf_exempt
@require_http_methods(["POST"])
def register_user(request):
    data, errors = parse_json_body(request)
    if errors:
        return validation_error(errors)

    validation_errors = {}
    username = clean_required_string(data, "username", validation_errors, max_length=150)
    password = clean_required_string(data, "password", validation_errors, max_length=128)
    email = str(data.get("email", "")).strip()

    if User.objects.filter(username=username).exists():
        validation_errors["username"] = "Username is already taken."

    if validation_errors:
        return validation_error(validation_errors)

    user = User.objects.create_user(
        username=username,
        email=email,
        password=password,
    )

    login(request, user)

    return JsonResponse({
        "id": user.id,
        "username": user.username,
        "email": user.email,
    }, status=201)


@csrf_exempt
@require_http_methods(["POST"])
def login_user(request):
    data, errors = parse_json_body(request)
    if errors:
        return validation_error(errors)

    validation_errors = {}
    username = clean_required_string(data, "username", validation_errors, max_length=150)
    password = clean_required_string(data, "password", validation_errors, max_length=128)

    if validation_errors:
        return validation_error(validation_errors)

    user = authenticate(
        request,
        username=username,
        password=password,
    )

    if user is None:
        return JsonResponse({"error": "Invalid username or password"}, status=400)

    login(request, user)

    return JsonResponse({
        "id": user.id,
        "username": user.username,
        "email": user.email,
    })


@csrf_exempt
@require_http_methods(["POST"])
def logout_user(request):
    logout(request)
    return JsonResponse({"logged_out": True})


@login_required
def current_user(request):
    return JsonResponse({
        "id": request.user.id,
        "username": request.user.username,
        "email": request.user.email,
    })


def serialize_stock(stock):
    return {
        'id': stock.id,
        'symbol': stock.symbol,
        'company_name': stock.company_name,
        'current_price': str(stock.current_price),
        'created_at': stock.created_at.isoformat(),
        'updated_at': stock.updated_at.isoformat(),
    }

def serialize_portfolio_stock(portfolio_stock):
    current_price = Decimal(str(portfolio_stock.stock.current_price))
    shares = Decimal(str(portfolio_stock.shares))
    market_value = shares * current_price

    return {
        "id": portfolio_stock.id,
        "stock_id": portfolio_stock.stock_id,
        "symbol": portfolio_stock.stock.symbol,
        "company_name": portfolio_stock.stock.company_name,
        "current_price": str(current_price),
        "shares": str(shares),
        "market_value": str(market_value),
        "purchasecost": str(portfolio_stock.purchasecost),
        "created_at": portfolio_stock.created_at.isoformat(),
        "updated_at": portfolio_stock.updated_at.isoformat(),
    }

@csrf_exempt
def stocks_list(request):
    if request.method == 'GET':
        stocks = Stock.objects.all().order_by('-created_at')
        return JsonResponse([serialize_stock(stock) for stock in stocks], safe=False)

    if request.method == 'POST':
        data, errors = parse_json_body(request)
        if errors:
            return validation_error(errors)

        stock_payload, errors = clean_stock_payload(data)
        if errors:
            return validation_error(errors)

        try:
            stock = Stock.objects.create(**stock_payload)
        except IntegrityError:
            return validation_error({"symbol": "A stock with this symbol already exists."})

        return JsonResponse(serialize_stock(stock), status=201)

    return JsonResponse({'error': 'Method not allowed'}, status=405)


@csrf_exempt
def stock_detail(request, stock_id):
    try:
        stock = Stock.objects.get(id=stock_id)
    except Stock.DoesNotExist:
        return JsonResponse({'error': 'Stock not found'}, status=404)

    if request.method == 'GET':
        return JsonResponse(serialize_stock(stock))

    if request.method == 'PUT':
        data, errors = parse_json_body(request)
        if errors:
            return validation_error(errors)

        stock_payload, errors = clean_stock_payload(data)
        if errors:
            return validation_error(errors)

        stock.symbol = stock_payload["symbol"]
        stock.company_name = stock_payload["company_name"]
        stock.current_price = stock_payload["current_price"]

        try:
            stock.save()
        except IntegrityError:
            return validation_error({"symbol": "A stock with this symbol already exists."})

        return JsonResponse(serialize_stock(stock))

    if request.method == 'DELETE':
        stock.delete()
        return JsonResponse({'deleted': True})

    return JsonResponse({'error': 'Method not allowed'}, status=405)

@csrf_exempt
@login_required
def portfolio_stocks_list(request):
    if request.method == "GET":
        portfolio_stocks = PortfolioStock.objects.filter(
            user=request.user
        ).select_related("stock").order_by("-created_at")

        return JsonResponse(
            [serialize_portfolio_stock(stock) for stock in portfolio_stocks],
            safe=False,
        )

    if request.method == "POST":
        data, errors = parse_json_body(request)
        if errors:
            return validation_error(errors)

        portfolio_payload, errors = clean_portfolio_payload(data, require_stock_id=True)
        if errors:
            return validation_error(errors)

        try:
            stock = Stock.objects.get(id=portfolio_payload["stock_id"])
        except Stock.DoesNotExist:
            return JsonResponse({"error": "Stock not found"}, status=404)

        try:
            portfolio_stock = PortfolioStock.objects.create(
                user=request.user,
                stock=stock,
                shares=portfolio_payload["shares"],
                purchasecost=portfolio_payload["shares"] * stock.current_price,
            )
        except IntegrityError:
            return JsonResponse(
                {"error": "This stock is already in your portfolio. Edit the existing holding instead."},
                status=400,
            )

        return JsonResponse(
            serialize_portfolio_stock(portfolio_stock),
            status=201,
        )

    return JsonResponse({"error": "Method not allowed"}, status=405)


@csrf_exempt
@login_required
def portfolio_stock_detail(request, portfolio_stock_id):
    try:
        portfolio_stock = PortfolioStock.objects.get(
            id=portfolio_stock_id,
            user=request.user,
        )
    except PortfolioStock.DoesNotExist:
        return JsonResponse({"error": "Portfolio stock not found"}, status=404)

    if request.method == "GET":
        return JsonResponse(serialize_portfolio_stock(portfolio_stock))

    if request.method == "PUT":
        data, errors = parse_json_body(request)
        if errors:
            return validation_error(errors)

        portfolio_payload, errors = clean_portfolio_payload(data, require_stock_id=False)
        if errors:
            return validation_error(errors)

        if "stock_id" in portfolio_payload:
            try:
                portfolio_stock.stock = Stock.objects.get(id=portfolio_payload["stock_id"])
            except Stock.DoesNotExist:
                return JsonResponse({"error": "Stock not found"}, status=404)

        portfolio_stock.shares = portfolio_payload["shares"]

        try:
            portfolio_stock.save()
        except IntegrityError:
            return JsonResponse(
                {"error": "This stock is already in your portfolio. Edit the existing holding instead."},
                status=400,
            )

        return JsonResponse(serialize_portfolio_stock(portfolio_stock))

    if request.method == "DELETE":
        portfolio_stock.delete()
        return JsonResponse({"deleted": True})

    return JsonResponse({"error": "Method not allowed"}, status=405)
