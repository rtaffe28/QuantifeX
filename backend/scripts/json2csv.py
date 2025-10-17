import pandas as pd
import json
import os

script_dir = os.path.dirname(os.path.abspath(__file__))
data_dir = os.path.join(script_dir, '..', 'data', 'seeds')
input_file = os.path.join(data_dir, 'company_tickers.json')
output_file = os.path.join(data_dir, 'company_tickers.csv')

with open(input_file, 'r') as f:
    data = json.load(f)

with open(output_file, 'w') as o:
    o.write("symbol;name\n")

    for key, value in data.items():
        ticker = value['ticker']
        title = value['title']
        o.write(f"{ticker};{title}\n")

print(f"Converted {input_file} to {output_file}")