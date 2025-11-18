#!/usr/bin/env python3
"""
Excel to Knowledge Base Markdown Converter
Converts TMC RFP Question List spreadsheet to markdown knowledge base format

Usage: python scripts/excel-to-kb-markdown.py "Resources/Solicitation_TMC_Sourcing_-_Master_RFP_Question_List (2).xlsx"
"""

import sys
import os
import json
from datetime import datetime
import re

try:
    import pandas as pd
    import openpyxl
except ImportError:
    print("Installing required packages...")
    os.system("pip install pandas openpyxl")
    import pandas as pd
    import openpyxl

def slugify(text):
    """Convert text to slug format for IDs"""
    text = text.lower()
    text = re.sub(r'[^\w\s-]', '', text)
    text = re.sub(r'[\s_-]+', '-', text)
    return text.strip('-')

def parse_excel_to_entries(excel_path):
    """Parse Excel file and extract knowledge entries"""
    entries = []
    
    # Read all sheets
    excel_file = pd.ExcelFile(excel_path)
    
    print(f"\nFound {len(excel_file.sheet_names)} sheets:")
    for sheet_name in excel_file.sheet_names:
        print(f"  - {sheet_name}")
    
    for sheet_name in excel_file.sheet_names:
        print(f"\nProcessing sheet: {sheet_name}")
        df = pd.read_excel(excel_path, sheet_name=sheet_name)
        
        # Show column structure
        print(f"  Columns: {list(df.columns)}")
        print(f"  Rows: {len(df)}")
        
        # Try to identify question/category structure
        # Common patterns: Category, Question, Section, Topic, etc.
        
        # Attempt to auto-detect structure
        question_col = None
        category_col = None
        section_col = None
        
        for col in df.columns:
            col_lower = str(col).lower()
            if 'question' in col_lower and question_col is None:
                question_col = col
            elif 'category' in col_lower and category_col is None:
                category_col = col
            elif 'section' in col_lower and section_col is None:
                section_col = col
        
        # If no obvious question column, assume first text column
        if question_col is None and len(df.columns) > 0:
            question_col = df.columns[0]
        
        print(f"  Detected - Question: {question_col}, Category: {category_col}, Section: {section_col}")
        
        # Process rows
        for idx, row in df.iterrows():
            question_text = str(row[question_col]) if question_col else ""
            
            # Skip empty or NaN rows
            if pd.isna(question_text) or question_text.strip() in ['', 'nan']:
                continue
            
            # Extract category/section info
            category = str(row[category_col]) if category_col and not pd.isna(row[category_col]) else sheet_name
            section = str(row[section_col]) if section_col and not pd.isna(row[section_col]) else "General"
            
            # Create entry ID
            entry_id = f"tmc-question-{slugify(sheet_name)}-{idx+1}"
            
            # Build entry
            entry = {
                'id': entry_id,
                'title': f"TMC Question: {section} - {category}" if category != sheet_name else f"TMC Question: {section}",
                'question': question_text,
                'category': category,
                'section': section,
                'sheet': sheet_name,
                'row_num': idx + 1,
                'type': 'knowledge',
                'importance': 0.85,
                'tags': ['tmc', 'rfp-questions', slugify(category), slugify(sheet_name)]
            }
            
            # Add any additional columns as metadata
            for col in df.columns:
                if col not in [question_col, category_col, section_col]:
                    val = row[col]
                    if not pd.isna(val) and str(val).strip():
                        col_key = slugify(str(col))
                        entry[col_key] = str(val).strip()
            
            entries.append(entry)
    
    return entries

