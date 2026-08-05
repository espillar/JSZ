# JSZ4 Test Documentation

This document describes the utilities and methods available for testing the JSZ4 Zettelkasten application.

## Zettel Diff Utility (`zettel_diff.js`)

The Zettel Diff utility is a standalone Node.js script designed to compare two saved Zettelkasten JSON files. This is particularly useful when making logic changes to the application to ensure that existing zettels are preserved and data is not unintentionally modified or lost.

### What it does

The script parses both JSON files, extracts all the Zettel keys, and performs a deep comparison of each Zettel object. It will output a summary categorizing the differences into:

*   🟢 **Added**: Zettels that exist in the *new* file but not in the *original* file.
*   🔴 **Deleted**: Zettels that exist in the *original* file but not in the *new* file.
*   🟡 **Modified**: Zettels that exist in both files, but whose contents (text, tags, links, backlinks, etc.) have changed.

### Prerequisites

You must have [Node.js](https://nodejs.org/) installed on your machine to run the script.

### Usage

Run the script from your terminal, passing the original JSON file as the first argument and the newly generated JSON file as the second argument:

```bash
node zettel_diff.js <original_file.json> <new_file.json>
```

#### Example:

```bash
node zettel_diff.js sample_zettelkasten.json 2025-09-25.json
```

### Interpreting the Output

If there are no differences between the two files, the script will output:
`✅ No differences found. Both files are identical.`

If there are differences, it will list the specific keys that were added, deleted, or modified, followed by a brief numerical summary, allowing you to quickly identify exactly which Zettels were affected by your changes.
