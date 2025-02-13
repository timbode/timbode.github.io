import pybtex.database.input.bibtex as bibtex
from pybtex.style.formatting.plain import Style as PlainStyle
from pybtex.backends.html import Backend as HTMLBackend
from pybtex.style.formatting import BaseStyle, toplevel
from pybtex.style.template import join

class YearSortedStyle(PlainStyle):
    def format_bibliography(self, bib_data):
        # First format all entries but don't return them yet
        formatted_entries = []
        entries_with_year = []
        
        for key in bib_data.entries:
            entry = bib_data.entries[key]
            formatted_entry = self.format_entry('article', entry)
            # Store the year along with the formatted entry
            try:
                year = int(entry.fields.get('year', '0'))
            except ValueError:
                year = 0
            entries_with_year.append((year, formatted_entry))
        
        # Sort by year
        entries_with_year.sort(key=lambda x: x[0], reverse=True)
        
        # Return just the formatted entries in sorted order
        return [entry for year, entry in entries_with_year]

bib_file = "publications.bib"  # Your .bib file
output_file = "publications.html"  # Output HTML file

try:
    parser = bibtex.Parser()
    bib_data = parser.parse_file(bib_file)
    
    # Use our custom style that sorts by year
    style = YearSortedStyle()
    formatted_bibliography = style.format_bibliography(bib_data)
    
    # Create the HTML
    html_backend = HTMLBackend()
    html_output = ""
    
    for entry in formatted_bibliography:
        print(entry.text)
        html_output += "<li>" + entry.text.render(html_backend).strip() + "</li>\n"
    
    # Wrap it in a <ul> tag
    html_output = "<ul>\n" + html_output + "</ul>\n"
    
    # Write to the HTML file
    with open(output_file, "w", encoding="utf-8") as f:
        f.write(html_output)
    
    print(f"Successfully generated {output_file}")
except FileNotFoundError:
    print(f"Error: {bib_file} not found.")
except Exception as e:
    print(f"An error occurred: {e}")