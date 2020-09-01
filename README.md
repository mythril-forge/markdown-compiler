# How to use
1. clone the repo
1. run `python main.py`
1. check out the generated markdown in class_summaries!

# Data Flow
1. GET files from API: `Record<string, string>`
1. Parse files into features: `Array<Record<string, any>>`
1. Parse features via map/filter/reduce
1. Create simple markdown descriptions of features in HTML tags
1. Create class progression table
1. Create full class descriptions
