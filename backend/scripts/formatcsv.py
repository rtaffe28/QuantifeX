import csv

input_file = '../data/seeds/unformated_investment_company_tickers.csv'
output_file = '../data/seeds/investment_company_tickers.csv'

with open(input_file, 'r', encoding='utf-8') as infile, \
     open(output_file, 'w', encoding='utf-8', newline='') as outfile:
    
    reader = csv.DictReader(infile)
    writer = csv.writer(outfile, delimiter=';')
    
    writer.writerow(['symbol', 'name'])
    
    for row in reader:
        ticker = row['Class Ticker'].strip()
        name = row['Series Name'].strip()
        
        if ticker:
            writer.writerow([ticker, name])

print(f"Processing complete. Output written to {output_file}")