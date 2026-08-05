# JSZ4 Code Documentation

This document provides a summary of the internal code structure, data models, and key functions used in the **JSZ4** Zettelkasten application. 

## Architecture Overview

JSZ4 is built entirely as a client-side application. The core logic is housed in `jsz4.js`, and the UI is rendered via `JSZ4.html`. To avoid polluting the global window space, recent refactors have moved many variables and functions into a centralized namespace called `JSZ`.

## Data Structure

The application's state and data are managed under the `JSZ` global object. 

### `JSZ.data`
This object holds the core state of the application.
*   **`JSZ.data.zettel`**: A dictionary-like object mapping unique Zettel keys (IDs) to their respective data objects.
*   **`JSZ.data.currentKey`**: A string indicating the key of the Zettel currently being viewed.
*   **`JSZ.data.stash`**: Used to temporarily store a copy of the current Zettel before editing.
*   **`JSZ.data.rawFileInput`**: A temporary buffer used when loading data from a JSON file.

### A Zettel Object
Each note in `JSZ.data.zettel` has the following structure:
```json
{
    "name": "Tags or keywords for the Zettel",
    "content": "The main text content, which can include [[internal_links]] and <<external_links>>.",
    "creation": "YYYY-MM-DD",
    "links": ["array", "of", "keys"],
    "fileLinks": ["array", "of", "external", "urls"],
    "backlinks": ["array", "of", "keys"]
}
```

## Sub-Modules & Key Functions

The functionality in `jsz4.js` is divided into logical sub-managers under the `JSZ` namespace, alongside various global utility functions.

### `JSZ.uiManager`
Manages the user interface state, particularly dynamic styling like font sizes.
*   `increaseFontSize()` / `decreaseFontSize()`: Adjusts the base font size up or down.
*   `updatePageFontSize(sizeInPt)`: Applies the new font size to the document body.

### `JSZ.storageManager`
Handles data persistence.
*   `saveToLocalStorage()`: Serializes `JSZ.data.zettel` to JSON and saves it in the browser's `localStorage` under the key `snapshot`.
*   `loadFromLocalStorage()`: Restores the application state from `localStorage` and re-renders the current Zettel.

### Core Zettel Operations (Global Functions)
These functions handle the core Zettelkasten logic, such as navigating, creating, editing, and linking Zettels.

*   **`showObj(key)`**: The primary rendering function. It triggers a save of the current editor fields (via `readObjNoShow`), updates `JSZ.data.currentKey`, fills the HTML UI fields with the data for `key`, and dynamically generates the jump buttons for incoming (backlinks) and outgoing links.
*   **`readObjNoShow()`**: Extracts values from the HTML inputs (`zkey`, `zname`, `zcontent`, `zdate`), parses links from the content, updates the `JSZ.data.zettel` object for that key, and calls `pokeReverseLinks()` to update the incoming links for any referenced Zettels.
*   **`readObj()`**: A wrapper that calls `readObjNoShow()` and then immediately refreshes the UI by calling `showObj()`.
*   **`makeEmpty(key)`**: Initializes a new, empty Zettel object in memory with the given key, pointing to the current date.
*   **`deleteCurrentZettel()`**: Prompts for confirmation, deletes the active Zettel from memory, cleans up any links pointing to it from other Zettels, and falls back to showing the "top" Zettel.
*   **`resetToZstring()`**: Resets the entire application state back to the default sample data defined in the `zstring` variable.

### Link Management
Functions dedicated to parsing and maintaining relationships between notes.

*   **`findLinks(aText)`**: Uses a Regular Expression (`/\[\[.*?\]\]/g`) to parse `[[ZettelKey]]` syntax out of the content text.
*   **`findFileLinks(aText)`**: Uses a Regular Expression (`/\<\<.*?\>\>/g`) to parse `<<URL>>` syntax out of the content text.
*   **`pokeReverseLinks()`**: Iterates through the outgoing links of the currently active Zettel and adds its key to the `backlinks` array of the target Zettels.
*   **`cleanBackList()`**: A thorough cleanup function that loops over all Zettels, clears their `backlinks` arrays, and rebuilds them completely from scratch by analyzing all `links` arrays.
*   **`parseAllZettels()`**: Iterates over all Zettels and completely re-parses their content fields to populate their `links` and `fileLinks` arrays.

### Search and I/O Functions
*   **`searchZettelForRegex()`**: Takes input from `searchRegEx` and searches the `name` (Tags) field of all Zettels, rendering jump buttons for matches.
*   **`searchZettelContent()`**: Takes input from `searchFullText` and searches the `content` field of all Zettels, rendering jump buttons for matches.
*   **`download(text)`**: Triggers a browser download prompt allowing the user to save their Zettelkasten as a `.json` file.
*   **`pullfiles()`**: Triggered by the `<input type="file">` element. Reads a user-selected JSON file using `FileReader` and merges its contents into `JSZ.data.zettel`.

## HTML to JS Bindings
Key UI elements in `JSZ4.html` map directly to Javascript logic:
*   `zkey` textarea: Contains the ID of the current Zettel.
*   `zname` textarea: Contains the Tags of the current Zettel.
*   `zcontent` textarea: The main editor area.
*   Keyboard shortcuts: `Ctrl+P` (Parse/Save), `Ctrl+S` (Save to JSON), `Ctrl+T` (Jump to Top) are bound via `document.onkeyup`.