def generate_markdown(entries, output_path):
    """Generate markdown knowledge base file"""
    
    with open(output_path, 'w', encoding='utf-8') as f:
        # Header
        f.write("# TMC Tender Agent Knowledge Base\n\n")
        f.write("This knowledge base contains TMC RFP questions and evaluation criteria extracted from the Master RFP Question List.\n")
        f.write("Access these via `search_memories()` using the knowledge IDs listed below.\n\n")
        f.write(f"**Generated:** {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}\n")
        f.write(f"**Total Entries:** {len(entries)}\n\n")
        f.write("---\n\n")
        
        # Group entries by sheet for organization
        sheets = {}
        for entry in entries:
            sheet = entry['sheet']
            if sheet not in sheets:
                sheets[sheet] = []
            sheets[sheet].append(entry)
        
        # Write entries grouped by sheet
        for sheet_name, sheet_entries in sheets.items():
            f.write(f"# {sheet_name} Questions\n\n")
            
            for entry in sheet_entries:
                f.write(f"## {entry['title']}\n\n")
                f.write(f"### ID: {entry['id']}\n")
                f.write(f"### Type: {entry['type']}\n")
                f.write(f"### Importance: {entry['importance']}\n")
                f.write(f"### Category: tmc-rfp-questions\n\n")
                
                f.write("**Content:**\n\n")
                
                # Main question
                f.write(f"**Question:** {entry['question']}\n\n")
                
                # Additional metadata
                if 'category' in entry and entry['category'] != sheet_name:
                    f.write(f"**Category:** {entry['category']}\n\n")
                
                if 'section' in entry:
                    f.write(f"**Section:** {entry['section']}\n\n")
                
                # Any additional fields from spreadsheet
                excluded_keys = {'id', 'title', 'question', 'category', 'section', 'sheet', 'row_num', 'type', 'importance', 'tags'}
                additional_fields = {k: v for k, v in entry.items() if k not in excluded_keys}
                
                if additional_fields:
                    f.write("**Additional Information:**\n\n")
                    for key, value in additional_fields.items():
                        field_name = key.replace('-', ' ').title()
                        f.write(f"- **{field_name}:** {value}\n")
                    f.write("\n")
                
                # Metadata JSON
                metadata = {
                    "knowledge_id": entry['id'],
                    "category": "tmc-rfp-questions",
                    "section": entry['section'],
                    "sheet": entry['sheet'],
                    "importance": entry['importance'],
                    "tags": entry['tags']
                }
                
                f.write("**Metadata:**\n")
                f.write("```json\n")
                f.write(json.dumps(metadata, indent=2))
                f.write("\n```\n\n")
                
                f.write("---\n\n")
    
    print(f"\n✅ Generated markdown knowledge base: {output_path}")
    print(f"   Total entries: {len(entries)}")
    print(f"   Sheets processed: {len(sheets)}")

def main():
    if len(sys.argv) < 2:
        print("Usage: python scripts/excel-to-kb-markdown.py <excel-file>")
        print("Example: python scripts/excel-to-kb-markdown.py \"Resources/Solicitation_TMC_Sourcing_-_Master_RFP_Question_List (2).xlsx\"")
        sys.exit(1)
    
    excel_path = sys.argv[1]
    
    if not os.path.exists(excel_path):
        print(f"❌ Error: File not found: {excel_path}")
        sys.exit(1)
    
    print(f"📊 Processing Excel file: {excel_path}")
    
    # Parse Excel
    entries = parse_excel_to_entries(excel_path)
    
    if not entries:
        print("❌ No entries found in Excel file")
        sys.exit(1)
    
    # Generate output filename
    base_name = os.path.basename(excel_path)
    output_name = "TMC Tender Agent-knowledge-base.md"
    output_path = os.path.join("Agent Instructions", output_name)
    
    # Generate markdown
    generate_markdown(entries, output_path)
    
    print(f"\n📝 Next steps:")
    print(f"   1. Review the generated file: {output_path}")
    print(f"   2. Edit and refine questions/categories as needed")
    print(f"   3. Get TMC Tender Agent ID:")
    print(f"      docker exec supabase_db_rfpez-app-local psql -U postgres -d postgres -c \"SELECT id FROM agents WHERE name = 'TMC Tender';\"")
    print(f"   4. Generate SQL migration:")
    print(f"      node scripts/kb-to-sql-migration.js \"{output_path}\" <agent-id>")
    print(f"   5. Apply migration locally:")
    print(f"      supabase migration up")
    print(f"   6. Commit and deploy via GitHub Actions")

if __name__ == "__main__":
    main()
