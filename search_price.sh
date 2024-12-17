#!/bin/bash

# Price-Related Component Search Script
SEARCH_TERMS=(
    "price"
    "toCents"
    "toDollars"
    "formatCurrency"
    ".price"
    "total"
)

SEARCH_DIRS=(
    "src/views/pos"
    "src/components"
    "src/stores"
)

OUTPUT_FILE="price_component_search_results.txt"

> "$OUTPUT_FILE"

echo "Searching for price-related components..." | tee -a "$OUTPUT_FILE"

for term in "${SEARCH_TERMS[@]}"; do
    echo "Searching for term: $term" | tee -a "$OUTPUT_FILE"
    for dir in "${SEARCH_DIRS[@]}"; do
        if [ -d "$dir" ]; then
            echo "  In directory: $dir" | tee -a "$OUTPUT_FILE"
            find "$dir" -type f \( -name "*.js" -o -name "*.vue" -o -name "*.ts" \) -exec grep -l "$term" {} \; | tee -a "$OUTPUT_FILE"
        fi
    done
    echo "" | tee -a "$OUTPUT_FILE"
done

echo "Search complete. Results saved to $OUTPUT_FILE"