# UI Redesign Proposals for JSZ4

Here is the original list of ideas we discussed for cleaning up the user interface. We have already implemented Ideas 1 and 2!

### 1. Hide Rarely Used Tools in a "Settings" or "Menu" Modal (✅ Implemented)
*   **Idea:** Move all of these (Download JSON, Load JSON, Set/Load Browser Store, Change Theme, Font Size) into a single "Settings" (⚙️) menu or a sliding sidebar that is hidden by default.

### 2. Streamline the Metadata Fields (✅ Implemented)
*   **Idea:** Change "Zettel Name" (Key) and "Tags" to single-line `<input type="text">` fields. 
*   **Idea:** Move read-only stats like "Date Created" and "Zettel Count" to a small, subtle status bar at the very bottom of the screen.

### 3. Responsive, Collapsible Sidebar for Search & Navigation
*   **Idea:** On small screens, having the search bars and results permanently visible pushes the actual writing area off the screen. Create a slide-out sidebar or use a tabbed interface (e.g., a toggle switch between `📝 Edit` and `🔍 Search`). You can search, click a result, and the search panel hides itself to give you full screen space for writing.

### 4. Re-thinking the Link Columns
*   **Idea:** Having three columns (`Incoming Links` | `Editor` | `Outgoing Links`) is impossible to read on a phone or small window.
*   **Mobile:** Give the Editor 100% width. Place the Incoming and Outgoing links in a tabbed section *below* the text editor, or accessible via floating action buttons (e.g., `Incoming (3)` `Outgoing (2)`) that pop up a list when tapped.
*   **Desktop:** Keep a sidebar approach, but perhaps combine Incoming and Outgoing links into a single unified "Related Notes" right-hand sidebar.

### 5. Floating "Save" and "Delete" Actions
*   **Idea:** Instead of having "parse & load fields" as a regular button, we can make it a sticky floating button, or use an auto-save mechanism that removes the need for the button entirely. "Delete" can be moved to a small trash can icon (🗑️) in the top right corner of the editor.
