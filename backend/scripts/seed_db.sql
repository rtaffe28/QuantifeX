\COPY core_stockticker (symbol, name) FROM 'data/seeds/company_tickers.csv' DELIMITER ';' CSV HEADER;
\COPY core_stockticker (symbol, name) FROM 'data/seeds/investment_company_tickers.csv' DELIMITER ';' CSV HEADER;

INSERT INTO auth_user (username, password, email, is_superuser, is_staff, is_active, first_name, last_name, date_joined)
VALUES (
  'local@local.com',
  'pbkdf2_sha256$1000000$h943gRcJPpHUfqqhcXxo8j$EtSRNClGQ7gCKWA6WYE9FO3jG/kDHdKvthOij+mTv7k=',
  'local@local.com',
  FALSE,
  FALSE,
  TRUE,
  '',
  '',
  NOW()
) ON CONFLICT (username) DO NOTHING;