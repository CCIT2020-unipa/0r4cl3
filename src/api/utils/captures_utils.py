def extract_protocol(row: dict):
  # Extract highest level protocol from the list of protocols
  row['protocol'] = row['protocols'].split(':')[-1]

  # Remove the list from the JSON response
  del row['protocols']
  return row
