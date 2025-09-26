# GEMINI Analysis of JSZ4

This document provides a comprehensive overview of the JSZ4 project, a browser-based Zettelkasten application. It is intended to be used as a instructional context for future interactions with the Gemini CLI.

## Project Overview

JSZ4 is a self-contained, client-side Zettelkasten system that runs entirely in a web browser. It uses HTML, CSS, and vanilla JavaScript to provide a personal note-taking environment. The application allows users to create, edit, and link notes (Zettels), and to save and load their Zettelkasten as a JSON file. The application features automatic backlink generation, search functionality, and uses browser local storage for temporary data persistence.

The project is structured into three main files:

*   `JSZ4.html`: The main HTML structure of the application.
*   `JSZ4.css`: The stylesheet for the application.
*   `jsz4.js`: The core logic of the application.

The project also includes a `sample_zettelkasten.json` file with 50 sample notes.

## Building and Running

This is a client-side application with no build process. To run the application, simply open the `JSZ4.html` file in a modern web browser.

## Development Conventions

### Code Structure

The JavaScript code is organized under a single global namespace, `JSZ`. This namespace is further divided into the following objects:

*   `JSZ.data`: Holds the application's data, including the `zettel` object, which stores all the Zettels.
*   `JSZ.dataManager`: Contains functions for managing the application's data.
*   `JSZ.uiManager`: Contains functions for managing the user interface.
*   `JSZ.storageManager`: Contains functions for managing data persistence (local storage and file downloads).

### Data Structure

A Zettel is a JavaScript object with the following structure:

```json
{
    "name": "Sample Note 1",
    "content": "This is placeholder content for Sample Note 1. [[note_38]]",
    "creation": "2024-07-30",
    "links": [],
    "backlinks": []
}
```

*   `name`: The name of the Zettel.
*   `content`: The content of the Zettel.
*   `creation`: The creation date of the Zettel.
*   `links`: An array of keys to other Zettels that this Zettel links to.
*   `backlinks`: An array of keys to other Zettels that link to this Zettel.

### Linking

*   **Internal Links:** Links between Zettels are created using the `[[link_key]]` syntax within the content of a Zettel.
*   **External Links:** Links to external URLs or files can be created using the `<<URL_or_filename>>` syntax.

### Data Persistence

*   **Local Storage:** The application uses the browser's local storage to temporarily save the Zettelkasten during a session.
*   **JSON Export/Import:** The entire Zettelkasten can be downloaded as a `zettelkasten.json` file and later loaded back into the application.

### Key Functions

*   `showObj(key)`: Displays the Zettel with the given key.
*   `readObj()`: Parses the content of the current Zettel and saves it.
*   `parseAllZettels()`: Parses all Zettels to update their link lists.
*   `cleanBackList()`: Re-calculates all backlinks.
*   `download(text)`: Downloads the given text as a file.
*   `pullfiles()`: Loads a JSON file into the application.
